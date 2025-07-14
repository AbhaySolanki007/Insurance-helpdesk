# 13.1. ai/Langgraph.py
"""Langgraph configuration for the support agent workflow."""
import config
import operator
from typing import TypedDict, Annotated, List, Dict
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage
from langchain_google_genai import GoogleGenerativeAI
from langchain_groq import ChatGroq
from utils.helpers import format_history_for_prompt


# 1. Define the state "clipboard" that moves through the graph.
class AgentState(TypedDict):
    query: str
    user_id: str
    language: str
    # History will be kept in the DB's dictionary format.
    history: Annotated[List[Dict[str, str]], operator.add]
    # The summary is generated only on escalation.
    escalation_summary: str
    is_l2_session: bool
    routing_decision: str


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

    # Create the full turn dictionary, including the L2 status.
    # We now explicitly save that this turn was handled by L1.
    turn_data = {"input": state["query"], "output": output, "is_l2_session": False}

    #  The node now makes the decision itself.
    if "L2...." in output:
        decision = "summarize_node"
        print("---L1 DECISION: ESCALATE TO L2---")
    else:
        decision = "END"
        print("---L1 DECISION: END---")

    return {
        "history": [turn_data],
        "is_l2_session": False,
        "routing_decision": decision,
    }


def summarize_for_l2_node(state: AgentState):
    """Summarizes the conversation for a clean handoff to L2."""
    print("---EXECUTING SUMMARY NODE---")
    history_text = format_history_for_prompt(state["history"])
    summary_prompt = f"""
    Concisely summarize the following support conversation for an L2 agent.
    Focus on the user's main problem and the reason for escalation.
    The summary must be in this language: {state['language']}.

    Conversation History:
    {history_text}

    Briefing Note:"""
    llm = ChatGroq(model="llama3-70b-8192", groq_api_key=config.GROQ_API_KEY)
    summary = llm.invoke(summary_prompt)
    return {"escalation_summary": summary}


def l2_node(state: AgentState, agent_executor):
    """Runs the L2 agent."""
    print("---EXECUTING L2 NODE---")
    history_text = format_history_for_prompt(state["history"])
    response = agent_executor.invoke(
        {
            "input": state["query"],
            "user_id": state["user_id"],
            "language": state["language"],
            "chat_history": history_text,
            # Pass the summary from the state to the prompt
            "escalation_summary": state.get(
                "escalation_summary", "No summary was provided."
            ),
        }
    )
    output = response.get("output", "")

    # 👇 STEP 2: Create the full turn dictionary, explicitly flagging it as L2.
    turn_data = {"input": state["query"], "output": output, "is_l2_session": True}

    return {
        "history": [turn_data],  # This list gets appended to the main history
        "is_l2_session": True,  # This updates the root state for the current request
    }


def dispatcher(state: AgentState) -> str:
    """
    Reads the conversation history and decides which agent should handle the query.
    This acts as the new entry point for the graph.
    """
    print("---DISPATCHING---")
    # The checkpointer has already loaded the history.
    history = state.get("history", [])

    if not history or not history[-1].get("is_l2_session", False):
        # If there's no history OR the last turn was handled by L1,
        # then the query should go to the L1 agent.
        print("---DECISION: ROUTE TO L1---")
        return "l1_agent"
    else:
        # If the last turn was handled by L2, the session is "sticky"
        # and all subsequent queries should go directly to the L2 agent.
        print("---DECISION: ROUTE DIRECTLY TO L2---")
        return "l2_agent"


# 3. Define the routing logic (the edge).
def router(state: AgentState) -> str:
    """A trivial router that simply returns the decision made by the L1 node."""
    return state["routing_decision"]
