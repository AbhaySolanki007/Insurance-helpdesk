from functools import partial
from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, END, START
from .Langgraph import (
    AgentState,
    l1_node,
    level2_node,
    router,
    summarize_for_level2_node,
    dispatcher,
    human_approval_node,
)


def compile_graph(
    l1_agent_executor: Any,
    level2_agent_executor: Any,
    memory: Optional[Any] = None,
) -> Any:
    """
    Assembles and compiles the LangGraph workflow.
    """
    workflow = StateGraph(AgentState)

    # Add all the nodes to the graph
    workflow.add_node("l1_agent", partial(l1_node, agent_executor=l1_agent_executor))
    workflow.add_node("summarize_node", summarize_for_level2_node)
    workflow.add_node(
        "level2_agent", partial(level2_node, agent_executor=level2_agent_executor)
    )
    workflow.add_node("human_approval", human_approval_node)

    # The graph's entry point is now a conditional router.
    workflow.add_conditional_edges(
        START,  # The special "START" key tells LangGraph this is the entry point router.
        dispatcher,  # The function that decides the initial path.
        {
            "l1_agent": "l1_agent",  # If dispatcher returns "l1_agent", go to the l1_agent node.
            "level2_agent": "level2_agent",  # If dispatcher returns "level2_agent", go directly to the level2_agent node.
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
    workflow.add_edge("summarize_node", "level2_agent")

    # Add conditional edge from level2_agent to human_approval or END
    workflow.add_conditional_edges(
        "level2_agent",
        lambda state: "human_approval" if state.get("pending_user_update") else "END",
        {"human_approval": "human_approval", "END": END},
    )

    workflow.add_edge("human_approval", END)

    # When compiling, tell LangGraph to interrupt BEFORE the human_approval node
    # This ensures the graph pauses and waits for an external action.
    return workflow.compile(checkpointer=memory, interrupt_before=["human_approval"])
