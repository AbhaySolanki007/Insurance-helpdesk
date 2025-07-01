# Project Structure Overview
"""
insurance_support/
│
├── app.py                  # Main Flask application entry point
├── config.py               # Configuration settings
├── requirements.txt        # Project dependencies
│
├── database/
│   ├── __init__.py
│   ├── models.py           # Database models
│   └── db_utils.py         # Database utility functions
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py     # Authentication services
│   ├── email_service.py    # Email functionality
│   ├── policy_service.py   # Policy management
│   ├── ticket_service.py   # Ticket management
│   └── audio_service.py    # Audio recording & processing
│
├── ai/
│   ├── __init__.py
│   ├── unified_chain.py    # Unified support chain
│   ├── agent.py            # L2 agent functionality
│   └── tools.py            # Agent tools definitions
│
└── utils/
    ├── __init__.py
    └── helpers.py          # General helper functions
"""

# 1. config.py
"""Configuration settings for the application."""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Email Settings
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")

# Flask Settings
FLASK_SECRET_KEY = os.getenv("FLASK_SECRET_KEY", "default_secret_key")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))

# Database Settings
DATABASE_PATH = os.getenv("DATABASE_PATH", "insurance.db")

# Vector Store Paths
FAQ_DB_PATH = os.getenv(
    "FAQ_DB_PATH",
    "D:/cywarden/project2/Insurance-Helpdesk/backend/backend-python/Unified Bot/Unified Bot/faq_database",
)
TICKET_DB_PATH = os.getenv(
    "TICKET_DB_PATH",
    "D:/cywarden/project2/Insurance-Helpdesk/backend/backend-python/Unified Bot/Unified Bot/ticket_database",
)
FAQ_COLLECTION_NAME = os.getenv("FAQ_COLLECTION_NAME", "FAQ_Article_Updated")
TICKET_COLLECTION_NAME = os.getenv("TICKET_COLLECTION_NAME", "Support_Ticket")

# Google API Scopes
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

# Audio Settings
AUDIO_FORMAT = "paInt16"
CHANNELS = 1
RATE = 16000
CHUNK = 1024

# 2. database/models.py
"""Database models for the insurance support system."""
import sqlite3
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
import config


def init_db():
    """Initialize the database with required tables."""
    conn = sqlite3.connect(config.DATABASE_PATH)
    c = conn.cursor()

    # Users table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            email TEXT,
            history TEXT DEFAULT '[]'
        )
    """
    )

    # Policies table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS policies (
            username TEXT PRIMARY KEY,
            current_coverage INTEGER,
            premium REAL,
            FOREIGN KEY (username) REFERENCES users(username)
        )
    """
    )

    # Tickets table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            username TEXT,
            summary TEXT,
            description TEXT,
            action_taken TEXT,
            created_at TEXT
        )
    """
    )

    conn.commit()
    conn.close()


class User:
    """User model for database operations."""

    @staticmethod
    def create_or_update(username: str, email: str) -> bool:
        """Create or update a user in the database."""
        try:
            conn = sqlite3.connect(config.DATABASE_PATH)
            c = conn.cursor()

            # Insert or update user
            c.execute(
                """
                INSERT INTO users (username, email)
                VALUES (?, ?)
                ON CONFLICT(username) DO UPDATE SET email=excluded.email
            """,
                (username, email),
            )

            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating/updating user: {str(e)}")
            return False

    @staticmethod
    def get_email(username: str) -> Optional[str]:
        """Get a user's email address."""
        conn = sqlite3.connect(config.DATABASE_PATH)
        c = conn.cursor()
        c.execute("SELECT email FROM users WHERE username=?", (username,))
        result = c.fetchone()
        conn.close()

        if result:
            return result[0]
        return None

    @staticmethod
    def get_conversation_history(username: str) -> List[Dict[str, str]]:
        """Get a user's conversation history."""
        conn = sqlite3.connect(config.DATABASE_PATH)
        c = conn.cursor()
        c.execute("SELECT history FROM users WHERE username=?", (username,))
        result = c.fetchone()
        conn.close()

        if result and result[0]:
            try:
                return json.loads(result[0])
            except json.JSONDecodeError:
                return []
        return []

    @staticmethod
    def update_conversation_history(username: str, history: List) -> bool:
        """Update a user's conversation history."""
        try:
            conn = sqlite3.connect(config.DATABASE_PATH)
            c = conn.cursor()
            c.execute(
                """
                UPDATE users SET history = ? WHERE username = ?
            """,
                (json.dumps(history), username),
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating conversation history: {str(e)}")
            return False


class Policy:
    """Policy model for database operations."""

    @staticmethod
    def create_default(username: str) -> bool:
        """Create a default policy for a user."""
        try:
            conn = sqlite3.connect(config.DATABASE_PATH)
            c = conn.cursor()

            # Create default policy
            c.execute(
                """
                INSERT INTO policies (username, current_coverage, premium)
                VALUES (?, ?, ?)
                ON CONFLICT(username) DO NOTHING
            """,
                (username, 10000, 50.00),
            )

            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error creating default policy: {str(e)}")
            return False

    @staticmethod
    def get_coverage(username: str) -> Optional[int]:
        """Get a user's current coverage amount."""
        conn = sqlite3.connect(config.DATABASE_PATH)
        c = conn.cursor()
        c.execute("SELECT current_coverage FROM policies WHERE username=?", (username,))
        result = c.fetchone()
        conn.close()

        if result:
            return result[0]
        return None

    @staticmethod
    def update_coverage(username: str, coverage: int, premium: float) -> bool:
        """Update a user's coverage and premium."""
        try:
            conn = sqlite3.connect(config.DATABASE_PATH)
            c = conn.cursor()
            c.execute(
                """
                UPDATE policies 
                SET current_coverage = ?, premium = ?
                WHERE username = ?
            """,
                (coverage, premium, username),
            )
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating policy: {str(e)}")
            return False


class Ticket:
    """Ticket model for database operations."""

    @staticmethod
    def create(username: str, summary: str, description: str) -> Optional[str]:
        """Create a new support ticket."""
        try:
            from uuid import uuid4

            ticket_id = f"TKT-{str(uuid4())[:8]}"
            conn = sqlite3.connect(config.DATABASE_PATH)
            c = conn.cursor()
            c.execute(
                """
                INSERT INTO tickets (id, username, summary, description, created_at)
                VALUES (?, ?, ?, ?, ?)
            """,
                (ticket_id, username, summary, description, datetime.now().isoformat()),
            )
            conn.commit()
            conn.close()

            return ticket_id
        except Exception as e:
            print(f"Error creating ticket: {str(e)}")
            return None

    @staticmethod
    def search(username: str, query: str = "") -> List[Dict[str, Any]]:
        """Search for tickets matching a query."""
        conn = sqlite3.connect(config.DATABASE_PATH)
        c = conn.cursor()
        search_term = f"%{query.lower()}%"
        c.execute(
            """
            SELECT * FROM tickets 
            WHERE username = ? AND 
            (lower(id) LIKE ? OR lower(summary) LIKE ? OR lower(description) LIKE ?)
            ORDER BY created_at DESC
        """,
            (username, search_term, search_term, search_term),
        )

        results = []
        for row in c.fetchall():
            status = row[4] if row[4] is not None else "In Progress"
            results.append(
                {
                    "id": row[0],
                    "summary": row[2],
                    "description": row[3],
                    "status": status,
                    "created_at": row[5],
                }
            )
        conn.close()

        return results


# 3. database/db_utils.py
"""Database utility functions."""
import sqlite3
from typing import List, Dict, Any, Optional
import config


def execute_query(
    query: str, params: tuple = (), fetch: bool = False
) -> Optional[List]:
    """Execute a database query and optionally fetch results."""
    conn = sqlite3.connect(config.DATABASE_PATH)
    c = conn.cursor()
    c.execute(query, params)

    result = None
    if fetch:
        result = c.fetchall()
    else:
        conn.commit()

    conn.close()
    return result


def format_ticket_results(results: List[Dict[str, Any]]) -> str:
    """Format ticket search results for display."""
    if not results:
        return "No tickets found for this user."

    formatted_results = []
    for ticket in results:
        formatted_results.append(
            f"ID: {ticket['id']}\n"
            f"Summary: {ticket['summary']}\n"
            f"Description: {ticket['description']}\n"
            f"Status: {ticket['status']}\n"
            f"Created: {ticket['created_at']}"
        )

    return "\n\n".join(formatted_results)


# 4. services/email_service.py
"""Email service functionality."""
import os
import base64
import pickle
from typing import Optional
from email.message import EmailMessage

from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from database.models import User
import config


def get_credentials():
    """Get or refresh Google API credentials."""
    creds = None
    if os.path.exists("token.pickle"):
        with open("token.pickle", "rb") as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "secret.json", config.SCOPES
            )
            creds = flow.run_local_server(port=0)
        with open("token.pickle", "wb") as token:
            pickle.dump(creds, token)
    return creds


def send_email(input_data):
    """
    Send email using stored address.

    Args:
        input_data: EmailSendInput object with username, subject, and body

    Returns:
        str: Status message
    """
    username = input_data.username
    subject = input_data.subject
    body = input_data.body

    # Get user email
    recipient_email = User.get_email(username)

    if not recipient_email:
        return "No email address stored for this user."

    try:
        creds = get_credentials()
        service = build("gmail", "v1", credentials=creds)

        message = EmailMessage()
        message.set_content(body)
        message["To"] = recipient_email
        message["Subject"] = subject
        message["From"] = config.SENDER_EMAIL
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        message_body = {"raw": raw_message}

        sent_message = (
            service.users().messages().send(userId="me", body=message_body).execute()
        )
        return f"Confirmation sent to {recipient_email}: {subject}\nMessage Id: {sent_message['id']}"

    except HttpError as error:
        return f"Failed to send email: {error}"


# 5. services/policy_service.py
"""Policy management services."""
from database.models import User, Policy
from services.email_service import send_email
from ai.tools import EmailSendInput


def check_eligibility(input_data):
    """
    Check if a user is eligible for coverage increase

    Args:
        input_data: EligibilityCheckInput object

    Returns:
        str: Eligibility status message
    """
    username = input_data.username
    current_coverage = User.get_coverage(username)

    if current_coverage is None:
        return "User has no policy"

    if current_coverage < 50000:
        new_premium = 120.0  # Dummy calculation
        return f"ELIGIBLE: Can increase to $50,000. New premium: ${new_premium:.2f}. Proceed?"
    else:
        return "NOT_ELIGIBLE: Already at maximum coverage."


def update_policy(input_data):
    """
    Update user's policy to maximum coverage

    Args:
        input_data: PolicyUpdateInput object

    Returns:
        str: Policy update status message
    """
    username = input_data.username
    new_coverage = 50000
    new_premium = 120.0

    success = User.update_coverage(username, new_coverage, new_premium)

    if not success:
        return "Failed to update policy."

    try:
        email_input = EmailSendInput(
            username=username,
            subject="Policy Update Confirmation",
            body=f"Your coverage has been increased to ${new_coverage}. New monthly premium: ${new_premium:.2f}.",
        )
        send_email(email_input)
    except Exception as e:
        pass  # Continue even if email fails

    return f"Policy updated successfully. New coverage: ${new_coverage}, Premium: ${new_premium:.2f}. Confirmation email has been sent."


# 6. services/ticket_service.py
"""Ticket management services."""
from database.models import Ticket


def create_ticket(input_data):
    """
    Create a support ticket for the user

    Args:
        input_data: TicketCreateInput object

    Returns:
        str: Ticket creation status message
    """
    username = input_data.username
    summary = input_data.summary
    description = input_data.description

    ticket_id = Ticket.create(username, summary, description)

    if not ticket_id:
        return "Failed to create ticket."

    return f'Ticket {ticket_id} created for: "{summary}". Would you like me to send confirmation to your registered email? (Yes/No)'


def search_tickets(input_data):
    """
    Search for tickets matching a query

    Args:
        input_data: TicketSearchInput object

    Returns:
        str: Formatted ticket search results
    """
    username = input_data.username
    query = input_data.query

    results = Ticket.search(username, query)

    if not results:
        return "No tickets found for this user."

    formatted_results = []
    for ticket in results:
        formatted_results.append(
            f"ID: {ticket['id']}\n"
            f"Summary: {ticket['summary']}\n"
            f"Description: {ticket['description']}\n"
            f"Status: {ticket['status']}\n"
            f"Created: {ticket['created_at']}"
        )

    return "\n\n".join(formatted_results)


# 7. services/audio_service.py
"""Audio recording and processing services."""
import threading
import pyaudio
import speech_recognition as sr

import config

# Initialize recognizer
recognizer = sr.Recognizer()

# Global variables
audio_buffer = []
stop_event = threading.Event()
audio = pyaudio.PyAudio()


def record_audio():
    """Record audio in a loop until `stop_event` is set."""
    stream = audio.open(
        format=getattr(pyaudio, config.AUDIO_FORMAT),
        channels=config.CHANNELS,
        rate=config.RATE,
        input=True,
        frames_per_buffer=config.CHUNK,
    )
    while not stop_event.is_set():
        data = stream.read(config.CHUNK)
        audio_buffer.append(data)
    stream.stop_stream()
    stream.close()


def start_recording():
    """Start recording audio."""
    stop_event.clear()
    audio_buffer.clear()
    threading.Thread(target=record_audio, daemon=True).start()
    return {"status": "Recording started"}


def stop_recording():
    """Stop recording and return recognized text."""
    stop_event.set()

    # Wait briefly for the recording thread to finish
    threading.Event().wait(0.5)

    if not audio_buffer:
        return {"error": "No audio recorded"}

    # Convert raw audio data to AudioData format
    audio_data = sr.AudioData(
        b"".join(audio_buffer), config.RATE, 2  # Sample width (2 bytes = 16-bit)
    )

    try:
        text = recognizer.recognize_google(audio_data)
        return {"text": text}
    except sr.UnknownValueError:
        return {"error": "Could not understand audio"}
    except sr.RequestError as e:
        return {"error": f"API request failed: {e}"}


# 8. ai/unified_chain.py
"""Unified support chain combining FAQ and ticket retrieval."""
import os
import re
from typing import List, Dict, Any, Optional
import chromadb
from sentence_transformers import SentenceTransformer
from langchain_google_genai import GoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain.memory import ConversationBufferMemory
from langchain_chroma import Chroma
import config


class UnifiedSupportChain:
    def __init__(
        self,
        faq_db_path=config.FAQ_DB_PATH,
        ticket_db_path=config.TICKET_DB_PATH,
        faq_collection_name=config.FAQ_COLLECTION_NAME,
        ticket_collection_name=config.TICKET_COLLECTION_NAME,
    ):
        """
        Initialize Unified Support System with both FAQ and Ticket capabilities.
        """
        # Initialize Google AI embeddings for FAQ
        self.faq_embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001", google_api_key=config.GOOGLE_API_KEY
        )

        # Initialize sentence transformer for ticket queries
        self.ticket_model = SentenceTransformer("all-mpnet-base-v2")

        self.faq_vectorstore = Chroma(
            client=chromadb.PersistentClient(path=faq_db_path),
            collection_name=faq_collection_name,
            embedding_function=self.faq_embeddings,
        )

        # Create FAQ retriever
        self.faq_retriever = self.faq_vectorstore.as_retriever(
            search_type="similarity", search_kwargs={"k": 3}
        )

        # Initialize ticket database client
        self.ticket_client = chromadb.PersistentClient(path=ticket_db_path)
        try:
            self.ticket_collection = self.ticket_client.get_collection(
                ticket_collection_name
            )
        except Exception as e:
            print(
                f"Warning: Ticket collection not found. Ticket lookup will be unavailable. Error: {str(e)}"
            )
            self.ticket_collection = None

        # Initialize LLM
        self.llm = GoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=config.GOOGLE_API_KEY,
            temperature=0.6,
            max_tokens=200,
        )

        # Remove global memory and use per-user memory instead.
        self.user_memories = {}  # This will map username to ConversationBufferMemory

        # Create the unified chain
        self.chain = self._create_chain()

    def _extract_identifiers(self, query):
        """
        Extract ticket ID and policy number from the query.
        """
        ticket_pattern = r"TKT-\d{8}|TKT\d{8}"
        policy_pattern = r"POL-\d{8}|POL\d{8}"

        ticket_matches = re.findall(ticket_pattern, query, re.IGNORECASE)
        policy_matches = re.findall(policy_pattern, query, re.IGNORECASE)

        ticket_id = None
        if ticket_matches:
            ticket_id = (
                ticket_matches[0].replace("TKT", "TKT-")
                if "TKT-" not in ticket_matches[0]
                else ticket_matches[0]
            )

        policy_number = None
        if policy_matches:
            policy_number = (
                policy_matches[0].replace("POL", "POL-")
                if "POL-" not in policy_matches[0]
                else policy_matches[0]
            )

        return ticket_id, policy_number

    def query_faqs(self, query_text):
        """
        Query the FAQ collection.
        """
        docs = self.faq_retriever.get_relevant_documents(query_text)
        formatted_results = []
        for doc in docs:
            formatted_results.append(
                {
                    "question": doc.page_content,
                    "answer": doc.metadata.get("answer", "No answer available"),
                }
            )
        return formatted_results

    def get_faq_response(self, query: str) -> str:
        """Public method to get formatted FAQ answers"""
        docs = self.faq_retriever.get_relevant_documents(query)
        if not docs:
            return "No relevant FAQs found"
        return "\n".join(
            f"Q: {doc.page_content}\nA: {doc.metadata.get('answer', 'No answer available')}"
            for doc in docs
        )

    def query_tickets(self, query_text, n_results=3):
        """
        Query the ticket collection if available.
        """
        if not self.ticket_collection:
            return []

        ticket_id, policy_number = self._extract_identifiers(query_text)

        if ticket_id or policy_number:
            where = {}
            if ticket_id:
                where["Ticket_ID"] = {"$in": [ticket_id, ticket_id.replace("-", "")]}
            if policy_number:
                where["Policy_Number"] = {
                    "$in": [policy_number, policy_number.replace("-", "")]
                }

            results = self.ticket_collection.query(
                query_embeddings=[self.ticket_model.encode(query_text).tolist()],
                n_results=1,
                where=where,
            )
        else:
            results = self.ticket_collection.query(
                query_embeddings=[self.ticket_model.encode(query_text).tolist()],
                n_results=n_results,
            )

        formatted_results = []
        if results["documents"] and results["documents"][0]:
            for doc, metadata in zip(results["documents"][0], results["metadatas"][0]):
                formatted_results.append({"document": doc, "metadata": metadata})

        return formatted_results

    def _create_chain(self):
        """
        Build the unified LangChain for both FAQ and ticket support.
        """
        prompt = ChatPromptTemplate.from_template(
            """
            
            Chat History:
            {chat_history}

            FAQ Information:
            {faq_context}

            User Ticket Information:
            {ticket_context}

            Current Query:
            {question}

            Instructions:

            1. Core Response Rules: Query Analysis Protocol :
            - First carefully read and analyze the entire user query before responding
            - If query includes ticket/policy ID (TKT-XXXXXXXX/POL-XXXXXXXX) or personal details:
                → Provide exact info if found, or clearly state "No matching records found"
            - For FAQ matches:
                → Respond naturally with answer + light humor (e.g., "Great question! Here's the scoop...")
                → "Great question! Here's the scoop..." 
                → "That one's in my training manual - let me share the official wisdom..."
            - For general inquiries without FAQ matches:
                → Give concise 3-4 sentence answer with LLM knowledge + humorous touch 
                    
            - Response Rules for Nonsensical/Fictional Queries:
                a) If the user asks about obviously fake/unrealistic insurance (e.g., dinosaur, UFO, fantasy-related):
                    → Respond factually with humor:
                     humorous touch + "There is no record of that type of insurance in our policies. Let me know if you need help with standard coverage (auto, home, health, etc.)." 
                
            

            2. Escalation Protocol:
            - IMMEDIATE ESCALATION triggers:
                a) Complaint keywords: "frustrated", "angry", "want to complain","escalate"
                b) Explicit requests: "speak to supervisor", "higher support"
                c) Complex policy changes/technical issues
                 → Required Response: "I'll connect you with a specialized L2 agent who can better assist. One moment please... L2...."

            - VERIFICATION REQUIRED cases:
                a) Unclear complex queries
                b) Potential complaints without explicit wording
                 → Ask: "Should I escalate this to our special agent team?"

            3. Style Guidelines:
            - Humor examples:
                * "I claim to be a policy expert so , but..."
                * "Let me check my virtual insurance handbook..."
                
            - Keep responses snack-sized (30-40 words max for general answers)
            - For off-topic questions: 
                "While I can't help with that, I'm great at insurance puzzles!"
            - Natural Humor Integration:
                * Policy explanations: "Think of it like insurance yoga - flexible coverage for life's twists!"
                * Payment questions: "Regular premiums keep your coverage fit as a fiddle!"
                * Document requests: "Let me check the archives... ah, here we go!"

            4. Special Cases:
            - When no FAQ match but question is simple:
                "While not in our FAQs, generally... [brief answer]. Want me to find more details?"
            - When no FAQ match and question is complex:
                "Let me transfer you to a specialized L2 agent with the full playbook on this..."
            
            5. Final Checks:
            - Always use exact phrase "specialized L2 agent" in escalation messages
            - Never use "specialized" or "L2 agent" in non-escalation responses
            - Maintain insurance focus in all responses
            Humor Safeguards:
                - Maintain 90% professional tone, 10% light levity
                - Never force jokes - only use when context allows
                - Maintain professional tone with light levity
                - Avoid pop culture references
            - Use insurance-themed wordplay sparingly
            
            Example GOOD Interaction:
            
                User: How do I update my address?
                Assistant: "Address changes are like insurance GPS updates - let's recalibrate your coverage! You can..."

                User: "How do I claim my dinosaur insurance?"
                Assistant: "There is no record of that type of insurance in our policies. Let me know if you need help with standard coverage (auto, home, health, etc.)."
            
                User: "How's the weather today?"
                Assistant: "I specialize in insurance matters and can't assist with that."
           
                User: "How do I file a car insurance claim?"
                Assistant: "Great question! You can file a claim by logging into your account online or calling our claims department at..."
            
            Example BAD Interaction:
            
                User: My car was totaled
                Assistant: "Looks like someone played bumper cars! Let's..."
                
                User: "How do I insure my pet dragon?"
                Assistant: "Great question! Let me check my mythical creatures policy handbook..."
        
        """
        )

        def format_faq_docs(docs):
            if not docs:
                return "No relevant FAQ information found."
            formatted_docs = []
            for doc in docs:
                formatted_doc = f"Q: {doc['question']}\nA: {doc['answer']}"
                formatted_docs.append(formatted_doc)
            return "\n\n".join(formatted_docs)

        def format_ticket_docs(docs):
            if not docs:
                return "No matching tickets found."
            formatted_docs = []
            for doc in docs:
                metadata = doc["metadata"]
                formatted_doc = (
                    f"Ticket ID: {metadata.get('Ticket_ID', 'N/A')}\n"
                    f"Customer: {metadata.get('Customer_Name', 'N/A')}\n"
                    f"Policy Number: {metadata.get('Policy_Number', 'N/A')}\n"
                    f"Issue Type: {metadata.get('Issue_Type', 'N/A')}\n"
                    f"Status: {metadata.get('Status', 'N/A')}"
                )
                formatted_docs.append(formatted_doc)
            return "\n\n".join(formatted_docs)

        def get_chat_history(inputs):
            # Retrieve the conversation history from the per-user ConversationBufferMemory.
            username = inputs.get("username")
            if username and username in self.user_memories:
                return self.user_memories[username].buffer
            return ""

        chain = (
            {
                "faq_context": lambda x: format_faq_docs(
                    self.query_faqs(x["question"])
                ),
                "ticket_context": lambda x: format_ticket_docs(
                    self.query_tickets(x["question"])
                ),
                "question": RunnablePassthrough(),
                "chat_history": get_chat_history,
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )

        return chain

    def process_query(self, query, username):
        """
        Process a user query for the given username, update conversation storage, and return the response.
        """
        # Create or retrieve the per-user ConversationBufferMemory
        if username not in self.user_memories:
            self.user_memories[username] = ConversationBufferMemory(
                memory_key="chat_history", return_messages=True
            )
        conv_mem = self.user_memories[username]

        # Build the chain input with the query and username.
        chain_input = {"question": query, "username": username}
        response = self.chain.invoke(chain_input)

        # Update the per-user conversation memory using the chat memory's built-in methods.
        conv_mem.chat_memory.add_user_message(query)
        conv_mem.chat_memory.add_ai_message(response)
        return response


# 9. ai/tools.py
"""Tool definitions for agent functionality."""
from typing import Dict, Any, Union, Optional
import json
from pydantic import BaseModel, Field
from langchain.tools import Tool

from database.models import User, Policy, Ticket
from services.email_service import send_email
from services.policy_service import check_eligibility, update_policy
from services.ticket_service import create_ticket, search_tickets


# Tool input schema definitions
class EligibilityCheckInput(BaseModel):
    username: str = Field(description="Username to check eligibility for")


class PolicyUpdateInput(BaseModel):
    username: str = Field(description="Username to update policy for")


class TicketCreateInput(BaseModel):
    username: str = Field(description="Username to create ticket for")
    summary: str = Field(description="Brief summary of the ticket")
    description: str = Field(description="Detailed description of the ticket")


class TicketSearchInput(BaseModel):
    username: str = Field(description="Username to search tickets for")
    query: str = Field(
        description="Search term for tickets (empty string returns all tickets)"
    )


class EmailSendInput(BaseModel):
    username: str = Field(description="Username to send email to")
    subject: str = Field(description="Email subject")
    body: str = Field(description="Email body content")


def safe_parse_input(input_data: Union[str, Dict[str, Any]]) -> Dict[str, Any]:
    """Safely parse input that might be a string or dict"""
    if isinstance(input_data, str):
        try:
            # Try to parse as JSON
            return json.loads(input_data)
        except json.JSONDecodeError:
            # If not valid JSON, return as is with a username key
            return {"username": input_data}
    return input_data


def tool_wrapper(func, schema_class):
    """Wrapper to handle input parsing and validation for tools"""

    def wrapped_func(input_data):
        try:
            if isinstance(input_data, str):
                try:
                    parsed_input = json.loads(input_data)
                except json.JSONDecodeError:
                    if schema_class in [EligibilityCheckInput, PolicyUpdateInput]:
                        parsed_input = {"username": input_data}
                    else:
                        raise ValueError(
                            f"Invalid input format for {schema_class.__name__}"
                        )
            else:
                parsed_input = input_data

            validated_input = schema_class(**parsed_input)
            return func(validated_input)
        except Exception as e:
            return f"Error: {str(e)}. Expected format: {schema_class.__name__} with fields {list(schema_class.model_fields.keys())}"

    return wrapped_func


def create_tools(support_chain):
    """Create a list of tools for the agent"""
    return [
        Tool(
            name="faq_search",
            func=support_chain.get_faq_response,
            description="Search insurance FAQs. Input: question string. Output: formatted FAQs.",
        ),
        Tool(
            name="check_eligibility",
            func=tool_wrapper(check_eligibility, EligibilityCheckInput),
            description="Check if a user is eligible for coverage increase",
        ),
        Tool(
            name="update_policy",
            func=tool_wrapper(update_policy, PolicyUpdateInput),
            description="Update user's policy to maximum coverage",
        ),
        Tool(
            name="create_ticket",
            func=tool_wrapper(create_ticket, TicketCreateInput),
            description="Create a support ticket for the user",
        ),
        Tool(
            name="search_ticket",
            func=tool_wrapper(search_tickets, TicketSearchInput),
            description="Search user's tickets (empty query returns all tickets)",
        ),
        Tool(
            name="send_email",
            func=tool_wrapper(send_email, EmailSendInput),
            description="Send an email to the user's registered email address",
        ),
    ]


# 10. ai/agent.py
"""Agent configuration for L2 support."""
from typing import Dict, Any, List
import os

from langchain.agents import AgentExecutor, create_react_agent
from langchain import hub
from langchain_google_genai import GoogleGenerativeAI

from ai.tools import create_tools
import config


def create_agent_executor(support_chain):
    """Create an agent executor with tools"""
    tools = create_tools(support_chain)

    llm = GoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=config.GOOGLE_API_KEY,
        temperature=0.6,
        top_p=0.9,
        max_tokens=200,
        top_k=40,
    )

    prompt = hub.pull("hwchase17/react")
    agent = create_react_agent(llm, tools, prompt)
    return AgentExecutor(
        agent=agent, tools=tools, verbose=True, handle_parsing_errors=True
    )


def format_system_message(username: str, faq_response: str, history_text: str) -> str:
    """Format the system message for the agent"""
    # Example JSON formats for tool usage
    check_eligibility_example = f'{{"username": "{username}"}}'
    update_policy_example = f'{{"username": "{username}"}}'
    create_ticket_example = f'{{"username": "{username}", "summary": "brief summary", "description": "detailed description"}}'
    search_ticket_example = (
        f'{{"username": "{username}", "query": "search term or empty string for all"}}'
    )
    send_email_example = f'{{"username": "{username}", "subject": "Email subject", "body": "Email content"}}'

    return f"""
    You are an insurance company virtual assistant helping {username}. Your primary goal is to assist with insurance-related inquiries—covering policy details, eligibility, ticket creation, and other support tasks—in a friendly, engaging, and human manner.
    
    Escalation Workflow Rules:
        1. FIRST ASK FOR DETAILS:
        - "Could you share more details about [specific aspect of query]?"
        - "What specifically would you like help with regarding [topic]?"
        - "When you say [user's phrase], could you elaborate?"

        2. ONLY AFTER UNDERSTANDING:
        - If ticket needed: "Let me summarize... [recap]. Should I create a ticket?" 
        - If email needed: "Would you like this sent to your email for records?"

        3. NEVER:
        - Assume user wants ticket/email without confirmation
        - Jump straight to solutions without clarifying
        
        Example Flow:
            User: "I'm having payment issues"
            L2: "Could you specify which type of payment? (Premium/Claim/Other)"
            User: "Premium payment failed"
            L2: "Let me verify... [checks]. Would you like me to:
            1. Resend payment link now
            2. Create ticket for support team
            3. Email instructions to your registered address?"
            
    **Critical Conversation Rules:**
        1. NEVER assume ticket creation intent - always confirm first
        2. For complaint-related queries:
            - First ask: "Could you clarify if this is a general inquiry or requires a formal complaint?"
            - If user confirms complaint: "Please describe the issue briefly so I can escalate properly"
            - Only create tickets after explicit confirmation
        3. Maintain natural speech patterns - avoid robotic "ticket created" responses
        
    IMPORTANT:
    Follow this workflow:
        -FIRST consider these FAQs:
        {faq_response}
        -Use tools for specific requests
        - For specific requests (policy changes, tickets, etc.) use tools
        - Maintain natural conversation flow
        
        - For off-topic queries (e.g., "what is the weather today?"), provide a natural response such as "Today's weather is sunny and pleasant!" and then kindly add, "I'd be happy to help if you have any questions about your policy or coverage."
        - If a query appears ambiguous or lacks details, ask clarifying questions like "Would you like to add any additional details?" or "Can you confirm that I should proceed with this action?" before executing any actions ANd ask follow up Question from user but not more then 4-5 for one topic.
        - When using tools, always provide the exact required fields in proper JSON format.
        - For greetings and general inquiries, respond warmly and naturally.
    
    
    PREVIOUS INTERACTIONS:
    {history_text}
    
    INSTRUCTIONS FOR TOOL USAGE:
        - When using tools, always provide the exact required fields in JSON format.
        - Use tools ONLY when necessary. For simple greetings or general questions, respond naturally.
        - Example greetings: "Hi", "Hello", "Good morning" → respond with a friendly greeting.
        - For check_eligibility: {check_eligibility_example}
        - For update_policy: {update_policy_example}
        - For create_ticket: {create_ticket_example}
        - For search_ticket: {search_ticket_example}
        - For send_email: {send_email_example}
    
    CONVERSATION FLOW:
        - When a user asks about increasing coverage: First use check_eligibility, then if eligible, ask if they want to proceed.
        - If the user wants to search tickets: Use search_ticket with their username and an appropriate search term.
        - For normal greetings: Just respond normally without using tools.
        - For ticket creation: Ask for summary and description if not provided, then use create_ticket.
        - After ticket creation: Ask if they want an email confirmation.
        
    IMPORTANT: Always format tool inputs as proper JSON with all required fields!
    IMPORTANT WORKFLOWS:
        Ask question to the user if you had query but ask atmost 4 question to the user not then that
            User: I want to file a complaint  
            AI: Could you provide a brief summary of your complaint and a detailed description of the issue?  
            User: Summary: Delayed claim. Description: My car repair claim from March 1st is still pending.  
            AI: Ticket TKT-12345678 created. Send confirmation email? (Yes/No)
    RESPONSE FORMAT RULES:
        - Use natural, conversational language
        - Avoid technical jargon
        - Keep sentences short (max 15 words)
        - Use contractions (e.g., "I'll" instead of "I will")
        - Add empathetic phrases where appropriate
    IMPORTANT WORKFLOWS:
        - After ticket creation: Only send confirmation email if user explicitly confirms with "Yes" to the question "Would you like me to send confirmation to your registered email?"
        - Example greeting response: 
                User: Hi
                Thought: Normal greeting requires no tools
                Final Answer: Hello! How can I assist you today?
    """


def process_l2_query(
    query: str, username: str, support_chain, agent_executor
) -> Dict[str, Any]:
    """Process an L2 query and return the response"""
    try:
        # Get FAQ responses using existing UnifiedSupportChain
        faq_response = support_chain.get_faq_response(query)

        # Get user conversation history
        user_history = User.get_conversation_history(username)

        # Format history for display
        history_text = ""
        if user_history:
            history_entries = []
            for h in user_history[-5:]:
                parts = h.split("||", 1)
                if len(parts) == 2:
                    history_entries.append(f"User: {parts[0]}\nAssistant: {parts[1]}")
            history_text = "\n".join(history_entries)

        # Create system message
        system_message = format_system_message(username, faq_response, history_text)

        # Execute agent
        response = agent_executor.invoke(
            {"input": f"{system_message}\n\nCurrent user query: {query}"}
        )

        output = response.get("output", "I'm sorry, I couldn't process that request.")

        # Remove any internal thinking that might be leaking through
        if "Final Answer:" in output:
            output = output.split("Final Answer:", 1)[1].strip()

        # Update conversation history
        new_entry = f"{query}||{output}"
        updated_history = user_history + [new_entry]
        User.update_conversation_history(username, updated_history)

        return {"response": output, "username": username}
    except Exception as e:
        import traceback

        error_details = traceback.format_exc()
        print(f"Error in chat endpoint: {error_details}")
        return {"error": str(e), "details": error_details, "username": username}


# 11. app.py
"""Main Flask application entry point."""
import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

import config
from database.models import init_db, User
from ai.unified_chain import UnifiedSupportChain
from ai.agent import create_agent_executor, process_l2_query
from services.audio_service import start_recording, stop_recording

# Initialize Flask app
app = Flask(__name__)
app.secret_key = config.FLASK_SECRET_KEY
CORS(app, origins="*")

# Initialize support chain
support_chain = UnifiedSupportChain()

# Initialize agent executor
agent_executor = create_agent_executor(support_chain)


@app.route("/predict/l1", methods=["POST"])
def predict_l1():
    """L1 support endpoint"""
    data = request.get_json()
    query = data.get("query")
    username = data.get("username")

    if not query:
        return jsonify({"error": "No query provided."}), 400
    if not username:
        return jsonify({"error": "No username provided."}), 400

    try:
        response = support_chain.process_query(query, username)
        return jsonify({"response": response, "username": username})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/l2", methods=["POST"])
def predict_l2():
    """L2 support endpoint"""
    data = request.get_json()
    username = data.get("username")
    query = data.get("query")

    if not query:
        return jsonify({"error": "No query provided."}), 400
    if not username:
        return jsonify({"error": "No username provided."}), 400

    result = process_l2_query(query, username, support_chain, agent_executor)

    if "error" in result:
        return jsonify(result), 500
    return jsonify(result)


@app.route("/register", methods=["POST"])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        if not data or "username" not in data or "email" not in data:
            return jsonify({"error": "Username and email are required"}), 400

        username = data["username"].strip()
        email = data["email"].strip()

        if not username or not email:
            return jsonify({"error": "Username and email cannot be empty"}), 400

        # Create or update user
        User.create_or_update(username, email)

        # Ensure user has default policy
        User.create_default(username)

        return jsonify({"status": "User registered/updated with default policy"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/start", methods=["POST"])
def start_recording_endpoint():
    """Start recording audio endpoint"""
    try:
        result = start_recording()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/stop", methods=["POST"])
def stop_recording_endpoint():
    """Stop recording and process audio endpoint"""
    try:
        result = stop_recording()
        if "error" in result:
            return jsonify(result), 400
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Initialize database
    init_db()
    # Run Flask app
    app.run(debug=config.DEBUG, host=config.HOST, port=config.PORT)
