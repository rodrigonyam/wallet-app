// Enhanced Digital Wallet App - Main Infrastructure
@description('The primary location for all resources')
param location string = 'East US 2'

@description('The name of the static web app')
param staticWebAppName string = 'swa-digital-wallet-${uniqueString(resourceGroup().id)}'

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environmentName string = 'prod'

@description('SKU name for the static web app')
@allowed(['Free', 'Standard'])
param staticWebAppSku string = 'Free'

@description('Tags to apply to all resources')
param tags object = {
  Environment: environmentName
  Application: 'Digital-Wallet-App'
  Owner: 'DevTeam'
  CostCenter: 'Engineering'
}

// Static Web App for hosting the PWA
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: staticWebAppSku
    tier: staticWebAppSku
  }
  properties: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    enterpriseGradeCdnStatus: 'Disabled'
  }
}

// Configure custom domains and SSL (if needed)
resource staticWebAppCustomDomain 'Microsoft.Web/staticSites/customDomains@2023-01-01' = if (environmentName == 'prod') {
  parent: staticWebApp
  name: '${staticWebAppName}.azurestaticapps.net'
  properties: {}
}

// Application Insights for monitoring (optional for enhanced version)
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${staticWebAppName}'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Redfield'
    Request_Source: 'IbizaAIExtension'
  }
}

// Log Analytics Workspace for Application Insights
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'law-${staticWebAppName}'
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Update Application Insights to use Log Analytics Workspace
resource applicationInsightsWithWorkspace 'Microsoft.Insights/components@2020-02-02' = {
  name: 'appi-${staticWebAppName}-workspace'
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Redfield'
    Request_Source: 'IbizaAIExtension'
    WorkspaceResourceId: logAnalyticsWorkspace.id
  }
}

// Outputs
@description('The static web app resource name')
output staticWebAppName string = staticWebApp.name

@description('The static web app resource ID')
output staticWebAppId string = staticWebApp.id

@description('The static web app URL')
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'

@description('The static web app default hostname')
output staticWebAppDefaultHostname string = staticWebApp.properties.defaultHostname

@description('Application Insights connection string')
output applicationInsightsConnectionString string = applicationInsights.properties.ConnectionString

@description('Application Insights instrumentation key')
output applicationInsightsInstrumentationKey string = applicationInsights.properties.InstrumentationKey

@description('Deployment summary')
output deploymentSummary object = {
  staticWebAppName: staticWebApp.name
  environment: environmentName
  location: location
  defaultUrl: 'https://${staticWebApp.properties.defaultHostname}'
  monitoring: {
    applicationInsightsName: applicationInsights.name
    logAnalyticsWorkspaceName: logAnalyticsWorkspace.name
  }
}
