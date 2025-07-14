import os
import sys
import chromadb

# Add the parent directory to the path to allow imports from 'backend'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from config import FAQ_DB_PATH, FAQ_COLLECTION_NAME, GOOGLE_API_KEY


# --- Test Questions ---
# Add any questions you want to test against the database here.
TEST_QUERIES = [
    "Does my policy cover damages from magnetic levitation vehicles?",
    "Are damages from artificial aurora displays covered?",
    "What coverage exists for damages from space-based solar power?",
]


def inspect_chroma_collection():
    """
    Connects to the ChromaDB using the application's configuration
    and performs a similarity search for a list of test queries.
    """
    print("--- ChromaDB Inspection Tool ---")
    print(f"Connecting to database path: {FAQ_DB_PATH}")
    print(f"Using collection: {FAQ_COLLECTION_NAME}\n")

    if not os.path.exists(FAQ_DB_PATH):
        print("❌ ERROR: The database path specified in config.py does not exist.")
        return
    if not GOOGLE_API_KEY:
        print("❌ ERROR: GOOGLE_API_KEY not found. Please check your .env file.")
        return

    try:
        # 1. Initialize the same embedding model the application uses
        embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001", google_api_key=GOOGLE_API_KEY
        )

        # 2. Create a LangChain vector store, which is how the app talks to the DB
        vector_store = Chroma(
            client=chromadb.PersistentClient(path=FAQ_DB_PATH),
            collection_name=FAQ_COLLECTION_NAME,
            embedding_function=embeddings_model,
        )

        print(f"✅ Successfully connected to the vector store.")
        print("-" * 40)

        # 3. For each test query, perform a similarity search
        for i, query in enumerate(TEST_QUERIES):
            print(f"\n🔍 TEST #{i+1}: Searching for answers to...")
            print(f"   '{query}'\n")

            # This is the same method the agent's retriever uses
            results = vector_store.similarity_search(query, k=1)

            if not results:
                print("   ❌ No relevant documents found.\n")
            else:
                # Print the top result
                top_doc = results[0]
                print("   🏆 Top Result Found:")
                print(f"   - DOCUMENT (Question): {top_doc.page_content}")
                print(
                    f"   - METADATA (Answer):   {top_doc.metadata.get('answer', 'N/A')}"
                )

            print("-" * 40)

    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    inspect_chroma_collection()
