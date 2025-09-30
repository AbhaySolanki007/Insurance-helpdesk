@echo off
REM Docker build script for Railway deployment (Windows)
REM This script builds and tags the Docker image for your backend

setlocal enabledelayedexpansion

REM Configuration
set IMAGE_NAME=insurance-helpdesk-backend
set REGISTRY_USERNAME=your-dockerhub-username
set VERSION=latest

echo 🐳 Building Docker image for Railway deployment...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    exit /b 1
)

REM Build the Docker image
echo 📦 Building Docker image...
docker build -t %IMAGE_NAME%:%VERSION% .

if errorlevel 1 (
    echo ❌ Docker build failed!
    exit /b 1
)

echo ✅ Docker image built successfully!

REM Tag for Docker Hub (if you want to push)
echo 🏷️  Tagging image for Docker Hub...
docker tag %IMAGE_NAME%:%VERSION% %REGISTRY_USERNAME%/%IMAGE_NAME%:%VERSION%

echo ✅ Image tagged as: %REGISTRY_USERNAME%/%IMAGE_NAME%:%VERSION%

REM Show image details
echo 📊 Image Details:
docker images %IMAGE_NAME%:%VERSION%

echo 🎉 Build completed successfully!
echo 📋 Next steps:
echo 1. Test the image locally: docker run -p 8001:8001 %IMAGE_NAME%:%VERSION%
echo 2. Push to Docker Hub: docker push %REGISTRY_USERNAME%/%IMAGE_NAME%:%VERSION%
echo 3. Deploy on Railway using: %REGISTRY_USERNAME%/%IMAGE_NAME%:%VERSION%

