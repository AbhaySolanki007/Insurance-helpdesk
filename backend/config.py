# 2. config.py
"""Configuration settings for the application."""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Email Settings
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

# Flask Settings
FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "default_secret_key")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))


# Vector Store Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FAQ_DB_PATH = os.getenv("FAQ_DB_PATH", os.path.join(BASE_DIR, "faq_database"))

FAQ_COLLECTION_NAME = os.getenv("FAQ_COLLECTION_NAME", "faq_collection")

# Google API Scopes
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

# JIRA Settings
JIRA_SERVER = os.getenv("JIRA_SERVER")
JIRA_USERNAME = os.getenv("JIRA_USERNAME")
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY")

# ========== SUPABASE INTEGRATION START ==========
# Database Settings - Support both Local PostgreSQL and Supabase
USE_SUPABASE = os.getenv("USE_SUPABASE", "false").lower() == "true"

if USE_SUPABASE:
    # Supabase Database Settings
    DB_CONFIG = {
        "host": os.getenv("SUPABASE_HOST"),
        "database": os.getenv("SUPABASE_DB_NAME", "postgres"),
        "user": os.getenv("SUPABASE_USER"),
        "password": os.getenv("SUPABASE_PASSWORD"),
        "port": os.getenv("SUPABASE_PORT", "5432"),
        "sslmode": "require",
    }

    # Supabase specific settings
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    # Initialize Supabase client
    try:
        from supabase import create_client, Client

        SUPABASE_CLIENT = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print("✅ Supabase client initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase client: {e}")
        SUPABASE_CLIENT = None
else:
    # ========== ORIGINAL POSTGRESQL CODE START ==========
    # Local PostgreSQL Database Settings
    DB_CONFIG = {
        "host": os.getenv("DB_HOST"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "port": os.getenv("DB_PORT"),
    }
    SUPABASE_CLIENT = None
    # ========== ORIGINAL POSTGRESQL CODE END ==========
# ========== SUPABASE INTEGRATION END ==========
