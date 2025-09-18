# 4. database/postgre.py
"""Database models for the insurance support system."""
import json
import psycopg2
import uuid
from config import DB_CONFIG
from typing import List, Dict, Optional
from . import db_utils
from psycopg2.extras import RealDictCursor
from config import USE_SUPABASE, SUPABASE_CLIENT


# Database initialization
def init_db():
    """Initialize database tables - works with both Supabase and local PostgreSQL"""
    if USE_SUPABASE:
        # ========== SUPABASE CODE START ==========
        print(
            "✅ Supabase database initialization - tables should already exist in Supabase"
        )
        # Supabase tables are managed through the Supabase dashboard
        # No need to create tables here as they should already exist
        return
        # ========== SUPABASE CODE END ==========
    else:
        # ========== ORIGINAL POSTGRESQL CODE START ==========
        """Initialize PostgreSQL database tables"""
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        # Add any table creation logic here if needed
        cursor.close()
        conn.close()
        # ========== ORIGINAL POSTGRESQL CODE END ==========


def get_user_email(user_id: str) -> Optional[str]:
    """Gets a user's email by their user_id."""
    if USE_SUPABASE:
        # ========== SUPABASE CODE START ==========
        try:
            result = (
                SUPABASE_CLIENT.table("users")
                .select("email")
                .eq("user_id", user_id)
                .execute()
            )
            return result.data[0]["email"] if result.data else None
        except Exception as e:
            print(f"Error fetching user email: {e}")
            return None
        # ========== SUPABASE CODE END ==========
    else:
        # ========== ORIGINAL POSTGRESQL CODE START ==========
        conn = db_utils.get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT email FROM users WHERE user_id = %s", (user_id,))
                result = cur.fetchone()
                return result[0] if result else None
        finally:
            db_utils.release_db_connection(conn)
        # ========== ORIGINAL POSTGRESQL CODE END ==========


def get_user_data(user_id: str):
    """Fetch user personal data from users table."""
    if USE_SUPABASE:
        # ========== SUPABASE CODE START ==========
        try:
            result = (
                SUPABASE_CLIENT.table("users")
                .select("user_id, name, email, phone, address, location")
                .eq("user_id", user_id)
                .execute()
            )

            if result.data:
                user = result.data[0]
                return f"""User Information:
- User ID: {user.get('user_id', 'N/A')}
- Name: {user.get('name', 'N/A')}
- Email: {user.get('email', 'N/A')}
- Phone: {user.get('phone', 'N/A')}
- Location: {user.get('location', 'N/A')}
- Address: {user.get('address', 'N/A')}"""
            else:
                return "User not found in the database."
        except Exception as e:
            print(f"Error fetching user data: {e}")
            return "Error fetching user data."
        # ========== SUPABASE CODE END ==========
    else:
        # ========== ORIGINAL POSTGRESQL CODE START ==========
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
        # ========== ORIGINAL POSTGRESQL CODE END ==========


def get_all_users():
    """Fetch all users from the database for admin portal."""
    if USE_SUPABASE:
        # ========== SUPABASE CODE START ==========
        try:
            result = (
                SUPABASE_CLIENT.table("users")
                .select("user_id, name, email, phone, address, location")
                .order("name")
                .execute()
            )
            return result.data
        except Exception as e:
            print(f"Error fetching all users: {e}")
            return []
        # ========== SUPABASE CODE END ==========
    else:
        # ========== ORIGINAL POSTGRESQL CODE START ==========
        conn = db_utils.get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT user_id, name, email, phone, address, location
                    FROM users
                    ORDER BY name
                """
                )
                users = cur.fetchall()
                return users
        except Exception as e:
            print(f"Error fetching all users: {e}")
            return []
        finally:
            db_utils.release_db_connection(conn)
        # ========== ORIGINAL POSTGRESQL CODE END ==========


def get_policy_data(user_id: str) -> str:
    """Fetches policy data, formatted for the LLM."""
    if USE_SUPABASE:
        # ========== SUPABASE CODE START ==========
        try:
            result = (
                SUPABASE_CLIENT.table("policies")
                .select(
                    "policy_id, user_id, policy_type, policy_status, issue_date, expiry_date, premium_amount, coverage_amount, markdown_format"
                )
                .eq("user_id", user_id)
                .execute()
            )

            if not result.data:
                return "No policy found for this user."

            # Loop through all policies and build a comprehensive string.
            formatted_policies = []
            for policy in result.data:
                formatted_policies.append(
                    f"""- Policy ID: {policy.get('policy_id', 'N/A')}
  - Type: {policy.get('policy_type', 'N/A')}
  - Status: {policy.get('policy_status', 'N/A')}
  - Coverage: ${policy.get('coverage_amount', 0):,.2f}
  - Premium: ${policy.get('premium_amount', 0):,.2f}
  - Full Policy Details:
{policy.get('markdown_format', 'No detailed information available.')}"""
                )

            # Join all the policy strings into a single response for the agent.
            return "Here is the user's policy information:\n" + "\n\n".join(
                formatted_policies
            )
        except Exception as e:
            print(f"Error fetching policy data: {e}")
            return "Error fetching policy data."
        # ========== SUPABASE CODE END ==========
    else:
        # ========== ORIGINAL POSTGRESQL CODE START ==========
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
  - Premium: ${policies.get('premium_amount', 0):,.2f}
  - Full Policy Details:
{policies.get('markdown_format', 'No detailed information available.')}"""
                    )

                # Join all the policy strings into a single response for the agent.
                return "Here is the user's policy information:\n" + "\n\n".join(
                    formatted_policies
                )

        finally:
            db_utils.release_db_connection(conn)
        # ========== ORIGINAL POSTGRESQL CODE END ==========


def get_user_history(user_id: str) -> List[Dict[str, str]]:
    """
    Gets structured conversation history for a user.
    Always returns a list. The list will be empty if no history is found or if data is corrupted.
    """
    if USE_SUPABASE:
        # ========== SUPABASE CODE START ==========
        try:
            result = (
                SUPABASE_CLIENT.table("users")
                .select("history")
                .eq("user_id", user_id)
                .execute()
            )
            if result.data and result.data[0]["history"]:
                try:
                    # Safely parse the JSON string into a Python list of dictionaries
                    return json.loads(result.data[0]["history"])
                except json.JSONDecodeError:
                    print(
                        f"Warning: Corrupted history for user_id {user_id}. Returning empty list."
                    )
                    return []
            return []
        except Exception as e:
            print(f"Error fetching user history for {user_id}: {e}")
            return []
        # ========== SUPABASE CODE END ==========
    else:
        # ========== ORIGINAL POSTGRESQL CODE START ==========
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
        # ========== ORIGINAL POSTGRESQL CODE END ==========


def update_user_history(user_id: str, history: List[Dict[str, str]]) -> bool:
    """
    Updates the conversation history for a user using a structured list.
    """
    if USE_SUPABASE:
        # ========== SUPABASE CODE START ==========
        try:
            # Safely serialize the Python list into a JSON string for storage
            history_json = json.dumps(history, indent=2)
            result = (
                SUPABASE_CLIENT.table("users")
                .update({"history": history_json})
                .eq("user_id", user_id)
                .execute()
            )
            return True
        except Exception as e:
            print(f"History update failed for {user_id}: {e}")
            return False
        # ========== SUPABASE CODE END ==========
    else:
        # ========== ORIGINAL POSTGRESQL CODE START ==========
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
        # ========== ORIGINAL POSTGRESQL CODE END ==========


def update_user_data(user_id: str, updates: dict) -> str:
    """
    Updates user data in the database.

    Args:
        user_id: The user ID to update
        updates: Dictionary containing fields to update (name, phone, address, location, passwords)

    Returns:
        Success or error message string
    """
    if USE_SUPABASE:
        # ========== SUPABASE CODE START ==========
        try:
            # Validate that user exists first
            result = (
                SUPABASE_CLIENT.table("users")
                .select("user_id")
                .eq("user_id", user_id)
                .execute()
            )
            if not result.data:
                return f"User with ID {user_id} not found in the database."

            # Define allowed fields for update
            allowed_fields = {"name", "phone", "address", "location", "passwords"}

            # Filter updates to only include allowed fields and non-None values
            valid_updates = {
                k: v
                for k, v in updates.items()
                if k in allowed_fields and v is not None
            }

            if not valid_updates:
                return "No valid fields provided for update. Allowed fields: name, phone, address, location, passwords"

            # Execute update
            result = (
                SUPABASE_CLIENT.table("users")
                .update(valid_updates)
                .eq("user_id", user_id)
                .execute()
            )

            if not result.data:
                return f"No changes made for user {user_id}"

            updated_fields = ", ".join(valid_updates.keys())
            return (
                f"Successfully updated user {user_id}. Updated fields: {updated_fields}"
            )

        except Exception as e:
            print(f"Error updating user data for {user_id}: {e}")
            return f"Error updating user data: {str(e)}"
        # ========== SUPABASE CODE END ==========
    else:
        # ========== ORIGINAL POSTGRESQL CODE START ==========
        conn = db_utils.get_db_connection()
        try:
            # Validate that user exists first
            with conn.cursor() as cur:
                cur.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
                if not cur.fetchone():
                    return f"User with ID {user_id} not found in the database."

            # Define allowed fields for update
            allowed_fields = {"name", "phone", "address", "location", "passwords"}

            # Filter updates to only include allowed fields and non-None values
            valid_updates = {
                k: v
                for k, v in updates.items()
                if k in allowed_fields and v is not None
            }

            if not valid_updates:
                return "No valid fields provided for update. Allowed fields: name, phone, address, location, passwords"

            # Build dynamic UPDATE query
            set_clause = ", ".join([f"{field} = %s" for field in valid_updates.keys()])
            query = f"UPDATE users SET {set_clause} WHERE user_id = %s"

            # Execute update
            with conn.cursor() as cur:
                values = list(valid_updates.values()) + [user_id]
                cur.execute(query, values)

                if cur.rowcount == 0:
                    return f"No changes made for user {user_id}"

                conn.commit()

                updated_fields = ", ".join(valid_updates.keys())
                return f"Successfully updated user {user_id}. Updated fields: {updated_fields}"

        except Exception as e:
            conn.rollback()
            print(f"Error updating user data for {user_id}: {e}")
            return f"Error updating user data: {str(e)}"
        finally:
            db_utils.release_db_connection(conn)
        # ========== ORIGINAL POSTGRESQL CODE END ==========
