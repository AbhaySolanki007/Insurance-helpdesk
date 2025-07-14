# Project Structure Overview
"""
insurance_support/
│
├── app.py                  # 1. Main Flask application: Initializes and orchestrates both L1/L2 agents and routes API requests.
├── config.py               # 2. Centralized configuration: Manages all environment variables, API keys, and database settings.
├── requirements.txt        # 3. Project dependencies: Lists all necessary Python packages for the application.
│
├── database/
│   ├── __init__.py
│   ├── models.py           # 4. Data Access Layer: Defines functions for all direct SQL interactions with the database (users, policies, history).
│   └── db_utils.py         # 5. Database Utilities: Manages a high-performance connection pool to efficiently handle database connections.
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py     # 6. Authentication services: (Placeholder) for handling user authentication logic.
│   ├── email_service.py    # 7. Email service: Encapsulates all logic for sending emails via the Gmail API, abstracting it from the agents.
│   ├── policy_service.py   # 8. Policy management: (Placeholder) for business logic related to insurance policies.
│   ├── ticket_service.py   # 9. Ticket management: Provides a simplified interface (facade) for creating and searching JIRA support tickets(in # 9.1 services/jira_service.py).
│   └── audio_service.py    # 10. Audio processing: (Placeholder) for handling audio recording, transcription, and related tasks.
│
├── ai/
│   ├── __init__.py
│   ├── unified_chain.py    # 11. RAG PERFORMING like FAQ Retriever Service: Manages the ChromaDB vector store and provides a method for performing RAG-based FAQ searches.
│   ├── l1_agent.py         # 12. L1 Agent Module: Defines the prompt, tools, and execution logic for the front-line, info-gathering ReAct agent.
│   ├── l2_agent.py         # 13. L2 Agent Module: Defines the prompt, tools, and execution logic for the advanced, escalation-handling ReAct agent.
│   └── tools.py            # 14. Agent Tool Factory: A central module that defines all possible agent tools and provides a function to create customized toolsets for L1 and L2.
│
└── utils/
    ├── __init__.py
    └── helpers.py          # 15. Helper Utilities: Contains shared functions, such as formatting conversation history for agent prompts.
"""

# Project Structure Overview
"""
insurance_support/
│
├── app.py                  # 1. Main Flask application: Initializes and orchestrates both L1/L2 agents and routes API requests.
├── config.py               # 2. Centralized configuration: Manages all environment variables, API keys, and database settings.
├── requirements.txt        # 3. Project dependencies: Lists all necessary Python packages for the application.
│
├── database/
│   ├── __init__.py
│   ├── models.py           # 4. Data Access Layer: Defines functions for all direct SQL interactions with the database (users, policies, history).
│   └── db_utils.py         # 5. Database Utilities: Manages a high-performance connection pool to efficiently handle database connections.
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py     # 6. Authentication services: (Placeholder) for handling user authentication logic.
│   ├── email_service.py    # 7. Email service: Encapsulates all logic for sending emails via the Gmail API, abstracting it from the agents.
│   ├── policy_service.py   # 8. Policy management: (Placeholder) for business logic related to insurance policies.
│   ├── ticket_service.py   # 9. Ticket management: Provides a simplified interface (facade) for creating and searching JIRA support tickets(in # 9.1 services/jira_service.py).
│   └── audio_service.py    # 10. Audio processing: (Placeholder) for handling audio recording, transcription, and related tasks.
│
├── ai/
│   ├── __init__.py
│   ├── unified_chain.py    # 11. RAG PERFORMING like FAQ Retriever Service: Manages the ChromaDB vector store and provides a method for performing RAG-based FAQ searches.
│   ├── l1_agent.py         # 12. L1 Agent Module: Defines the prompt, tools, and execution logic for the front-line, info-gathering ReAct agent.
│   ├── l2_agent.py         # 13. L2 Agent Module: Defines the prompt, tools, and execution logic for the advanced, escalation-handling ReAct agent.
│   └── tools.py            # 14. Agent Tool Factory: A central module that defines all possible agent tools and provides a function to create customized toolsets for L1 and L2.
│
└── utils/
    ├── __init__.py
    └── helpers.py          # 15. Helper Utilities: Contains shared functions, such as formatting conversation history for agent prompts.
"""
# Project Structure Overview
"""
insurance_support/
│
├── app.py                  # 1. Main Flask application: Initializes and orchestrates both L1/L2 agents and routes API requests.
├── config.py               # 2. Centralized configuration: Manages all environment variables, API keys, and database settings.
├── requirements.txt        # 3. Project dependencies: Lists all necessary Python packages for the application.
│
├── database/
│   ├── __init__.py
│   ├── models.py           # 4. Data Access Layer: Defines functions for all direct SQL interactions with the database (users, policies, history).
│   └── db_utils.py         # 5. Database Utilities: Manages a high-performance connection pool to efficiently handle database connections.
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py     # 6. Authentication services: (Placeholder) for handling user authentication logic.
│   ├── email_service.py    # 7. Email service: Encapsulates all logic for sending emails via the Gmail API, abstracting it from the agents.
│   ├── policy_service.py   # 8. Policy management: (Placeholder) for business logic related to insurance policies.
│   ├── ticket_service.py   # 9. Ticket management: Provides a simplified interface (facade) for creating and searching JIRA support tickets(in # 9.1 services/jira_service.py).
│   └── audio_service.py    # 10. Audio processing: (Placeholder) for handling audio recording, transcription, and related tasks.
│
├── ai/
│   ├── __init__.py
│   ├── unified_chain.py    # 11. RAG PERFORMING like FAQ Retriever Service: Manages the ChromaDB vector store and provides a method for performing RAG-based FAQ searches.
│   ├── l1_agent.py         # 12. L1 Agent Module: Defines the prompt, tools, and execution logic for the front-line, info-gathering ReAct agent.
│   ├── l2_agent.py         # 13. L2 Agent Module: Defines the prompt, tools, and execution logic for the advanced, escalation-handling ReAct agent.
│   └── tools.py            # 14. Agent Tool Factory: A central module that defines all possible agent tools and provides a function to create customized toolsets for L1 and L2.
│
└── utils/
    ├── __init__.py
    └── helpers.py          # 15. Helper Utilities: Contains shared functions, such as formatting conversation history for agent prompts.
"""
# change viewed on git

# 1. app.py
"""Main Flask application entry point(L1 and L2 intilizatiion)"""
# This file contains the main Flask application for the insurance helpdesk system.
# It initializes the database, sets up routes for L1 and L2 support, and handles

import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from psycopg2.extras import RealDictCursor
from langchain_core.messages import HumanMessage, AIMessage
from functools import partial


import config
from database.db_utils import DB_POOL
from database.models import init_db, get_user_history, update_user_history
from ai.unified_chain import UnifiedSupportChain
from ai.L1_agent import create_l1_agent_executor, process_l1_query
from ai.L2_agent import create_l2_agent_executor, process_l2_query
from backend.ai.Langgraph_module.Langgraph import (
    AgentState,
    l1_node,
    l2_node,
    router,
    summarize_for_l2_node,
)
from langgraph.graph import StateGraph, END
from utils.helpers import format_history_for_prompt


# Initialize Flask app
app = Flask(__name__)
app.secret_key = config.FLASK_SECRET_KEY

CORS(
    app,
    resources={
        r"/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
        }
    },
)

support_chain = UnifiedSupportChain()
l1_agent_executor = create_l1_agent_executor(support_chain)
l2_agent_executor = create_l2_agent_executor(support_chain)

# --- Assemble and Compile the Graph ---
workflow = StateGraph(AgentState)
workflow.add_node("l1_agent", partial(l1_node, agent_executor=l1_agent_executor))
workflow.add_node("summarize_node", summarize_for_l2_node)
workflow.add_node("l2_agent", partial(l2_node, agent_executor=l2_agent_executor))

workflow.set_entry_point("l1_agent")
workflow.add_conditional_edges(
    "l1_agent",
    router,
    {
        "summarize_node": "summarize_node",
        "END": END,  # Use the imported END object, not the string "END"
    },
)
workflow.add_edge("summarize_node", "l2_agent")
workflow.add_edge("l2_agent", END)
app_graph = workflow.compile()

#    Create a separate graph specifically for the L2 handoff process.
# This graph's job is to prepare L2 for its first interaction.
l2_workflow = StateGraph(AgentState)
l2_workflow.add_node("summarize_node", summarize_for_l2_node)
l2_workflow.add_node("l2_agent", partial(l2_node, agent_executor=l2_agent_executor))
# The L2 process ALWAYS starts with summarization.
l2_workflow.set_entry_point("summarize_node")
l2_workflow.add_edge("summarize_node", "l2_agent")
l2_workflow.add_edge("l2_agent", END)
# Compile the dedicated L2 handoff graph.
l2_handoff_graph = l2_workflow.compile()


@app.route("/predict/l1", methods=["POST"])
def predict_l1():
    data = request.get_json()
    query, user_id, language = (
        data.get("query"),
        data.get("user_id"),
        data.get("language", "en"),
    )
    if not query or not user_id:
        return jsonify({"error": "Missing 'query' or 'user_id'."}), 400

    # 1. Fetch history from the database (the source of truth).
    history = get_user_history(user_id)

    # 2. Prepare the initial state for the graph.
    initial_state = {
        "query": query,
        "user_id": user_id,
        "language": language,
        "history": history,
        "escalation_summary": "",
    }

    # 3. Invoke the graph, starting at the beginning.
    final_state = app_graph.invoke(initial_state)

    # 4. Extract the final response to send to the user.
    final_response = final_state["history"][-1]["output"]

    # 5. Save the complete, updated history from the final state back to the DB.
    update_user_history(user_id, final_state["history"])

    return jsonify({"response": final_response, "user_id": user_id})


@app.route("/predict/l2", methods=["POST"])
def predict_l2():
    data = request.get_json()
    query, user_id, language = (
        data.get("query"),
        data.get("user_id"),
        data.get("language", "en"),
    )
    if not query or not user_id:
        return jsonify({"error": "Missing 'query' or 'user_id'."}), 400

    # 1. Fetch history from the database.
    history = get_user_history(user_id)

    # 2. Prepare the initial state. Note that we can't know the summary yet.
    initial_state = {
        "query": query,
        "user_id": user_id,
        "language": language,
        "history": history,
        "escalation_summary": "",  # The L2 prompt has a default for this.
    }

    # 3. Invoke the graph, but FORCE entry at the L2 node.
    # The frontend, by calling this endpoint, has already decided to bypass L1.
    final_state = app_graph.invoke(
        initial_state, config={"configurable": {"entry_point": "l2_agent"}}
    )

    # 4. Extract final response.
    final_response = final_state["history"][-1]["output"]

    # 5. Save the complete history back to the DB.
    update_user_history(user_id, final_state["history"])

    return jsonify({"response": final_response, "user_id": user_id})


@app.route("/api/login/", methods=["POST"])
def login():
    print("🟡 [INFO] Received login request.")
    data = request.get_json()
    print(f"🔍 [DEBUG] Payload received: {data}")

    if not data or not data.get("email") or not data.get("password"):
        print("[ERROR] Missing email or password field in request.")
        return jsonify({"message": "Missing email or password"}), 400

    email = data.get("email").strip()
    password = data.get("password").strip()

    conn = None
    try:
        conn = DB_POOL.getconn()
        cur = conn.cursor(cursor_factory=RealDictCursor)

        query = "SELECT user_id, name, email, passwords FROM users WHERE email = %s"
        cur.execute(query, (email,))
        user = cur.fetchone()

        if not user:
            print(f"[ERROR] User not found for email: {email}")
            return jsonify({"message": "Invalid credentials"}), 401

        stored_password = user.get("passwords")
        if stored_password is None:
            print(f"[ERROR] No password set for user: {email}")
            return jsonify({"message": "Password not set for this user"}), 401

        if password == stored_password:
            print("[SUCCESS] Login successful.")
            # Reset history on successful login
            cur.execute(
                "UPDATE users SET history = '[]' WHERE user_id = %s", (user["user_id"],)
            )
            conn.commit()

            return (
                jsonify(
                    {
                        "message": "Login successful",
                        "user": {
                            "user_id": user["user_id"],
                            "name": user["name"],
                            "email": user["email"],
                        },
                    }
                ),
                200,
            )
        else:
            print("[ERROR] Password mismatch.")
            return jsonify({"message": "Invalid credentials"}), 401

    except Exception as e:
        print(f"[EXCEPTION] Login error: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"message": "An internal server error occurred."}), 500

    finally:
        if conn:
            DB_POOL.putconn(conn)
            print("[INFO] DB connection returned to pool.")


@app.route("/api/logout/", methods=["POST"])
def logout():
    response = jsonify({"message": "Logged out"})
    return response, 200


@app.route("/api/chat/history/<user_id>", methods=["GET"])
def get_chat_history(user_id):
    print(f"\n🔍 [DEBUG] Fetching chat history for user_id: {user_id}")
    conn = None
    try:
        conn = DB_POOL.getconn()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Get chat history from users table
        query = "SELECT history FROM users WHERE user_id = %s"
        print(f"📝 [DEBUG] Executing query: {query} with user_id: {user_id}")

        cursor.execute(query, (user_id,))
        result = cursor.fetchone()

        print(f"📊 [DEBUG] Query result: {result}")

        if not result:
            print(f"❌ [ERROR] No user found with user_id: {user_id}")
            return jsonify({"error": "User not found"}), 404

        history = eval(result["history"]) if result["history"] else []
        print(f"✅ [SUCCESS] Retrieved history: {history}")
        return jsonify({"history": history}), 200

    except Exception as e:
        print(f"❌ [ERROR] Error fetching chat history: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            DB_POOL.putconn(conn)
            print("🔄 [DEBUG] Database connection returned to pool")


@app.route("/api/user/policies/<user_id>", methods=["GET"])
def get_user_policies(user_id):
    print(f"\n🔍 [DEBUG] Fetching policies for user_id: {user_id}")
    conn = None
    cursor = None
    try:
        conn = DB_POOL.getconn()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # First check if user exists
        cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()

        if not user:
            print(f"❌ [ERROR] User not found with user_id: {user_id}")
            return jsonify({"error": "User not found"}), 404

        # Get policy information
        query = """
            SELECT policy_id, policy_type, policy_status, markdown_format, issue_date, expiry_date, premium_amount, coverage_amount
            FROM policies 
            WHERE user_id = %s
        """
        print(f"📝 [DEBUG] Executing query: {query} with user_id: {user_id}")

        cursor.execute(query, (user_id,))
        policies = cursor.fetchall()

        print(f"📊 [DEBUG] Query result: {policies}")

        if not policies:
            print(f"ℹ️ [INFO] No policies found for user_id: {user_id}")
            return jsonify({"policies": []}), 200  # Return empty array instead of 404

        return jsonify({"policies": policies}), 200

    except Exception as e:
        print(f"❌ [ERROR] Error fetching policies: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            DB_POOL.putconn(conn)
            print("🔄 [DEBUG] Database connection returned to pool")


if __name__ == "__main__":
    # Initialize database
    init_db()
    # Run Flask app
    app.run(debug=config.DEBUG, host="0.0.0.0", port=8001)


# 2. config.py
"""Configuration settings for the application."""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Email Settings
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

# Flask Settings
FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "default_secret_key")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))


# Vector Store Paths
FAQ_DB_PATH = os.getenv(
    "FAQ_DB_PATH",
    r"D:\Cywarden\Insurance-Helpdesk_new\backend\backend-pythonNEW _Copy\Unified_Bot\data\faq_database",
)

FAQ_COLLECTION_NAME = os.getenv("FAQ_COLLECTION_NAME", "FAQ_Article_Updated")

# Google API Scopes
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

# JIRA Settings
JIRA_SERVER = os.getenv("JIRA_SERVER")
JIRA_USERNAME = os.getenv("JIRA_USERNAME")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY")

# PostgreSQL Database Settings
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "database": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "port": os.getenv("DB_PORT"),
}


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


# 5. database/db_utils.py
"""Database utility functions."""
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
import config

# Initialize the connection pool
try:
    DB_POOL = SimpleConnectionPool(minconn=1, maxconn=10, **config.DB_CONFIG)
    print("Database pool initialized successfully.")
except Exception as e:
    print(f"Error initializing database pool: {e}")
    DB_POOL = None


def get_db_connection():
    """Gets a connection from the pool."""
    if not DB_POOL:
        raise ConnectionError("Database pool is not available.")
    return DB_POOL.getconn()


def release_db_connection(conn):
    """Releases a connection back to the pool."""
    if not DB_POOL:
        return
    DB_POOL.putconn(conn)


# 7. services/email_service.py
"""Email service functionality."""
import os
import base64
import pickle
from typing import Optional
from email.message import EmailMessage

from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from database import models
import config


def get_credentials():
    creds = None
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "secret.json", config.SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)
    return creds


def send_email(user_id: str, subject: str, body: str) -> str:
    """Sends an email to the user identified by user_id."""
    recipient_email = models.get_user_email(user_id)  # CHANGED: Call new model function
    if not recipient_email:
        return f"Could not send email: No email address found for user_id {user_id}."

    try:
        creds = get_credentials()
        service = build("gmail", "v1", credentials=creds)
        message = EmailMessage()
        message.set_content(body)
        message["To"] = recipient_email
        message["Subject"] = subject
        message["From"] = config.SENDER_EMAIL
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        sent_message = (
            service.users()
            .messages()
            .send(userId="me", body={"raw": raw_message})
            .execute()
        )
        return f"Confirmation sent to {recipient_email}: {subject}\nMessage Id: {sent_message['id']}"
    except HttpError as error:
        return f"Failed to send email: {error}"


# 9. services/ticket_service.py
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


# 11. ai/unified_chain.py
"""Unified support chain combining FAQ and ticket retrieval.
with RAG implententation
also in future it will be used for RAG the documents and other data"""

import os
import re
import config
import chromadb
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from langchain_google_genai import GoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_chroma import Chroma
from database.models import get_policy_data, get_user_data


class UnifiedSupportChain:
    def __init__(
        self,
        faq_db_path=config.FAQ_DB_PATH,
        faq_collection_name=config.FAQ_COLLECTION_NAME,
    ):

        # Initialize Google AI embeddings for FAQ
        self.faq_embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001", google_api_key=config.GOOGLE_API_KEY
        )

        self.faq_vectorstore = Chroma(
            client=chromadb.PersistentClient(path=faq_db_path),
            collection_name=faq_collection_name,
            embedding_function=self.faq_embeddings,
        )

        # Create FAQ retriever
        self.faq_retriever = self.faq_vectorstore.as_retriever(
            search_type="similarity", search_kwargs={"k": 3}
        )

    def get_faq_response(self, query: str) -> str:
        """Public method to get formatted FAQ answers"""
        docs = self.faq_retriever.invoke(query)
        if not docs:
            return "No relevant FAQs found"
        return "\n".join(
            f"Q: {doc.page_content}\nA: {doc.metadata.get('answer', 'No answer available')}"
            for doc in docs
        )


# 12 ai/l1_agent.py
"""Agent configuration for L1 support.
with L1 prompts and all funtionalities of L1"""
import config
import traceback
from typing import Dict, Any
from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from langchain_google_genai import GoogleGenerativeAI

from database.models import update_user_history, get_user_history
from utils.helpers import format_history_for_prompt
from ai.tools import create_tools


def create_l1_agent_executor(support_chain):
    """Create the L1 agent executor with its specific tools."""
    # Define the tools specific to the L1 agent
    l1_tool_names = ["faq_search", "get_user_data", "get_policy_data"]
    tools = create_tools(support_chain, l1_tool_names)

    llm = GoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=config.GOOGLE_API_KEY,
        temperature=0.6,
        max_retries=3,
    )

    l1_prompt_template = """
You are a friendly and helpful insurance support assistant for user_id: {user_id}.
You MUST generate your final answer exclusively in the following language code: {language}.
Your goal is to answer user questions accurately and determine if they need to be escalated.

You have access to the following tools:
{tools}

Use the following format:
Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
Thought: I now know the final answer
Final Answer: the final answer to the original input question

**Your Instructions:**
1.  **Analyze the Query:** First, understand what the user is asking.
2.  **Use Tools Intelligently:**
    *   For off-topic queries (e.g., "what is the weather today?"), provide a natural response such as "Today's weather is sunny and pleasant!" and then kindly add, "I'd be happy to help if you have any questions about your policy or coverage."
    *   For general questions ("how do I file a claim?"), use `faq_search` first.
    *   For user-specific questions ("what policies do I have?", "what is my address?"), use `get_user_data` or `get_policy_data`. The input for these tools is just the user_id, which is provided to you.
3.  **Escalate When Necessary:** If the user uses words like "complain", "frustrated", "angry", "escalate", "supervisor", or if their problem is too complex for an FAQ (like filing a complex claim or disputing a charge), you MUST respond with the exact phrase: "I'll connect you with a specialized L2 agent who can better assist. One moment please... L2...."
4.  **Be Conversational:** If you don't have enough information, ask the user clarifying questions.

Begin!

Previous conversation history:
{chat_history}

Question: {input}
Thought:{agent_scratchpad}
"""
    prompt = PromptTemplate.from_template(l1_prompt_template)

    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(
        agent=agent, tools=tools, verbose=True, handle_parsing_errors=True
    )


def process_l1_query(
    query: str, user_id: str, language: str, agent_executor
) -> Dict[str, Any]:
    """Processes an L1 query using the agent, with centralized history management."""
    try:
        # 1. Load history from the database
        user_history = get_user_history(user_id)
        # 2. Format history using the central helper function
        history_text_for_prompt = format_history_for_prompt(user_history)

        # 3. Process the query
        response = agent_executor.invoke(
            {
                "input": query,
                "user_id": user_id,
                "language": language,
                "chat_history": history_text_for_prompt,
            }
        )
        output = response.get("output", "I'm sorry, I couldn't process that request.")
        # 4. Update the history list
        user_history.append({"input": query, "output": output})
        # 5. Save the updated history back to the database
        update_user_history(user_id, user_history)

        return {"response": output, "user_id": user_id}

    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error in L1 processing: {error_details}")
        return {"error": str(e), "details": error_details, "user_id": user_id}


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

    llm = GoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=config.GOOGLE_API_KEY,
        temperature=0.6,
        max_retries=3,
    )

    # llm = ChatGroq(
    #     model="llama3-70b-8192",
    #     groq_api_key=os.getenv("GROQ_API_KEY"),
    #     temperature=0.2,
    #     max_retries=3,
    # )

    l2_prompt_string = """
You are a specialized insurance support agent for user: {user_id}.
You MUST generate your final answer exclusively in the following language code: {language}.

--- L1 AGENT BRIEFING ---
{escalation_summary}
-------------------------

Based on the briefing above and the full conversation history, your goal is to resolve the user's complex issue.
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
    ).with_config(
        {"run_name": "L2 Agent"}
    )  # The L2 agent might sometimes not receive a summary (on direct L2 calls),
    # so we provide a default empty string for the summary.


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


# 13.1. ai/Langgraph.py
"""Langgraph configuration for the support agent workflow."""
import operator
from typing import TypedDict, Annotated, List, Dict
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage
from langchain_google_genai import GoogleGenerativeAI
import config
from utils.helpers import format_history_for_prompt


# 1. Define the state "clipboard" that moves through the graph.
class AgentState(TypedDict):
    query: str
    user_id: str
    language: str
    # History will be kept in the DB's dictionary format.
    history: Annotated[List[Dict[str, str]], operator.add]
    # The summary is generated only on escalation.
    escalation_summary: str


# 2. Define the individual nodes (functions) for the graph.


def l1_node(state: AgentState, agent_executor):
    """Runs the L1 agent."""
    print("---EXECUTING L1 NODE---")
    history_text = format_history_for_prompt(state["history"])
    response = agent_executor.invoke(
        {
            "input": state["query"],
            "user_id": state["user_id"],
            "language": state["language"],
            "chat_history": history_text,
        }
    )
    # Append the new turn to the history within the state
    return {
        "history": [{"input": state["query"], "output": response.get("output", "")}]
    }


def summarize_for_l2_node(state: AgentState):
    """Summarizes the conversation for a clean handoff to L2."""
    print("---EXECUTING SUMMARY NODE---")
    history_text = format_history_for_prompt(state["history"])
    summary_prompt = f"""
    Concisely summarize the following support conversation for an L2 agent.
    Focus on the user's main problem and the reason for escalation.
    The summary must be in this language: {state['language']}.

    Conversation History:
    {history_text}

    Briefing Note:"""
    llm = GoogleGenerativeAI(
        model="gemini-2.0-flash", google_api_key=config.GOOGLE_API_KEY
    )
    summary = llm.invoke(summary_prompt)
    return {"escalation_summary": summary}


def l2_node(state: AgentState, agent_executor):
    """Runs the L2 agent."""
    print("---EXECUTING L2 NODE---")
    history_text = format_history_for_prompt(state["history"])
    response = agent_executor.invoke(
        {
            "input": state["query"],
            "user_id": state["user_id"],
            "language": state["language"],
            "chat_history": history_text,
            # Pass the summary from the state to the prompt
            "escalation_summary": state.get(
                "escalation_summary", "No summary was provided."
            ),
        }
    )
    return {
        "history": [{"input": state["query"], "output": response.get("output", "")}]
    }


# 3. Define the routing logic (the edge).
def router(state: AgentState):
    """Determines the next step after L1 execution."""
    print("---ROUTING---")
    last_turn = state["history"][-1]
    if "L2...." in last_turn.get("output", ""):
        print("---DECISION: ESCALATE TO L2---")
        return "summarize_node"
    else:
        print("---DECISION: END---")
        return "END"


# 14. ai/tools.py
"""Tool definitions for agent functionality. which is used in l2"""

from typing import Dict, Any, Union, Optional, Type, Callable, TypeVar
import json
from pydantic import BaseModel, Field
from langchain.tools import Tool
from typing import Dict, Any, List

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
        "create_ticket": Tool(
            name="create_ticket",
            func=create_tool_wrapper(lambda x: create_ticket(x), TicketCreateInput),
            description="Use this ONLY for L2 escalation. Creates a support ticket in JIRA after collecting a summary and description.",
        ),
        "search_ticket": Tool(
            name="search_ticket",
            func=create_tool_wrapper(lambda x: search_tickets(x), TicketSearchInput),
            description="Use this ONLY for L2 escalation. Search for a user's existing support tickets.",
        ),
        "send_email": Tool(
            name="send_email",
            func=create_tool_wrapper(
                lambda x: send_email(x.user_id, x.subject, x.body), EmailSendInput
            ),
            description="Use this ONLY for L2 escalation. Send an email to the user.",
        ),
    }

    # Return only the tools that were requested
    return [available_tools[name] for name in tool_names if name in available_tools]


# 15. utils/helpers.py
"""Helper utilities for the application."""
from typing import List, Dict


# This function is now designed to work with a list of dictionaries from the database.
def format_history_for_prompt(history: List[Dict[str, str]]) -> str:
    """
    Formats a list of structured history turns from the database into a single
    string for an LLM prompt.
    """
    if not history:
        return "No previous conversation history."

    entries = []
    # We loop through the entire history, as context is managed by the application flow.
    for turn in history:
        # Safely get 'input' and 'output' from each dictionary.
        user_message = turn.get("input", "")
        ai_message = turn.get("output", "")

        # We only add non-empty messages to the prompt history.
        if user_message:
            entries.append(f"Human: {user_message}")

        # We filter out the internal "L2...." escalation message from the prompt.
        if ai_message and "L2...." not in ai_message:
            entries.append(f"AI: {ai_message}")

    return "\n\n".join(entries)
