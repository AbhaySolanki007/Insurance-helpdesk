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
│   ├── rag_orchestrator.py    # 12. FAQ Retriever: Manages the ChromaDB vector store for performing RAG-based FAQ searches.
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
import pickle
from typing import Dict, Any

from flask import Flask, request, jsonify
from flask_cors import CORS
from google.api_core import exceptions
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import START
from psycopg2.extras import RealDictCursor


import config
from config import SUPABASE_CLIENT, USE_SUPABASE, FLASK_SECRET_KEY
from ai.Level1_agent import create_l1_agent_executor
from ai.Level2_agent import create_level2_agent_executor
from ai.Langgraph_module.graph_compiler import compile_graph
from ai.langsmith.langsmith_cache import fetch_and_cache_all_metrics, get_cached_metric
from ai.rag_orchestrator import UnifiedSupportChain
from database.db_utils import DB_POOL
from database.postgre import init_db, update_user_history, get_all_users
from services import ticket_service


# Initialize Flask app
app = Flask(__name__)
app.secret_key = FLASK_SECRET_KEY

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

    try:
        if USE_SUPABASE:
            # ========== SUPABASE CODE START ==========
            # Use Supabase client for authentication
            result = (
                SUPABASE_CLIENT.table("users")
                .select("user_id, name, email, passwords")
                .eq("email", email)
                .execute()
            )

            if not result.data:
                print(f"[ERROR] User not found for email: {email}")
                return jsonify({"message": "Invalid credentials"}), 401

            user = result.data[0]
            stored_password = user.get("passwords")

            if stored_password is None:
                print(f"[ERROR] No password set for user: {email}")
                return jsonify({"message": "Password not set for this user"}), 401

            if password == stored_password:
                print("[SUCCESS] Login successful.")
                user_id_to_clear = user["user_id"]

                # 1. Reset Supabase history on successful login
                print(
                    f"[INFO] Clearing Supabase history for user_id: {user_id_to_clear}"
                )
                SUPABASE_CLIENT.table("users").update({"history": "[]"}).eq(
                    "user_id", user_id_to_clear
                ).execute()

                # 2. Reset LangGraph checkpoint for the user to ensure a fresh start.
                try:
                    print(
                        f"[INFO] Clearing LangGraph checkpoint for thread_id: {user_id_to_clear}"
                    )
                    with sqlite_conn:
                        sqlite_cursor = sqlite_conn.cursor()
                        sqlite_cursor.execute(
                            "DELETE FROM checkpoints WHERE thread_id = ?",
                            (user_id_to_clear,),
                        )
                    print(
                        f"[SUCCESS] Cleared LangGraph checkpoint for thread_id: {user_id_to_clear}"
                    )
                except sqlite3.Error as e:
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
            # ========== SUPABASE CODE END ==========
        # else:
        #     # ========== ORIGINAL POSTGRESQL CODE START ==========
        #     # Use local PostgreSQL for authentication
        #     conn = DB_POOL.getconn()
        #     cur = conn.cursor(cursor_factory=RealDictCursor)

        #     query = "SELECT user_id, name, email, passwords FROM users WHERE email = %s"
        #     cur.execute(query, (email,))
        #     user = cur.fetchone()

        #     if not user:
        #         print(f"[ERROR] User not found for email: {email}")
        #         return jsonify({"message": "Invalid credentials"}), 401

        #     stored_password = user.get("passwords")
        #     if stored_password is None:
        #         print(f"[ERROR] No password set for user: {email}")
        #         return jsonify({"message": "Password not set for this user"}), 401

        #     if password == stored_password:
        #         print("[SUCCESS] Login successful.")
        #         user_id_to_clear = user["user_id"]

        #         # 1. Reset PostgreSQL history on successful login
        #         print(
        #             f"[INFO] Clearing PostgreSQL history for user_id: {user_id_to_clear}"
        #         )
        #         cur.execute(
        #             "UPDATE users SET history = '[]' WHERE user_id = %s",
        #             (user_id_to_clear,),
        #         )
        #         conn.commit()

        #         # 2. Reset LangGraph checkpoint for the user to ensure a fresh start.
        #         try:
        #             print(
        #                 f"[INFO] Clearing LangGraph checkpoint for thread_id: {user_id_to_clear}"
        #             )
        #             with sqlite_conn:
        #                 sqlite_cursor = sqlite_conn.cursor()
        #                 sqlite_cursor.execute(
        #                     "DELETE FROM checkpoints WHERE thread_id = ?",
        #                     (user_id_to_clear,),
        #                 )
        #             print(
        #                 f"[SUCCESS] Cleared LangGraph checkpoint for thread_id: {user_id_to_clear}"
        #             )
        #         except sqlite3.Error as e:
        #             print(
        #                 f"[WARNING] Could not clear LangGraph checkpoint for thread_id {user_id_to_clear}: {e}"
        #             )

        #         return (
        #             jsonify(
        #                 {
        #                     "message": "Login successful",
        #                     "user": {
        #                         "user_id": user["user_id"],
        #                         "name": user["name"],
        #                         "email": user["email"],
        #                     },
        #                 }
        #             ),
        #             200,
        #         )
        #     else:
        #         print("[ERROR] Password mismatch.")
        #         return jsonify({"message": "Invalid credentials"}), 401
        #     # ========== ORIGINAL POSTGRESQL CODE END ==========

    except Exception as e:
        print(f"[EXCEPTION] Login error: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"message": "An internal server error occurred."}), 500

    finally:
        if not config.USE_SUPABASE and "conn" in locals():
            DB_POOL.putconn(conn)
            print("[INFO] DB connection returned to pool.")


@app.route("/api/pending-approvals", methods=["GET"])
def get_pending_approvals():
    """
    Fetches all approval requests from the checkpoints database,
    categorized into pending, approved, and declined.
    """
    try:
        all_pending = []
        all_approved = []
        all_declined = []

        # Connect to SQLite to get all thread_ids
        with sqlite3.connect("checkpoints.sqlite") as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            # DISTINCT to avoid processing the same thread multiple times
            cursor.execute("SELECT DISTINCT thread_id FROM checkpoints")
            rows = cursor.fetchall()

        # If there are no threads, there's nothing to do
        if not rows:
            return (
                jsonify(
                    {
                        "pending": [],
                        "approved": [],
                        "declined": [],
                    }
                ),
                200,
            )

        # For each thread, get its state and aggregate the approval lists
        for row in rows:
            thread_id = row["thread_id"]
            if not thread_id:
                continue

            config = {"configurable": {"thread_id": thread_id}}
            graph_state = app_graph.get_state(config)

            if graph_state:
                user_state = graph_state.values
                all_pending.extend(user_state.get("pending_approvals", []))
                all_approved.extend(user_state.get("approved_approvals", []))
                all_declined.extend(user_state.get("declined_approvals", []))

        return (
            jsonify(
                {
                    "pending": all_pending,
                    "approved": all_approved,
                    "declined": all_declined,
                }
            ),
            200,
        )

    except Exception as e:
        print(f"---ERROR FETCHING APPROVALS---: {e}")
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch approvals."}), 500


@app.route("/api/pending-approvals/<string:user_id>", methods=["GET"])
def get_user_approval_status(user_id):
    """
    Fetches the approval status for a specific user.
    Returns a simple status string: "pending", "approved", "declined", or "no_history"
    """
    try:
        # Create config for the specific user
        config = {"configurable": {"thread_id": user_id}}

        # Get the user's state from checkpoints
        graph_state = app_graph.get_state(config)

        if not graph_state:
            # User not found or no state exists
            return jsonify({"status": "no_history"}), 200

        user_state = graph_state.values

        # Check approval lists in priority order
        pending_list = user_state.get("pending_approvals", [])
        approved_list = user_state.get("approved_approvals", [])
        declined_list = user_state.get("declined_approvals", [])

        # Debug logging to see what's in each list
        print(f"---DEBUG USER STATUS for {user_id}---")
        print(f"Pending list: {pending_list}")
        print(f"Approved list: {approved_list}")
        print(f"Declined list: {declined_list}")

        # Determine status based on priority: declined > pending > approved > no_history
        # If there are declined requests, prioritize them over pending (to handle duplicate requests)
        if declined_list:
            status = "declined"
        elif pending_list:
            status = "pending"
        elif approved_list:
            status = "approved"
        else:
            status = "no_history"

        print(f"---DETERMINED STATUS: {status}---")

        return jsonify({"status": status}), 200

    except Exception as e:
        print(f"---ERROR FETCHING USER APPROVAL STATUS for {user_id}---: {e}")
        traceback.print_exc()
        # Return no_history for any errors to keep it simple
        return jsonify({"status": "no_history"}), 200


@app.route("/api/approve-update/<string:thread_id>", methods=["POST"])
def approve_update(thread_id):
    """
    Resumes a paused graph execution with the admin's decision.
    """
    print(f"\n---APPROVE-UPDATE ENDPOINT TRIGGERED FOR THREAD: {thread_id}---")
    data = request.get_json()
    decision = data.get("decision")
    print(f"---RECEIVED DECISION: {decision}---")

    if not decision or decision not in ["approved", "declined"]:
        return jsonify({"error": "Invalid decision provided."}), 400

    try:
        config = {"configurable": {"thread_id": thread_id}}

        # Get the current state
        current_state = app_graph.get_state(config)
        if not current_state:
            print(f"---ERROR: No state found for thread_id: {thread_id}---")
            return jsonify({"error": "Approval request not found."}), 404

        print(
            f"---[BEFORE INVOKE] CURRENT STATE for thread {thread_id}: {current_state.values}---"
        )
        print(f"---[BEFORE INVOKE] NEXT NODE: {current_state.next}---")

        # Inject the decision into the state
        current_state.values["human_approval_status"] = decision
        app_graph.update_state(config, current_state.values)
        print(f"---STATE UPDATED with decision: {decision} for thread {thread_id}---")

        # Resume the graph
        print(f"---INVOKING GRAPH to resume thread: {thread_id}---")
        resumed_state = app_graph.invoke(None, config)
        print(
            f"---[AFTER INVOKE] RESUMED STATE for thread {thread_id}: {resumed_state}---"
        )

        return (
            jsonify(
                {
                    "status": "success",
                    "message": f"Decision '{decision}' processed for thread {thread_id}.",
                }
            ),
            200,
        )

    except Exception as e:
        print(f"---ERROR PROCESSING APPROVAL---: {e}")
        traceback.print_exc()
        return jsonify({"error": "Failed to process approval decision."}), 500


@app.route("/api/logout/", methods=["POST"])
def logout():
    response = jsonify({"message": "Logged out"})
    return response, 200


@app.route("/api/chat/history/<user_id>", methods=["GET"])
def get_chat_history(user_id):
    print(f"\n🔍 [DEBUG] Fetching chat history for user_id: {user_id}")
    try:
        if USE_SUPABASE:
            # ========== SUPABASE CODE START ==========
            # Use Supabase client
            result = (
                SUPABASE_CLIENT.table("users")
                .select("history")
                .eq("user_id", user_id)
                .execute()
            )

            if not result.data:
                print(f"❌ [ERROR] No user found with user_id: {user_id}")
                return jsonify({"error": "User not found"}), 404

            history = (
                eval(result.data[0]["history"]) if result.data[0]["history"] else []
            )
            print(f"✅ [SUCCESS] Retrieved history: {history}")
            return jsonify({"history": history}), 200
            # ========== SUPABASE CODE END ==========
        # else:
        # # ========== ORIGINAL POSTGRESQL CODE START ==========
        # # Use local PostgreSQL
        # conn = DB_POOL.getconn()
        # cursor = conn.cursor(cursor_factory=RealDictCursor)

        # # Get chat history from users table
        # query = "SELECT history FROM users WHERE user_id = %s"
        # print(f"📝 [DEBUG] Executing query: {query} with user_id: {user_id}")

        # cursor.execute(query, (user_id,))
        # result = cursor.fetchone()

        # print(f"📊 [DEBUG] Query result: {result}")

        # if not result:
        #     print(f"❌ [ERROR] No user found with user_id: {user_id}")
        #     return jsonify({"error": "User not found"}), 404

        # history = eval(result["history"]) if result["history"] else []
        # print(f"✅ [SUCCESS] Retrieved history: {history}")
        # return jsonify({"history": history}), 200
        # # ========== ORIGINAL POSTGRESQL CODE END ==========

    except Exception as e:
        print(f"❌ [ERROR] Error fetching chat history: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if not USE_SUPABASE and "conn" in locals():
            DB_POOL.putconn(conn)
            print("🔄 [DEBUG] Database connection returned to pool")


@app.route("/api/user/policies/<user_id>", methods=["GET"])
def get_user_policies(user_id):
    print(f"\n🔍 [DEBUG] Fetching policies for user_id: {user_id}")
    try:
        if USE_SUPABASE:
            # ========== SUPABASE CODE START ==========
            # Use Supabase client
            # First check if user exists
            user_result = (
                SUPABASE_CLIENT.table("users")
                .select("user_id")
                .eq("user_id", user_id)
                .execute()
            )

            if not user_result.data:
                print(f"❌ [ERROR] User not found with user_id: {user_id}")
                return jsonify({"error": "User not found"}), 404

            # Get policy information
            policies_result = (
                SUPABASE_CLIENT.table("policies")
                .select(
                    "policy_id, policy_type, policy_status, markdown_format, issue_date, expiry_date, premium_amount, coverage_amount"
                )
                .eq("user_id", user_id)
                .execute()
            )

            print(f"📊 [DEBUG] Query result: {policies_result.data}")

            if not policies_result.data:
                print(f"ℹ️ [INFO] No policies found for user_id: {user_id}")
                return (
                    jsonify({"policies": []}),
                    200,
                )  # Return empty array instead of 404

            return jsonify({"policies": policies_result.data}), 200
            # ========== SUPABASE CODE END ==========
        # else:
        #     # ========== ORIGINAL POSTGRESQL CODE START ==========
        #     # Use local PostgreSQL
        #     conn = DB_POOL.getconn()
        #     cursor = conn.cursor(cursor_factory=RealDictCursor)

        #     # First check if user exists
        #     cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (user_id,))
        #     user = cursor.fetchone()

        #     if not user:
        #         print(f"❌ [ERROR] User not found with user_id: {user_id}")
        #         return jsonify({"error": "User not found"}), 404

        #     # Get policy information
        #     query = """
        #         SELECT policy_id, policy_type, policy_status, markdown_format, issue_date, expiry_date, premium_amount, coverage_amount
        #         FROM policies
        #         WHERE user_id = %s
        #     """
        #     print(f"📝 [DEBUG] Executing query: {query} with user_id: {user_id}")

        #     cursor.execute(query, (user_id,))
        #     policies = cursor.fetchall()

        #     print(f"📊 [DEBUG] Query result: {policies}")

        #     if not policies:
        #         print(f"ℹ️ [INFO] No policies found for user_id: {user_id}")
        #         return (
        #             jsonify({"policies": []}),
        #             200,
        #         )  # Return empty array instead of 404

        # return jsonify({"policies": policies}), 200
        # # ========== ORIGINAL POSTGRESQL CODE END ==========

    except Exception as e:
        print(f"❌ [ERROR] Error fetching policies: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    finally:
        if not USE_SUPABASE and "conn" in locals():
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


# ========== PDF UPLOAD ENDPOINTS START ==========
@app.route("/api/upload/pdf", methods=["POST"])
def upload_pdf():
    """
    Upload and process PDF documents for vector storage.
    """
    print("🔄 [INFO] Received PDF upload request")

    try:
        # Check if file is present
        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        # Check if file is PDF
        if not file.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Only PDF files are allowed"}), 400

        # Get additional parameters
        user_id = request.form.get("user_id")
        document_type = request.form.get("document_type", "policy")
        metadata = {}

        # Add any additional metadata
        for key, value in request.form.items():
            if key not in ["user_id", "document_type"]:
                metadata[key] = value

        # Save file temporarily
        import tempfile
        import os
        from uploads.pdf_processor import pdf_processor

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name

        try:
            # Process PDF
            result = pdf_processor.process_pdf(
                pdf_path=temp_path,
                filename=file.filename,
                user_id=user_id,
                document_type=document_type,
                metadata=metadata,
            )

            if result["success"]:
                print(f"✅ [SUCCESS] PDF processed successfully: {file.filename}")
                return (
                    jsonify(
                        {
                            "message": "PDF processed successfully",
                            "document_id": result["document_id"],
                            "chunk_count": result["chunk_count"],
                            "text_length": result["text_length"],
                            "filename": result["filename"],
                            "document_type": result["document_type"],
                        }
                    ),
                    200,
                )
            else:
                print(
                    f"❌ [ERROR] PDF processing failed: {result.get('error', 'Unknown error')}"
                )
                return (
                    jsonify(
                        {
                            "error": f"PDF processing failed: {result.get('error', 'Unknown error')}"
                        }
                    ),
                    500,
                )

        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    except Exception as e:
        print(f"❌ [ERROR] PDF upload error: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


# ========== PDF UPLOAD ENDPOINTS END ==========


if __name__ == "__main__":
    # Initialize database
    init_db()

    # Populate metrics cache on startup in a background thread
    print("🚀 [INFO] Starting off metrics caching in the background.")
    metrics_thread = threading.Thread(target=background_metrics_caching)
    metrics_thread.start()

    # Run Flask app12
    app.run(debug=config.DEBUG, host="0.0.0.0", port=8001)
