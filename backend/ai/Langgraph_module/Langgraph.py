# 13.1. ai/Langgraph.py
"""Langgraph configuration for the support agent workflow."""
import config
import operator
import uuid
from typing import TypedDict, Annotated, List, Dict, Optional, Any
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage
from langchain_google_genai import GoogleGenerativeAI
from langchain_groq import ChatGroq
from utils.helpers import format_history_for_prompt, format_full_history_for_summary


# 1. Define the state "clipboard" that moves through the graph.
class AgentState(TypedDict):
    query: str
    user_id: str
    language: str
    # History will be kept in the DB's dictionary format.
    history: Annotated[List[Dict[str, str]], operator.add]
    # The summary is generated only on escalation.
    escalation_summary: str
    # A list of all new responses to be sent to the user in this turn.
    new_responses: List[str]
    is_level2_session: bool
    routing_decision: str
    # Human approval fields for update_user_data
    pending_user_update: Optional[Dict[str, Any]]  # Stores the update request
    human_approval_status: Optional[str]  # "pending", "approved", "declined"
    human_approval_response: Optional[str]  # Human's decision message


# 2. Define the individual nodes (functions) for the graph.


def l1_node(state: AgentState, agent_executor):
    """Runs the L1 agent."""
    print("---EXECUTING L1 NODE---")
    history_text = format_history_for_prompt(state["history"])
    response = agent_executor.invoke(
        {
            "input": state["query"],
            "user_id": state["user_id"],
            "language": state["language"],
            "chat_history": history_text,
        }
    )
    output = response.get("output", "")

    # Create the full turn dictionary, including the Level2 status.
    # We now explicitly save that this turn was handled by L1.
    turn_data = {"input": state["query"], "output": output, "is_level2_session": False}

    #  The node now makes the decision itself.
    if "Level2...." in output:
        decision = "summarize_node"
        print("---L1 DECISION: ESCALATE TO Level2---")
    else:
        decision = "END"
        print("---L1 DECISION: END---")

    return {
        "history": [turn_data],
        "new_responses": [output],
        "is_level2_session": False,
        "routing_decision": decision,
    }


def summarize_for_level2_node(state: AgentState):
    """Summarizes the conversation for a clean handoff to Level2."""
    print("---EXECUTING SUMMARY NODE---")
    history_text = format_full_history_for_summary(state["history"])
    summary_prompt = f"""
    Concisely summarize the following support conversation for a Level2 agent.
    The summary must be in this language: {state['language']}.
    
    IMPORTANT: 
    - Do not use terms like "L2" or "level2" in the summary
    - Use "supervisor", "specialist", or "expert" instead
    - Focus on what the user needs help with, not the escalation process

    Conversation History:
    {history_text}

    Briefing Note:"""
    llm = ChatGroq(model="llama3-70b-8192", groq_api_key=config.GROQ_API_KEY)
    summary = llm.invoke(summary_prompt)
    return {
        "escalation_summary": summary,
        "new_responses": state.get("new_responses", []),
    }


def level2_node(state: AgentState, agent_executor):
    """Runs the Level2 agent."""
    print("---EXECUTING Level2 NODE---")
    history_text = format_history_for_prompt(state["history"])
    response = agent_executor.invoke(
        {
            "input": state["query"],
            "user_id": state["user_id"],
            "language": state["language"],
            "chat_history": history_text,
            "escalation_summary": state.get(
                "escalation_summary", "No summary was provided."
            ),
        }
    )

    # For Human-in-the-Loop processing, we need to check for tool calls
    # NEW: Check intermediate steps for tool calls
    if "intermediate_steps" in response:
        for action, observation in response["intermediate_steps"]:
            if action.tool == "update_user_data":
                print(
                    "---UPDATE_USER_DATA TOOL DETECTED - STORING FOR HUMAN APPROVAL---"
                )

                # Extract the updates from the tool call and ensure it's a dictionary
                import json
                import re

                tool_input = action.tool_input
                updates = {}
                if isinstance(tool_input, str):
                    # Use regex to find the JSON part of the string
                    json_match = re.search(r"\{.*\}", tool_input, re.DOTALL)
                    if json_match:
                        json_string = json_match.group(0)
                        try:
                            updates = json.loads(json_string)
                        except json.JSONDecodeError:
                            print(
                                f"---ERROR: Could not parse extracted JSON string: {json_string}---"
                            )
                            continue
                    else:
                        print(
                            f"---ERROR: No JSON object found in tool_input string: {tool_input}---"
                        )
                        continue
                elif isinstance(tool_input, dict):
                    updates = tool_input

                # The user_id is already in the state, so we can remove it from the updates dict
                # to avoid redundancy in the approval prompt.
                updates.pop("user_id", None)

                # Store the request for human approval
                pending_update = {
                    "updates": updates,
                    "original_output": observation,
                    "timestamp": str(uuid.uuid4()),
                }

                return {
                    "pending_user_update": pending_update,
                    "new_responses": [
                        "Thank you for your update request. It has been submitted for review and is currently pending approval. We appreciate your patience during this process."
                    ],
                    "is_level2_session": True,
                    "escalation_summary": "",
                }

    # If no update_user_data tool was detected, continue with normal processing
    output = response.get("output", "")
    print("---CONTINUING WITH NORMAL PROCESSING---")
    current_responses = state.get("new_responses", [])
    current_responses.append(output)
    final_history_output = "\n\n".join(current_responses)
    turn_data = {
        "input": state["query"],
        "output": final_history_output,
        "is_level2_session": True,
    }

    return {
        "history": [turn_data],
        "new_responses": current_responses,
        "is_level2_session": True,
        "escalation_summary": "",  # Clear the summary
    }


# Human-in-the-Loop Node
def human_approval_node(state: AgentState):
    """
    Node that handles human approval for user data updates.
    On the first pass, it interrupts. On resume, it processes the decision.
    """
    print("---EXECUTING HUMAN APPROVAL NODE---")

    if not state.get("human_approval_status"):
        # If no decision has been made, interrupt the graph and wait.
        # The API call to /approve-update will resume from this point.
        print("---INTERRUPTING FOR HUMAN APPROVAL---")
        return

    # This part of the code will only be executed AFTER the graph is resumed.
    print(f"---RESUMED WITH APPROVAL STATUS: {state['human_approval_status']}---")

    if state["human_approval_status"] == "approved":
        print("---UPDATE APPROVED. PROCESSING...---")
        from database.models import update_user_data

        try:
            updates = state.get("pending_user_update", {}).get("updates", {})
            if updates:
                result = update_user_data(state["user_id"], updates)
                print(f"---DATABASE UPDATE RESULT: {result}---")
                # Clear the pending state after processing
                return {
                    "pending_user_update": None,
                    "human_approval_status": None,
                    "human_approval_response": "Update successful.",
                }
            else:
                return {
                    "pending_user_update": None,
                    "human_approval_status": "error",
                    "human_approval_response": "No updates found to process.",
                }
        except Exception as e:
            print(f"---ERROR DURING DATABASE UPDATE: {e}---")
            return {
                "pending_user_update": None,
                "human_approval_status": "error",
                "human_approval_response": f"An error occurred: {e}",
            }
    else:  # Declined
        print("---UPDATE DECLINED BY ADMINISTRATOR.---")
        return {
            "pending_user_update": None,  # Clear the pending state
            "human_approval_status": None,
            "human_approval_response": "Update request was declined.",
        }


def dispatcher(state: AgentState) -> str:
    """
    Reads the conversation history and decides which agent should handle the query.
    This acts as the new entry point for the graph.
    """
    print("---DISPATCHING---")
    # The checkpointer has already loaded the history.
    history = state.get("history", [])

    if not history or not history[-1].get("is_level2_session", False):
        # If there's no history OR the last turn was handled by L1,
        # then the query should go to the L1 agent.
        print("---DECISION: ROUTE TO L1---")
        return "l1_agent"
    else:
        # If the last turn was handled by Level2, the session is "sticky"
        # and all subsequent queries should go directly to the Level2 agent.
        print("---DECISION: ROUTE DIRECTLY TO Level2---")
        return "level2_agent"


# 3. Define the routing logic (the edge).
def router(state: AgentState) -> str:
    """A trivial router that simply returns the decision made by the L1 node."""
    return state["routing_decision"]
