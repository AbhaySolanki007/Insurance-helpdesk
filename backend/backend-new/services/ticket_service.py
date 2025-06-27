# 6. services/ticket_service.py
"""Ticket management services."""
from . import jira_service


def create_ticket(input_data):
    """
    Create a support ticket for the user

    Args:
        input_data: TicketCreateInput object

    Returns:
        str: Ticket creation status message
    """
    user_id = input_data.user_id
    summary = input_data.summary
    description = input_data.description

    ticket_id = jira_service.create_jira_ticket(user_id, summary, description)

    if not ticket_id:
        return "Failed to create ticket in jira."

    return f'Ticket {ticket_id} created in JIRA for: "{summary}". Would you like me to send confirmation to your registered email? (Yes/No)'


def search_tickets(input_data):
    """
    Search for tickets matching a query

    Args:
        input_data: TicketSearchInput object

    Returns:
        str: Formatted ticket search results
    """
    user_id = input_data.user_id
    query = input_data.query
    results = jira_service.search_jira_tickets(user_id, query)
    if not results:
        return "No tickets found in JIRA for this user."

    formatted_results = []
    for ticket in results:
        formatted_results.append(
            f"ID: {ticket['id']}\n"
            f"Summary: {ticket['summary']}\n"
            f"Description: {ticket['description'][:100]}...\n"
            f"Status: {ticket['status']}\n"
            f"Created: {ticket['created_at']}"
        )

    return "\n\n".join(formatted_results)
