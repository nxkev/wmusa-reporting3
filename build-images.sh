#!/bin/bash

# Exit on error
set -e

# Colors and formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Progress function
progress() {
    echo -e "${BLUE}[BUILD]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Load environment variables
progress "Loading environment variables..."
if [ -f .env.deploy ]; then
    export $(cat .env.deploy | grep -v '^#' | xargs)
    success "Environment variables loaded"
else
    echo "Error: .env.deploy file not found"
    exit 1
fi

# Login to GitHub Container Registry
progress "Logging into GitHub Container Registry..."
echo ${GITHUB_TOKEN} | docker login ghcr.io -u ${GITHUB_USERNAME} --password-stdin
success "Successfully logged into GitHub Container Registry"

# Create and configure buildx builder
progress "Setting up buildx builder..."
if ! docker buildx inspect amd64-builder > /dev/null 2>&1; then
    info "Creating new builder instance..."
    docker buildx create --name amd64-builder --driver docker-container --platform linux/amd64
fi
docker buildx use amd64-builder
docker buildx inspect --bootstrap
success "Buildx builder configured"

# Build and push frontend image
progress "Building frontend image..."
info "This may take a few minutes..."
docker build --platform linux/amd64 \
    -t ghcr.io/${GITHUB_USERNAME}/wmusa-reporting-frontend:latest \
    frontend/
success "Frontend image built"

progress "Pushing frontend image..."
docker push ghcr.io/${GITHUB_USERNAME}/wmusa-reporting-frontend:latest
success "Frontend image pushed"

# Build and push backend image
progress "Building backend image..."
info "This may take a few minutes..."
docker buildx build --platform linux/amd64 \
    -t ghcr.io/${GITHUB_USERNAME}/wmusa-reporting-backend:latest \
    --push \
    backend/
success "Backend image built and pushed"

success "Build process complete! 🎉"
echo -e "\n${BOLD}Images are available at:${NC}"
echo -e "Frontend: ghcr.io/${GITHUB_USERNAME}/wmusa-reporting-frontend:latest"
echo -e "Backend:  ghcr.io/${GITHUB_USERNAME}/wmusa-reporting-backend:latest" 