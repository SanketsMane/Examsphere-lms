#!/bin/bash

# AWS EC2 Deployment Script for KIDOKOOL LMS - Git Pull Method
# This script pulls the latest code from GitHub and deploys to EC2

set -e  # Exit on error

# Configuration
EC2_IP="16.176.20.69"
EC2_USER="ubuntu"
PEM_KEY="/Users/sanket/Documents/Kidokool-LMS/Kidokool-latest-key.pem"
APP_NAME="kidokool-lms"
REMOTE_DIR="/home/ubuntu/kidokool-lms"
REPO_URL="https://github.com/SanketsMane/Examsphere-lms.git"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  KIDOKOOL LMS - Production Deployment${NC}"
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

# Upload environment variables
echo -e "${GREEN}Uploading environment variables...${NC}"
scp -i "$PEM_KEY" "env.production" "$EC2_USER@$EC2_IP:$REMOTE_DIR/.env"

# Deploy on EC2
echo -e "${GREEN}Deploying application on EC2...${NC}"
ssh -i "$PEM_KEY" "$EC2_USER@$EC2_IP" << ENDSSH
set -e

cd $REMOTE_DIR

# Check if it's a git repository
if [ ! -d ".git" ]; then
    echo "Not a git repository. Cloning from GitHub..."
    cd /home/ubuntu
    rm -rf kidokool-lms
    git clone $REPO_URL kidokool-lms
    cd kidokool-lms
else
    echo "Pulling latest code from GitHub..."
    git fetch origin
    git reset --hard origin/main
    git pull origin main
fi

echo "✓ Latest code pulled successfully"

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database push (since migration deploy fails with P3005 on existing schema)
echo "Synchronizing database schema..."
# Try to rename table first to avoid data loss
node scripts/rename_table.js || true
npx prisma db push

# Build the application
echo "Building application..."
rm -rf .next
npm run build

# Copy public and static files for standalone mode
echo "Preparing standalone assets..."
mkdir -p .next/standalone/.next/static
cp -r public .next/standalone/
cp -r .next/static/* .next/standalone/.next/static/

# Restart PM2 process
echo "Restarting application..."
# We use node to start the standalone server
pm2 stop kidokool-lms || true
pm2 delete kidokool-lms || true
# Need to set PORT explicitly for standalone server
PORT=3000 pm2 start .next/standalone/server.js --name "kidokool-lms"

# Show status
echo ""
echo "Application Status:"
pm2 status kidokool-lms

ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}Application URL: http://$EC2_IP:3000${NC}"
echo -e "${BLUE}Admin Broadcasts: http://$EC2_IP:3000/admin/broadcasts${NC}"
echo -e "${BLUE}To view logs: ssh -i $PEM_KEY $EC2_USER@$EC2_IP 'pm2 logs kidokool-lms'${NC}"
echo -e "${BLUE}To restart: ssh -i $PEM_KEY $EC2_USER@$EC2_IP 'pm2 restart kidokool-lms'${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Visit http://$EC2_IP:3000/admin/broadcasts to create broadcasts"
echo -e "2. Test the broadcast banner on the homepage"
echo -e "3. Monitor logs for any errors"
