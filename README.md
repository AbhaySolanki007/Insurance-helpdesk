# Insurance Helpdesk - Internal Platform

This is a full-stack, AI-powered internal helpdesk application designed for insurance companies. It combines a modern React frontend with a powerful Python backend, featuring a multi-level conversational AI to provide comprehensive support.

## System Architecture

The application is composed of two main parts: a **React Frontend** and a **Flask Backend**. The frontend provides the user interface for interacting with the helpdesk, while the backend orchestrates the AI agents, handles business logic, and manages data.

```
+------------------+      +---------------------+      +----------------+
|                  |      |                     |      |                |
|  React Frontend  |----->|    Flask Backend    |----->|   PostgreSQL   |
| (Vite, Tailwind) |      | (Python, LangChain) |      |    Database    |
|                  |      |                     |      |                |
+------------------+      +----------+----------+      +----------------+
                                     |
                                     |
                         +-----------v-----------+
                         |                       |
                         |  Conversational AI    |
                         | (L1/L2 Agents, RAG)   |
                         |                       |
                         +-----------+-----------+
                                     |
           +-------------------------+-------------------------+
           |                         |                         |
+----------v----------+   +----------v----------+   +----------v----------+
|                     |   |                     |   |                     |
|    ChromaDB         |   |     Jira API        |   |     Gmail API       |
| (Vector Store)      |   |   (Ticketing)       |   |   (Notifications)   |
|                     |   |                     |   |                     |
+---------------------+   +---------------------+   +---------------------+

```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **HTTP Client**: Axios

### Backend
- **Framework**: Flask
- **AI / LLMs**: LangChain, Google Gemini, Groq (Llama3)
- **Database**: PostgreSQL
- **Vector Database**: ChromaDB for Retrieval-Augmented Generation (RAG)
- **Primary Dependencies**: `psycopg2`, `jira`, `google-api-python-client`

## Getting Started

### Prerequisites
- Node.js (v16 or higher) & npm/yarn
- Python (3.9 or higher) & pip
- PostgreSQL Server

### Installation & Setup

Follow these steps to set up both the backend and frontend environments.

**1. Clone the repository:**
```bash
git clone <repository-url>
cd Insurance-Helpdesk-Internal
```

---

**2. Backend Setup:**

- **Navigate to the backend directory:**
  ```bash
  cd backend
  ```

- **Create and activate a Python virtual environment:**
  ```bash
  python -m venv venv
  # On Windows
  .\venv\Scripts\activate
  # On macOS/Linux
  source venv/bin/activate
  ```

- **Install backend dependencies:**
  ```bash
  pip install -r requirements.txt
  ```

- **Set up backend environment variables:**
  Create a file named `.env` in the `backend` directory and populate it with your credentials.
  ```env
  # Flask
  FLASK_SECRET_KEY='your-very-secret-key'

  # Database (PostgreSQL)
  DB_NAME='your_db_name'
  DB_USER='your_db_user'
  DB_PASSWORD='your_db_password'
  DB_HOST='localhost'
  DB_PORT='5432'

  # Google AI & Gmail API
  GOOGLE_API_KEY='your-google-api-key'
  SENDER_EMAIL='your-sending-email@gmail.com'

  # Groq AI
  GROQ_API_KEY='your-groq-api-key'

  # Jira
  JIRA_SERVER='https://your-domain.atlassian.net'
  JIRA_USERNAME='your-jira-email'
  JIRA_API_TOKEN='your-jira-api-token'
  JIRA_PROJECT_KEY='YOUR_PROJECT_KEY'
  ```

- **Set up Gmail API Credentials:**
  - Download your OAuth 2.0 credentials from the Google Cloud Console.
  - Rename the file to `secret.json` and place it in the `backend` directory.
  - The first time an email is sent, the application will prompt you to authorize it in your browser. This creates a `token.pickle` file for future sessions.

- **Initialize the Database:**
  - Ensure your PostgreSQL server is running.
  - Manually create the `users` and `policies` tables using the schemas provided in `backend/README.md`.

- **Populate the FAQ Vector Store:**
  - The project uses a Streamlit application to load FAQ data from a CSV into ChromaDB.
  - Run the Streamlit app:
    ```bash
    streamlit run ./faq_database/CsvToChroma.py
    ```
  - Use the web interface to upload your FAQ CSV file and populate the database.

---

**3. Frontend Setup:**

- **Navigate to the frontend directory:**
  ```bash
  # From the project root
  cd frontend
  ```

- **Install frontend dependencies:**
  ```bash
  npm install
  ```

- **Set up frontend environment variables:**
  Create a file named `.env` in the `frontend` directory. Point it to your running backend server, which defaults to port 5000.
  ```env
  VITE_API_URL=http://127.0.0.1:5000
  ```

---

### Running the Application

You will need two separate terminals to run both the backend and frontend servers.

- **Terminal 1: Start the Backend**
  ```bash
  cd backend
  # Make sure your virtual environment is activated
  python app.py
  ```
  The backend will be available at `http://127.0.0.1:5000`.

- **Terminal 2: Start the Frontend**
  ```bash
  cd frontend
  npm run dev
  ```
  The frontend application will be available at `http://localhost:5173`.

## License

This project is proprietary and confidential. Unauthorized copying or distribution is prohibited. 