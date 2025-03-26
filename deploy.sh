#!/bin/bash

# Exit on any error
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Check if DOCKER_REGISTRY is set
if [ -z "$DOCKER_REGISTRY" ]; then
    echo "Error: DOCKER_REGISTRY not set in .env file"
    exit 1
fi

# Build images
echo "Building Docker images..."
docker compose -f docker-compose.prod.yml build

# Log in to Docker registry
echo "Logging in to Docker registry..."
docker login $DOCKER_REGISTRY

# Push images
echo "Pushing images to registry..."
docker compose -f docker-compose.prod.yml push

echo "Deployment preparation complete!"
echo "Images are now available at:"
echo "- $DOCKER_REGISTRY/wmusa-reporting-frontend:${TAG:-latest}"
echo "- $DOCKER_REGISTRY/wmusa-reporting-backend:${TAG:-latest}" 