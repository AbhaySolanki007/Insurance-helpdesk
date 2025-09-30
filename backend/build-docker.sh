#!/bin/bash

# Docker build script for Railway deployment
# This script builds and tags the Docker image for your backend

set -e  # Exit on any error

# Configuration
IMAGE_NAME="insurance-helpdesk-backend"
REGISTRY_USERNAME="your-dockerhub-username"  # Replace with your Docker Hub username
VERSION="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Building Docker image for Railway deployment...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi

# Build the Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:${VERSION} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
else
    echo -e "${RED}❌ Docker build failed!${NC}"
    exit 1
fi

# Tag for Docker Hub (if you want to push)
echo -e "${YELLOW}🏷️  Tagging image for Docker Hub...${NC}"
docker tag ${IMAGE_NAME}:${VERSION} ${REGISTRY_USERNAME}/${IMAGE_NAME}:${VERSION}

echo -e "${GREEN}✅ Image tagged as: ${REGISTRY_USERNAME}/${IMAGE_NAME}:${VERSION}${NC}"

# Show image details
echo -e "${BLUE}📊 Image Details:${NC}"
docker images ${IMAGE_NAME}:${VERSION}

echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "1. Test the image locally: ${BLUE}docker run -p 8001:8001 ${IMAGE_NAME}:${VERSION}${NC}"
echo -e "2. Push to Docker Hub: ${BLUE}docker push ${REGISTRY_USERNAME}/${IMAGE_NAME}:${VERSION}${NC}"
echo -e "3. Deploy on Railway using: ${BLUE}${REGISTRY_USERNAME}/${IMAGE_NAME}:${VERSION}${NC}"

