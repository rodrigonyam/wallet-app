using 'main.bicep'

// Production environment parameters for Enhanced Digital Wallet App
param location = 'East US 2'
param staticWebAppName = 'swa-digital-wallet-prod'
param environmentName = 'prod'
param staticWebAppSku = 'Standard'
param tags = {
  Environment: 'Production'
  Application: 'Digital-Wallet-App-Enhanced'
  Owner: 'DevTeam'
  CostCenter: 'Engineering-PWA'
  DeploymentMethod: 'Azure-Developer-CLI'
  Features: 'DarkMode,Search,Export,Import,PWA'
}
