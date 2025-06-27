# 11. app.py
"""Main Flask application entry point(L1 and L2 intilizatiion)"""
# This file contains the main Flask application for the insurance helpdesk system.
# It initializes the database, sets up routes for L1 and L2 support, and handles 

import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from psycopg2.extras import RealDictCursor

import config
from database import models
from database.db_utils import DB_POOL
from database.models import init_db, get_user_history, update_user_history
from ai.unified_chain import UnifiedSupportChain
from ai.agent import create_agent_executor, process_l2_query
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

# Initialize agent executor
agent_executor = create_agent_executor(support_chain)


@app.route("/predict/l1", methods=["POST"])
def predict_l1():
    """L1 support endpoint with stateless history management."""
    data = request.get_json()
    query = data.get("query")
    user_id = data.get("user_id")

    if not query or not user_id:
        return jsonify({"error": "Missing 'query' or 'user_id'."}), 400

    try:
        # 1. Load history from the database
        history = get_user_history(user_id)

        # 2. Format history using the central helper function
        history_for_prompt = format_history_for_prompt(history)

        # 3. Process the query
        response = support_chain.process_query(
            query=query, user_id=user_id, chat_history_str=history_for_prompt
        )

        # 4. Update the history list
        history.append({"input": query, "output": response})

        # 5. Save the updated history back to the database
        update_user_history(user_id, history)

        return jsonify({"response": response, "user_id": user_id})
    except Exception as e:
        import traceback

        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/predict/l2", methods=["POST"])
def predict_l2():
    """L2 support endpoint"""
    data = request.get_json()
    user_id = data.get("user_id")
    query = data.get("query")

    if not query or not user_id:
        return jsonify({"error": "Missing 'query' or 'user_id'."}), 400

    # This function now handles its own history loading and saving.
    result = process_l2_query(query, user_id, support_chain, agent_executor)

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
