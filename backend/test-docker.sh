#!/bin/bash

# Test script for Docker image
# This script tests the Docker image locally before pushing to Railway

set -e

# Configuration
IMAGE_NAME="insurance-helpdesk-backend"
CONTAINER_NAME="insurance-helpdesk-test"
PORT="8001"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Docker image locally...${NC}"

# Check if image exists
if ! docker images | grep -q ${IMAGE_NAME}; then
    echo -e "${RED}❌ Docker image '${IMAGE_NAME}' not found. Please build it first.${NC}"
    exit 1
fi

# Stop and remove existing container if it exists
if docker ps -a | grep -q ${CONTAINER_NAME}; then
    echo -e "${YELLOW}🔄 Stopping existing container...${NC}"
    docker stop ${CONTAINER_NAME} > /dev/null 2>&1
    docker rm ${CONTAINER_NAME} > /dev/null 2>&1
fi

# Run the container
echo -e "${YELLOW}🚀 Starting container...${NC}"
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${PORT}:8001 \
    -e USE_SUPABASE=true \
    -e DEBUG=false \
    -e HOST=0.0.0.0 \
    -e PORT=8001 \
    ${IMAGE_NAME}:latest

# Wait for container to start
echo -e "${YELLOW}⏳ Waiting for container to start...${NC}"
sleep 10

# Check if container is running
if ! docker ps | grep -q ${CONTAINER_NAME}; then
    echo -e "${RED}❌ Container failed to start. Checking logs...${NC}"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

echo -e "${GREEN}✅ Container is running!${NC}"

# Test health endpoint
echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
sleep 5

if curl -f http://localhost:${PORT}/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health endpoint is working!${NC}"
else
    echo -e "${RED}❌ Health endpoint failed. Checking logs...${NC}"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

# Show container info
echo -e "${BLUE}📊 Container Information:${NC}"
docker ps | grep ${CONTAINER_NAME}

echo -e "${GREEN}🎉 Docker image test completed successfully!${NC}"
echo -e "${YELLOW}📋 Test Results:${NC}"
echo -e "  ✅ Container starts successfully"
echo -e "  ✅ Health endpoint responds"
echo -e "  ✅ Ready for Railway deployment"

echo -e "${BLUE}🔗 Test the API:${NC}"
echo -e "  Health: http://localhost:${PORT}/health"
echo -e "  Chat: http://localhost:${PORT}/api/chat"

echo -e "${YELLOW}🛑 To stop the test container:${NC}"
echo -e "  docker stop ${CONTAINER_NAME}"
echo -e "  docker rm ${CONTAINER_NAME}"

