#!/bin/bash

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
echo -e "${BLUE}  KIDOKOOL LMS - PM2 Deployment${NC}"
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

# Sync files to EC2
echo -e "${GREEN}Syncing files to EC2...${NC}"
rsync -avz --progress \
    -e "ssh -i \"$PEM_KEY\"" \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '.git' \
    --exclude '.env.local' \
    --exclude 'AWS' \
    --exclude 'Testing' \
    --exclude 'Documents' \
    "$LOCAL_DIR/" "$EC2_USER@$EC2_IP:$REMOTE_DIR/"

echo -e "${GREEN}✓ Files synced successfully${NC}"

# Copy .env.production separately to .env
if [ -f "$LOCAL_DIR/.env.production" ]; then
    echo -e "${GREEN}Copying environment variables...${NC}"
    scp -i "$PEM_KEY" "$LOCAL_DIR/.env.production" "$EC2_USER@$EC2_IP:$REMOTE_DIR/.env"
    echo -e "${GREEN}✓ Environment variables copied to .env${NC}"
fi

# Run Build and Restart on EC2
echo -e "${GREEN}Building and restarting application on EC2...${NC}"
ssh -i "$PEM_KEY" "$EC2_USER@$EC2_IP" << 'ENDSSH'
export PATH=$PATH:/usr/bin:/usr/local/bin
cd /home/ubuntu/kidokool-lms
echo "Installing dependencies..."
npm install --production=false --legacy-peer-deps
echo "Generating Prisma Client..."
npx prisma generate
echo "Synchronizing database schema..."
npx prisma db push --accept-data-loss
echo "Building application..."
npm run build
echo "Copying static assets to standalone folder..."
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
echo "Restarting application via PM2..."
pm2 restart kidokool-lms
echo "✓ Application restarted"
ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
