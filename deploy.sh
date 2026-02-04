#!/bin/bash

# AWS EC2 Deployment Script for KIDOKOOL LMS
# This script deploys the Next.js application to EC2

set -e  # Exit on error

# Configuration
EC2_IP="16.176.20.69"
EC2_USER="ubuntu"
PEM_KEY="/Users/sanket/Documents/Kidokool-LMS/Kidokool-latest-key.pem"
APP_NAME="kidokool-lms"
REMOTE_DIR="/home/ubuntu/kidokool-lms"
LOCAL_DIR="/Users/sanket/Documents/Kidokool-LMS"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  KIDOKOOL LMS - AWS EC2 Deployment${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if PEM key exists
if [ ! -f "$PEM_KEY" ]; then
    echo -e "${RED}Error: PEM key not found at $PEM_KEY${NC}"
    exit 1
fi

# Set correct permissions for PEM key
echo -e "${GREEN}Setting PEM key permissions...${NC}"
chmod 400 "$PEM_KEY"

# Test SSH connection
echo -e "${GREEN}Testing SSH connection to EC2...${NC}"
if ! ssh -i "$PEM_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "echo 'Connection successful'"; then
    echo -e "${RED}Error: Cannot connect to EC2 instance${NC}"
    exit 1
fi

echo -e "${GREEN}✓ SSH connection successful${NC}"

# Create remote directory
echo -e "${GREEN}Creating remote directory...${NC}"
ssh -i "$PEM_KEY" "$EC2_USER@$EC2_IP" "mkdir -p $REMOTE_DIR"

# Sync files to EC2 (excluding node_modules, .next, etc.)
echo -e "${GREEN}Syncing files to EC2...${NC}"
rsync -avz --progress \
    -e "ssh -i \"$PEM_KEY\"" \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude 'build*.log' \
    --exclude 'errors*.txt' \
    --exclude 'lint_errors*.txt' \
    --exclude '.env.local' \
    --exclude 'AWS' \
    "$LOCAL_DIR/" "$EC2_USER@$EC2_IP:$REMOTE_DIR/"

echo -e "${GREEN}✓ Files synced successfully${NC}"

# Copy .env file separately (if exists)
if [ -f "$LOCAL_DIR/.env.production" ]; then
    echo -e "${GREEN}Copying environment variables...${NC}"
    scp -i "$PEM_KEY" "$LOCAL_DIR/.env.production" "$EC2_USER@$EC2_IP:$REMOTE_DIR/.env.production"
    echo -e "${GREEN}✓ Environment variables copied${NC}"
else
    echo -e "${RED}Warning: No .env.production file found. You'll need to create one on the server.${NC}"
fi

# Build and run Docker container on EC2
echo -e "${GREEN}Building and starting Docker container on EC2...${NC}"
ssh -i "$PEM_KEY" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd /home/ubuntu/kidokool-lms

# Stop and remove existing container if running
if [ "$(docker ps -q -f name=kidokool-lms)" ]; then
    echo "Stopping existing container..."
    docker stop kidokool-lms
    docker rm kidokool-lms
fi

# Remove old image if exists
if [ "$(docker images -q kidokool-lms:latest)" ]; then
    echo "Removing old image..."
    docker rmi kidokool-lms:latest
fi

# Build new Docker image
echo "Building Docker image..."
docker build -t kidokool-lms:latest .

# Run the container
echo "Starting container..."
docker run -d \
    --name kidokool-lms \
    --restart unless-stopped \
    -p 3000:3000 \
    --env-file .env.production \
    kidokool-lms:latest

# Wait for container to start
sleep 5

# Check if container is running
if [ "$(docker ps -q -f name=kidokool-lms)" ]; then
    echo "✓ Container started successfully"
    docker ps -f name=kidokool-lms
else
    echo "✗ Container failed to start"
    docker logs kidokool-lms
    exit 1
fi
ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}Application URL: http://$EC2_IP:3000${NC}"
echo -e "${BLUE}To view logs: ssh -i $PEM_KEY $EC2_USER@$EC2_IP 'docker logs -f kidokool-lms'${NC}"
echo -e "${GREEN}========================================${NC}"
