"""
AI Service Layer for Azure OpenAI Integration
Handles different types of AI interactions: chat, document Q&A, summarization, etc.
"""

import json
import logging
from typing import List, Dict, Any, Optional, Generator
from datetime import datetime
from config import config


class AIService:
    """Service class for AI operations using Azure OpenAI"""
    
    def __init__(self):
        self.client = config.get_client()
        self.deployment_name = config.deployment_name
        self.logger = logging.getLogger(__name__)
        
        # Conversation history for context
        self.conversation_history: List[Dict[str, str]] = []
        
    def chat_completion(
        self, 
        message: str, 
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        stream: bool = False
    ) -> str | Generator[str, None, None]:
        """
        Generate chat completion with conversation context
        
        Args:
            message: User message
            system_prompt: Optional system prompt to set behavior
            max_tokens: Maximum tokens in response
            temperature: Creativity level (0.0-1.0)
            stream: Whether to stream the response
            
        Returns:
            AI response as string or generator for streaming
        """
        try:
            # Build messages array
            messages = []
            
            # Add system prompt if provided
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            
            # Add conversation history (last 10 exchanges to manage token limits)
            messages.extend(self.conversation_history[-20:])  # 10 exchanges = 20 messages
            
            # Add current user message
            messages.append({"role": "user", "content": message})
            
            # Create completion
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=stream
            )
            
            if stream:
                return self._handle_streaming_response(response, message)
            else:
                ai_response = response.choices[0].message.content
                
                # Update conversation history
                self._update_conversation_history(message, ai_response)
                
                # Log usage for monitoring
                self._log_usage(response.usage)
                
                return ai_response
                
        except Exception as e:
            self.logger.error(f"Chat completion failed: {e}")
            raise
    
    def _handle_streaming_response(self, response, user_message: str) -> Generator[str, None, None]:
        """Handle streaming response from Azure OpenAI"""
        full_response = ""
        
        try:
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield content
            
            # Update conversation history after streaming is complete
            self._update_conversation_history(user_message, full_response)
            
        except Exception as e:
            self.logger.error(f"Streaming response failed: {e}")
            yield f"Error: {str(e)}"
    
    def summarize_document(self, text: str, max_length: int = 500) -> str:
        """
        Summarize a document using AI
        
        Args:
            text: Document text to summarize
            max_length: Maximum length of summary
            
        Returns:
            Document summary
        """
        system_prompt = f"""
        You are an expert document summarizer. Create a concise, informative summary 
        of the provided text in approximately {max_length} words. Focus on key points, 
        main arguments, and important details.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Please summarize this document:\n\n{text}"}
                ],
                max_tokens=max_length * 2,  # Rough estimate: 1 token ≈ 0.75 words
                temperature=0.3  # Lower temperature for more focused summaries
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            self.logger.error(f"Document summarization failed: {e}")
            raise
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment of text
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary with sentiment analysis results
        """
        system_prompt = """
        You are a sentiment analysis expert. Analyze the sentiment of the provided text 
        and return your response as a JSON object with the following structure:
        {
            "sentiment": "positive|negative|neutral",
            "confidence": 0.0-1.0,
            "emotions": ["emotion1", "emotion2"],
            "explanation": "brief explanation"
        }
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analyze sentiment: {text}"}
                ],
                max_tokens=300,
                temperature=0.1  # Very low temperature for consistent JSON output
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse sentiment analysis JSON: {e}")
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "emotions": [],
                "explanation": "Analysis failed"
            }
        except Exception as e:
            self.logger.error(f"Sentiment analysis failed: {e}")
            raise
    
    def generate_code(self, description: str, language: str = "python") -> str:
        """
        Generate code based on description
        
        Args:
            description: Description of what the code should do
            language: Programming language
            
        Returns:
            Generated code
        """
        system_prompt = f"""
        You are an expert {language} developer. Generate clean, well-commented, 
        production-ready code based on the user's description. Include error handling 
        where appropriate and follow best practices.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate {language} code: {description}"}
                ],
                max_tokens=1500,
                temperature=0.2  # Low temperature for more deterministic code
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            self.logger.error(f"Code generation failed: {e}")
            raise
    
    def _update_conversation_history(self, user_message: str, ai_response: str):
        """Update conversation history for context"""
        self.conversation_history.append({"role": "user", "content": user_message})
        self.conversation_history.append({"role": "assistant", "content": ai_response})
        
        # Keep only last 20 messages (10 exchanges) to manage token limits
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]
    
    def _log_usage(self, usage):
        """Log token usage for monitoring and cost tracking"""
        if usage:
            self.logger.info(
                f"Token usage - Prompt: {usage.prompt_tokens}, "
                f"Completion: {usage.completion_tokens}, "
                f"Total: {usage.total_tokens}"
            )
    
    def clear_conversation(self):
        """Clear conversation history"""
        self.conversation_history = []
        self.logger.info("Conversation history cleared")
    
    def get_conversation_summary(self) -> Dict[str, Any]:
        """Get summary of current conversation"""
        return {
            "message_count": len(self.conversation_history),
            "started_at": datetime.now().isoformat(),
            "last_messages": self.conversation_history[-4:] if self.conversation_history else []
        }