# Project Structure Overview
"""
insurance_support_backend/
│
├── app.py                  # 1. Main Flask App: Handles API routes, initializes the LangGraph, and orchestrates the agent workflow.
├── config.py               # 2. Configuration: Manages environment variables, API keys, and database settings.
├── requirements.txt        # 3. Dependencies: Lists all necessary Python packages for the backend.
├── checkpoints.sqlite      # 4. LangGraph State: A SQLite database used by LangGraph to persist conversation state, enabling stateful multi-turn interactions.
│
├── database/
│   ├── db_utils.py         # 5. DB Connection Pool: Manages a high-performance PostgreSQL connection pool.
│   └── models.py           # 6. Data Models & Operations: Defines functions for all database interactions (e.g., fetching user history, updating policies).
│
├── faq_database/
│   ├── chroma.sqlite3      # 7. Vector DB: The ChromaDB file storing vector embeddings of the FAQ articles for efficient semantic search.
│   └── update_faq_db.py    # 8. DB Update Script: A script to process and load new articles into the ChromaDB.
│
├── ai/
│   ├── L1_agent.py         # 9. L1 Agent: Defines the prompt, tools, and logic for the primary, first-response agent.
│   ├── Level2_agent.py     # 10. Level2 Agent: Defines the prompt, tools, and logic for the escalation agent, handling complex queries.
│   ├── tools.py            # 11. Agent Tools: A factory for creating and providing tools (e.g., FAQ search, ticket creation) to the agents.
│   ├── unified_chain.py    # 12. FAQ Retriever: Manages the ChromaDB vector store for performing RAG-based FAQ searches.
│   │
│   ├── Langgraph_module/
│   │   ├── Langgraph.py        # 13. Graph Nodes: Defines the core functions (nodes) that make up the graph's logic (e.g., l1_node, l2_node, summarize_node).
│   │   └── graph_compiler.py   # 14. Graph Assembly: Constructs the StateGraph, connecting all the nodes and defining the conversational flow (edges).
│   │
│   └── langsmith/
│       └── langsmith_cache.py  # 15. LangSmith Caching: Fetches and caches observability metrics from LangSmith to improve dashboard performance.
│
├── utils/
│   └── helpers.py          # 16. Helper Utilities: Contains shared functions, such as formatting conversation history for agent prompts and summarization.
│
└── services/
    ├── jira_service.py     # 17. JIRA Service: Encapsulates the logic for interacting with the JIRA API (creating and searching tickets).
    ├── email_service.py    # 18. Email Service: Handles the logic for sending emails via the Gmail API.
    └── ticket_service.py   # 19. Ticket Facade: Provides a simplified interface that the agents use to interact with the underlying JIRA service.
"""


# 1. app.py
"""Main Flask application entry point(L1 and L2 intilizatiion)
This file contains the main Flask application for the insurance helpdesk system.
It initializes the database, sets up routes for L1 and L2 support, and handles

This file contains the main Flask application for the insurance helpdesk system.
It initializes the database, sets up routes for L1 and L2 support, and handles
all API endpoints for the conversational AI system.
"""

import sqlite3
import traceback
import threading
from typing import Dict, Any

from flask import Flask, request, jsonify
from flask_cors import CORS
from google.api_core import exceptions
from langgraph.checkpoint.sqlite import SqliteSaver
from psycopg2.extras import RealDictCursor

import config
from ai.L1_agent import create_l1_agent_executor
from ai.Level2_agent import create_level2_agent_executor
from ai.Langgraph_module.graph_compiler import compile_graph
from ai.langsmith.langsmith_cache import fetch_and_cache_all_metrics, get_cached_metric
from ai.unified_chain import UnifiedSupportChain
from database.db_utils import DB_POOL
from database.models import init_db, update_user_history, get_all_users
from services import ticket_service


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
level2_agent_executor = create_level2_agent_executor(support_chain)


# Manually create a persistent connection to the SQLite database Langgraph.
sqlite_conn = sqlite3.connect("checkpoints.sqlite", check_same_thread=False)
# Instantiate the checkpointer by passing the connection object to its constructor.
memory = SqliteSaver(conn=sqlite_conn)

# --- Assemble and Compile the Graph (Langgraph---
app_graph = compile_graph(l1_agent_executor, level2_agent_executor, memory)


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    query = data.get("query")
    user_id = data.get(
        "user_id"
    )  # We will use user_id  as the conversation's unique ID for LangGraph
    language = data.get("language", "en")

    if not query or not user_id:
        return jsonify({"error": "Missing 'query' or 'user_id'."}), 400

    # 1. DEFINE the unique ID for the conversation thread in sqlite checkpoint.
    #    This is the key that LangGraph will use to load and save the state.
    config = {"configurable": {"thread_id": user_id}}

    # 2. PREPARE only the new inputs for this turn.
    #    The 'history' is now managed automatically by the checkpointer.
    inputs = {
        "query": query,
        "user_id": user_id,
        "language": language,
        "new_responses": [],  # IMPORTANT: Reset the list for each new turn
    }

    try:
        # 3. INVOKE the stateful graph. LangGraph will automatically load the
        #    previous state for this `thread_id` and resume where it left off.
        final_state = app_graph.invoke(inputs, config=config)

        # 4. EXTRACT the final response(s) and Level2 status from the result.
        new_responses = final_state.get("new_responses", [])
        is_level2_now = final_state.get("is_level2_session", False)

        # Filter out the is_level2_session field before saving to database
        # This field is only for internal backend use, not for frontend display
        filtered_history = []
        for turn in final_state["history"]:
            filtered_turn = {
                "input": turn.get("input", ""),
                "output": turn.get("output", ""),
            }
            filtered_history.append(filtered_turn)

        # This saves a complete copy of the conversation to your PostgreSQL DB
        update_user_history(user_id, filtered_history)

        # 5. SEND the response to the frontend.
        # Always send the `responses` key for consistency on the frontend.
        return jsonify(
            {"responses": new_responses, "user_id": user_id, "is_l2": is_level2_now}
        )

    except exceptions.ServiceUnavailable as e:
        # This will now only be reached if all 3 retries fail
        print(f"API is overloaded and all retries failed: {e}")
        return (
            jsonify(
                {
                    "response": "I apologize, but our AI services are currently experiencing high demand. Please try again in a few moments."
                }
            ),
            503,
        )


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
            user_id_to_clear = user["user_id"]

            # 1. Reset PostgreSQL history on successful login
            print(f"[INFO] Clearing PostgreSQL history for user_id: {user_id_to_clear}")
            cur.execute(
                "UPDATE users SET history = '[]' WHERE user_id = %s",
                (user_id_to_clear,),
            )
            conn.commit()

            # 2. ADDED: Reset LangGraph checkpoint for the user to ensure a fresh start.
            try:
                print(
                    f"[INFO] Clearing LangGraph checkpoint for thread_id: {user_id_to_clear}"
                )
                with sqlite_conn:
                    sqlite_cursor = sqlite_conn.cursor()
                    # The table is named 'checkpoints' and the key is 'thread_id'
                    sqlite_cursor.execute(
                        "DELETE FROM checkpoints WHERE thread_id = ?",
                        (user_id_to_clear,),
                    )
                print(
                    f"[SUCCESS] Cleared LangGraph checkpoint for thread_id: {user_id_to_clear}"
                )
            except sqlite3.Error as e:
                # Log a warning but don't fail the login if the checkpoint can't be cleared
                print(
                    f"[WARNING] Could not clear LangGraph checkpoint for thread_id {user_id_to_clear}: {e}"
                )

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


@app.route("/api/tickets/all", methods=["GET"])
def get_all_tickets_api():
    """
    API endpoint to fetch all tickets from JIRA.
    """
    try:
        tickets = ticket_service.get_all_tickets()
        return jsonify({"tickets": tickets}), 200
    except Exception as e:
        print(f"Error fetching all tickets: {e}")
        return jsonify({"error": "Failed to fetch tickets"}), 500


@app.route("/api/metrics", methods=["GET"])
def get_metrics():
    """
    API endpoint to serve all cached LangSmith metrics for the dashboard.
    Returns all metrics in a single JSON response.
    """
    try:
        # Get all cached metrics
        metrics = {
            "trace_count": get_cached_metric("trace_count")[0] or [],
            "trace_latency": get_cached_metric("trace_latency")[0] or [],
            "trace_error_rate": get_cached_metric("trace_error_rate")[0] or [],
            "llm_count": get_cached_metric("llm_count")[0] or [],
            "llm_latency": get_cached_metric("llm_latency")[0] or [],
            "llm_error_rate": get_cached_metric("llm_error_rate")[0] or [],
            "total_cost": get_cached_metric("total_cost")[0] or [],
            "cost_per_trace": get_cached_metric("cost_per_trace")[0] or [],
            "output_tokens": get_cached_metric("output_tokens")[0] or [],
            "output_tokens_per_trace": get_cached_metric("output_tokens_per_trace")[0]
            or [],
            "input_tokens": get_cached_metric("input_tokens")[0] or [],
            "input_tokens_per_trace": get_cached_metric("input_tokens_per_trace")[0]
            or [],
            "tool_run_count": get_cached_metric("tool_run_count")[0] or [],
            "tool_median_latency": get_cached_metric("tool_median_latency")[0] or [],
            "tool_error_rate": get_cached_metric("tool_error_rate")[0] or [],
        }

        return jsonify(metrics), 200

    except Exception as e:
        print(f"Error serving metrics: {e}")
        return jsonify({"error": "Failed to fetch metrics"}), 500


@app.route("/api/admin/users", methods=["GET"])
def get_all_users_api():
    """
    API endpoint to fetch all users for the admin portal.
    """
    try:
        users = get_all_users()
        return jsonify({"users": users}), 200
    except Exception as e:
        print(f"Error fetching users: {e}")
        return jsonify({"error": "Failed to fetch users"}), 500


def background_metrics_caching():
    """
    Fetches and caches LangSmith metrics in a background thread.
    """
    print("🔄 [INFO] Background task started: Populating LangSmith metrics cache...")
    try:
        fetch_and_cache_all_metrics()
        print("✅ [SUCCESS] Background task complete: Metrics cache populated.")
    except Exception as e:
        print(f"⚠️ [WARNING] The background metrics caching task failed: {e}")


if __name__ == "__main__":
    # Initialize database
    init_db()

    # Populate metrics cache on startup in a background thread
    print("🚀 [INFO] Starting off metrics caching in the background.")
    metrics_thread = threading.Thread(target=background_metrics_caching)
    metrics_thread.start()

    # Run Flask app
    app.run(debug=config.DEBUG, host="0.0.0.0", port=8001)
