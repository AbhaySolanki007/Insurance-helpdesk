# 13. ai/L2_agent.py
"""Agent configuration for L2 support.
with L2 prompt"""

import os
import config
import traceback
from typing import Dict, Any, List
from database.models import get_user_history
from database.models import update_user_history
from utils.helpers import format_history_for_prompt
from langchain.agents import AgentExecutor, create_react_agent
from langchain import hub
from langchain_google_genai import GoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate

from ai.tools import create_tools
from database.models import init_db


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
        temperature=0.2,
        max_retries=3,
    )

    l2_prompt_string = """
You are a specialized insurance support agent for user: {user_id}.
You MUST generate your final answer exclusively in the following language code: {language}.
Your primary goal is to handle complex issues by gathering detailed information from the user and then creating a support ticket.

**Your Workflow:**
1.  **Be Conversational:** Talk to the user to understand their problem fully.
2.  **Gather Details:** Your main task is to collect a clear `summary` and a detailed `description` for the ticket. Ask follow-up questions until you have enough information.
3.  **Confirm Before Acting:** Once you have gathered the details, you MUST confirm them with the user. Propose a summary and description and ask for their permission to create the ticket.
4.  **Use Tools:** Only after the user confirms the details should you use the `create_ticket` tool.

You have access to the following tools:
{tools}

**RESPONSE FORMATTING RULES - THIS IS CRITICAL:**

*   **RULE 1: To ask the user a question:** If you need more information or need to confirm something with the user, your response MUST strictly follow this format:
    Thought: [Your reasoning for asking the question.]
    Final Answer: [The question you need to ask the user.]

*   **RULE 2: To use a tool:** If you have enough information to use a tool, your response MUST strictly follow this format:
    Thought: [Your reasoning for using the tool and what you expect to happen.]
    Action: [one of {tool_names}]
    Action Input: [The input for the action]

*   **NEVER mix these formats.** A response with a `Final Answer` must NOT contain an `Action`. A response with an `Action` must NOT contain a `Final Answer`.

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
    )


def process_l2_query(
    query: str, user_id: str, language: str, support_chain, agent_executor
) -> Dict[str, Any]:
    """Processes an L2 query using the agent, with centralized history management."""
    try:
        user_history = get_user_history(user_id)
        history_text_for_prompt = format_history_for_prompt(user_history)

        response = agent_executor.invoke(
            {
                "input": query,
                "user_id": user_id,
                "language": language,
                "chat_history": history_text_for_prompt,
            }
        )
        output = response.get("output", "I'm sorry, I couldn't process that request.")

        user_history.append({"input": query, "output": output})
        update_user_history(user_id, user_history)

        return {"response": output, "user_id": user_id}

    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error in L2 processing: {error_details}")
        return {"error": str(e), "details": error_details, "user_id": user_id}
