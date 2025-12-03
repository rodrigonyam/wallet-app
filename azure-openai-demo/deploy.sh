#!/bin/bash

# Azure OpenAI Demo Deployment Script
# This script demonstrates deployment best practices for Azure

set -e  # Exit on any error

# Configuration
RESOURCE_GROUP_NAME="rg-azure-openai-demo"
LOCATION="eastus"
DEPLOYMENT_NAME="azure-openai-demo-$(date +%Y%m%d-%H%M%S)"
SUBSCRIPTION_ID=""  # Set your subscription ID here

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if user is logged in
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    # Set subscription if provided
    if [ ! -z "$SUBSCRIPTION_ID" ]; then
        log_info "Setting subscription to $SUBSCRIPTION_ID"
        az account set --subscription "$SUBSCRIPTION_ID"
    fi
    
    log_info "Prerequisites check completed ✓"
}

# Create resource group
create_resource_group() {
    log_info "Creating resource group: $RESOURCE_GROUP_NAME"
    
    az group create \
        --name "$RESOURCE_GROUP_NAME" \
        --location "$LOCATION" \
        --tags Environment=dev Project=azure-openai-demo
        
    log_info "Resource group created ✓"
}

# Deploy infrastructure
deploy_infrastructure() {
    log_info "Deploying infrastructure with Bicep..."
    
    az deployment group create \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$DEPLOYMENT_NAME" \
        --template-file "deploy.bicep" \
        --parameters "@deploy.parameters.dev.json" \
        --verbose
        
    log_info "Infrastructure deployment completed ✓"
}

# Get deployment outputs
get_deployment_outputs() {
    log_info "Retrieving deployment outputs..."
    
    # Get the outputs from deployment
    WEB_APP_URL=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.webAppUrl.value" \
        --output tsv)
        
    OPENAI_ENDPOINT=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.openAiEndpoint.value" \
        --output tsv)
        
    KEY_VAULT_URL=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.keyVaultUrl.value" \
        --output tsv)
    
    log_info "Deployment outputs retrieved ✓"
    echo ""
    echo "🚀 Deployment Summary:"
    echo "   Web App URL: $WEB_APP_URL"
    echo "   OpenAI Endpoint: $OPENAI_ENDPOINT"
    echo "   Key Vault URL: $KEY_VAULT_URL"
    echo ""
}

# Deploy application code
deploy_application() {
    log_info "Deploying application code..."
    
    # Get the web app name from the deployment
    WEB_APP_NAME=$(az deployment group show \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$DEPLOYMENT_NAME" \
        --query "properties.outputs.webAppUrl.value" \
        --output tsv | sed 's|https://||' | sed 's|\.azurewebsites\.net||')
    
    # Deploy using zip deployment
    az webapp deployment source config-zip \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$WEB_APP_NAME" \
        --src "app.zip"
        
    log_info "Application deployment completed ✓"
}

# Create deployment package
create_deployment_package() {
    log_info "Creating deployment package..."
    
    # Create a zip file with the application
    zip -r app.zip . \
        -x "*.git*" \
        -x "*.vscode*" \
        -x "__pycache__*" \
        -x "*.pyc" \
        -x "venv/*" \
        -x ".env*" \
        -x "uploads/*" \
        -x "*.md" \
        -x "deploy.sh"
        
    log_info "Deployment package created ✓"
}

# Main deployment function
main() {
    log_info "Starting Azure OpenAI Demo deployment..."
    echo ""
    
    check_prerequisites
    create_resource_group
    deploy_infrastructure
    get_deployment_outputs
    create_deployment_package
    deploy_application
    
    echo ""
    log_info "🎉 Deployment completed successfully!"
    log_info "Visit your application at: $WEB_APP_URL"
    log_warning "Note: It may take a few minutes for the application to fully start."
}

# Error handler
error_handler() {
    log_error "Deployment failed on line $1"
    exit 1
}

trap 'error_handler $LINENO' ERR

# Run main function
main "$@"