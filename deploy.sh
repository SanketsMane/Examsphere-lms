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

# Build and start with PM2 on EC2
echo -e "${GREEN}Building and starting application on EC2...${NC}"
ssh -i "$PEM_KEY" "$EC2_USER@$EC2_IP" << 'ENDSSH'
set -e
cd /home/ubuntu/kidokool-lms

# 1. Install Dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# 2. Generate Prisma Client
echo "🧬 Generating Prisma Client..."
npx prisma generate

# 3. Migrate/Push Database
echo "🗄️ Pushing database schema..."
npx prisma db push

# 4. Build Application
echo "🏗️ Building application..."
rm -rf .next
npm run build

# 5. Preparing standalone assets (Skipped - using standard start)
# echo "📦 Preparing standalone assets..."
# mkdir -p .next/standalone/.next/static
# cp -r public .next/standalone/
# cp -r .next/static/* .next/standalone/.next/static/

# 6. Start/Restart with PM2
echo "♻️ Restarting server..."
    # Using standard start to avoid standalone issues - Always restart
    echo "Stopping existing process..."
    pm2 stop kidokool-lms || true
    pm2 delete kidokool-lms || true
    
    echo "Starting new process with npm start..."
    pm2 start npm --name "kidokool-lms" -- start

# Save PM2 list so it restarts on reboot
pm2 save

echo "✅ Deployment steps completed on server."
ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}Application URL: http://$EC2_IP:3000${NC}"
echo -e "${BLUE}To view logs: ssh -i $PEM_KEY $EC2_USER@$EC2_IP 'docker logs -f kidokool-lms'${NC}"
echo -e "${GREEN}========================================${NC}"
