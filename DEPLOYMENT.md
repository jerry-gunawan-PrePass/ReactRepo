# Deploying Taskboard to Azure

This document provides step-by-step instructions for deploying the Taskboard application to Azure using Docker containers.

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Docker](https://docs.docker.com/get-docker/)
- An Azure account with an active subscription
- GitHub account (if using GitHub Actions for CI/CD)

## Local Development with Docker

1. Build the Docker image locally:
   ```bash
   docker build -t taskboard-app .
   ```

2. Run the container locally:
   ```bash
   docker run -p 8080:80 taskboard-app
   ```

3. Access the application at http://localhost:8080

## Azure Deployment Setup

### Manual Setup

1. Make the setup script executable:
   ```bash
   chmod +x azure-setup.sh
   ```

2. Run the setup script:
   ```bash
   ./azure-setup.sh
   ```

3. Note the output values for your Azure resources.

### Setting up GitHub Actions

1. Create a service principal for GitHub Actions:
   ```bash
   az ad sp create-for-rbac --name "taskboard-github-actions" --role contributor \
                            --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
                            --sdk-auth
   ```

2. Add the following secrets to your GitHub repository:
   - `AZURE_CREDENTIALS`: The entire JSON output from the command above
   - `REGISTRY_USERNAME`: ACR username from the setup script
   - `REGISTRY_PASSWORD`: ACR password from the setup script

3. Update the `.github/workflows/azure-deploy.yml` file with your resource names:
   - `AZURE_CONTAINER_REGISTRY`: Your ACR name
   - `RESOURCE_GROUP`: Your resource group name
   - `APP_SERVICE_NAME`: Your App Service name

4. Push to the main branch to trigger the deployment.

## Manual Deployment

If you prefer to deploy manually:

1. Build and tag the Docker image:
   ```bash
   docker build -t {acr-name}.azurecr.io/taskboard-app:latest .
   ```

2. Log in to Azure Container Registry:
   ```bash
   az acr login --name {acr-name}
   ```

3. Push the image to ACR:
   ```bash
   docker push {acr-name}.azurecr.io/taskboard-app:latest
   ```

4. Update the web app to use the new image:
   ```bash
   az webapp config container set --name {app-service-name} --resource-group {resource-group} \
     --docker-custom-image-name {acr-name}.azurecr.io/taskboard-app:latest
   ```

## Troubleshooting

- **Container fails to start**: Check the logs using `az webapp log tail --name {app-service-name} --resource-group {resource-group}`
- **Image not found**: Ensure the image was pushed to ACR and the App Service has the correct credentials
- **Application not accessible**: Check if the App Service is running and the container port is correctly exposed

## Additional Resources

- [Azure Container Registry documentation](https://docs.microsoft.com/en-us/azure/container-registry/)
- [Azure App Service documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [GitHub Actions for Azure](https://github.com/Azure/actions/) 