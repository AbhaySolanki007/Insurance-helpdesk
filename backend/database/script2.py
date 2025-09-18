from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")

print(f"URL: {url}")
print(f"Key: {key[:20]}...")

supabase: Client = create_client(url, key)

# Test connection
try:
    result = supabase.table("users").select("*").limit(1).execute()
    print(f"✅ Connected via Supabase client! Found {len(result.data)} users")
    print(f"Sample user: {result.data[0] if result.data else 'No users found'}")
except Exception as e:
    print(f"❌ Supabase client failed: {e}")
