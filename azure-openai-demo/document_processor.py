"""
Document Processing Service for RAG Implementation
Handles document ingestion, chunking, embedding, and retrieval for Q&A
"""

import os
import logging
from typing import List, Dict, Any, Optional
import PyPDF2
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.schema import Document
from config import config


class DocumentProcessor:
    """Service for processing documents and implementing RAG"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.embeddings = OpenAIEmbeddings(
            azure_endpoint=config.endpoint,
            api_key=config.api_key,
            api_version=config.api_version,
            azure_deployment="text-embedding-ada-002"  # Standard embedding model
        )
        
        # Text splitter for chunking documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        # Vector store for document embeddings
        self.vector_store: Optional[FAISS] = None
        self.documents: List[Document] = []
    
    def process_pdf(self, file_path: str) -> List[str]:
        """
        Extract text from PDF file
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            List of text chunks from the PDF
        """
        try:
            chunks = []
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                full_text = ""
                for page_num, page in enumerate(pdf_reader.pages):
                    text = page.extract_text()
                    full_text += f"\\n--- Page {page_num + 1} ---\\n{text}"
                
                # Split into chunks
                text_chunks = self.text_splitter.split_text(full_text)
                chunks.extend(text_chunks)
            
            self.logger.info(f"Processed PDF: {len(chunks)} chunks extracted")
            return chunks
            
        except Exception as e:
            self.logger.error(f"PDF processing failed: {e}")
            raise
    
    def process_text_file(self, file_path: str) -> List[str]:
        """
        Process plain text file
        
        Args:
            file_path: Path to text file
            
        Returns:
            List of text chunks
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            chunks = self.text_splitter.split_text(text)
            self.logger.info(f"Processed text file: {len(chunks)} chunks extracted")
            return chunks
            
        except Exception as e:
            self.logger.error(f"Text file processing failed: {e}")
            raise
    
    def add_document(self, file_path: str, metadata: Optional[Dict] = None) -> bool:
        """
        Add document to the knowledge base
        
        Args:
            file_path: Path to document file
            metadata: Optional metadata for the document
            
        Returns:
            Success status
        """
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.pdf':
                chunks = self.process_pdf(file_path)
            elif file_extension == '.txt':
                chunks = self.process_text_file(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
            
            # Create Document objects with metadata
            doc_metadata = metadata or {}
            doc_metadata.update({
                'source': file_path,
                'file_name': os.path.basename(file_path)
            })
            
            documents = [
                Document(page_content=chunk, metadata={**doc_metadata, 'chunk_id': i})
                for i, chunk in enumerate(chunks)
            ]
            
            self.documents.extend(documents)
            
            # Update or create vector store
            self._update_vector_store(documents)
            
            self.logger.info(f"Document added successfully: {len(chunks)} chunks")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to add document: {e}")
            return False
    
    def _update_vector_store(self, new_documents: List[Document]):
        """Update the vector store with new documents"""
        try:
            if self.vector_store is None:
                # Create new vector store
                self.vector_store = FAISS.from_documents(new_documents, self.embeddings)
            else:
                # Add to existing vector store
                new_vector_store = FAISS.from_documents(new_documents, self.embeddings)
                self.vector_store.merge_from(new_vector_store)
            
            self.logger.info("Vector store updated successfully")
            
        except Exception as e:
            self.logger.error(f"Vector store update failed: {e}")
            raise
    
    def search_documents(self, query: str, k: int = 3) -> List[Dict[str, Any]]:
        """
        Search for relevant documents based on query
        
        Args:
            query: Search query
            k: Number of results to return
            
        Returns:
            List of relevant document chunks with metadata
        """
        try:
            if not self.vector_store:
                return []
            
            # Perform similarity search
            results = self.vector_store.similarity_search_with_score(query, k=k)
            
            formatted_results = []
            for doc, score in results:
                formatted_results.append({
                    'content': doc.page_content,
                    'metadata': doc.metadata,
                    'similarity_score': float(score)
                })
            
            self.logger.info(f"Document search completed: {len(formatted_results)} results")
            return formatted_results
            
        except Exception as e:
            self.logger.error(f"Document search failed: {e}")
            return []
    
    def answer_question(self, question: str, context_limit: int = 3) -> Dict[str, Any]:
        """
        Answer a question using RAG (Retrieval Augmented Generation)
        
        Args:
            question: Question to answer
            context_limit: Number of document chunks to use as context
            
        Returns:
            Dictionary with answer and source information
        """
        try:
            # Search for relevant documents
            relevant_docs = self.search_documents(question, k=context_limit)
            
            if not relevant_docs:
                return {
                    'answer': "I don't have enough information to answer that question.",
                    'sources': [],
                    'confidence': 0.0
                }
            
            # Build context from relevant documents
            context = "\\n\\n".join([
                f"Source: {doc['metadata'].get('file_name', 'Unknown')}\\n{doc['content']}"
                for doc in relevant_docs
            ])
            
            # Generate answer using Azure OpenAI
            from ai_service import AIService
            ai_service = AIService()
            
            system_prompt = f"""
            You are a helpful assistant that answers questions based on the provided context. 
            Use only the information from the context to answer questions. If the context 
            doesn't contain enough information, say so clearly.
            
            Context:
            {context}
            """
            
            answer = ai_service.chat_completion(
                message=question,
                system_prompt=system_prompt,
                temperature=0.1  # Low temperature for factual answers
            )
            
            # Extract source information
            sources = [
                {
                    'file_name': doc['metadata'].get('file_name', 'Unknown'),
                    'similarity_score': doc['similarity_score']
                }
                for doc in relevant_docs
            ]
            
            return {
                'answer': answer,
                'sources': sources,
                'confidence': min([doc['similarity_score'] for doc in relevant_docs])
            }
            
        except Exception as e:
            self.logger.error(f"Question answering failed: {e}")
            return {
                'answer': f"Error processing question: {str(e)}",
                'sources': [],
                'confidence': 0.0
            }
    
    def get_document_stats(self) -> Dict[str, Any]:
        """Get statistics about processed documents"""
        return {
            'total_documents': len(set([doc.metadata.get('file_name', 'Unknown') for doc in self.documents])),
            'total_chunks': len(self.documents),
            'has_vector_store': self.vector_store is not None,
            'document_list': list(set([doc.metadata.get('file_name', 'Unknown') for doc in self.documents]))
        }
    
    def save_vector_store(self, path: str):
        """Save vector store to disk"""
        if self.vector_store:
            self.vector_store.save_local(path)
            self.logger.info(f"Vector store saved to {path}")
    
    def load_vector_store(self, path: str):
        """Load vector store from disk"""
        try:
            self.vector_store = FAISS.load_local(path, self.embeddings)
            self.logger.info(f"Vector store loaded from {path}")
        except Exception as e:
            self.logger.error(f"Failed to load vector store: {e}")
            raise