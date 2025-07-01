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

import config
from database.db_utils import DB_POOL
from database.models import init_db, get_user_history, update_user_history
from ai.unified_chain import UnifiedSupportChain
from ai.L1_agent import create_l1_agent_executor, process_l1_query
from ai.L2_agent import create_l2_agent_executor, process_l2_query
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

# Initialize support chain
support_chain = UnifiedSupportChain()

l1_agent_executor = create_l1_agent_executor(support_chain)
l2_agent_executor = create_l2_agent_executor(support_chain)


@app.route("/predict/l1", methods=["POST"])
def predict_l1():
    """L1 support endpoint using the new ReAct agent."""
    data = request.get_json()
    query = data.get("query")
    user_id = data.get("user_id")
    language = data.get("language", "en")

    if not query or not user_id:
        return jsonify({"error": "Missing 'query' or 'user_id'."}), 400

    # Call the new L1 processor, passing the L1 agent
    result = process_l1_query(query, user_id, language, l1_agent_executor)

    if "error" in result:
        return jsonify(result), 500
    return jsonify(result)


@app.route("/predict/l2", methods=["POST"])
def predict_l2():
    """L2 support endpoint"""
    data = request.get_json()
    user_id = data.get("user_id")
    query = data.get("query")
    language = data.get("language", "en")

    if not query or not user_id:
        return jsonify({"error": "Missing 'query' or 'user_id'."}), 400

    # Call the L2 processor, passing the L2 agent
    result = process_l2_query(
        query, user_id, language, support_chain, l2_agent_executor
    )

    if "error" in result:
        return jsonify(result), 500
    return jsonify(result)


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
