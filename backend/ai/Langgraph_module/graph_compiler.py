from functools import partial
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END, START
from .Langgraph import (
    AgentState,
    l1_node,
    l2_node,
    router,
    summarize_for_l2_node,
    dispatcher,
)


def compile_graph(
    l1_agent_executor: Any,
    l2_agent_executor: Any,
    memory: Optional[Any] = None,
) -> Any:
    """
    Assembles and compiles the LangGraph workflow.
    """
    workflow = StateGraph(AgentState)

    # Add all the nodes to the graph
    workflow.add_node("l1_agent", partial(l1_node, agent_executor=l1_agent_executor))
    workflow.add_node("summarize_node", summarize_for_l2_node)
    workflow.add_node("l2_agent", partial(l2_node, agent_executor=l2_agent_executor))

    # The graph's entry point is now a conditional router.
    workflow.add_conditional_edges(
        START,  # The special "START" key tells LangGraph this is the entry point router.
        dispatcher,  # The function that decides the initial path.
        {
            "l1_agent": "l1_agent",  # If dispatcher returns "l1_agent", go to the l1_agent node.
            "l2_agent": "l2_agent",  # If dispatcher returns "l2_agent", go directly to the l2_agent node.
        },
    )

    # The L1 agent still has its own router for deciding on escalation.
    workflow.add_conditional_edges(
        "l1_agent",
        router,
        {
            "summarize_node": "summarize_node",
            "END": END,
        },
    )
    workflow.add_edge("summarize_node", "l2_agent")
    workflow.add_edge("l2_agent", END)

    return workflow.compile(checkpointer=memory)
