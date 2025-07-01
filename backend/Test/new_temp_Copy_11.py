# ---------------------------
# Standard Libraries
# ---------------------------
import os
import re
import sqlite3
import json
import base64
import pickle
from uuid import uuid4
from datetime import datetime
from typing import Union, Dict, Any, Optional
from email.message import EmailMessage
import threading,speech_recognition as sr,pyaudio

# ---------------------------
# Third-Party Libraries
# ---------------------------
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request # type: ignore

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import chromadb

# ---------------------------
# LangChain and Related Libraries
# ---------------------------
from langchain import hub
from langchain.agents import AgentExecutor, create_react_agent
from langchain_google_genai import GoogleGenerativeAI
from langchain.tools import tool, Tool
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain.memory import ConversationBufferMemory
from langchain_community.vectorstores import Chroma
from langchain_core.messages import HumanMessage, AIMessage
from langchain_chroma import Chroma

# ---------------------------
# Pydantic for Data Validation
# ---------------------------
from pydantic import BaseModel, Field

# ---------------------------
# Load Environment Variables
# ---------------------------
load_dotenv()

# ---------------------------
# Example: Gmail API Helper Functions
# ---------------------------


recognizer = sr.Recognizer()

# Audio configuration
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000  # Sample rate (Hz)
CHUNK = 1024  # Buffer size

# Global variables
audio_buffer = []
stop_event = threading.Event()
audio = pyaudio.PyAudio()

def record_audio():
    """Record audio in a loop until `stop_event` is set."""
    stream = audio.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK
    )
    while not stop_event.is_set():
        data = stream.read(CHUNK)
        audio_buffer.append(data)
    stream.stop_stream()
    stream.close()

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

app = Flask(__name__)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "llama3-8b-8192")
EMAIL = os.getenv("SENDER_EMAIL")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PASSWORD = os.getenv("SENDER_PASSWORD")
app.secret_key = os.getenv("FLASK_SECRET_KEY", "default_secret_key")
CORS(app,origins="*")

class UnifiedSupportChain:
    def __init__(self, 
                #  faq_db_path=r"C:\Users\harpr\Downloads\Cywarden_agents\Unified Bot\Unified Bot\faq_database",
                 faq_db_path=r"D:\cywarden\project2\Insurance-Helpdesk\backend\backend-python\Unified Bot\Unified Bot\faq_database",
                 ticket_db_path=r"D:\cywarden\project2\Insurance-Helpdesk\backend\backend-python\Unified Bot\Unified Bot\ticket_database",
                 faq_collection_name="FAQ_Article_Updated",
                 ticket_collection_name="Support_Ticket"):
        """
        Initialize Unified Support System with both FAQ and Ticket capabilities.
        """
        # Initialize Google AI embeddings for FAQ
        self.faq_embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=os.getenv('GOOGLE_API_KEY')
        )
        
        # Initialize sentence transformer for ticket queries
        self.ticket_model = SentenceTransformer('all-mpnet-base-v2')
        
        self.faq_vectorstore = Chroma(
            client=chromadb.PersistentClient(path=faq_db_path),
            collection_name=faq_collection_name,
            embedding_function=self.faq_embeddings
        )
        
        # Create FAQ retriever
        self.faq_retriever = self.faq_vectorstore.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 3}
        )
        
        # Initialize ticket database client
        self.ticket_client = chromadb.PersistentClient(path=ticket_db_path)
        try:
            self.ticket_collection = self.ticket_client.get_collection(ticket_collection_name)
        except Exception as e:
            print(f"Warning: Ticket collection not found. Ticket lookup will be unavailable. Error: {str(e)}")
            self.ticket_collection = None
        
        # Initialize LLM
        self.llm = GoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=os.getenv('GOOGLE_API_KEY'),
            temperature=0.6,
            max_tokens=200
        )
        
        # Remove global memory and use per-user memory instead.
        self.user_memories = {}  # This will map username to ConversationBufferMemory
        
        # Create the unified chain
        self.chain = self._create_chain()
    
    def _extract_identifiers(self, query):
        """
        Extract ticket ID and policy number from the query.
        """
        ticket_pattern = r'TKT-\d{8}|TKT\d{8}'
        policy_pattern = r'POL-\d{8}|POL\d{8}'
        
        ticket_matches = re.findall(ticket_pattern, query, re.IGNORECASE)
        policy_matches = re.findall(policy_pattern, query, re.IGNORECASE)
        
        ticket_id = None
        if ticket_matches:
            ticket_id = ticket_matches[0].replace('TKT', 'TKT-') if 'TKT-' not in ticket_matches[0] else ticket_matches[0]
        
        policy_number = None
        if policy_matches:
            policy_number = policy_matches[0].replace('POL', 'POL-') if 'POL-' not in policy_matches[0] else policy_matches[0]
        
        return ticket_id, policy_number
    
    def query_faqs(self, query_text):
        """
        Query the FAQ collection.
        """
        docs = self.faq_retriever.get_relevant_documents(query_text)
        formatted_results = []
        for doc in docs:
            formatted_results.append({
                'question': doc.page_content,
                'answer': doc.metadata.get('answer', 'No answer available')
            })
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
                where["Ticket_ID"] = {"$in": [ticket_id, ticket_id.replace('-', '')]}
            if policy_number:
                where["Policy_Number"] = {"$in": [policy_number, policy_number.replace('-', '')]}
            
            results = self.ticket_collection.query(
                query_embeddings=[self.ticket_model.encode(query_text).tolist()],
                n_results=1,
                where=where
            )
        else:
            results = self.ticket_collection.query(
                query_embeddings=[self.ticket_model.encode(query_text).tolist()],
                n_results=n_results
            )
        
        formatted_results = []
        if results['documents'] and results['documents'][0]:
            for doc, metadata in zip(results['documents'][0], results['metadatas'][0]):
                formatted_results.append({
                    'document': doc,
                    'metadata': metadata
                })
        
        return formatted_results
    
    def _create_chain(self):
        """
        Build the unified LangChain for both FAQ and ticket support.
        """
        prompt = ChatPromptTemplate.from_template("""
            
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
        
        """)
        
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
                metadata = doc['metadata']
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
                print(self.user_memories[username].buffer)
                return self.user_memories[username].buffer
            return ""
        
        chain = (
            {
                "faq_context": lambda x: format_faq_docs(self.query_faqs(x["question"])),
                "ticket_context": lambda x: format_ticket_docs(self.query_tickets(x["question"])),
                "question": RunnablePassthrough(),
                "chat_history": get_chat_history
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
                memory_key="chat_history",
                return_messages=True
            )
        conv_mem = self.user_memories[username]
        
        # Build the chain input with the query and username.
        chain_input = {"question": query, "username": username}
        response = self.chain.invoke(chain_input)
        
        # Update the per-user conversation memory using the chat memory's built-in methods.
        conv_mem.chat_memory.add_user_message(query)
        conv_mem.chat_memory.add_ai_message(response)
        return response

def get_credentials():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('secret.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)
    return creds

# Database initialization 
def init_db():
    conn = sqlite3.connect('insurance.db')
    c = conn.cursor()
    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            email TEXT,
            history TEXT DEFAULT '[]'
        )
    ''')
    # Policies table
    c.execute('''
        CREATE TABLE IF NOT EXISTS policies (
            username TEXT PRIMARY KEY,
            current_coverage INTEGER,
            premium REAL,
            FOREIGN KEY (username) REFERENCES users(username)
        )
    ''')
    # Tickets table
    c.execute('''
        CREATE TABLE IF NOT EXISTS tickets (
            id TEXT PRIMARY KEY,
            username TEXT,
            summary TEXT,
            description TEXT,
            action_taken TEXT,
            created_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

# Tool input schema definitions
class EligibilityCheckInput(BaseModel):
    username: str = Field(description="Username to check eligibility for")

class PolicyUpdateInput(BaseModel):
    username: str = Field(description="Username to update policy for")

class TicketCreateInput(BaseModel):
    username: str = Field(description="Username to update policy for")
    summary: str = Field(description="Brief summary of the ticket")
    description: str = Field(description="Detailed description of the ticket")

class TicketSearchInput(BaseModel):
    username: str = Field(description="Username to search tickets for")
    query: str = Field(description="Search term for tickets (empty string returns all tickets)")

class EmailSendInput(BaseModel):
    username: str = Field(description="Username to send email to")
    subject: str = Field(description="Email subject")
    body: str = Field(description="Email body content") 

# Safe parsing function for tool inputs
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

# Tool functions
def check_eligibility_func(input_data: EligibilityCheckInput) -> str:
    """Check coverage increase eligibility"""
    username = input_data.username
    conn = sqlite3.connect('insurance.db')
    c = conn.cursor()
    c.execute("SELECT current_coverage FROM policies WHERE username=?", (username,))
    result = c.fetchone()
    conn.close()
    
    if not result:
        return "User has no policy"
    
    current_coverage = result[0]
    if current_coverage < 50000:
        new_premium = 120.0  # Dummy calculation
        return f"ELIGIBLE: Can increase to $50,000. New premium: ${new_premium:.2f}. Proceed?"
    else:
        return "NOT_ELIGIBLE: Already at maximum coverage."

def update_policy_func(input_data: PolicyUpdateInput) -> str:
    """Update user's policy to maximum coverage"""
    username = input_data.username
    new_coverage = 50000
    new_premium = 120.0
    
    conn = sqlite3.connect('insurance.db')
    c = conn.cursor()
    c.execute('''
        UPDATE policies 
        SET current_coverage = ?, premium = ?
        WHERE username = ?
    ''', (new_coverage, new_premium, username))
    conn.commit()
    conn.close()
    
    try:
        email_input = EmailSendInput(
            username=username,
            subject="Policy Update Confirmation",
            body=f"Your coverage has been increased to ${new_coverage}. New monthly premium: ${new_premium:.2f}."
        )
        send_email_func(email_input)
    except Exception as e:
        pass  # Continue even if email fails
    
    return f"Policy updated successfully. New coverage: ${new_coverage}, Premium: ${new_premium:.2f}. Confirmation email has been sent."

def create_ticket_func(input_data: TicketCreateInput) -> str:
    """Create ticket associated with username"""
    username = input_data.username
    summary = input_data.summary
    description = input_data.description
    
    ticket_id = f"TICKET-{str(uuid4())[:8]}"
    conn = sqlite3.connect('insurance.db')
    c = conn.cursor()
    c.execute('''
        INSERT INTO tickets (id, username, summary, description, created_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (ticket_id, username, summary, description, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    
    return f"Ticket {ticket_id} created for: \"{summary}\". Would you like me to send confirmation to your registered email? (Yes/No)"

def search_ticket_func(input_data: TicketSearchInput) -> str:
    """Search user's tickets"""
    username = input_data.username
    query = input_data.query
    
    conn = sqlite3.connect('insurance.db')
    c = conn.cursor()
    search_term = f"%{query.lower()}%"
    c.execute('''
        SELECT * FROM tickets 
        WHERE username = ? AND 
        (lower(id) LIKE ? OR lower(summary) LIKE ? OR lower(description) LIKE ?)
        ORDER BY created_at DESC
    ''', (username, search_term, search_term, search_term))
    
    results = []
    for row in c.fetchall():
        status = row[4] if row[4] is not None else "In Progress"
        results.append(
            f"ID: {row[0]}\n"
            f"Summary: {row[2]}\n"
            f"Description: {row[3]}\n"
            f"Status: {status}\n"
            f"Created: {row[5]}"
        )
    conn.close()
    
    if not results:
        return "No tickets found for this user."
    return "\n\n".join(results)

def send_email_func(input_data: Union[Dict[str, Any], EmailSendInput]) -> str:
    """
    Send email using stored address. Expects input_data to contain username, subject, and body.
    """
    if isinstance(input_data, dict):
        try:
            input_data = EmailSendInput(**input_data)
        except Exception as e:
            return f"Invalid email input format: {str(e)}"
    
    username = input_data.username
    subject = input_data.subject
    body = input_data.body
    
    conn = sqlite3.connect('insurance.db')
    c = conn.cursor()
    c.execute("SELECT email FROM users WHERE username=?", (username,))
    result = c.fetchone()
    conn.close()
    
    if not result:
        return "User not found."
    
    recipient_email = result[0]
    if not recipient_email:
        return "No email address stored for this user."
    
    try:
        creds = get_credentials()
        service = build('gmail', 'v1', credentials=creds)
        
        message = EmailMessage()
        message.set_content(body)
        message['To'] = recipient_email
        message['Subject'] = subject
        message['From'] = EMAIL
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        message_body = {'raw': raw_message}
        
        sent_message = service.users().messages().send(userId="me", body=message_body).execute()
        return f"Confirmation sent to {recipient_email}: {subject}\nMessage Id: {sent_message['id']}"
    
    except HttpError as error:
        return f"Failed to send email: {error}"

# Custom tool wrapper that handles input parsing
def tool_wrapper(func, schema_class):
    def wrapped_func(input_data):
        try:
            if isinstance(input_data, str):
                try:
                    parsed_input = json.loads(input_data)
                except json.JSONDecodeError:
                    if schema_class in [EligibilityCheckInput, PolicyUpdateInput]:
                        parsed_input = {"username": input_data}
                    else:
                        raise ValueError(f"Invalid input format for {schema_class.__name__}")
            else:
                parsed_input = input_data
                
            validated_input = schema_class(**parsed_input)
            return func(validated_input)
        except Exception as e:
            return f"Error: {str(e)}. Expected format: {schema_class.__name__} with fields {list(schema_class.model_fields.keys())}"
    return wrapped_func

support_chain = UnifiedSupportChain()
# Create structured tools with explicit schemas and input handling
tools = [
    Tool(
        name="faq_search",
        func=support_chain.get_faq_response,  # Use the existing method
        description="Search insurance FAQs. Input: question string. Output: formatted FAQs."
    ),
    Tool(
        name="check_eligibility",
        func=tool_wrapper(check_eligibility_func, EligibilityCheckInput),
        description="Check if a user is eligible for coverage increase"
    ),
    Tool(
        name="update_policy",
        func=tool_wrapper(update_policy_func, PolicyUpdateInput),
        description="Update user's policy to maximum coverage"
    ),
    Tool(
        name="create_ticket",
        func=tool_wrapper(create_ticket_func, TicketCreateInput),
        description="Create a support ticket for the user"
    ),
    Tool(
        name="search_ticket",
        func=tool_wrapper(search_ticket_func, TicketSearchInput),
        description="Search user's tickets (empty query returns all tickets)"
    ),
    Tool(
        name="send_email",
        func=tool_wrapper(send_email_func, EmailSendInput),
        description="Send an email to the user's registered email address"
    )
]



@app.route('/predict/l1', methods=['POST'])
def predict_l1():
    data = request.get_json()
    query = data.get('query')
    username = data.get('username')
    
    if not query:
        return jsonify({"error": "No query provided."}), 400
    if not username:
        return jsonify({"error": "No username provided."}), 400
    
    try:
        response = support_chain.process_query(query, username)
        return jsonify({"response": response, "username": username})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'email' not in data:
            return jsonify({"error": "Username and email are required"}), 400

        username = data['username'].strip()
        email = data['email'].strip()

        if not username or not email:
            return jsonify({"error": "Username and email cannot be empty"}), 400

        conn = sqlite3.connect('insurance.db')
        c = conn.cursor()

        # Insert or update user
        c.execute('''
            INSERT INTO users (username, email)
            VALUES (?, ?)
            ON CONFLICT(username) DO UPDATE SET email=excluded.email
        ''', (username, email))

        # Ensure user has a default policy
        c.execute('''
            INSERT INTO policies (username, current_coverage, premium)
            VALUES (?, ?, ?)
            ON CONFLICT(username) DO NOTHING
        ''', (username, 10000, 50.00))

        conn.commit()
        conn.close()

        return jsonify({"status": "User registered/updated with default policy"}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Agent configuration 
@app.route('/predict/l2', methods=['POST'])
def chat():
    data = request.get_json()
    username = data.get('username')
    query = data.get('query')
    # Get FAQ responses using existing UnifiedSupportChain
    faq_response = support_chain.get_faq_response(query)
    
    def get_history(username):
        conn = sqlite3.connect('insurance.db')
        c = conn.cursor()
        c.execute("SELECT history FROM users WHERE username=?", (username,))
        result = c.fetchone()
        conn.close()
        return eval(result[0]) if result and result[0] else []

    user_history = get_history(username)
    history_text = ""
    if user_history:
        history_entries = []
        for h in user_history[-5:]:
            parts = h.split('||', 1)
            if len(parts) == 2:
                history_entries.append(f"User: {parts[0]}\nAssistant: {parts[1]}")
        history_text = "\n".join(history_entries)
    
    # Example JSON formats for tool usage
    check_eligibility_example = f'{{"username": "{username}"}}'
    update_policy_example = f'{{"username": "{username}"}}'
    create_ticket_example = f'{{"username": "{username}", "summary": "brief summary", "description": "detailed description"}}'
    search_ticket_example = f'{{"username": "{username}", "query": "search term or empty string for all"}}'
    send_email_example = f'{{"username": "{username}", "subject": "Email subject", "body": "Email content"}}'

    agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True 
    )

    
    # Modified system instructions for a natural and engaging support experience:
    # Example JSON formats for tool usage
    check_eligibility_example = f'{{"username": "{username}"}}'
    update_policy_example = f'{{"username": "{username}"}}'
    create_ticket_example = f'{{"username": "{username}", "summary": "brief summary", "description": "detailed description"}}'
    search_ticket_example = f'{{"username": "{username}", "query": "search term or empty string for all"}}'
    send_email_example = f'{{"username": "{username}", "subject": "Email subject", "body": "Email content"}}'
    
    # Modified system instructions for a natural and engaging support experience:
    system_message = f"""
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
                Final Answer: Hello! How can I assist you today? """
    
    try:
        response = agent_executor.invoke({
            "input": f"{system_message}\n\nCurrent user query: {query}"
        })
        
        output = response.get('output', "I'm sorry, I couldn't process that request.")
        # Remove any internal thinking that might be leaking through
        if "Final Answer:" in output:
            output = output.split("Final Answer:", 1)[1].strip()
        # Update conversation history
        new_entry = f"{query}||{output}"
        updated_history = user_history + [new_entry]
        
        conn = sqlite3.connect('insurance.db')
        c = conn.cursor()
        c.execute('''
            UPDATE users SET history = ? WHERE username = ?
        ''', (str(updated_history), username))
        conn.commit()
        conn.close()
        
        return jsonify({
            "response": output,
            "username": username
        })
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error in chat endpoint: {error_details}")
        return jsonify({
            "error": str(e),
            "details": error_details,
            "username": username
        }), 500

@app.route("/start", methods=["POST"])
def start_recording():
    """Start recording audio."""
    stop_event.clear()
    audio_buffer.clear()
    threading.Thread(target=record_audio, daemon=True).start()
    return jsonify({"status": "Recording started"}), 200

@app.route("/stop", methods=["POST"])
def stop_recording():
    """Stop recording and return recognized text."""
    stop_event.set()
    
    # Wait briefly for the recording thread to finish
    threading.Event().wait(0.5)
    
    if not audio_buffer:
        return jsonify({"error": "No audio recorded"}), 400
    
    # Convert raw audio data to AudioData format
    audio_data = sr.AudioData(
        b"".join(audio_buffer),
        RATE,
        2  # Sample width (2 bytes = 16-bit)
    )
    
    try:
        text = recognizer.recognize_google(audio_data)
        return jsonify({"text": text}), 200
    except sr.UnknownValueError:
        return jsonify({"error": "Could not understand audio"}), 400
    except sr.RequestError as e:
        return jsonify({"error": f"API request failed: {e}"}), 500


if __name__ == "__main__":
    init_db()
    # Initialize LangChain components
    llm = GoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.6,  # Increased from default 0.0
        top_p=0.9,        # Controls diversity of responses
        max_tokens=200,   # Limit response length
        top_k=40          # Consider more possible tokens
    )
    prompt = hub.pull("hwchase17/react")
    agent = create_react_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    app.run(debug=True,host="0.0.0.0",port=8001)