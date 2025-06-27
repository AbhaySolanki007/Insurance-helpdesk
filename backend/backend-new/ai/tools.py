# 9. ai/tools.py
"""Tool definitions for agent functionality. which is used in l2"""

from typing import Dict, Any, Union, Optional, Type, Callable, TypeVar
import json
from pydantic import BaseModel, Field
from langchain.tools import Tool

from database.models import get_policy_data, get_user_data
from services.email_service import send_email
from services.ticket_service import create_ticket, search_tickets


class TicketCreateInput(BaseModel):
    user_id: str = Field(description="user_id to create ticket for")
    summary: str = Field(description="Brief summary of the ticket")
    description: str = Field(description="Detailed description of the ticket")


class TicketSearchInput(BaseModel):
    user_id: str = Field(description="user_id to search tickets for")
    query: str = Field(
        description="Search term for tickets (empty string returns all tickets)"
    )


class EmailSendInput(BaseModel):
    user_id: str = Field(description="user_id to send email to")
    subject: str = Field(description="Email subject")
    body: str = Field(description="Email body content")


class UserDataInput(BaseModel):
    user_id: str = Field(description="The user_id to fetch data for")


class PolicyDataInput(BaseModel):
    user_id: str = Field(description="The user_id to fetch policy data for")


# Type variable for generic function typing
T = TypeVar("T", bound=BaseModel)


def create_tool_wrapper(
    func: Callable[[T], str], schema_class: Type[T]
) -> Callable[[Union[str, Dict[str, Any]]], str]:
    """
    Create a wrapper function that handles input parsing, validation,
    and calls the underlying function with the validated Pydantic model.

    Args:
        func: The function to wrap
        schema_class: The Pydantic model class to validate input against

    Returns:
        A wrapped function that handles various input formats
    """

    def wrapped_func(input_data: Union[str, Dict[str, Any]]) -> str:
        try:
            if isinstance(input_data, str):
                try:
                    parsed_input = json.loads(input_data)
                except json.JSONDecodeError:
                    if (
                        len(schema_class.model_fields) == 1
                        and "user_id" in schema_class.model_fields
                    ):
                        parsed_input = {"user_id": input_data}
                    else:
                        return f"Invalid input. Expected JSON with fields: {list(schema_class.model_fields.keys())}"
            else:
                parsed_input = input_data

            # Create and validate the model instance
            validated_input = schema_class(**parsed_input)

            # Call the original function with the validated Pydantic object
            return func(validated_input)

        except Exception as e:
            return f"Error: {str(e)}. Expected format: {schema_class.__name__} with fields {list(schema_class.model_fields.keys())}"

    return wrapped_func


def create_tools(support_chain):
    """Create a list of tools for the agent"""
    return [
        Tool(
            name="faq_search",
            func=support_chain.get_faq_response,
            description="Search insurance FAQs. Input: question string. Output: formatted FAQs.",
        ),
        Tool(
            name="create_ticket",
            # Pass the Pydantic object `x` directly to create_ticket
            func=create_tool_wrapper(lambda x: create_ticket(x), TicketCreateInput),
            description="Use this ONLY AFTER you have collected a summary and a detailed description from the user. Do not use this tool before asking for details first. This tool creates a support ticket in JIRA.",
        ),
        Tool(
            name="search_ticket",
            # Pass the Pydantic object `x` directly to search_tickets
            func=create_tool_wrapper(lambda x: search_tickets(x), TicketSearchInput),
            description="Search user's tickets (empty query returns all tickets)",
        ),
        Tool(
            name="send_email",
            # Pass the required fields from the Pydantic object `x` to send_email
            func=create_tool_wrapper(
                lambda x: send_email(x.user_id, x.subject, x.body), EmailSendInput
            ),
            description="Send an email to the user's registered email address",
        ),
        Tool(
            name="get_user_data",
            # Pass the user_id attribute from the Pydantic object `x` to get_user_data
            func=create_tool_wrapper(lambda x: get_user_data(x.user_id), UserDataInput),
            description="Fetch user personal information from the database.",
        ),
        Tool(
            name="get_policy_data",
            # Pass the user_id attribute from the Pydantic object `x` to get_policy_data
            func=create_tool_wrapper(
                lambda x: get_policy_data(x.user_id), PolicyDataInput
            ),
            description="Fetch user policy information from the database.",
        ),
    ]
