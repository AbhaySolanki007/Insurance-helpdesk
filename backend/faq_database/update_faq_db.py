import os
import csv
import chromadb
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
import uuid

# --- CONFIGURATION ---
CSV_FILE_NAME = "FAQ_Article_Optimized.csv"
COLLECTION_NAME = "faq_collection"


def main():
    """
    Main function to update the ChromaDB from the FAQ CSV file.
    """
    print("🚀 Starting ChromaDB update process...")

    # 1. Load Environment Variables
    load_dotenv()
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        print("❌ ERROR: GOOGLE_API_KEY not found in .env file.")
        return

    # 2. Define Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, CSV_FILE_NAME)
    db_path = script_dir

    # 3. Read data using Python's built-in CSV module
    print(f"📑 Reading data from '{CSV_FILE_NAME}' using the standard csv library...")
    questions = []
    answers = []
    try:
        # Initialize embeddings model
        print("🧠 Initializing embeddings model...")
        embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001", google_api_key=google_api_key
        )
        with open(csv_path, mode="r", encoding="utf-8") as infile:
            reader = csv.reader(infile)
            header = next(reader)  # Skip header

            # --- DEFINITIVE FIX: Use CORRECT 0-based index ---
            for row in reader:
                if not row or not row[0]:  # Skip empty rows or rows without a question
                    continue
                # Column 0 is Question, Column 1 is Answer
                question = row[0]
                answer = row[1]
                if question:  # Only add rows that have a question
                    questions.append(question)
                    answers.append(answer if answer else "")
            # --- END FIX ---

    except Exception as e:
        print(f"❌ ERROR: Failed while reading CSV file: {e}")
        import traceback

        traceback.print_exc()
        return

    # 4. Connect to ChromaDB
    print(f"🗄️ Connecting to ChromaDB at: {db_path}")
    client = chromadb.PersistentClient(path=db_path)

    # 5. Delete Old Collection
    try:
        client.delete_collection(name=COLLECTION_NAME)
        print(
            f"🗑️ Deleted existing collection: '{COLLECTION_NAME}' to ensure a fresh start."
        )
    except Exception:
        print(
            f"ℹ️  No existing collection named '{COLLECTION_NAME}' found. Creating a new one."
        )

    # 6. Create New Collection
    print(f"✨ Creating new collection: '{COLLECTION_NAME}'")
    collection = client.get_or_create_collection(name=COLLECTION_NAME)

    print("\n📝 --- Data Preview (First 3 Records) ---")
    for i in range(min(3, len(questions))):
        print(f"  Record {i+1}:")
        print(f"    Question: {questions[i]}")
        print(f"    Answer:   {answers[i]}")
    print("📝 -------------------------------------\n")

    ids = [f"faq_{uuid.uuid5(uuid.NAMESPACE_DNS, q)}" for q in questions]
    metadatas = [{"answer": ans} for ans in answers]

    print(f"Embedding {len(questions)} documents... (This may take a moment)")
    embeddings = embeddings_model.embed_documents(questions)

    collection.add(
        embeddings=embeddings,
        documents=questions,
        metadatas=metadatas,
        ids=ids,
    )

    print("\n✅ SUCCESS: ChromaDB update process complete!")
    print(f"📊 {len(questions)} records processed into collection '{COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
