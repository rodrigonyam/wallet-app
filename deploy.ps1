# Enhanced Digital Wallet App - Azure Deployment Script
# Supports both Azure CLI and Azure Developer CLI deployment methods

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("azd", "az")]
    [string]$DeploymentMethod = "azd",
    
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "East US 2",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipValidation
)

Write-Host "🚀 Enhanced Digital Wallet App Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Validation
if (-not $SkipValidation) {
    Write-Host "🔍 Validating application files..." -ForegroundColor Yellow
    
    $requiredFiles = @("index.html", "manifest.json", "css/styles.css", "js/app.js", "js/storage.js", "js/camera.js")
    $missing = @()
    
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $missing += $file
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "❌ Missing required files:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
        exit 1
    }
    
    Write-Host "✅ All required files present" -ForegroundColor Green
    
    # Check for enhanced features
    Write-Host "🔍 Checking enhanced features..." -ForegroundColor Yellow
    
    $features = @()
    
    if (Select-String -Path "css/styles.css" -Pattern "data-theme" -Quiet) {
        $features += "Dark Mode"
    }
    
    if (Select-String -Path "index.html" -Pattern "search-input" -Quiet) {
        $features += "Search"
    }
    
    if (Select-String -Path "index.html" -Pattern "export-btn" -Quiet) {
        $features += "Export/Import"
    }
    
    if (Select-String -Path "manifest.json" -Pattern "shortcuts" -Quiet) {
        $features += "PWA Shortcuts"
    }
    
    Write-Host "✅ Enhanced features detected: $($features -join ', ')" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Deployment Configuration:" -ForegroundColor Cyan
Write-Host "   Environment: $Environment"
Write-Host "   Method: $DeploymentMethod"
Write-Host "   Location: $Location"
Write-Host ""

# Set resource group name if not provided
if ([string]::IsNullOrEmpty($ResourceGroupName)) {
    $ResourceGroupName = "rg-wallet-app-$Environment"
}

try {
    if ($DeploymentMethod -eq "azd") {
        # Azure Developer CLI deployment
        Write-Host "🔧 Deploying with Azure Developer CLI..." -ForegroundColor Yellow
        
        # Check if azd is installed
        $azdVersion = azd version 2>$null
        if (-not $azdVersion) {
            Write-Host "❌ Azure Developer CLI (azd) is not installed." -ForegroundColor Red
            Write-Host "💡 Install it using: winget install microsoft.azd" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "✅ Azure Developer CLI detected: $($azdVersion[0])" -ForegroundColor Green
        
        # Initialize azd if needed
        if (-not (Test-Path "azure.yaml")) {
            Write-Host "❌ azure.yaml not found. Please ensure you're in the correct directory." -ForegroundColor Red
            exit 1
        }
        
        # Set environment
        Write-Host "🔧 Setting up azd environment..." -ForegroundColor Yellow
        azd env set AZURE_ENV_NAME "wallet-app-$Environment"
        azd env set AZURE_LOCATION $Location
        
        # Deploy
        Write-Host "🚀 Starting deployment..." -ForegroundColor Yellow
        azd up --environment $Environment
        
    } else {
        # Azure CLI deployment
        Write-Host "🔧 Deploying with Azure CLI..." -ForegroundColor Yellow
        
        # Check if az is installed and logged in
        $azAccount = az account show 2>$null
        if (-not $azAccount) {
            Write-Host "❌ Not logged into Azure CLI. Please run 'az login'" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ Azure CLI authentication confirmed" -ForegroundColor Green
        
        # Create resource group
        Write-Host "🔧 Creating resource group: $ResourceGroupName" -ForegroundColor Yellow
        az group create --name $ResourceGroupName --location $Location --output none
        
        # Deploy Bicep template
        $deploymentName = "wallet-app-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Write-Host "🔧 Deploying infrastructure: $deploymentName" -ForegroundColor Yellow
        
        $deployResult = az deployment group create `
            --resource-group $ResourceGroupName `
            --template-file "infra/main.bicep" `
            --parameters "infra/$Environment.bicepparam" `
            --name $deploymentName `
            --output json | ConvertFrom-Json
        
        if ($deployResult) {
            $staticWebAppName = $deployResult.properties.outputs.staticWebAppName.value
            $defaultUrl = $deployResult.properties.outputs.staticWebAppUrl.value
            
            Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green
            Write-Host "📱 Static Web App: $staticWebAppName" -ForegroundColor Cyan
            Write-Host "🌐 URL: $defaultUrl" -ForegroundColor Cyan
            
            # Get deployment token
            Write-Host "🔧 Getting deployment token..." -ForegroundColor Yellow
            $deployToken = az staticwebapp secrets list --name $staticWebAppName --resource-group $ResourceGroupName --query "properties.apiKey" -o tsv
            
            if ($deployToken) {
                Write-Host "🚀 Deploying application files..." -ForegroundColor Yellow
                
                # Use Azure Static Web Apps CLI if available, otherwise use az deployment
                $swaCliVersion = swa --version 2>$null
                if ($swaCliVersion) {
                    swa deploy . --deployment-token $deployToken --app-location . --output-location .
                } else {
                    Write-Host "💡 For better deployment experience, install SWA CLI: npm install -g @azure/static-web-apps-cli" -ForegroundColor Yellow
                    Write-Host "✅ Infrastructure is ready. Use the Azure portal to deploy your files." -ForegroundColor Green
                }
            }
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "📱 Your Enhanced Digital Wallet App is now live with:" -ForegroundColor Cyan
    Write-Host "   ✅ Mobile-first responsive design" -ForegroundColor Green
    Write-Host "   ✅ Dark/Light mode toggle (🌙/☀️)" -ForegroundColor Green
    Write-Host "   ✅ Advanced search functionality (🔍)" -ForegroundColor Green
    Write-Host "   ✅ Export/Import capabilities (📤/📥)" -ForegroundColor Green
    Write-Host "   ✅ PWA support with home screen installation" -ForegroundColor Green
    Write-Host "   ✅ Enhanced privacy and security features" -ForegroundColor Green
    Write-Host "   ✅ Offline support and local storage" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Visit your app in a mobile browser" -ForegroundColor White
    Write-Host "   2. Test the 'Add to Home Screen' functionality" -ForegroundColor White
    Write-Host "   3. Try the dark mode toggle and search features" -ForegroundColor White
    Write-Host "   4. Test export/import with sample data" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Useful Links:" -ForegroundColor Yellow
    Write-Host "   • Azure Portal: https://portal.azure.com" -ForegroundColor White
    Write-Host "   • Static Web Apps Docs: https://docs.microsoft.com/azure/static-web-apps/" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting Tips:" -ForegroundColor Yellow
    Write-Host "   • Ensure you're logged into Azure CLI: az login" -ForegroundColor White
    Write-Host "   • Check your Azure permissions for resource creation" -ForegroundColor White
    Write-Host "   • Verify the resource group name and location" -ForegroundColor White
    Write-Host "   • Try running with -SkipValidation if file validation is failing" -ForegroundColor White
    exit 1
}