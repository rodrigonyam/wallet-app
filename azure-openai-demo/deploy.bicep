# Azure Bicep template for deploying the AI application
# This demonstrates Infrastructure as Code (IaC) best practices

@description('The name of the application')
param appName string = 'azure-openai-demo'

@description('The Azure region for deployment')
param location string = resourceGroup().location

@description('Environment (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('Azure OpenAI service name')
param openAiServiceName string = '${appName}-openai-${environment}'

@description('App Service Plan SKU')
@allowed([
  'B1'
  'S1'
  'P1v2'
])
param appServicePlanSku string = 'B1'

// Variables
var resourceNamePrefix = '${appName}-${environment}'
var appServicePlanName = '${resourceNamePrefix}-plan'
var webAppName = '${resourceNamePrefix}-webapp'
var keyVaultName = '${resourceNamePrefix}-kv-${uniqueString(resourceGroup().id)}'
var storageAccountName = '${replace(resourceNamePrefix, '-', '')}stor${uniqueString(resourceGroup().id)}'
var applicationInsightsName = '${resourceNamePrefix}-insights'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: appServicePlanSku
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
  tags: {
    Environment: environment
    Application: appName
  }
}

// Web App
resource webApp 'Microsoft.Web/sites@2022-03-01' = {
  name: webAppName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.11'
      appCommandLine: 'gunicorn --bind=0.0.0.0 --timeout 600 app:app'
      appSettings: [
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'AZURE_OPENAI_ENDPOINT'
          value: 'https://${openAiService.name}.openai.azure.com/'
        }
        {
          name: 'AZURE_KEY_VAULT_URL'
          value: keyVault.properties.vaultUri
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: applicationInsights.properties.ConnectionString
        }
        {
          name: 'FLASK_ENV'
          value: environment == 'prod' ? 'production' : 'development'
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false'
        }
      ]
    }
    httpsOnly: true
  }
  tags: {
    Environment: environment
    Application: appName
  }
}

// Azure OpenAI Service
resource openAiService 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: openAiServiceName
  location: 'eastus' // Note: Azure OpenAI is only available in specific regions
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: openAiServiceName
    networkAcls: {
      defaultAction: 'Allow'
    }
    publicNetworkAccess: 'Enabled'
  }
  tags: {
    Environment: environment
    Application: appName
  }
}

// GPT-4 Deployment
resource gpt4Deployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAiService
  name: 'gpt-4o'
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-05-13'
    }
  }
  sku: {
    name: 'Standard'
    capacity: 10
  }
}

// Text Embedding Deployment
resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAiService
  name: 'text-embedding-ada-002'
  dependsOn: [gpt4Deployment] // Deploy sequentially to avoid conflicts
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-ada-002'
      version: '2'
    }
  }
  sku: {
    name: 'Standard'
    capacity: 10
  }
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2022-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: webApp.identity.principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
    ]
    enableRbacAuthorization: false
    enabledForDeployment: false
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
  }
  tags: {
    Environment: environment
    Application: appName
  }
}

// Store OpenAI API Key in Key Vault
resource openAiApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2022-07-01' = {
  parent: keyVault
  name: 'openai-api-key'
  properties: {
    value: openAiService.listKeys().key1
  }
}

// Storage Account for document uploads
resource storageAccount 'Microsoft.Storage/storageAccounts@2022-09-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
  tags: {
    Environment: environment
    Application: appName
  }
}

// Container for document uploads
resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2022-09-01' = {
  name: '${storageAccount.name}/default/documents'
  properties: {
    publicAccess: 'None'
  }
}

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: applicationInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
  tags: {
    Environment: environment
    Application: appName
  }
}

// Log Analytics Workspace
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${resourceNamePrefix}-workspace'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
  tags: {
    Environment: environment
    Application: appName
  }
}

// Outputs
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output openAiEndpoint string = 'https://${openAiService.name}.openai.azure.com/'
output keyVaultUrl string = keyVault.properties.vaultUri
output storageAccountName string = storageAccount.name
output applicationInsightsConnectionString string = applicationInsights.properties.ConnectionString
