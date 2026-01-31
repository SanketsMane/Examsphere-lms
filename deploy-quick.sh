#!/bin/bash

# Quick deployment script - Skip DB migration, just pull and rebuild
# Author: Sanket

set -e

EC2_IP="16.176.20.69"
EC2_USER="ubuntu"
PEM_KEY="/Users/sanket/Documents/Kidokool-LMS/Kidokool-latest-key.pem"
REMOTE_DIR="/home/ubuntu/kidokool-lms"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Quick Deployment - Email Templates${NC}"
echo -e "${BLUE}========================================${NC}"

chmod 400 "$PEM_KEY"

echo -e "${GREEN}Deploying to EC2...${NC}"
ssh -i "$PEM_KEY" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd /home/ubuntu/kidokool-lms

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Building application..."
npm run build

echo "Restarting PM2..."
pm2 restart kidokool-lms

echo "✓ Deployment complete!"
pm2 status kidokool-lms

ENDSSH

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}Application URL: http://$EC2_IP:3000${NC}"
echo -e "${GREEN}========================================${NC}"
