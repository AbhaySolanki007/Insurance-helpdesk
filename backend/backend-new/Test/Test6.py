# Project Structure Overview
"""
insurance_support/
│
├── app.py                  # Main Flask application entry point(L1 and L2 intilizatiion)
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
│   ├── unified_chain.py    # Unified support chain,with L1 prompts
│   ├── agent.py            # L2 agent functionality,with L2 prompt
│   └── tools.py            # Agent tools definitions
│
└── utils/
    ├── __init__.py
    └── helpers.py          # General helper functions like history
"""

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


# 2. database/db_utils.py
"""Database utility functions."""
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
import config

# Initialize the connection pool
try:
    DB_POOL = SimpleConnectionPool(minconn=1, maxconn=10, **config.DB_CONFIG)
    print("Database pool initialized successfully.")
except Exception as e:
    print(f"Error initializing database pool: {e}")
    DB_POOL = None


def get_db_connection():
    """Gets a connection from the pool."""
    if not DB_POOL:
        raise ConnectionError("Database pool is not available.")
    return DB_POOL.getconn()


def release_db_connection(conn):
    """Releases a connection back to the pool."""
    if not DB_POOL:
        return
    DB_POOL.putconn(conn)


# 3. database/models.py
"""Database models for the insurance support system."""
import json
import psycopg2
import uuid
from config import DB_CONFIG
from typing import List, Dict, Optional
from . import db_utils
from psycopg2.extras import RealDictCursor


# Database initialization
def init_db():
    """Initialize PostgreSQL database tables"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()


def get_user_email(user_id: str) -> Optional[str]:
    """Gets a user's email by their user_id."""
    conn = db_utils.get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT email FROM users WHERE user_id = %s", (user_id,))
            result = cur.fetchone()
            return result[0] if result else None
    finally:
        db_utils.release_db_connection(conn)


def get_user_data(user_id: str):
    """Fetch user personal data from users table."""
    conn = db_utils.get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT user_id, user_id, email FROM users WHERE user_id = %s",
                (user_id,),
            )
            result = cur.fetchone()
            if not result:
                return "User not found in the database."
            return f"""User Information:
- User ID: {result.get('user_id', 'N/A')}
- Name: {result.get('name', 'N/A')}
- Email: {result.get('email', 'N/A')}
- Phone: {result.get('phone', 'N/A')}
- Address: {result.get('address', 'N/A')}"""
    finally:
        db_utils.release_db_connection(conn)


def get_policy_data(user_id: str) -> str:
    """Fetches policy data, formatted for the LLM."""
    conn = db_utils.get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT policy_id, policy_type, policy_status, coverage_amount FROM policies WHERE user_id = %s",
                (user_id,),
            )
            result = cur.fetchone()
            if not result:
                return "No policy found for this user."
            return f"""Policy Information:
- Policy ID: {result.get('policy_id', 'N/A')}
- Type: {result.get('policy_types', 'N/A')}
- Status: {result.get('policy_status', 'N/A')}
- Coverage: ${result.get('coverage_amount', 0):,.2f}
- Premium: ${result.get('premium_amount', 0):,.2f}"""
    finally:
        db_utils.release_db_connection(conn)


def get_user_history(user_id: str) -> List[Dict[str, str]]:
    """
    Gets structured conversation history for a user.
    Always returns a list. The list will be empty if no history is found or if data is corrupted.
    """
    conn = db_utils.get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT history FROM users WHERE user_id = %s", (user_id,))
            result = cur.fetchone()
            if result and result[0]:
                try:
                    # Safely parse the JSON string into a Python list of dictionaries
                    return json.loads(result[0])
                except json.JSONDecodeError:
                    print(
                        f"Warning: Corrupted history for user_id {user_id}. Returning empty list."
                    )
                    return []
        # If no user or history, return an empty list for consistency
        return []
    except Exception as e:
        print(f"Error fetching user history for {user_id}: {e}")
        return []  # Return empty list on DB error to prevent crashes
    finally:
        db_utils.release_db_connection(conn)


def update_user_history(user_id: str, history: List[Dict[str, str]]) -> bool:
    """
    Updates the conversation history for a user using a structured list.
    """
    conn = db_utils.get_db_connection()
    try:
        with conn.cursor() as cur:
            # Safely serialize the Python list into a JSON string for storage
            history_json = json.dumps(
                history, indent=2
            )  # indent is optional but nice for debugging
            cur.execute(
                "UPDATE users SET history = %s WHERE user_id = %s",
                (history_json, user_id),
            )
            conn.commit()
            return True
    except Exception as e:
        conn.rollback()
        print(f"History update failed for {user_id}: {e}")
        return False
    finally:
        db_utils.release_db_connection(conn)


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

from database import models
import config


def get_credentials():
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


def send_email(user_id: str, subject: str, body: str) -> str:
    """Sends an email to the user identified by user_id."""
    recipient_email = models.get_user_email(user_id)  # CHANGED: Call new model function
    if not recipient_email:
        return f"Could not send email: No email address found for user_id {user_id}."

    try:
        creds = get_credentials()
        service = build("gmail", "v1", credentials=creds)
        message = EmailMessage()
        message.set_content(body)
        message["To"] = recipient_email
        message["Subject"] = subject
        message["From"] = config.SENDER_EMAIL
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        sent_message = (
            service.users()
            .messages()
            .send(userId="me", body={"raw": raw_message})
            .execute()
        )
        return f"Confirmation sent to {recipient_email}: {subject}\nMessage Id: {sent_message['id']}"
    except HttpError as error:
        return f"Failed to send email: {error}"


# 6. services/ticket_service.py
"""Ticket management services."""
from . import jira_service


def create_ticket(input_data):
    """Creates a support ticket in JIRA."""
    user_id = input_data.user_id
    summary = input_data.summary
    description = input_data.description

    ticket_id = jira_service.create_jira_ticket(user_id, summary, description)

    if not ticket_id:
        return "Failed to create ticket in jira."

    return f'Ticket {ticket_id} created in JIRA for: "{summary}". Would you like me to send confirmation to your registered email? (Yes/No)'


def search_tickets(input_data):
    """Searches for JIRA tickets."""
    user_id = input_data.user_id
    query = input_data.query
    results = jira_service.search_jira_tickets(user_id, query)
    if not results:
        return "No tickets found in JIRA for this user."

    formatted_results = []
    for ticket in results:
        formatted_results.append(
            f"ID: {ticket['id']}\n"
            f"Summary: {ticket['summary']}\n"
            f"Description: {ticket['description'][:100]}...\n"
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


# 12. utils/helpers.py
"""Helper utilities for the application."""
from typing import List, Dict


def format_history_for_prompt(history: List[Dict[str, str]]) -> str:
    """
    Formats a list of structured history turns into a single string for an LLM prompt.
    Uses the last 5 turns to keep the context window manageable.
    """
    if not history:
        return "No previous conversation history."

    # Use the last 5 interactions to avoid overly large prompts
    entries = []
    for turn in history[-5:]:
        # Safely get 'input' and 'output', providing an empty string as a fallback
        user_message = turn.get("input", "")
        ai_message = turn.get("output", "")
        entries.append(f"Human: {user_message}\nAI: {ai_message}")

    return "\n\n".join(entries)


# 8. ai/unified_chain.py
"""Unified support chain combining FAQ and ticket retrieval.
with L1 prompts and all funtionalities of L1"""
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
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
import config
from database import models


class UnifiedSupportChain:
    def __init__(
        self,
        faq_db_path=config.FAQ_DB_PATH,
        faq_collection_name=config.FAQ_COLLECTION_NAME,
    ):

        # Initialize Google AI embeddings for FAQ
        self.faq_embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001", google_api_key=config.GOOGLE_API_KEY
        )

        self.faq_vectorstore = Chroma(
            client=chromadb.PersistentClient(path=faq_db_path),
            collection_name=faq_collection_name,
            embedding_function=self.faq_embeddings,
        )

        # Create FAQ retriever
        self.faq_retriever = self.faq_vectorstore.as_retriever(
            search_type="similarity", search_kwargs={"k": 3}
        )

        # Initialize LLM
        self.llm = GoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=config.GOOGLE_API_KEY,
            temperature=0.6,
            max_tokens=200,
        )

        # Remove global memory and use per-user memory instead.
        self.user_memories = {}

        # Create the unified chain
        self.chain = self._create_chain()

    def query_faqs(self, query_text):
        """
        Query the FAQ collection.
        """
        docs = self.faq_retriever.invoke(query_text)
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
        docs = self.faq_retriever.invoke(query)
        if not docs:
            return "No relevant FAQs found"
        return "\n".join(
            f"Q: {doc.page_content}\nA: {doc.metadata.get('answer', 'No answer available')}"
            for doc in docs
        )

    def _create_chain(self):
        """
        Build the unified LangChain for both FAQ and ticket support.
        """
        prompt = ChatPromptTemplate.from_template(
            """
            
            User Personal Data: {user_data}
            User Policy Data: {policy_data}
            Previous Conversation History: {chat_history}
            Relevant FAQ Information: {faq_context}
            Current User Query: {question}

            Instructions:

            1. Core Response Rules: Query Analysis Protocol:
            - First carefully read and analyze the entire user query before responding
            - If query includes ticket/policy ID (TKT-XXXXXXXX/POL-XXXXXXXX) or personal details:
                → Provide exact info if found, or clearly state "No matching records found"
            - For FAQ matches:
                → Respond naturally with answer + light humor (e.g., "Right out of the FAQ vault—dusted it off just for you!...")
                → "Great question! Here's the scoop..." 
                → "Straight from the sacred scrolls of FAQ legend - let me share the official wisdom..."
            - For general inquiries without FAQ matches:
                → Give concise 3-4 sentence answer with humorous touch with a more human-like tone. 
            -If the user greets with a simple "hi", "hello", or similar greeting:
                → Instruct the LLM to respond with:
                    a)A brief, professional tone
                    b)A lightly humorous or warm touch (without being overly casual)
                    c)Vary responses to avoid repetition (rotate among a small set)
                → Example responses to use or rotate:
                    "Hello! I'm here to help with any insurance questions. How can I assist you today?"
                    
                    "Hi there! Thanks for reaching out. I'm here to help you navigate your insurance needs—just say the word."
                    
                    "Hello! Great to hear from you. Let me know how I can assist with coverage or answer any insurance-related questions."
    
                    
            - Response Rules for Nonsensical/Fictional Queries:
                a) If query is about weather:
                    → Instruct the LLM to respond factually:
                        humorous touch + "Sunny with a chance of paperwork—just how I like it!  But seriously, if it hails, I’ve got your car covered. Literally. Let me know if you need help with standard coverage (auto, home, health, etc.)."
                b) If the user asks about obviously fake/unrealistic insurance (e.g., dinosaur, UFO, fantasy-related):
                    → Instruct the LLM to respond factually:
                        humorous touch + ""While we specialize in real-world coverage, inquiries about dinosaur incidents, UFO abductions, and magical mishaps are noted with great interest. Unfortunately, policies for dragon fire and time-travel disruptions are still under review by our Mythical Risk Department. Let me know if you need help with standard coverage (auto, home, health, etc.)." 
                c) If query is about News/Current Events:
                    → Instruct the LLM to respond factually:
                        humorous touch + "Current events, always keeping us on our digital toes! Much like our underwriters reviewing a particularly... eventful claim. While we can't insure you against bad news headlines (yet!), we can help protect your assets from some of life's more tangible plot twists. Stay informed, stay covered! Let me know if you need help with standard coverage (auto, home, health, etc.)."
                d) If query is about Sports:
                    → Instruct the LLM to respond factually:
                        humorous touch + "Sports! The thrill of victory, the agony of a dropped pass... or that foul ball making a surprise visit to your uninsured windshield. While my algorithms can't predict the winner, I can help ensure you're covered for some of life's unexpected fumbles, both on and off the field. Game on for good coverage! Let me know if you need help with standard coverage (auto, home, health, etc.)."
                e) If query is about The Local Environment/Community Happenings:
                    → Instruct the LLM to respond factually:
                        humorous touch + "Local happenings! As a digital resident, I monitor local risk factors with great interest. A new trampoline park? Fascinating isn't it ! Joking aside , We're here to help you feel secure in your neck of the woods! Let me know if you need help with standard coverage (auto, home, health, etc.)."
                f) If query is about Food:
                    → Instruct the LLM to respond factually:
                        humorous touch + ""Dining questions? Always welcome. While we don't offer policies for spilled coffee or missing Burgers, we do take your overall well-being seriously. Whether it’s health coverage or home insurance , we’ve got you covered. Let me know if you need help with standard coverage (auto, home, health, etc.)."
                g) If the query is off-topic (not related to weather, fake insurance, news, sports, community, or food):
                    → Respond politely
                    → Lightly humorous but redirect back to insurance assistance
                        Response: "That’s an interesting topic—but a bit outside my policy coverage zone. I’m here to help with real-world insurance questions, from auto and home to health and more. Let me know how I can assist with coverage today!"

            

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
            
            Response criteria:
                - MUST keep the response relevant to the asked topic. 
                - AVOID generating responses in a manner that includes the model's thinking process of arriving at a conclusion.
                - For general queries [Like : Hi, Hello, etc] respond promptly and avoid hallucinations to out of context response.
            
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

        chain = (
            {
                # This part now directly takes inputs from the `process_query` call
                "faq_context": lambda x: format_faq_docs(
                    self.query_faqs(x["question"])
                ),
                "user_data": lambda x: models.get_user_data(x["user_id"]),
                "policy_data": lambda x: models.get_policy_data(x["user_id"]),
                "question": lambda x: x["question"],
                "chat_history": lambda x: x["chat_history"],
                "user_id": lambda x: x["user_id"],
                "language": lambda x: x.get("language", "en"),
            }
            | prompt
            | self.llm
            | StrOutputParser()
        )
        return chain

    def process_query(self, query: str, user_id: str, chat_history_str: str) -> str:
        """
        Processes a user query using the L1 chain with the provided history.
        This method is completely stateless.

        Args:
            query (str): The user's current query.
            user_id (str): The user's unique identifier.
            chat_history_str (str): The pre-formatted string of conversation history.
        """
        chain_input = {
            "question": query,
            "user_id": user_id,
            "chat_history": chat_history_str,
            "language": "en",  # Or other detected language
        }

        response = self.chain.invoke(chain_input)
        return response


# 9. ai/tools.py
"""Tool definitions for agent functionality. which is used in l2"""

from typing import Dict, Any, Union, Optional, Type, Callable, TypeVar
import json
from pydantic import BaseModel, Field
from langchain.tools import Tool

from database.models import get_policy_data, get_user_data
from services.email_service import send_email
from services.ticket_service import create_ticket, search_tickets


class TicketCreateInput(BaseModel):
    user_id: str = Field(description="user_id to create ticket for")
    summary: str = Field(description="Brief summary of the ticket")
    description: str = Field(description="Detailed description of the ticket")


class TicketSearchInput(BaseModel):
    user_id: str = Field(description="user_id to search tickets for")
    query: str = Field(
        description="Search term for tickets (empty string returns all tickets)"
    )


class EmailSendInput(BaseModel):
    user_id: str = Field(description="user_id to send email to")
    subject: str = Field(description="Email subject")
    body: str = Field(description="Email body content")


class UserDataInput(BaseModel):
    user_id: str = Field(description="The user_id to fetch data for")


class PolicyDataInput(BaseModel):
    user_id: str = Field(description="The user_id to fetch policy data for")


# Type variable for generic function typing
T = TypeVar("T", bound=BaseModel)


def create_tool_wrapper(
    func: Callable[[T], str], schema_class: Type[T]
) -> Callable[[Union[str, Dict[str, Any]]], str]:
    """
    Create a wrapper function that handles input parsing, validation,
    and calls the underlying function with the validated Pydantic model.

    Args:
        func: The function to wrap
        schema_class: The Pydantic model class to validate input against

    Returns:
        A wrapped function that handles various input formats
    """

    def wrapped_func(input_data: Union[str, Dict[str, Any]]) -> str:
        try:
            if isinstance(input_data, str):
                try:
                    parsed_input = json.loads(input_data)
                except json.JSONDecodeError:
                    if (
                        len(schema_class.model_fields) == 1
                        and "user_id" in schema_class.model_fields
                    ):
                        parsed_input = {"user_id": input_data}
                    else:
                        return f"Invalid input. Expected JSON with fields: {list(schema_class.model_fields.keys())}"
            else:
                parsed_input = input_data

            # Create and validate the model instance
            validated_input = schema_class(**parsed_input)

            # Call the original function with the validated Pydantic object
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
            name="create_ticket",
            # Pass the Pydantic object `x` directly to create_ticket
            func=create_tool_wrapper(lambda x: create_ticket(x), TicketCreateInput),
            description="Use this ONLY AFTER you have collected a summary and a detailed description from the user. Do not use this tool before asking for details first. This tool creates a support ticket in JIRA.",
        ),
        Tool(
            name="search_ticket",
            # Pass the Pydantic object `x` directly to search_tickets
            func=create_tool_wrapper(lambda x: search_tickets(x), TicketSearchInput),
            description="Search user's tickets (empty query returns all tickets)",
        ),
        Tool(
            name="send_email",
            # Pass the required fields from the Pydantic object `x` to send_email
            func=create_tool_wrapper(
                lambda x: send_email(x.user_id, x.subject, x.body), EmailSendInput
            ),
            description="Send an email to the user's registered email address",
        ),
        Tool(
            name="get_user_data",
            # Pass the user_id attribute from the Pydantic object `x` to get_user_data
            func=create_tool_wrapper(lambda x: get_user_data(x.user_id), UserDataInput),
            description="Fetch user personal information from the database.",
        ),
        Tool(
            name="get_policy_data",
            # Pass the user_id attribute from the Pydantic object `x` to get_policy_data
            func=create_tool_wrapper(
                lambda x: get_policy_data(x.user_id), PolicyDataInput
            ),
            description="Fetch user policy information from the database.",
        ),
    ]


# 10. ai/agent.py
"""Agent configuration for L2 support.
with L2 prompt"""

import os
import config
import traceback
from typing import Dict, Any, List
from database.models import get_user_history
from database.models import update_user_history
from utils.helpers import format_history_for_prompt
from langchain.agents import AgentExecutor, create_react_agent
from langchain import hub
from langchain_google_genai import GoogleGenerativeAI

from ai.tools import create_tools
from database.models import init_db


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


def format_system_message(user_id: str, faq_response: str, history_text: str) -> str:
    """Format the system message for the agent"""
    # Example JSON formats for tool usage
    create_ticket_example = f'{{"user_id": "{user_id}", "summary": "brief summary", "description": "detailed description"}}'
    search_ticket_example = (
        f'{{"user_id": "{user_id}", "query": "search term or empty string for all"}}'
    )
    send_email_example = f'{{"user_id": "{user_id}", "subject": "Email subject", "body": "Email content"}}'

    return f"""
    You are an insurance company virtual assistant helping {user_id}. Your primary goal is to assist with insurance-related inquiries—covering policy details, eligibility, ticket creation, and other support tasks—in a friendly, engaging, and human manner.
    PREVIOUS INTERACTIONS:
    {history_text}
    RELEVANT FAQ INFO:
    {faq_response}
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
            
    **YOUR MOST IMPORTANT RULE: You operate in one of two modes. You MUST decide which mode you are in BEFORE you act.**

     **MODE 1: GATHER, ACKNOWLEDGE, AND PROGRESS (Your Default Mode)**
    - **WHEN TO USE:** You are in this mode until you have gathered enough information from the user to create a useful ticket.
    - **YOUR PRIMARY GOAL:** Your goal is to AVOID repeating the same general question ("provide a summary and description"). Instead, you must build the ticket details piece by piece over the conversation.
    - **YOUR ACTIONS IN THIS MODE:**
        1. **Acknowledge & Confirm:** When the user gives you a piece of information, first acknowledge it. Example: "Okay, property damage from a bulldozer."
        2. **Ask a Specific Follow-up:** Then, ask for the *next* logical piece of information. Do not re-ask the whole general question.
        3. **Propose an Exit:** Once you think you have a workable summary and description, you MUST propose it to the user and ask for permission to proceed. This is how you transition to Mode 2.

    *-- Gathering Mode Example --*
    User: I want to file a complaint about property damage.
    Thought: I am in Mode 1. I have the topic but need a summary.
    Final Answer: I can help with that. Could you give me a brief summary of what happened?

    User: a bulldozer wrecked my home.
    Thought: I am still in Mode 1. I have the summary now. I need to acknowledge it and ask for more details for the description.
    Final Answer: A bulldozer wrecked your home, I see. To create an accurate report, could you describe the extent of the damage and when it happened?

    User: it happened in the evening, the whole front of the house is gone.
    Thought: I now have enough for a ticket. I must exit Mode 1 by proposing a summary and asking for confirmation.
    Final Answer: Okay, let me confirm: You want to file a complaint because a bulldozer destroyed the entire front of your house in the evening. Is this correct, and shall I create a ticket with this information?

    **MODE 2: TOOL EXECUTION (The Final Step)**
    - **WHEN TO USE:** You can ONLY enter this mode AFTER you have gathered all the necessary information (summary AND description) from the user conversation.
    - **YOUR ONLY ACTION:** In this mode, your job is to use the `create_ticket` tool with the information the user provided.

    *-- Execution Mode Example --*
    User: The fire was yesterday in the kitchen, and it damaged the whole room. The claim was denied.
    Thought: The user has provided sufficient details. I can now proceed to create a ticket. I am now in Tool Execution Mode.
    Action: create_ticket
    Action Input: {{"user_id": "{user_id}", "summary": "Claim denied for kitchen fire", "description": "The user's claim for a kitchen fire that occurred yesterday and damaged the entire room was denied."}}

    **CRITICAL REMINDER: If you are asking a question, you are in Mode 1 and your response MUST start with `Final Answer:`. If you are using a tool, you are in Mode 2 and your response MUST start with `Action:`. Do not mix them.**


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
        - For create_ticket: {create_ticket_example}
        - For search_ticket: {search_ticket_example}
        - For send_email: {send_email_example}
    
    CONVERSATION FLOW:
        - If the user wants to search tickets: Use search_ticket with their user_id and an appropriate search term.
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
        - Keep sentences short (max 30 words)
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
    query: str, user_id: str, support_chain, agent_executor
) -> Dict[str, Any]:
    """
    Processes an L2 query using the agent, with centralized history management.
    """
    try:
        # Step 1: Get prerequisite information.
        faq_response = support_chain.get_faq_response(query)

        # Step 2: Load structured history from the database.
        user_history = models.get_user_history(user_id)

        # Step 3: Format history using the central helper function.
        history_text_for_prompt = format_history_for_prompt(user_history)

        # Step 4: Create the system message for the agent.
        system_message = format_system_message(
            user_id, faq_response, history_text_for_prompt
        )

        # Step 5: Invoke the agent.
        response = agent_executor.invoke(
            {"input": f"{system_message}\n\nHuman query: {query}"}
        )
        output = response.get("output", "I'm sorry, I couldn't process that request.")

        if "Final Answer:" in output:
            output = output.split("Final Answer:", 1)[1].strip()

        # Step 6: Update the history list and persist it to the database.
        user_history.append({"input": query, "output": output})
        models.update_user_history(user_id, user_history)

        return {"response": output, "user_id": user_id}

    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error in L2 processing: {error_details}")
        return {"error": str(e), "details": error_details, "user_id": user_id}


# 11. app.py
"""Main Flask application entry point(L1 and L2 intilizatiion)"""

import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from psycopg2.extras import RealDictCursor

import config
from database import models
from database.db_utils import DB_POOL
from database.models import init_db
from ai.unified_chain import UnifiedSupportChain
from ai.agent import create_agent_executor, process_l2_query
from services.audio_service import start_recording, stop_recording
from utils.helpers import format_history_for_prompt

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
    """L1 support endpoint with stateless history management."""
    data = request.get_json()
    query = data.get("query")
    user_id = data.get("user_id")

    if not query or not user_id:
        return jsonify({"error": "Missing 'query' or 'user_id'."}), 400

    try:
        # 1. Load history from the database
        history = models.get_user_history(user_id)

        # 2. Format history using the central helper function
        history_for_prompt = format_history_for_prompt(history)

        # 3. Process the query
        response = support_chain.process_query(
            query=query, user_id=user_id, chat_history_str=history_for_prompt
        )

        # 4. Update the history list
        history.append({"input": query, "output": response})

        # 5. Save the updated history back to the database
        models.update_user_history(user_id, history)

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
    return jsonify({"message": "Logged out"}), 200


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
