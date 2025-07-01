# 4. database/models.py
"""Database models for the insurance support system."""
import json
import psycopg2
import uuid
from config import DB_CONFIG
from typing import List, Dict, Optional
from . import db_utils
from psycopg2.extras import RealDictCursor


# Database initialization
def init_db():
    """Initialize PostgreSQL database tables"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()


def get_user_email(user_id: str) -> Optional[str]:
    """Gets a user's email by their user_id."""
    conn = db_utils.get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT email FROM users WHERE user_id = %s", (user_id,))
            result = cur.fetchone()
            return result[0] if result else None
    finally:
        db_utils.release_db_connection(conn)


def get_user_data(user_id: str):
    """Fetch user personal data from users table."""
    conn = db_utils.get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT user_id, name, email, phone, address, location FROM users WHERE user_id = %s",
                (user_id,),
            )
            result = cur.fetchone()
            if not result:
                return "User not found in the database."
            return f"""User Information:
- User ID: {result.get('user_id', 'N/A')}
- Name: {result.get('name', 'N/A')}
- Email: {result.get('email', 'N/A')}
- Phone: {result.get('phone', 'N/A')}
- Location: {result.get('location', 'N/A')}
- Address: {result.get('address', 'N/A')}"""
    finally:
        db_utils.release_db_connection(conn)


def get_policy_data(user_id: str) -> str:
    """Fetches policy data, formatted for the LLM."""
    conn = db_utils.get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT policy_id, user_id, policy_type, policy_status, issue_date, expiry_date, premium_amount, coverage_amount, markdown_format FROM policies WHERE user_id = %s",
                (user_id,),
            )
            result = cur.fetchall()  #  Use fetchall() to get all policies
            if not result:
                return "No policy found for this user."

            # Loop through all policies and build a comprehensive string.
            formatted_policies = []
            for policies in result:
                formatted_policies.append(
                    f"""- Policy ID: {policies.get('policy_id', 'N/A')}
  - Type: {policies.get('policy_type', 'N/A')}
  - Status: {policies.get('policy_status', 'N/A')}
  - Coverage: ${policies.get('coverage_amount', 0):,.2f}
  - Premium: ${policies.get('premium_amount', 0):,.2f}"""
                )

            # Join all the policy strings into a single response for the agent.
            return "Here is the user's policy information:\n" + "\n\n".join(
                formatted_policies
            )

    finally:
        db_utils.release_db_connection(conn)


def get_user_history(user_id: str) -> List[Dict[str, str]]:
    """
    Gets structured conversation history for a user.
    Always returns a list. The list will be empty if no history is found or if data is corrupted.
    """
    conn = db_utils.get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT history FROM users WHERE user_id = %s", (user_id,))
            result = cur.fetchone()
            if result and result[0]:
                try:
                    # Safely parse the JSON string into a Python list of dictionaries
                    return json.loads(result[0])
                except json.JSONDecodeError:
                    print(
                        f"Warning: Corrupted history for user_id {user_id}. Returning empty list."
                    )
                    return []
        # If no user or history, return an empty list for consistency
        return []
    except Exception as e:
        print(f"Error fetching user history for {user_id}: {e}")
        return []  # Return empty list on DB error to prevent crashes
    finally:
        db_utils.release_db_connection(conn)


def update_user_history(user_id: str, history: List[Dict[str, str]]) -> bool:
    """
    Updates the conversation history for a user using a structured list.
    """
    conn = db_utils.get_db_connection()
    try:
        with conn.cursor() as cur:
            # Safely serialize the Python list into a JSON string for storage
            history_json = json.dumps(
                history, indent=2
            )  # indent is optional but nice for debugging
            cur.execute(
                "UPDATE users SET history = %s WHERE user_id = %s",
                (history_json, user_id),
            )
            conn.commit()
            return True
    except Exception as e:
        conn.rollback()
        print(f"History update failed for {user_id}: {e}")
        return False
    finally:
        db_utils.release_db_connection(conn)
