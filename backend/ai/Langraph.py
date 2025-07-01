# ai/graph.py
import operator
from typing import TypedDict, Annotated, List
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END

from ai.L1_agent import process_l1_query, create_l1_agent_executor
from ai.L2_agent import process_l2_query, create_l2_agent_executor
from ai.unified_chain import UnifiedSupportChain


# --- This is our "digital clipboard", the state that flows through the graph ---
class AgentState(TypedDict):
    query: str
    user_id: str
    language: str
    messages: Annotated[List[BaseMessage], operator.add]
    escalation_summary: str


# --- Initialize the tools and agents just once ---
support_chain = UnifiedSupportChain()
l1_agent_executor = create_l1_agent_executor(support_chain)
l2_agent_executor = create_l2_agent_executor(support_chain)

# --- These are the nodes of our graph ---


def l1_node(state: AgentState):
    """The node that runs the L1 agent."""
    print("---EXECUTING L1 NODE---")
    # We call the original L1 processing function, but now it returns a dictionary
    result = process_l1_query(state, l1_agent_executor)
    # The result contains the agent's response, which we add to our message list
    return {"messages": [result["response_message"]]}


def l2_node(state: AgentState):
    """The node that runs the L2 agent."""
    print("---EXECUTING L2 NODE---")
    # We call the original L2 processing function
    result = process_l2_query(state, support_chain, l2_agent_executor)
    return {"messages": [result["response_message"]]}


# --- This is the router that decides where to go next ---


def should_escalate(state: AgentState):
    """The router that decides if we need to escalate to L2."""
    print("---CHECKING FOR ESCALATION---")
    last_message = state["messages"][-1].content
    # If the magic string is in the last message, we escalate
    if "L2...." in last_message:
        print("---DECISION: ESCALATE TO L2---")
        return "escalate"

    print("---DECISION: FINISH---")
    return "end"


# --- Now, we assemble the graph ---


def build_graph():
    workflow = StateGraph(AgentState)

    # Add the nodes we defined
    workflow.add_node("l1_agent", l1_node)
    workflow.add_node("l2_agent", l2_node)

    # Set the entry point
    workflow.set_entry_point("l1_agent")

    # Add the conditional edge for routing
    workflow.add_conditional_edges(
        "l1_agent",
        should_escalate,
        {
            "escalate": "l2_agent",
            "end": END,
        },
    )

    # The L2 agent always finishes the process
    workflow.add_edge("l2_agent", END)

    # Compile the graph into a runnable app
    return workflow.compile()


# Create the final runnable app
app = build_graph()
