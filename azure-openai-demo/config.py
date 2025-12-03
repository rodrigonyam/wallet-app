"""
Azure OpenAI Configuration and Client Management
This module handles Azure OpenAI client setup with proper authentication and error handling.
"""

import os
import logging
from typing import Optional
from dotenv import load_dotenv
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, ChainedTokenCredential, ManagedIdentityCredential
from azure.keyvault.secrets import SecretClient

# Load environment variables
load_dotenv()

class AzureOpenAIConfig:
    """Configuration management for Azure OpenAI services"""
    
    def __init__(self):
        self.endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
        self.api_key = os.getenv('AZURE_OPENAI_API_KEY')
        self.api_version = os.getenv('AZURE_OPENAI_API_VERSION', '2024-05-01-preview')
        self.deployment_name = os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME', 'gpt-4o')
        self.key_vault_url = os.getenv('AZURE_KEY_VAULT_URL')
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def get_api_key_from_keyvault(self) -> Optional[str]:
        """Retrieve API key from Azure Key Vault for production security"""
        try:
            if not self.key_vault_url:
                return None
                
            # Use managed identity or service principal for authentication
            credential = ChainedTokenCredential(
                ManagedIdentityCredential(),
                DefaultAzureCredential()
            )
            
            client = SecretClient(vault_url=self.key_vault_url, credential=credential)
            secret = client.get_secret("openai-api-key")
            return secret.value
            
        except Exception as e:
            self.logger.warning(f"Failed to retrieve from Key Vault: {e}")
            return None
    
    def get_client(self) -> AzureOpenAI:
        """Create and return configured Azure OpenAI client"""
        
        # Try Key Vault first (production), then environment variable
        api_key = self.get_api_key_from_keyvault() or self.api_key
        
        if not api_key or not self.endpoint:
            raise ValueError("Azure OpenAI API key and endpoint must be configured")
        
        try:
            client = AzureOpenAI(
                azure_endpoint=self.endpoint,
                api_key=api_key,
                api_version=self.api_version
            )
            
            # Test the connection
            self._test_connection(client)
            self.logger.info("Azure OpenAI client initialized successfully")
            return client
            
        except Exception as e:
            self.logger.error(f"Failed to initialize Azure OpenAI client: {e}")
            raise
    
    def _test_connection(self, client: AzureOpenAI):
        """Test the connection to Azure OpenAI"""
        try:
            # Simple test call
            response = client.chat.completions.create(
                model=self.deployment_name,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10
            )
            self.logger.info("Connection test successful")
        except Exception as e:
            raise ConnectionError(f"Azure OpenAI connection test failed: {e}")


# Global configuration instance
config = AzureOpenAIConfig()