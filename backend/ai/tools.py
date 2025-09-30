# 14. ai/tools.py
"""Tool definitions for agent functionality. which is used in l2"""

from typing import Dict, Any, Union, Optional, Type, Callable, TypeVar
import json
from pydantic import BaseModel, Field
from langchain.tools import Tool
from typing import Dict, Any, List

from database.postgre import get_policy_data, get_user_data, update_user_data
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


class UserUpdateInput(BaseModel):
    user_id: str = Field(description="The user_id to update")
    name: Optional[str] = Field(default=None, description="User's full name")
    phone: Optional[str] = Field(default=None, description="User's phone number")
    address: Optional[str] = Field(default=None, description="User's address")
    location: Optional[str] = Field(default=None, description="User's location")
    passwords: Optional[str] = Field(default=None, description="User's password")


class PDFDocumentQueryInput(BaseModel):
    user_id: str = Field(description="The user_id to search documents for")
    filename: str = Field(
        description="The specific PDF filename to search in (e.g., 'policy.pdf')"
    )
    query: str = Field(
        description="The question or term to search for in the specified document"
    )


# Type variable for generic function typing
T = TypeVar("T", bound=BaseModel)


def update_user_data_with_approval(user_id: str, updates: dict) -> str:
    """
    Wrapper function that triggers human approval workflow instead of directly updating.
    This function will be called by the agent, but the actual update will be handled
    by the human approval node in the LangGraph workflow.
    """
    return {
        "status": "pending_approval",
        "message": "Your update request has been submitted for approval",
        "updates": updates,
        "user_id": user_id,
    }


def query_specific_document(user_id: str, filename: str, query: str) -> str:
    """
    Search for information in a specific PDF document uploaded by the user using intelligent RAG.

    Args:
        user_id: The user ID to search documents for
        filename: The specific PDF filename to search in
        query: The question or term to search for

    Returns:
        Formatted response with relevant content from the specified document
    """
    try:
        # Import here to avoid circular imports
        import sys
        import os

        sys.path.append(os.path.join(os.path.dirname(__file__), "..", "uploads"))
        from pdf_processor import pdf_processor

        # Use the user's query directly for semantic search
        # Search all documents in the database (no user filtering for simplicity)
        results = pdf_processor.search_documents(query=query, user_id=None, limit=15)

        # Filter results to only include the specified filename
        filtered_results = []
        for result in results:
            if result["metadata"].get("filename", "").lower() == filename.lower():
                filtered_results.append(result)

        if not filtered_results:
            return f"No relevant information found in '{filename}' for the query: '{query}'. Please make sure the filename is correct and the document has been uploaded."

        # Remove duplicates based on content similarity
        unique_results = []
        for result in filtered_results:
            is_duplicate = False
            for unique_result in unique_results:
                # Simple similarity check - if content is very similar, skip
                if (
                    len(
                        set(result["content"].split())
                        & set(unique_result["content"].split())
                    )
                    / max(
                        len(result["content"].split()),
                        len(unique_result["content"].split()),
                    )
                    > 0.8
                ):
                    is_duplicate = True
                    break
            if not is_duplicate:
                unique_results.append(result)

        # Sort by relevance (lower distance = higher relevance)
        unique_results.sort(key=lambda x: x["distance"])

        # Take top 5 most relevant results
        top_results = unique_results[:5]

        # Format the results
        formatted_results = []
        for i, result in enumerate(top_results, 1):
            content = result["content"]
            relevance = (
                1 - result["distance"]
            )  # Convert distance to relevance percentage

            formatted_results.append(
                f"**Section {i}** (Relevance: {relevance:.1%}):\n{content}\n"
            )

        return (
            f"Found {len(top_results)} relevant sections in '{filename}':\n\n"
            + "\n".join(formatted_results)
        )

    except Exception as e:
        return f"Error searching in '{filename}': {str(e)}"


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


def create_tools(support_chain, tool_names: List[str]):
    """
    Create a list of tools for an agent based on a list of tool names.

    Args:
        support_chain: An instance of UnifiedSupportChain to access the FAQ retriever.
        tool_names: A list of strings with the names of the tools to create.
    """
    available_tools = {
        "faq_search": Tool(
            name="faq_search",
            func=support_chain.get_faq_response,
            description="Use this to find answers to frequently asked questions about insurance. Input should be a user's question.",
        ),
        "get_user_data": Tool(
            name="get_user_data",
            func=create_tool_wrapper(lambda x: get_user_data(x.user_id), UserDataInput),
            description="Use this to get the user's personal information like name, email, and address. Input must be a user_id.",
        ),
        "get_policy_data": Tool(
            name="get_policy_data",
            func=create_tool_wrapper(
                lambda x: get_policy_data(x.user_id), PolicyDataInput
            ),
            description="Use this to get details about the user's insurance policies. Input must be a user_id.",
        ),
        "update_user_data": Tool(
            name="update_user_data",
            func=create_tool_wrapper(
                lambda x: update_user_data_with_approval(
                    x.user_id,
                    {
                        k: v
                        for k, v in x.model_dump().items()
                        if k != "user_id" and v is not None
                    },
                ),
                UserUpdateInput,
            ),
            description="Use this ONLY for Level2 escalation. Update user's personal information like name, phone, address, location, or password.",
        ),
        "create_ticket": Tool(
            name="create_ticket",
            func=create_tool_wrapper(lambda x: create_ticket(x), TicketCreateInput),
            description="Use this ONLY for Level2 escalation. Creates a support ticket in JIRA after collecting a summary and description.",
        ),
        "search_ticket": Tool(
            name="search_ticket",
            func=create_tool_wrapper(lambda x: search_tickets(x), TicketSearchInput),
            description="Use this ONLY for Level2 escalation. Search for a user's existing support tickets.",
        ),
        "send_email": Tool(
            name="send_email",
            func=create_tool_wrapper(
                lambda x: send_email(x.user_id, x.subject, x.body), EmailSendInput
            ),
            description="Use this ONLY for Level2 escalation. Send an email to the user.",
        ),
        "query_pdf_document": Tool(
            name="query_pdf_document",
            func=create_tool_wrapper(
                lambda x: query_specific_document(x.user_id, x.filename, x.query),
                PDFDocumentQueryInput,
            ),
            description="Use this to intelligently search and retrieve information from a specific PDF document. The tool uses semantic search to understand the user's query and find relevant content from all uploaded documents. Input requires user_id, filename (e.g., 'policy.pdf'), and the user's natural language query (e.g., 'What is this document about?', 'Explain the deductibles', 'Give me a summary').",
        ),
    }

    # Return only the tools that were requested
    return [available_tools[name] for name in tool_names if name in available_tools]
