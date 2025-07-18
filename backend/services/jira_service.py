# 9.1 services/jira_service.py
import re
from jira import JIRA
import config

# Initialize JIRA client
options = {"server": config.JIRA_SERVER}
jira_client = JIRA(options, basic_auth=(config.JIRA_USERNAME, config.JIRA_API_TOKEN))


def create_jira_ticket(username: str, summary: str, description: str):
    """Creates a ticket in JIRA."""
    try:
        # You can add the username to the description or use a custom JIRA field
        full_description = f"User: {username}\n\n{description}"

        issue_dict = {
            "project": {"key": config.JIRA_PROJECT_KEY},
            "summary": summary,
            "description": full_description,
            "issuetype": {"name": "Task"},  # Or 'Bug', 'Story', etc.
            # If you have a custom field for username:
            # "customfield_XXXXX": username
        }
        new_issue = jira_client.create_issue(fields=issue_dict)
        return new_issue.key  # Returns the JIRA ticket ID like 'SUP-123'
    except Exception as e:
        print(f"Error creating JIRA ticket: {e}")
        return None


def search_jira_tickets(username: str, query: str = ""):
    """Searches for tickets in JIRA for a given user."""
    try:
        # This pattern checks if the query looks like a JIRA issue key (e.g., KAN-2)
        is_issue_key = re.match(r"^[A-Z]+-\d+$", query.upper())

        if is_issue_key:
            # If searching for a specific key, this is the most direct JQL.
            # The key is unique, so we don't need project or username filters.
            jql_query = f'issuekey = "{query.upper()}"'
        else:
            # If it's a general search, filter by project and the username in the description.
            # Using \'"{username}"\' safely wraps the username in quotes for the JQL query.
            jql_query = f'project = "{config.JIRA_PROJECT_KEY}" AND description ~ \'"{username}"\''

            if query:
                # If there are other search terms, add them to the general query.
                jql_query += (
                    f" AND (summary ~ '\"{query}\"' OR description ~ '\"{query}\"')"
                )

        jql_query += " ORDER BY created DESC"

        issues = jira_client.search_issues(jql_query, maxResults=10)

        results = []
        for issue in issues:
            results.append(
                {
                    "id": issue.key,
                    "summary": issue.fields.summary,
                    "description": issue.fields.description,
                    "status": issue.fields.status.name,
                    "created_at": issue.fields.created,
                }
            )
        return results
    except Exception as e:
        print(f"Error searching JIRA tickets: {e}")
        return []


def get_all_jira_tickets():
    """Fetches all tickets from the configured JIRA project."""
    try:
        jql_query = f'project = "{config.JIRA_PROJECT_KEY}" ORDER BY created DESC'
        issues = jira_client.search_issues(jql_query, maxResults=False)

        results = []
        for issue in issues:
            results.append(
                {
                    "id": issue.key,
                    "summary": issue.fields.summary,
                    "description": issue.fields.description,
                    "status": issue.fields.status.name,
                    "assignee": (
                        issue.fields.assignee.displayName
                        if issue.fields.assignee
                        else "Unassigned"
                    ),
                    "reporter": (
                        issue.fields.reporter.displayName
                        if issue.fields.reporter
                        else "N/A"
                    ),
                    "priority": (
                        issue.fields.priority.name if issue.fields.priority else "N/A"
                    ),
                    "created_at": issue.fields.created,
                    "updated_at": issue.fields.updated,
                    "due_date": issue.fields.duedate,
                }
            )
        return results
    except Exception as e:
        print(f"Error fetching all JIRA tickets: {e}")
        return []
