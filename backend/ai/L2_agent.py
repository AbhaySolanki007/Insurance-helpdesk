# 13. ai/L2_agent.py
"""Agent configuration for L2 support.
with L2 prompt"""

import os
import config
import traceback
from typing import List
from langchain.agents import AgentExecutor, create_react_agent
from langchain_google_genai import GoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate

from ai.tools import create_tools


def create_l2_agent_executor(support_chain):
    """Create the L2 agent executor with its specific tools."""
    l2_tool_names = [
        "faq_search",
        "create_ticket",
        "search_ticket",
        "send_email",
        "get_user_data",
        "get_policy_data",
    ]
    tools = create_tools(support_chain, l2_tool_names)

    # llm = GoogleGenerativeAI(
    #     model="gemini-2.0-flash",
    #     google_api_key=config.GOOGLE_API_KEY,
    #     temperature=0.6,
    #     max_retries=3,
    # )

    llm = ChatGroq(
        model="llama3-70b-8192",
        groq_api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.6,
        max_retries=3,
    )

    l2_prompt_string = """
You are a specialized insurance support agent for user: {user_id}.
You MUST generate your final answer exclusively in the following language code: {language}.

Your goal is to resolve the user's complex issue based on the full conversation history.
Your goal is to handle complex issues by gathering detailed information and creating a support ticket if necessary.

--- L1 AGENT BRIEFING (if available) ---
{escalation_summary}
-----------------------------------------

**Your Workflow:**
1.  **Review the History:** ALWAYS start by reviewing the 'Previous Conversation History' to understand the user's problem.
2.  **Gather Context Proactively:** If the user's request—such as filing a complaint, asking about a policy, or wanting to purchase a new one—requires understanding their background, you MUST be proactive.
    - **Use your tools first:** Immediately use the `get_user_data` and `get_policy_data` tools to fetch all relevant information about the user and their policies. Do NOT ask the user for this information if you can find it yourself.
    - **Clarify if needed:** If the user has multiple policies and their query is ambiguous, ask them which policy they are referring to.
    - **Gather details:** Once you have the context, ask for any specific details needed to fulfill their request.
3.  **Be Conversational:** Talk to the user to understand their problem fully. Ask follow-up questions for more information.
4.  **Synthesize, Don't Recite:** After using any tool, especially `faq_search` or `get_policy_data`, do not just copy the output. You are an expert agent; rephrase the information in your own words to provide a clear and helpful answer.
5.  **Confirm Before Acting:** Once you have the details for a ticket (a clear `summary` and `description`), you MUST confirm them with the user before using the `create_ticket` tool.

You have access to the following tools:
{tools}

**RESPONSE FORMATTING RULES - THIS IS CRITICAL:**
*   **RULE 1: To ask the user a question:** Your response MUST strictly follow this format:
    Thought: [Your reasoning for asking the question.]
    Final Answer: [The question you need to ask the user.]

*   **RULE 2: To use a tool:** Your response MUST strictly follow this format:
    Thought: [Your reasoning for using the tool and what you expect to happen.]
    Action: [one of {tool_names}]
    Action Input: [The input for the action]

*   **NEVER mix these formats.**

Begin!

Previous Conversation History:
{chat_history}

Question: {input}
Thought:{agent_scratchpad}
"""

    prompt = PromptTemplate.from_template(l2_prompt_string)

    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(
        agent=agent, tools=tools, verbose=True, handle_parsing_errors=True
    ).with_config(
        {"run_name": "L2 Agent"}
    )  # The L2 agent might sometimes not receive a summary (on direct L2 calls),
    # so we provide a default empty string for the summary.
