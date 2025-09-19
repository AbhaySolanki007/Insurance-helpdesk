#!/usr/bin/env python3
"""
Test script for PDF document query tool integration with Level 2 agent.
"""

import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_pdf_tool():
    """Test the PDF document query tool."""
    print("🧪 Testing PDF Document Query Tool")
    print("=" * 50)

    try:
        from ai.tools import query_specific_document

        # Test the function directly
        print("1️⃣ Testing PDF document query function...")

        result = query_specific_document(
            user_id="USR1000", filename="test_document.pdf", query="coverage limits"
        )

        print(f"✅ Function executed successfully!")
        print(f"Result: {result}")

        return True

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_tool_creation():
    """Test that the tool can be created properly."""
    print("\n2️⃣ Testing tool creation...")

    try:
        from ai.tools import create_tools
        from ai.rag_orchestrator import UnifiedSupportChain

        # Create a mock support chain
        support_chain = UnifiedSupportChain()

        # Test creating tools with PDF document query
        tools = create_tools(support_chain, ["query_pdf_document"])

        if tools and len(tools) > 0:
            tool = tools[0]
            print(f"✅ Tool created successfully!")
            print(f"   Tool name: {tool.name}")
            print(f"   Tool description: {tool.description}")
            return True
        else:
            print("❌ No tools created")
            return False

    except Exception as e:
        print(f"❌ Tool creation test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_level2_agent_tools():
    """Test that Level 2 agent includes the PDF tool."""
    print("\n3️⃣ Testing Level 2 agent tool integration...")

    try:
        from ai.Level2_agent import create_level2_agent_executor
        from ai.rag_orchestrator import UnifiedSupportChain

        # Create support chain
        support_chain = UnifiedSupportChain()

        # Create Level 2 agent
        agent_executor = create_level2_agent_executor(support_chain)

        # Check if the agent has the PDF tool
        tool_names = [tool.name for tool in agent_executor.tools]

        if "query_pdf_document" in tool_names:
            print(f"✅ PDF document query tool found in Level 2 agent!")
            print(f"   Available tools: {tool_names}")
            return True
        else:
            print(f"❌ PDF document query tool not found in Level 2 agent")
            print(f"   Available tools: {tool_names}")
            return False

    except Exception as e:
        print(f"❌ Level 2 agent test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("🚀 Starting PDF Tool Integration Tests")
    print("=" * 60)

    # Test 1: Direct function test
    test1_success = test_pdf_tool()

    # Test 2: Tool creation test
    test2_success = test_tool_creation()

    # Test 3: Level 2 agent integration test
    test3_success = test_level2_agent_tools()

    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    print(f"   PDF Function Test: {'✅ PASSED' if test1_success else '❌ FAILED'}")
    print(f"   Tool Creation Test: {'✅ PASSED' if test2_success else '❌ FAILED'}")
    print(f"   Level 2 Agent Test: {'✅ PASSED' if test3_success else '❌ FAILED'}")

    if test1_success and test2_success and test3_success:
        print("\n🎉 All tests passed! PDF document query tool is ready!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
