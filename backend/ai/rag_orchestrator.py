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

    def get_faq_response(self, query: str) -> str:
        """Public method to get formatted FAQ answers"""
        docs = self.faq_retriever.invoke(query)
        if not docs:
            return "No relevant FAQs found"
        return "\n".join(
            f"Q: {doc.page_content}\nA: {doc.metadata.get('answer', 'No answer available')}"
            for doc in docs
        )
