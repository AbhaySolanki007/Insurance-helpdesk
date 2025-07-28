# Test script for update_user_data tool
"""Test script to verify the update_user_data functionality"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.models import update_user_data, get_user_data
from database import db_utils

def test_update_user_data():
    """Test the update_user_data function with various scenarios"""
    
    print("🧪 Testing update_user_data tool...")
    print("=" * 50)
    
    # Test user ID (you may need to change this to an existing user in your database)
    test_user_id = "test_user_123"
    
    # Test 1: Update name only
    print("\n📝 Test 1: Update user name")
    result = update_user_data(test_user_id, {"name": "John Doe Updated"})
    print(f"Result: {result}")
    
    # Test 2: Update multiple fields
    print("\n📝 Test 2: Update multiple fields")
    result = update_user_data(test_user_id, {
        "name": "Jane Smith",
        "phone": "+1-555-0123",
        "address": "456 Oak Street, City, State 12345",
        "location": "New York"
    })
    print(f"Result: {result}")
    
    # Test 3: Update password
    print("\n📝 Test 3: Update password")
    result = update_user_data(test_user_id, {"passwords": "new_secure_password_123"})
    print(f"Result: {result}")
    
    # Test 4: Try to update invalid field
    print("\n📝 Test 4: Try to update invalid field (email)")
    result = update_user_data(test_user_id, {"email": "newemail@test.com"})
    print(f"Result: {result}")
    
    # Test 5: Try to update with None values
    print("\n📝 Test 5: Try to update with None values")
    result = update_user_data(test_user_id, {
        "name": None,
        "phone": "+1-555-9999"
    })
    print(f"Result: {result}")
    
    # Test 6: Try to update non-existent user
    print("\n📝 Test 6: Try to update non-existent user")
    result = update_user_data("non_existent_user_999", {"name": "Test Name"})
    print(f"Result: {result}")
    
    # Test 7: Get user data to verify updates
    print("\n📝 Test 7: Get user data to verify updates")
    user_data = get_user_data(test_user_id)
    print(f"Current user data:\n{user_data}")
    
    print("\n✅ Testing completed!")

def test_with_real_user():
    """Test with a real user from your database"""
    print("\n🔍 Testing with real user data...")
    print("=" * 50)
    
    # First, let's see what users exist in your database
    try:
        conn = db_utils.get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, name, email FROM users LIMIT 5")
            users = cur.fetchall()
            
        if users:
            print("Available users in database:")
            for user in users:
                print(f"  - User ID: {user[0]}, Name: {user[1]}, Email: {user[2]}")
            
            # Test with the first user
            test_user = users[0]
            print(f"\n📝 Testing update with real user: {test_user[0]}")
            
            # Update the user's phone number
            result = update_user_data(test_user[0], {"phone": "+1-555-TEST-123"})
            print(f"Update result: {result}")
            
            # Get updated user data
            updated_data = get_user_data(test_user[0])
            print(f"Updated user data:\n{updated_data}")
            
        else:
            print("No users found in database. Please add some test users first.")
            
    except Exception as e:
        print(f"Error accessing database: {e}")
    finally:
        if 'conn' in locals():
            db_utils.release_db_connection(conn)

if __name__ == "__main__":
    print("🚀 Starting update_user_data tool tests...")
    
    # Test with dummy user ID first
    test_update_user_data()
    
    # Test with real user from database
    test_with_real_user()
    
    print("\n🎉 All tests completed!") 