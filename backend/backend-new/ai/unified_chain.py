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
from database.models import get_policy_data, get_user_data


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
                "user_data": lambda x: get_user_data(x["user_id"]),
                "policy_data": lambda x: get_policy_data(x["user_id"]),
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
