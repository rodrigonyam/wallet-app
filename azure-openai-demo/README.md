# Azure OpenAI Enterprise Demo

A comprehensive enterprise-grade AI application demonstrating Azure OpenAI integration with advanced features like RAG (Retrieval Augmented Generation), document processing, and secure deployment patterns.

## 🚀 Features

### Core AI Capabilities
- **Chat Interface**: Interactive AI assistant powered by GPT-4
- **Document Q&A (RAG)**: Upload documents and ask questions about their content
- **Text Summarization**: AI-powered document summarization
- **Code Generation**: Generate code from natural language descriptions
- **Sentiment Analysis**: Analyze text sentiment and emotions

### Enterprise Features
- **Azure Integration**: Native Azure OpenAI and Key Vault integration
- **Security**: Managed Identity authentication and Key Vault secrets
- **Scalability**: App Service with auto-scaling capabilities
- **Monitoring**: Application Insights integration
- **IaC**: Infrastructure as Code using Bicep templates

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Flask API      │───▶│  Azure OpenAI   │
│   (HTML/JS)     │    │   (Python)       │    │   Service       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Document       │───▶│   FAISS Vector  │
                       │   Processor      │    │   Database      │
                       └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Azure Key      │
                       │   Vault          │
                       └──────────────────┘
```

## 📋 Prerequisites

### Required Tools
- **Python 3.11+**
- **Azure CLI** (`az`)
- **Git**
- **VS Code** (recommended)

### Azure Requirements
- **Azure Subscription** with appropriate permissions
- **Azure OpenAI Service** quota (GPT-4 and text-embedding-ada-002)
- **Resource Group** creation permissions

## 🛠️ Local Development Setup

### 1. Clone and Setup Environment

```bash
# Clone the repository
git clone <your-repo-url>
cd azure-openai-demo

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Azure OpenAI credentials
# AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
# AZURE_OPENAI_API_KEY=your-api-key-here
# AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

### 3. Run the Application

```bash
# Start the Flask development server
python app.py

# Application will be available at http://localhost:5000
```

## ☁️ Azure Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Make deploy script executable (macOS/Linux)
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

### Option 2: Manual Deployment

```bash
# 1. Login to Azure
az login

# 2. Create resource group
az group create --name "rg-azure-openai-demo" --location "eastus"

# 3. Deploy infrastructure
az deployment group create \
  --resource-group "rg-azure-openai-demo" \
  --template-file "deploy.bicep" \
  --parameters "@deploy.parameters.dev.json"

# 4. Deploy application (get webapp name from previous step)
az webapp deployment source config-zip \
  --resource-group "rg-azure-openai-demo" \
  --name "your-webapp-name" \
  --src "app.zip"
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI service endpoint | Yes | `https://my-openai.openai.azure.com/` |
| `AZURE_OPENAI_API_KEY` | API key for Azure OpenAI | Yes | `abc123...` |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | GPT model deployment name | Yes | `gpt-4o` |
| `AZURE_KEY_VAULT_URL` | Key Vault URL for production | No | `https://my-kv.vault.azure.net/` |
| `FLASK_ENV` | Flask environment | No | `development` |

### Azure OpenAI Models Required

1. **GPT-4o** - For chat, summarization, and code generation
2. **text-embedding-ada-002** - For document embeddings (RAG)

## 📖 API Documentation

### Chat Completion
```http
POST /api/chat
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "stream": false,
  "system_prompt": "You are a helpful assistant"
}
```

### Document Upload
```http
POST /api/upload-document
Content-Type: multipart/form-data

document: [file.pdf or file.txt]
```

### Question Answering
```http
POST /api/ask-question
Content-Type: application/json

{
  "question": "What is the main topic of the document?"
}
```

### Text Summarization
```http
POST /api/summarize
Content-Type: application/json

{
  "text": "Long text to summarize...",
  "max_length": 500
}
```

### Code Generation
```http
POST /api/generate-code
Content-Type: application/json

{
  "description": "Create a function to sort a list",
  "language": "python"
}
```

## 🔒 Security Best Practices

### Production Security Checklist
- ✅ **API Keys**: Store in Azure Key Vault
- ✅ **Authentication**: Use Managed Identity
- ✅ **HTTPS**: Enforce SSL/TLS
- ✅ **CORS**: Configure appropriate origins  
- ✅ **File Upload**: Validate file types and sizes
- ✅ **Rate Limiting**: Implement API throttling
- ✅ **Logging**: Monitor with Application Insights

### Key Vault Integration
```python
# Production configuration automatically uses Key Vault
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

credential = DefaultAzureCredential()
client = SecretClient(vault_url="https://your-kv.vault.azure.net/", credential=credential)
api_key = client.get_secret("openai-api-key").value
```

## 📊 Monitoring and Logging

### Application Insights Integration
- **Request Tracking**: All API calls logged
- **Error Monitoring**: Exceptions captured automatically  
- **Performance Metrics**: Response times and throughput
- **Custom Events**: AI service usage tracking

### Log Analysis Queries
```kusto
// Find errors in the last 24 hours
traces
| where timestamp > ago(24h)
| where severityLevel >= 3
| order by timestamp desc

// Monitor AI API usage
customEvents
| where name == "AIServiceUsage"
| summarize requests = count(), avg_tokens = avg(toint(customDimensions.total_tokens)) by bin(timestamp, 1h)
```

## 🧪 Testing

### Unit Tests
```bash
# Run unit tests
python -m pytest tests/

# Run with coverage
python -m pytest tests/ --cov=. --cov-report=html
```

### Load Testing
```bash
# Install locust
pip install locust

# Run load tests
locust -f tests/load_test.py --host=http://localhost:5000
```

## 🚀 Scaling Considerations

### Performance Optimization
- **Connection Pooling**: Reuse Azure OpenAI connections
- **Caching**: Implement Redis for frequently accessed data
- **CDN**: Use Azure CDN for static assets
- **Database**: Consider Azure Cosmos DB for larger document stores

### Cost Optimization
- **Token Management**: Monitor and optimize token usage
- **Auto-scaling**: Configure based on demand patterns
- **Reserved Capacity**: Use reserved instances for predictable workloads
- **Resource Tagging**: Track costs by environment/project

## 📝 Development Guidelines

### Code Structure
```
azure-openai-demo/
├── app.py                 # Main Flask application
├── config.py             # Configuration management
├── ai_service.py         # AI service layer
├── document_processor.py # RAG implementation
├── templates/            # HTML templates
├── static/              # CSS/JS assets
├── tests/               # Unit and integration tests
├── deploy.bicep         # Infrastructure as Code
└── requirements.txt     # Python dependencies
```

### Contributing
1. **Fork** the repository
2. **Create** a feature branch
3. **Add** tests for new features
4. **Update** documentation
5. **Submit** a pull request

## 📚 Learning Resources

### Azure OpenAI
- [Azure OpenAI Service Documentation](https://docs.microsoft.com/azure/cognitive-services/openai/)
- [Azure OpenAI REST API Reference](https://docs.microsoft.com/azure/cognitive-services/openai/reference)

### RAG Implementation
- [LangChain Documentation](https://python.langchain.com/)
- [FAISS Vector Database](https://faiss.ai/)

### Azure Deployment
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Bicep Language Reference](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)

## 🆘 Troubleshooting

### Common Issues

**Issue**: "Azure OpenAI connection failed"
```bash
# Check endpoint and API key
curl -H "api-key: YOUR_KEY" "https://YOUR_ENDPOINT/openai/deployments/gpt-4o/chat/completions?api-version=2024-05-01-preview"
```

**Issue**: "Document upload fails"
- Check file size (max 16MB)
- Verify file type (.pdf or .txt)
- Ensure uploads directory exists

**Issue**: "Deployment fails"
- Verify Azure OpenAI quota in target region
- Check resource naming conventions
- Ensure proper Azure permissions

## 📞 Support

For issues and questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review [Azure OpenAI documentation](https://docs.microsoft.com/azure/cognitive-services/openai/)
3. Create an issue in the repository

---

## 💡 What You've Learned

This project demonstrates key skills for the Microsoft AI Engineer role:

✅ **Azure OpenAI Integration** - Production-ready API usage  
✅ **RAG Implementation** - Document Q&A with vector search  
✅ **Security Best Practices** - Key Vault and Managed Identity  
✅ **Infrastructure as Code** - Bicep templates for Azure deployment  
✅ **Enterprise Architecture** - Scalable, monitored, secure solutions  
✅ **DevOps Integration** - Automated deployment pipelines  

Perfect for demonstrating your Azure AI capabilities! 🚀