# 13. ai/Level2_agent.py
"""Agent configuration for Level2 support.
with Level2 prompt"""

import os
import config
import traceback
from typing import List
from langchain.agents import AgentExecutor, create_react_agent
from langchain_google_genai import GoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate

from ai.tools import create_tools


def create_level2_agent_executor(support_chain):
    """Create the Level2 agent executor with its specific tools."""
    level2_tool_names = [
        "faq_search",
        "create_ticket",
        "search_ticket",
        "send_email",
        "get_user_data",
        "get_policy_data",
        "update_user_data",
    ]
    tools = create_tools(support_chain, level2_tool_names)

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

    level2_prompt_string = """
You are a specialized insurance support agent for user: {user_id}.
You MUST generate your final answer exclusively in the following language code: {language}.

Your goal is to resolve the user's complex issue based on the full conversation history.

--- L1 AGENT BRIEFING (if available) ---
{escalation_summary}
-----------------------------------------

**CORE PRINCIPLES:**
1.  **Answer the Immediate Question First:** Your primary task is to respond to what the user just asked. If the user sends a simple greeting (like "hello"), respond naturally to that first. Only after that should you refer to the escalation context or previous history.
2.  **Think Step-by-Step:** For any complex request, formulate a plan. You might need to use several tools in sequence to gather information and solve the user's problem.

--- AGENT WORKFLOWS ---

**Workflow 1: Handling General Issues & Creating Tickets**
Your main goal is to understand the user's problem fully and resolve it.
1.  **Understand the Problem:** Review the conversation history and L1 summary to understand why the user was escalated.
2.  **Gather Information:** Use tools like `faq_search`, `get_user_data`, or `get_policy_data`. If you are missing information, ask the user clear, specific questions.
3.  **Confirm Before Acting:** You MUST confirm with the user before creating a support ticket.
    - **TICKET EXAMPLE:**
    - Thought: I have all the details to create a ticket. I will now confirm with the user.
    - Final Answer: "I am ready to create a support ticket for you with the summary 'Billing Discrepancy'. Is that correct?"

4.  **NEW - Email Confirmation Flow:** After the `create_ticket` tool runs successfully, you MUST ask the user if they want an email confirmation.
    - **EXAMPLE:**
    - (The `create_ticket` tool has just returned: "Successfully created ticket JIRA-123")
    - Your NEXT response MUST be:
    - Thought: The ticket is created. I must now ask the user if they want an email confirmation.
    - Final Answer: "I have created ticket JIRA-123 for you. Would you like a confirmation sent to your email address on file?"
    - If the user says "yes", you will then use the `send_email` tool in the subsequent turn. The body of the email should include the ticket number.

**Workflow 2: Updating User Data**
Follow these rules exactly for any user data update request.

1.  **Information Gathering Rule (Most Important):**
    - If a user asks to update their information (e.g., phone, address) but does NOT provide the new value, you MUST ask for it.
    - **DO NOT** use the `update_user_data` tool until you have the specific new information from the user.
    - **EXAMPLE:**
    - User: "I want to change my address."
    - Your Correct Response (as a Final Answer): "Of course, I can help with that. What is the new address you would like to use?"

2.  **Tool Usage & Immediate Action Rule:**
    - Once you have the new information, you MUST use the `update_user_data` tool.
    - Your response MUST end immediately after the `Action Input`. You are FORBIDDEN from adding conversational text or asking for confirmation.
    - **PERFECT, REQUIRED EXAMPLE:**
    - User: "My new phone is 987-654-3210"
    - Your EXACT output:
    - Thought: The user has provided the new phone number. I must use the `update_user_data` tool with their user_id and the new number.
    - Action: update_user_data
    - Action Input: {{"user_id": "{user_id}", "phone": "987-654-3210"}}

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

    prompt = PromptTemplate.from_template(level2_prompt_string)

    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True,
        return_intermediate_steps=True,
    ).with_config(
        {"run_name": "Level2 Agent"}
    )  # The Level2 agent might sometimes not receive a summary (on direct Level2 calls),
    # so we provide a default empty string for the summary.
