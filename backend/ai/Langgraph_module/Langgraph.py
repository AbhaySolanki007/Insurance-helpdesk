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
                        "Your update request has been submitted for approval. Please wait while we review your request."
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


def human_approval_node(state: AgentState):
    """Node that handles human approval for user data updates."""
    print("---EXECUTING HUMAN APPROVAL NODE---")

    # Check if we have a pending update that needs approval
    if state.get("pending_user_update"):
        print(f"---HUMAN APPROVAL REQUEST FOR USER: {state['user_id']}---")

        # Display approval request in terminal
        pending_update = state.get("pending_user_update", {})
        updates = pending_update.get("updates", {})

        print("\n" + "=" * 60)
        print("🚨 UPDATE USER DATA REQUEST DETECTED!")
        print("=" * 60)
        print(f"👤 User ID: {state['user_id']}")
        print(f"📝 Requested Updates:")

        for key, value in updates.items():
            print(f"   • {key}: {value}")

        print("\n" + "=" * 60)
        print("Available actions:")
        print("1. Approve this request")
        print("2. Decline this request")
        print("=" * 60)

        # Get admin decision
        while True:
            try:
                choice = input("\nEnter your choice (1-2): ").strip()

                if choice == "1":
                    print("✅ Request approved! Processing update...")
                    # Execute the update immediately
                    from database.models import update_user_data

                    try:
                        result = update_user_data(state["user_id"], updates)
                        print(f"---DATABASE UPDATE RESULT: {result}---")

                        return {
                            "pending_user_update": None,
                            "human_approval_status": "approved",
                            "human_approval_response": "Database updated successfully",
                            "new_responses": [
                                f"Your information has been updated successfully. {result}"
                            ],
                        }
                    except Exception as e:
                        print(f"---ERROR UPDATING DATABASE: {e}---")
                        return {
                            "pending_user_update": None,
                            "human_approval_status": "error",
                            "human_approval_response": f"Error updating database: {e}",
                            "new_responses": [
                                "There was an error processing your update request. Please try again."
                            ],
                        }

                elif choice == "2":
                    print("❌ Request declined!")
                    return {
                        "pending_user_update": None,
                        "human_approval_status": "declined",
                        "human_approval_response": "Your request is under review by our security team",
                        "new_responses": [
                            "Your request is under review by our security team. We'll contact you shortly."
                        ],
                    }

                else:
                    print("❌ Invalid choice. Please enter 1 or 2.")

            except KeyboardInterrupt:
                print("\n⚠️ Approval cancelled by user. Declining request...")
                return {
                    "pending_user_update": None,
                    "human_approval_status": "declined",
                    "human_approval_response": "Request cancelled by admin",
                    "new_responses": [
                        "Your request has been cancelled. Please try again later."
                    ],
                }

    # If no pending update, just pass through
    return state


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
