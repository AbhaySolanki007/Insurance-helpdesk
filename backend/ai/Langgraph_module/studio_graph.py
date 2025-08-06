# Graph configuration for LangGraph Studio
# This file exports the graph without a checkpointer for use with langgraph dev

from ..Level1_agent import create_l1_agent_executor
from ..Level2_agent import create_level2_agent_executor
from .graph_compiler import compile_graph
from ..rag_orchestrator import UnifiedSupportChain

# Initialize the support chain and agents
support_chain = UnifiedSupportChain()
l1_agent_executor = create_l1_agent_executor(support_chain)
l2_agent_executor = create_level2_agent_executor(support_chain)

# Compile the graph WITHOUT a checkpointer for LangGraph Studio
# The platform handles persistence automatically
app_graph = compile_graph(l1_agent_executor, l2_agent_executor, memory=None)
