# Insurance Helpdesk - Backend

## Overview

This is the backend for the Insurance Helpdesk application, a conversational AI system designed to provide multi-level support to users. It features a tiered agent architecture (L1 and L2) that can answer frequently asked questions, retrieve user-specific information, and escalate complex issues by creating support tickets in Jira.

The system is built with Flask and leverages the LangChain framework to create and manage the AI agents. It uses a PostgreSQL database for data persistence and integrates with external services like Jira and Gmail.

## System Architecture

The backend follows a modular architecture orchestrated by the main Flask application. An incoming user query is first handled by a lightweight **L1 Agent**. If the query is complex or requires special permissions (like creating a ticket), it is escalated to a more powerful **L2 Agent**. Both agents leverage a set of tools to perform their tasks.



    subgraph "Backend Application"
        direction TB
        UI -- HTTP API Request --> App[Flask App: app.py]

        App -- Reroutes to --> L1[L1 Agent: Gemini]
        App -- Reroutes to --> L2[L2 Agent: Llama3]

        L1 -- Escalates to --> L2

        subgraph "Agent Tools"
            L1 -- Uses --> ToolFAQ[FAQ Search]
            L1 -- Uses --> ToolUser[User Data Lookup]

            L2 -- Uses --> ToolFAQ
            L2 -- Uses --> ToolUser
            L2 -- Uses --> ToolTicket[Jira Ticket Tool]
            L2 -- Uses --> ToolEmail[Gmail Tool]
        end

        subgraph "Data & Services"
            ToolFAQ -- Accesses --> VDB[(ChromaDB)]
            ToolUser -- Accesses --> DB[(PostgreSQL)]
            ToolTicket -- Accesses --> Jira[Jira API]
            ToolEmail -- Accesses --> Gmail[Gmail API]
        end
    end
```

## Technology Stack

- **Framework:** Flask
- **AI / LLMs:** LangChain, Google Gemini, Groq (Llama3)
- **Vector Database:** ChromaDB for RAG
- **Database:** PostgreSQL
- **Primary Dependencies:**
    - `flask`, `flask_cors`: Web server and request handling.
    - `psycopg2-binary`: PostgreSQL database driver.
    - `langchain`, `langgraph`, `langchain_google_genai`, `langchain_groq`: Core AI agent and LLM orchestration.
    - `chromadb`, `sentence-transformers`: Vector store and embeddings for RAG.
    - `jira`: For creating and managing support tickets.
    - `google-api-python-client`, `google-auth-oauthlib`: For sending emails via Gmail API.
    - `python-dotenv`: For managing environment variables.

## Prerequisites

- Python 3.9+
- PostgreSQL Server
- Access to Google AI, Groq, and Jira APIs.

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Insurance-Helpdesk-Internal/backend
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # On Windows
    # source venv/bin/activate # On macOS/Linux
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up environment variables:**
    Create a file named `.env` in the `backend` directory and add the following variables.

    ```env
    # Flask
    FLASK_SECRET_KEY='your-very-secret-key'

    # Database (PostgreSQL)
    DB_NAME='your_db_name'
    DB_USER='your_db_user'
    DB_PASSWORD='your_db_password'
    DB_HOST='localhost'
    DB_PORT='5432'

    # Google AI
    GOOGLE_API_KEY='your-google-api-key'

    # Groq AI
    GROQ_API_KEY='your-groq-api-key'

    # Jira
    JIRA_SERVER='https://your-domain.atlassian.net'
    JIRA_USERNAME='your-jira-email'
    JIRA_API_TOKEN='your-jira-api-token'
    JIRA_PROJECT_KEY='YOUR_PROJECT_KEY'

    # Gmail API
    SENDER_EMAIL='your-sending-email@gmail.com'
    # Note: SENDER_PASSWORD is not used if using OAuth 2.0 with secret.json

    # ChromaDB (Defaults are usually fine)
    FAQ_DB_PATH='./faq_database/'
    FAQ_COLLECTION_NAME='insurance_faqs'
    ```

5.  **Gmail API Credentials:**
    - Download your OAuth 2.0 credentials from the Google Cloud Console.
    - Rename the file to `secret.json` and place it in the `backend` directory.
    - The first time you run the app and an email is sent, you will be prompted to authorize the application. This will create a `token.pickle` file to store credentials for future sessions.

6.  **Initialize the Database:**
    Ensure your PostgreSQL server is running and the credentials in `.env` are correct. The application uses functions in `database/models.py` to interact with the tables. You will need to create the `users` and `policies` tables manually.

    **`users` table schema:**
    ```sql
    CREATE TABLE users (
        user_id UUID PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        passwords VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        location VARCHAR(255),
        history JSONB
    );
    ```

    **`policies` table schema:**
    ```sql
    CREATE TABLE policies (
        policy_id VARCHAR(255) PRIMARY KEY,
        user_id UUID REFERENCES users(user_id),
        policy_type VARCHAR(255),
        policy_status VARCHAR(100),
        issue_date DATE,
        expiry_date DATE,
        premium_amount NUMERIC,
        coverage_amount NUMERIC,
        markdown_format TEXT
    );
    ```

7.  **Populate the FAQ Vector Store:**
    The project uses a Streamlit application to load FAQ data from a CSV into ChromaDB.
    - Place your FAQ data in a file named `FAQ_Article_Updated.csv` in the `backend/faq_database/` directory.
    - Run the Streamlit app:
    ```bash
    streamlit run ./faq_database/CsvToChroma.py
    ```
    - Use the web interface to upload the CSV and populate the database.

## Running the Application

Once the setup is complete, you can run the Flask development server:

```bash
flask run
```

The backend will be available at `http://127.0.0.1:5000`.

## API Endpoints

- `POST /predict/l1`: Submits a query to the L1 agent.
  - **Body:** `{ "query": "...", "user_id": "...", "language": "en" }`
- `POST /predict/l2`: Submits a query to the L2 agent (for escalated issues).
  - **Body:** `{ "query": "...", "user_id": "...", "language": "en" }`
- `POST /api/login`: Authenticates a user and retrieves a token.
  - **Body:** `{ "email": "...", "password": "..." }`
- `POST /api/logout`: Logs out the user.
- `GET /api/chat/history/<user_id>`: Retrieves the chat history for a user.
- `GET /api/user/policies/<user_id>`: Retrieves the insurance policies for a user.

# Project Structure Overview
"""
insurance_support/
│
├── app.py                  # 1. Main Flask application: Initializes and orchestrates both L1/L2 agents and routes API requests.
├── config.py               # 2. Centralized configuration: Manages all environment variables, API keys, and database settings.
├── requirements.txt        # 3. Project dependencies: Lists all necessary Python packages for the application.
│
├── database/
│   ├── __init__.py
│   ├── models.py           # 4. Data Access Layer: Defines functions for all direct SQL interactions with the database (users, policies, history).
│   └── db_utils.py         # 5. Database Utilities: Manages a high-performance connection pool to efficiently handle database connections.
│
├── services/
│   ├── __init__.py
│   ├── auth_service.py     # 6. Authentication services: (Placeholder) for handling user authentication logic.
│   ├── email_service.py    # 7. Email service: Encapsulates all logic for sending emails via the Gmail API, abstracting it from the agents.
│   ├── policy_service.py   # 8. Policy management: (Placeholder) for business logic related to insurance policies.
│   ├── ticket_service.py   # 9. Ticket management: Provides a simplified interface (facade) for creating and searching JIRA support tickets(in # 9.1 services/jira_service.py).
│   └── audio_service.py    # 10. Audio processing: (Placeholder) for handling audio recording, transcription, and related tasks.
│
├── ai/
│   ├── __init__.py
│   ├── unified_chain.py    # 11. RAG PERFORMING like FAQ Retriever Service: Manages the ChromaDB vector store and provides a method for performing RAG-based FAQ searches.
│   ├── l1_agent.py         # 12. L1 Agent Module: Defines the prompt, tools, and execution logic for the front-line, info-gathering ReAct agent.
│   ├── l2_agent.py         # 13. L2 Agent Module: Defines the prompt, tools, and execution logic for the advanced, escalation-handling ReAct agent.
│   └── tools.py            # 14. Agent Tool Factory: A central module that defines all possible agent tools and provides a function to create customized toolsets for L1 and L2.
│
└── utils/
    ├── __init__.py
    └── helpers.py          # 15. Helper Utilities: Contains shared functions, such as formatting conversation history for agent prompts.
"""