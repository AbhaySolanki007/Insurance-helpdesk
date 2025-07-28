# 15. utils/helpers.py
"""Helper utilities for the application."""
from typing import List, Dict, Any


# Define how many of the most recent conversation turns to include in the prompt.
# A "turn" consists of one user input and one AI output.
MAX_HISTORY_TURNS = 6


# This function is now designed to work with a list of dictionaries from the database.
def format_history_for_prompt(history: List[Dict[str, str]]) -> str:
    """
    Formats a list of structured history turns from the database into a single
    string for an LLM prompt, using only the most recent turns.
    """
    if not history:
        return "No previous conversation history."

    # Get the last N turns of the conversation to keep the prompt concise.
    recent_history = history[-MAX_HISTORY_TURNS:]

    entries = []
    # We loop through the recent history only.
    for turn in recent_history:
        # Safely get 'input' and 'output' from each dictionary.
        user_message = turn.get("input", "")
        ai_message = turn.get("output", "")
        is_level2_session = turn.get("is_level2_session", False)

        # We only add non-empty messages to the prompt history.
        if user_message:
            entries.append(f"Human: {user_message}")

        # We filter out the internal "Level2...." escalation message from the prompt.
        if ai_message and "Level2...." not in ai_message:
            entries.append(f"AI: {ai_message}")

    return "\n\n".join(entries)


def format_full_history_for_summary(history: List[Dict[str, str]]) -> str:
    """
    Formats the entire list of structured history turns from the database into a
    single string for the summarization prompt, without truncation.
    """
    if not history:
        return "No previous conversation history."

    entries = []
    # Loop through the entire history.
    for turn in history:
        # Safely get 'input' and 'output' from each dictionary.
        user_message = turn.get("input", "")
        ai_message = turn.get("output", "")

        # We only add non-empty messages to the prompt history.
        if user_message:
            entries.append(f"Human: {user_message}")

        # We filter out the internal "Level2...." escalation message from the prompt.
        if ai_message and "Level2...." not in ai_message:
            entries.append(f"AI: {ai_message}")

    return "\n\n".join(entries)


# You can add other helpers here in the future, for example:
# import re
# def detect_language(text: str) -> str:
#     # Dummy language detection
#     return "en"


"""kind of helper functions are commonly needed in a web application. For instance, data validation functions
to check email formats or password strength. Date and time formatting functions to standardize how dates are
displayed. Security utilities like generating secure tokens for email verification or password reset.
Error handling decorators to catch exceptions and log them, which would make the code cleaner and
more maintainable.

Also, response formatting is important. They might want a consistent way to format JSON responses from the API,
including success and error messages. Logging setup is another aspect, ensuring that logs are properly configured
to track application behavior and errors.

Another consideration is environment checks, like verifying if the application is running in debug mode.
Additionally, functions for handling file operations, such as safely reading configuration files,
could be useful. Data sanitization to prevent issues like SQL injection by escaping special characters
might also be necessary.

I should provide examples of each type of function. For instance, a validate_email function using regex,
a format_timestamp function using datetime, a generate_secure_token function using secrets module,
and a handle_errors decorator that wraps functions to catch exceptions.
"""

"""
Key Utilities Included:


Validation Helpers

Email validation

Policy number validation

Password strength checking

Date parsing

Security Utilities

Secure token generation

Data masking

Input sanitization

Formatting Helpers

Timestamp formatting

Standard API response formatting

Decorators

Error handling and logging decorator

Utility Functions

Age calculation

Debug mode check

Sensitive data masking"""
