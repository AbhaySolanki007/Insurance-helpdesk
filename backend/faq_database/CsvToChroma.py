import streamlit as st
import pandas as pd
import chromadb
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os
from dotenv import load_dotenv
import uuid

def process_faq_data(df, collection, embeddings_model):
    """Process FAQ data into ChromaDB with collection name prefixed in each question and ID."""
    # Original questions
    questions = df['Question'].tolist()
    # Prefix each question with the collection name
    docs_with_prefix = [f"{collection.name}: {q}" for q in questions]
    embeddings = embeddings_model.embed_documents(docs_with_prefix)
    
    # Build metadata and IDs
    metadatas = [{"answer": ans} for ans in df['Answer']]
    ids = [f"{collection.name}_{uuid.uuid4()}" for _ in questions]
    
    # Add to collection
    collection.add(
        embeddings=embeddings,
        documents=docs_with_prefix,
        metadatas=metadatas,
        ids=ids
    )


def main():
    st.set_page_config(page_title="Data to ChromaDB", page_icon="📊")
    st.title("Data to ChromaDB Embeddings Processor")

    load_dotenv()
    
    try:
        # Initialize the embeddings model
        embeddings_model = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=os.getenv('GOOGLE_API_KEY')
        )

        # Prepare ChromaDB folder
        db_path = os.path.join(os.getcwd(), "faq_database")
        os.makedirs(db_path, exist_ok=True)
        client = chromadb.PersistentClient(path="D:/cywarden/project2/Insurance-Helpdesk/backend/backend-python/csvtochroma")


        # UI: choose data type
        data_type = st.radio(
            "Select data type to upload",
            ["FAQ Data", "User Information"],
            help="Choose which schema your CSV follows"
        )

        # CSV upload
        uploaded_file = st.file_uploader(
            "Upload your CSV file",
            type=['csv'],
            help="CSV must match the chosen data type"
        )

        if uploaded_file:
            df = pd.read_csv(uploaded_file)
            st.write("Data Preview:")
            st.dataframe(df.head())

            # Validate required columns
            if data_type == "FAQ Data":
                required_columns = ['Question', 'Answer']
                collection_prefix = "faq_"
            else:
                required_columns = [
                    'Ticket_ID', 'Customer_Name', 'Policy_Number',
                    'Issue_Type', 'Status', 'Related_FAQ', 'id'
                ]
                collection_prefix = "user_"

            if not all(col in df.columns for col in required_columns):
                st.error(f"CSV must contain these columns: {', '.join(required_columns)}")
                st.stop()

            # Collection name input
            collection_name = st.text_input(
                "Enter collection name",
                help="This name will be prefixed with faq_ or user_ in the DB"
            )

            # Process button
            if collection_name and st.button("Process and Store in ChromaDB"):
                with st.spinner("Processing…"):
                    try:
                        full_collection_name = f"{collection_prefix}{collection_name}"
                        collection = client.get_or_create_collection(
                            name=full_collection_name,
                            metadata={"hnsw:space": "cosine"}
                        )

                        # Delegate to the right helper
                        if data_type == "FAQ Data":
                            process_faq_data(df, collection, embeddings_model)
                        else:
                            process_user_info(df, collection, embeddings_model)

                        # <-- Explicitly persist to disk here -->
                       # client.persist()
                        

                        st.success("✅ Processing Complete!")
                        st.info(f"""
                        📊 **Processing Details**  
                        • Records Processed: {len(df)}  
                        • DB Folder: `{db_path}`  
                        • Collection: `{full_collection_name}`  
                        • Total Collections: {len(client.list_collections())}
                        """)

                        st.subheader("Existing Collections:")
                        for coll in client.list_collections():
                            st.write(f"- **{coll.name}**: {coll.count()} entries")

                    except Exception as e:
                        st.error(f"Processing Error: {e}")

    except Exception as e:
        st.error(f"Initialization Error: {e}")
        st.info("Make sure your GOOGLE_API_KEY is set in your `.env` file")

if __name__ == "__main__":
    main()
