#!/bin/bash

# Hostinger VPS Deployment Script for KIDOKOOL LMS
# This script deploys the local code to the Hostinger VPS

set -e  # Exit on error

# Configuration
VPS_IP="147.93.29.199"
VPS_USER="root"
VPS_PASS="Bksun@1708@@"
APP_NAME="kidokool-lms"
REMOTE_DIR="/root/kidokool-lms"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  KIDOKOOL LMS - Hostinger Deployment  ${NC}"
echo -e "${BLUE}========================================${NC}"

# Ensure remote directory exists
echo -e "${GREEN}Creating remote directory...${NC}"
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" "mkdir -p $REMOTE_DIR"

# Rsync code (excluding node_modules and .next)
echo -e "${GREEN}Transferring code to VPS...${NC}"
sshpass -p "$VPS_PASS" rsync -avz --progress --exclude='node_modules' --exclude='.next' --exclude='.git' ./ "$VPS_USER@$VPS_IP:$REMOTE_DIR/"

# Deploy on VPS
echo -e "${GREEN}Building and starting application on VPS...${NC}"
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" << ENDSSH
set -e
cd $REMOTE_DIR

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Sync database schema
echo "Synchronizing database schema..."
npx prisma db push

# Build the application
echo "Building application..."
npm run build

# PM2 logic
echo "Restarting application with PM2..."
pm2 stop $APP_NAME || true
pm2 delete $APP_NAME || true
# Important: PORT 3000 as configured in Nginx
PORT=3000 pm2 start npm --name "$APP_NAME" -- start

echo "PM2 Status:"
pm2 status $APP_NAME
ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}Application URL: http://$VPS_IP${NC}"
