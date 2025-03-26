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

# Login to GitHub Container Registry
echo ${GITHUB_TOKEN} | docker login ghcr.io -u ${GITHUB_USERNAME} --password-stdin

# Build Docker images
echo "Building Docker images..."
docker buildx create --use
docker buildx build --platform linux/amd64 -t ghcr.io/${GITHUB_USERNAME}/wmusa-reporting-frontend:latest -f frontend/Dockerfile ./frontend --push
docker buildx build --platform linux/amd64 -t ghcr.io/${GITHUB_USERNAME}/wmusa-reporting-backend:latest -f backend/Dockerfile ./backend --push

echo "Deployment preparation complete!"
echo "Images are available at:"
echo "- ghcr.io/${GITHUB_USERNAME}/wmusa-reporting-frontend:latest"
echo "- ghcr.io/${GITHUB_USERNAME}/wmusa-reporting-backend:latest" 