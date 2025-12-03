using 'main.bicep'

// Development environment parameters for Enhanced Digital Wallet App
param location = 'East US 2'
param staticWebAppName = 'swa-digital-wallet-dev'
param environmentName = 'dev'
param staticWebAppSku = 'Free'
param tags = {
  Environment: 'Development'
  Application: 'Digital-Wallet-App-Enhanced'
  Owner: 'DevTeam'
  CostCenter: 'Engineering-PWA'
  DeploymentMethod: 'Azure-Developer-CLI'
  Features: 'DarkMode,Search,Export,Import,PWA'
  Testing: 'true'
}
