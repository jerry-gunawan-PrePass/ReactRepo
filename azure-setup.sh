#!/bin/bash

# Variables - replace these with your own values
RESOURCE_GROUP="taskboard-rg"
LOCATION="eastus"
ACR_NAME="taskboardregistry"  # Must be globally unique
APP_SERVICE_PLAN="taskboard-plan"
APP_SERVICE_NAME="taskboard-app"  # Must be globally unique
SKU="B1"  # Basic tier

# Login to Azure (uncomment if not already logged in)
# az login

# Create resource group
echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Container Registry
echo "Creating Azure Container Registry..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic

# Enable admin user for the registry
echo "Enabling admin user for ACR..."
az acr update --name $ACR_NAME --admin-enabled true

# Get the registry credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

echo "ACR Username: $ACR_USERNAME"
echo "ACR Password: $ACR_PASSWORD"
echo "Please save these credentials securely for GitHub Actions secrets"

# Create App Service Plan for Linux containers
echo "Creating App Service Plan..."
az appservice plan create --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --is-linux --sku $SKU

# Create Web App for Containers
echo "Creating Web App for Containers..."
az webapp create --resource-group $RESOURCE_GROUP --plan $APP_SERVICE_PLAN --name $APP_SERVICE_NAME --deployment-container-image-name nginx:alpine

# Configure the web app to use the Azure Container Registry
echo "Configuring Web App to use ACR..."
az webapp config container set --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name nginx:alpine \
  --docker-registry-server-url https://$ACR_NAME.azurecr.io \
  --docker-registry-server-user $ACR_USERNAME \
  --docker-registry-server-password $ACR_PASSWORD

echo "Setup complete!"
echo "Resource Group: $RESOURCE_GROUP"
echo "Container Registry: $ACR_NAME.azurecr.io"
echo "App Service: $APP_SERVICE_NAME.azurewebsites.net"
echo ""
echo "Next steps:"
echo "1. Update the GitHub workflow file with your resource names"
echo "2. Add the following secrets to your GitHub repository:"
echo "   - AZURE_CREDENTIALS: Output from 'az ad sp create-for-rbac' command"
echo "   - REGISTRY_USERNAME: $ACR_USERNAME"
echo "   - REGISTRY_PASSWORD: $ACR_PASSWORD" 