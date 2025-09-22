# 11. ai/rag_orchestrator.py
"""Unified support chain combining FAQ and ticket retrieval.
with RAG implententation
also in future it will be used for RAG the documents and other data"""

import os
import re
import config
import chromadb
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from langchain_google_genai import GoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_chroma import Chroma
from database.postgre import get_policy_data, get_user_data
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class UnifiedSupportChain:
    def __init__(
        self,
        faq_db_path=config.FAQ_DB_PATH,
        faq_collection_name=config.FAQ_COLLECTION_NAME,
    ):
        self.faq_db_path = faq_db_path
        self.faq_collection_name = faq_collection_name

        # Try to initialize Google AI embeddings, fallback to SentenceTransformers if quota exceeded
        self.faq_embeddings = self._initialize_embeddings()

        self.faq_vectorstore = Chroma(
            client=chromadb.PersistentClient(path=faq_db_path),
            collection_name=faq_collection_name,
            embedding_function=self.faq_embeddings,
        )

        # Create FAQ retriever
        self.faq_retriever = self.faq_vectorstore.as_retriever(
            search_type="similarity", search_kwargs={"k": 3}
        )

    def _initialize_embeddings(self):
        """Initialize SentenceTransformers embeddings with custom model path"""
        try:
            logger.info("Initializing SentenceTransformers embeddings...")

            # Define custom model path
            model_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "ai", "Embedding_models"
            )

            # Use a lightweight, fast model with custom cache directory
            model = SentenceTransformer("all-MiniLM-L6-v2", cache_folder=model_path)

            # Create a wrapper class to make it compatible with LangChain
            class SentenceTransformerEmbeddings:
                def __init__(self, model):
                    self.model = model

                def embed_query(self, text):
                    return self.model.encode(text).tolist()

                def embed_documents(self, texts):
                    return [self.model.encode(text).tolist() for text in texts]

            embeddings = SentenceTransformerEmbeddings(model)
            logger.info("✅ SentenceTransformers embeddings initialized successfully")
            logger.info(f"📁 Model cached at: {model_path}")
            return embeddings

        except Exception as e:
            logger.error(
                f"❌ Failed to initialize SentenceTransformers embeddings: {e}"
            )
            raise Exception("Could not initialize SentenceTransformers embedding model")

    def get_faq_response(self, query: str) -> str:
        """Public method to get formatted FAQ answers with error handling"""
        try:
            docs = self.faq_retriever.invoke(query)
            if not docs:
                return "No relevant FAQs found"
            return "\n".join(
                f"Q: {doc.page_content}\nA: {doc.metadata.get('answer', 'No answer available')}"
                for doc in docs
            )
        except Exception as e:
            logger.error(f"Error in FAQ retrieval: {e}")
            if "quota" in str(e).lower() or "429" in str(e):
                return "I'm currently experiencing high demand. Please try again in a few minutes, or contact support directly."
            else:
                return "I'm having trouble accessing the FAQ database right now. Please try again later."
