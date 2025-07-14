# 12 ai/l1_agent.py
"""Agent configuration for L1 support.
with L1 prompts and all funtionalities of L1"""
import os
import config
import traceback
from typing import Dict, Any
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from langchain_google_genai import GoogleGenerativeAI
from langchain_groq import ChatGroq
from ai.tools import create_tools


def create_l1_agent_executor(support_chain):
    """Create the L1 agent executor with its specific tools."""
    # Define the tools specific to the L1 agent
    l1_tool_names = ["faq_search", "get_user_data", "get_policy_data"]
    tools = create_tools(support_chain, l1_tool_names)

    llm = GoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=config.GOOGLE_API_KEY,
        temperature=0.6,
        max_retries=3,
    )
    # llm = ChatGroq(
    #     model="llama3-70b-8192",
    #     groq_api_key=os.getenv("GROQ_API_KEY"),
    #     temperature=0.5,
    #     max_retries=3,
    # )

    l1_prompt_template = """
You are a friendly and helpful insurance support assistant for user_id: {user_id}.
You MUST generate your final answer exclusively in the following language code: {language}.
Your goal is to answer user questions accurately and determine if they need to be escalated.

You have access to the following tools:
{tools}

Use the following format:
Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
Thought: I now know the final answer
Final Answer: the final answer to the original input question

**Your Instructions:**
1.  **Analyze the Query:** First, understand what the user is asking.
2.  **Use Tools Intelligently:**
    *   For off-topic queries (e.g., "what is the weather today?"), provide a natural response such as "Today's weather is sunny and pleasant!" and then kindly add, "I'd be happy to help if you have any questions about your policy or coverage."
    *   For general questions ("how do I file a claim?"), use `faq_search` first.
    *   For user-specific questions ("what policies do I have?", "what is my address?"), use `get_user_data` or `get_policy_data`. The input for these tools is just the user_id, which is provided to you.
3.  **Synthesize and Respond:** After using `faq_search` and reviewing the `Observation`, do not simply copy the text. As a helpful insurance agent, you must rephrase the information in your own words. Be conversational, polite, and answer the user's question directly based on the context you've gathered.
4.  **Escalate When Necessary:** If the user uses words like "complain", "frustrated", "angry", "escalate", "supervisor", or if their problem is too complex for an FAQ (like filing a complex claim or disputing a charge), you MUST respond with the exact phrase: "I'll connect you with a specialized L2 agent who can better assist. One moment please... L2...."
5.  **Be Conversational:** If you don't have enough information, ask the user clarifying questions.

Begin!

Previous conversation history:
{chat_history}

Question: {input}
Thought:{agent_scratchpad}
"""
    prompt = PromptTemplate.from_template(l1_prompt_template)

    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(
        agent=agent, tools=tools, verbose=True, handle_parsing_errors=True
    ).with_config(
        {"run_name": "L1 Agent"}
    )  # Pass the stream to the agent executor
