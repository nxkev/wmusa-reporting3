#!/bin/bash

# Exit on error
set -e

# Colors and formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Progress function
progress() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables
progress "Loading environment variables..."
if [ -f .env.deploy ]; then
    export $(cat .env.deploy | grep -v '^#' | xargs)
    success "Environment variables loaded"
else
    error "Error: .env.deploy file not found"
    exit 1
fi

# Test SSH connection
progress "Testing SSH connection to ${PROD_SERVER_IP}..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes -o StrictHostKeyChecking=accept-new ${PROD_SERVER_USER}@${PROD_SERVER_IP} -p ${PROD_SERVER_PORT} "echo 'SSH connection successful'"; then
    error "Failed to connect to server. Please check your SSH configuration and server status."
    exit 1
fi
success "SSH connection verified"

# Create remote directory if it doesn't exist
progress "Ensuring remote directory exists..."
if ! ssh ${PROD_SERVER_USER}@${PROD_SERVER_IP} -p ${PROD_SERVER_PORT} "mkdir -p ${PROD_DEPLOY_PATH}"; then
    error "Failed to create remote directory"
    exit 1
fi
success "Remote directory ready"

# Copy docker-compose.yml to server
progress "Copying docker-compose.yml to server..."
if ! scp -P ${PROD_SERVER_PORT} docker-compose.yml ${PROD_SERVER_USER}@${PROD_SERVER_IP}:${PROD_DEPLOY_PATH}/; then
    error "Failed to copy docker-compose.yml"
    exit 1
fi
success "Docker compose file copied"

# Create a temporary Docker config.json with credentials
progress "Preparing Docker credentials..."
DOCKER_CONFIG_DIR=$(mktemp -d)
echo "{\"auths\":{\"ghcr.io\":{\"auth\":\"$(echo -n "${GITHUB_USERNAME}:${GITHUB_TOKEN}" | base64)\"}}}" > "${DOCKER_CONFIG_DIR}/config.json"

# Copy Docker credentials to server
progress "Copying Docker credentials to server..."
if ! ssh ${PROD_SERVER_USER}@${PROD_SERVER_IP} -p ${PROD_SERVER_PORT} "mkdir -p ~/.docker"; then
    error "Failed to create Docker config directory on server"
    rm -rf "${DOCKER_CONFIG_DIR}"
    exit 1
fi

if ! scp -P ${PROD_SERVER_PORT} "${DOCKER_CONFIG_DIR}/config.json" ${PROD_SERVER_USER}@${PROD_SERVER_IP}:~/.docker/config.json; then
    error "Failed to copy Docker credentials"
    rm -rf "${DOCKER_CONFIG_DIR}"
    exit 1
fi

# Clean up temporary directory
rm -rf "${DOCKER_CONFIG_DIR}"
success "Docker credentials configured"

# SSH into server and deploy
progress "Starting deployment on remote server..."
ssh -t ${PROD_SERVER_USER}@${PROD_SERVER_IP} -p ${PROD_SERVER_PORT} << ENDSSH
# Colors and formatting for remote shell
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

progress() {
    echo -e "\${BLUE}[REMOTE]\${NC} \$1"
}

success() {
    echo -e "\${GREEN}[SUCCESS]\${NC} \$1"
}

error() {
    echo -e "\${RED}[ERROR]\${NC} \$1"
}

cd ${PROD_DEPLOY_PATH}

# Create directories for volumes if they don't exist
progress "Creating data directories..."
mkdir -p data uploads
success "Data directories created"

# Stop any existing containers
progress "Stopping existing containers..."
docker compose down || true
success "Existing containers stopped"

# Pull latest images
progress "Pulling latest images..."
if ! docker compose pull; then
    error "Failed to pull images"
    exit 1
fi
success "Images pulled successfully"

# Start containers
progress "Starting containers..."
if ! docker compose up -d; then
    error "Failed to start containers"
    exit 1
fi
success "Containers started"

# Check container status
progress "Verifying container status..."
sleep 5  # Wait for containers to initialize
if docker compose ps | grep -q "Up"; then
    success "All containers are running"
    echo -e "\nContainer Status:"
    docker compose ps
else
    error "Some containers may not be running properly"
    docker compose ps
    exit 1
fi

ENDSSH

success "Deployment complete! 🚀"
echo -e "\n${BOLD}Services should be available at:${NC}"
echo -e "Frontend: http://${PROD_SERVER_IP}:${PROD_FRONTEND_PORT}"
echo -e "Backend:  http://${PROD_SERVER_IP}:${PROD_BACKEND_PORT}" 