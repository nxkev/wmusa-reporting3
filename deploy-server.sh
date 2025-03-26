#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env.deploy ]; then
  export $(cat .env.deploy | grep -v '^#' | xargs)
else
  echo "Error: .env.deploy file not found"
  exit 1
fi

echo "Starting deployment to ${PROD_SERVER_IP}..."

# Create the deployment directory structure
echo "Creating deployment directory structure..."
ssh -p ${PROD_SERVER_PORT:-22} root@${PROD_SERVER_IP} "mkdir -p ${PROD_DEPLOY_PATH}/{data,uploads} && chown -R docker:docker ${PROD_DEPLOY_PATH} && chmod 777 ${PROD_DEPLOY_PATH}/data ${PROD_DEPLOY_PATH}/uploads"

# Copy docker-compose.prod.yml to server
echo "Copying docker-compose.prod.yml to server..."
scp -P ${PROD_SERVER_PORT:-22} docker-compose.prod.yml root@${PROD_SERVER_IP}:${PROD_DEPLOY_PATH}/
ssh -p ${PROD_SERVER_PORT:-22} root@${PROD_SERVER_IP} "chown docker:docker ${PROD_DEPLOY_PATH}/docker-compose.prod.yml"

# Login to GitHub Container Registry on the server
echo "Logging into GitHub Container Registry..."
ssh -p ${PROD_SERVER_PORT:-22} root@${PROD_SERVER_IP} "echo ${GITHUB_TOKEN} | su - docker -c 'docker login ghcr.io -u ${GITHUB_USERNAME} --password-stdin'"

# Pull latest images and restart containers
echo "Pulling latest images and restarting containers..."
ssh -p ${PROD_SERVER_PORT:-22} root@${PROD_SERVER_IP} "cd ${PROD_DEPLOY_PATH} && \
  su - docker -c 'docker pull --platform linux/amd64 ghcr.io/nxkev/wmusa-reporting-frontend:latest' && \
  su - docker -c 'docker pull --platform linux/amd64 ghcr.io/nxkev/wmusa-reporting-backend:latest' && \
  su - docker -c 'docker compose -f docker-compose.prod.yml down || true' && \
  su - docker -c 'PROD_NODE_ENV=${PROD_NODE_ENV} \
  PROD_DB_PATH=${PROD_DB_PATH} \
  PROD_UPLOAD_DIR=${PROD_UPLOAD_DIR} \
  PROD_FRONTEND_PORT=${PROD_FRONTEND_PORT} \
  PROD_BACKEND_PORT=${PROD_BACKEND_PORT} \
  docker compose -f docker-compose.prod.yml up -d'"

echo "Deployment complete! Services are available at:"
echo "Frontend: http://${PROD_SERVER_IP}:${PROD_FRONTEND_PORT}"
echo "Backend: http://${PROD_SERVER_IP}:${PROD_BACKEND_PORT}" 