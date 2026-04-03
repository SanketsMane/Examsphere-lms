#!/bin/bash
# Deploy nginx config updates to production VPS

set -e

echo "=== Deploying Nginx Config Updates ==="
echo "This script updates nginx configuration to allow 50MB POST bodies for settings forms."
echo ""
echo "Target: 147.93.29.199 (kidokool.xyz)"
echo ""

# Read SSH password (you'll be prompted)
read -sp "Enter VPS SSH password: " SSH_PASS
echo ""

# Function to run SSH commands
run_ssh() {
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no root@147.93.29.199 "$@"
}

echo "1. Pulling latest code..."
run_ssh "cd /root/kidokool-lms && git pull origin main"

echo "2. Copying updated nginx config..."
run_ssh "cp /root/kidokool-lms/nginx-vps.conf /etc/nginx/sites-available/kidokool.xyz"

echo "3. Testing nginx config..."
run_ssh "nginx -t"

echo "4. Reloading nginx..."
run_ssh "systemctl reload nginx"

echo "5. Verifying deployment..."
run_ssh "curl -s http://localhost:3000 > /dev/null && echo 'App is responding'"

echo ""
echo "✅ Deployment complete!"
echo "The settings page should now accept base64-encoded images up to 50MB."
