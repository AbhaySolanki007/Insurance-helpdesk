# uploads/pdf_processor.py
"""
PDF processing utilities for converting PDFs to ChromaDB vectors.
Handles PDF text extraction, chunking, and vector storage.
"""

import os
import uuid
import hashlib
from typing import List, Dict, Any, Optional
import PyPDF2
import pdfplumber
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import chromadb
from langchain_chroma import Chroma
import config
import logging
from sentence_transformers import SentenceTransformer

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PDFProcessor:
    """Handles PDF processing and vector storage for insurance documents."""

    def __init__(
        self,
        pdf_db_path: str = None,
        collection_name: str = None,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
    ):
        """
        Initialize PDF processor with ChromaDB integration.

        Args:
            pdf_db_path: Path to store PDF vectors (defaults to config.PDF_DB_PATH)
            collection_name: ChromaDB collection name for PDF documents (defaults to config.PDF_COLLECTION_NAME)
            chunk_size: Size of text chunks for processing
            chunk_overlap: Overlap between chunks
        """
        # ========== SUPABASE INTEGRATION START ==========
        # Set up paths using config
        if pdf_db_path is None:
            pdf_db_path = config.PDF_DB_PATH

        if collection_name is None:
            collection_name = config.PDF_COLLECTION_NAME

        self.pdf_db_path = pdf_db_path
        self.collection_name = collection_name
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # Ensure directory exists
        os.makedirs(pdf_db_path, exist_ok=True)

        # Initialize embeddings with fallback mechanism
        self.embeddings = self._initialize_embeddings()

        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(path=pdf_db_path)

        # Initialize or get collection
        try:
            self.collection = self.client.get_collection(name=collection_name)
            print(f"✅ Connected to existing PDF collection: {collection_name}")
        except:
            self.collection = self.client.create_collection(
                name=collection_name,
                metadata={"description": "PDF documents for insurance helpdesk"},
            )
            print(f"✅ Created new PDF collection: {collection_name}")

        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""],
        )

    def _initialize_embeddings(self):
        """Initialize SentenceTransformers embeddings with custom model path"""
        try:
            logger.info(
                "Initializing SentenceTransformers embeddings for PDF processing..."
            )

            # Define custom model path
            model_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "ai", "Embedding_models"
            )

            # Use a lightweight, fast model with custom cache directory
            model = SentenceTransformer("all-MiniLM-L6-v2", cache_folder=model_path)

            # Create a wrapper class to make it compatible with ChromaDB
            class SentenceTransformerEmbeddings:
                def __init__(self, model):
                    self.model = model

                def embed_query(self, text):
                    return self.model.encode(text).tolist()

                def embed_documents(self, texts):
                    return [self.model.encode(text).tolist() for text in texts]

            embeddings = SentenceTransformerEmbeddings(model)
            logger.info(
                "✅ SentenceTransformers embeddings initialized successfully for PDF processing"
            )
            logger.info(f"📁 Model cached at: {model_path}")
            return embeddings

        except Exception as e:
            logger.error(
                f"❌ Failed to initialize SentenceTransformers embeddings for PDF processing: {e}"
            )
            raise Exception(
                "Could not initialize SentenceTransformers embedding model for PDF processing"
            )
        # ========== SUPABASE INTEGRATION END ==========

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text from PDF file using multiple methods for better accuracy.
        Also handles text files for testing purposes.

        Args:
            pdf_path: Path to the PDF file or text file

        Returns:
            Extracted text content
        """
        text = ""

        try:
            # Check if it's a text file (for testing)
            if pdf_path and pdf_path.endswith(".txt"):
                with open(pdf_path, "r", encoding="utf-8") as file:
                    text = file.read()
                return text.strip()

            # Method 1: Try pdfplumber first (better for complex layouts)
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

            # If pdfplumber didn't get much text, try PyPDF2 as backup
            if len(text.strip()) < 100:
                with open(pdf_path, "rb") as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"

            return text.strip()

        except Exception as e:
            print(f"❌ Error extracting text from PDF: {e}")
            return ""

    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into chunks for better vector processing.

        Args:
            text: Text content to chunk

        Returns:
            List of text chunks
        """
        if not text.strip():
            return []

        chunks = self.text_splitter.split_text(text)
        return [chunk.strip() for chunk in chunks if chunk.strip()]

    def generate_document_id(self, filename: str, content: str) -> str:
        """
        Generate a unique document ID based on filename and content.

        Args:
            filename: Original filename
            content: Document content

        Returns:
            Unique document ID
        """
        # Create hash from filename and content for consistency
        content_hash = hashlib.md5(f"{filename}_{content[:1000]}".encode()).hexdigest()
        return f"doc_{content_hash[:12]}"

    def process_pdf(
        self,
        pdf_path: str,
        filename: str,
        user_id: str = None,
        document_type: str = "policy",
        metadata: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Process PDF file and store vectors in ChromaDB.

        Args:
            pdf_path: Path to the PDF file
            filename: Original filename
            user_id: User who uploaded the document
            document_type: Type of document (policy, claim, manual, etc.)
            metadata: Additional metadata

        Returns:
            Processing result with document ID and chunk count
        """
        try:
            print(f"🔄 Processing PDF: {filename}")

            # Extract text from PDF
            text = self.extract_text_from_pdf(pdf_path)
            if not text:
                return {
                    "success": False,
                    "error": "Could not extract text from PDF",
                    "document_id": None,
                }

            print(f"✅ Extracted {len(text)} characters from PDF")

            # Chunk the text
            chunks = self.chunk_text(text)
            if not chunks:
                return {
                    "success": False,
                    "error": "Could not create text chunks",
                    "document_id": None,
                }

            print(f"✅ Created {len(chunks)} text chunks")

            # Generate document ID
            doc_id = self.generate_document_id(filename, text)

            # Prepare metadata
            doc_metadata = {
                "filename": filename,
                "document_type": document_type,
                "user_id": user_id,
                "total_chunks": len(chunks),
                "text_length": len(text),
                "upload_timestamp": str(uuid.uuid4()),  # Simple timestamp
                **(metadata or {}),
            }

            # Prepare data for ChromaDB
            chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
            chunk_metadata = [
                {**doc_metadata, "chunk_index": i, "chunk_id": chunk_ids[i]}
                for i in range(len(chunks))
            ]

            # Store in ChromaDB
            self.collection.add(
                documents=chunks, metadatas=chunk_metadata, ids=chunk_ids
            )

            print(f"✅ Successfully stored {len(chunks)} chunks in ChromaDB")

            return {
                "success": True,
                "document_id": doc_id,
                "chunk_count": len(chunks),
                "text_length": len(text),
                "filename": filename,
                "document_type": document_type,
            }

        except Exception as e:
            print(f"❌ Error processing PDF: {e}")
            return {"success": False, "error": str(e), "document_id": None}

    def search_documents(
        self, query: str, user_id: str = None, document_type: str = None, limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant document chunks based on query.

        Args:
            query: Search query
            user_id: Filter by user (optional)
            document_type: Filter by document type (optional)
            limit: Maximum number of results

        Returns:
            List of relevant document chunks with metadata
        """
        try:
            # Prepare where clause for filtering
            where_clause = {}
            if user_id:
                where_clause["user_id"] = user_id
            if document_type:
                where_clause["document_type"] = document_type

            # Search in ChromaDB
            results = self.collection.query(
                query_texts=[query],
                n_results=limit,
                where=where_clause if where_clause else None,
            )

            # Format results
            formatted_results = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    formatted_results.append(
                        {
                            "content": doc,
                            "metadata": (
                                results["metadatas"][0][i]
                                if results["metadatas"]
                                else {}
                            ),
                            "distance": (
                                results["distances"][0][i]
                                if results["distances"]
                                else 0
                            ),
                        }
                    )

            return formatted_results

        except Exception as e:
            print(f"❌ Error searching documents: {e}")
            return []


# Global instance for easy access
pdf_processor = PDFProcessor()
