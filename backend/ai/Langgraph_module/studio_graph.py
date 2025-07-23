# Graph configuration for LangGraph Studio
# This file exports the graph without a checkpointer for use with langgraph dev

from ..L1_agent import create_l1_agent_executor
from ..L2_agent import create_l2_agent_executor
from .graph_compiler import compile_graph
from ..unified_chain import UnifiedSupportChain

# Initialize the support chain and agents
support_chain = UnifiedSupportChain()
l1_agent_executor = create_l1_agent_executor(support_chain)
l2_agent_executor = create_l2_agent_executor(support_chain)

# Compile the graph WITHOUT a checkpointer for LangGraph Studio
# The platform handles persistence automatically
app_graph = compile_graph(l1_agent_executor, l2_agent_executor, memory=None)
