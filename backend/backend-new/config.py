# 1. config.py
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
JIRA_SERVER = os.getenv("JIRA_SERVER")  # e.g., "https://your-domain.atlassian.net"
JIRA_USERNAME = os.getenv("JIRA_USERNAME")  # Your JIRA email
JIRA_API_TOKEN = os.getenv("JIRA_API_TOKEN")  # Your JIRA API Token
JIRA_PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY")  # The key for your JIRA project

# PostgreSQL Database Settings
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_NAME", "Testdb1"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "123"),
    "port": os.getenv("DB_PORT", "5432"),
}

# Audio Settings
AUDIO_FORMAT = "paInt16"
CHANNELS = 1
RATE = 16000
CHUNK = 1024
