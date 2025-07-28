# Test script for Level2 agent update_user_data tool
"""Test script to verify the update_user_data tool works through Level2 agent"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.tools import create_tools, UserUpdateInput
from ai.Level2_agent import create_level2_agent_executor
from ai.unified_chain import UnifiedSupportChain
from database.models import get_user_data


def test_tool_directly():
    """Test the update_user_data tool directly through the tool interface"""

    print("🧪 Testing update_user_data tool directly...")
    print("=" * 50)

    # Create a mock support chain (we don't need the full FAQ functionality for this test)
    class MockSupportChain:
        def get_faq_response(self, query):
            return "Mock FAQ response"

    support_chain = MockSupportChain()

    # Create tools
    tools = create_tools(support_chain, ["update_user_data"])
    update_tool = tools[0]  # Get the update_user_data tool

    # Test user ID
    test_user_id = "test_user_123"

    # Test 1: Update user name via tool
    print("\n📝 Test 1: Update user name via tool interface")
    tool_input = {"user_id": test_user_id, "name": "John Doe via Tool"}
    result = update_tool.func(tool_input)
    print(f"Tool result: {result}")

    # Test 2: Update multiple fields via tool
    print("\n📝 Test 2: Update multiple fields via tool interface")
    tool_input = {
        "user_id": test_user_id,
        "name": "Jane Smith via Tool",
        "phone": "+1-555-TOOL-123",
        "address": "789 Tool Street, Test City",
    }
    result = update_tool.func(tool_input)
    print(f"Tool result: {result}")

    # Test 3: Test with JSON string input (as the agent might send)
    print("\n📝 Test 3: Test with JSON string input")
    import json

    json_input = json.dumps({"user_id": test_user_id, "phone": "+1-555-JSON-123"})
    result = update_tool.func(json_input)
    print(f"Tool result: {result}")

    # Test 4: Verify the updates
    print("\n📝 Test 4: Verify the updates")
    user_data = get_user_data(test_user_id)
    print(f"Updated user data:\n{user_data}")


def test_pydantic_validation():
    """Test the Pydantic model validation"""

    print("\n🔍 Testing Pydantic model validation...")
    print("=" * 50)

    # Test valid input
    print("\n📝 Test 1: Valid input")
    try:
        valid_input = UserUpdateInput(
            user_id="test_user_123", name="Test User", phone="+1-555-1234"
        )
        print(f"Valid input created: {valid_input}")
        print(f"Dict representation: {valid_input.dict()}")
    except Exception as e:
        print(f"Error creating valid input: {e}")

    # Test with None values
    print("\n📝 Test 2: Input with None values")
    try:
        input_with_none = UserUpdateInput(
            user_id="test_user_123", name=None, phone="+1-555-5678"
        )
        print(f"Input with None created: {input_with_none}")
        print(f"Dict representation: {input_with_none.dict()}")
    except Exception as e:
        print(f"Error creating input with None: {e}")


def test_with_real_user():
    """Test with a real user from the database"""

    print("\n🔍 Testing with real user...")
    print("=" * 50)

    try:
        from database import db_utils

        # Get a real user from database
        conn = db_utils.get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, name, email FROM users LIMIT 1")
            user = cur.fetchone()

        if user:
            test_user_id = user[0]
            print(f"Testing with real user: {test_user_id}")

            # Create tool
            class MockSupportChain:
                def get_faq_response(self, query):
                    return "Mock FAQ response"

            support_chain = MockSupportChain()
            tools = create_tools(support_chain, ["update_user_data"])
            update_tool = tools[0]

            # Test update
            tool_input = {"user_id": test_user_id, "phone": "+1-555-REAL-TEST"}
            result = update_tool.func(tool_input)
            print(f"Update result: {result}")

            # Verify update
            user_data = get_user_data(test_user_id)
            print(f"Updated user data:\n{user_data}")

        else:
            print("No users found in database")

    except Exception as e:
        print(f"Error testing with real user: {e}")
    finally:
        if "conn" in locals():
            db_utils.release_db_connection(conn)


if __name__ == "__main__":
    print("🚀 Starting Level2 update_user_data tool tests...")

    # Test tool directly
    test_tool_directly()

    # Test Pydantic validation
    test_pydantic_validation()

    # Test with real user
    test_with_real_user()

    print("\n🎉 All Level2 tool tests completed!")
