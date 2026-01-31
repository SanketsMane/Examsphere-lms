#!/bin/bash

# SSL Setup Script for KIDOKOOL LMS on EC2
# Author: Sanket
# This script sets up Nginx with Let's Encrypt SSL certificate

set -e

# Configuration
DOMAIN="kidokool.xyz"
WWW_DOMAIN="www.kidokool.xyz"
EMAIL="bksun170882@gmail.com"
APP_PORT="3000"

echo "========================================="
echo "  SSL Setup for KIDOKOOL LMS"
echo "========================================="
echo ""
echo "Domain: $DOMAIN"
echo "WWW Domain: $WWW_DOMAIN"
echo "Email: $EMAIL"
echo "App Port: $APP_PORT"
echo ""
echo "This script will:"
echo "1. Install Nginx"
echo "2. Install Certbot (Let's Encrypt)"
echo "3. Configure Nginx as reverse proxy"
echo "4. Obtain SSL certificate"
echo "5. Set up auto-renewal"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# Update system
echo "Updating system packages..."
sudo apt update

# Install Nginx
echo "Installing Nginx..."
sudo apt install -y nginx

# Install Certbot
echo "Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Stop Nginx temporarily
sudo systemctl stop nginx

# Create initial HTTP-only Nginx configuration (for Let's Encrypt validation)
echo "Creating initial Nginx configuration..."
sudo tee /etc/nginx/sites-available/kidokool > /dev/null <<EOF
# Initial HTTP configuration for Let's Encrypt validation
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;
    
    # Let's Encrypt validation
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Temporary proxy to app
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/kidokool /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Start Nginx
echo "Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

# Obtain SSL certificate
echo ""
echo "========================================="
echo "  Obtaining SSL Certificate"
echo "========================================="
echo ""
echo "IMPORTANT: Make sure your domain DNS is pointing to this server!"
echo "A Record: $DOMAIN -> $(curl -s ifconfig.me)"
echo "A Record: $WWW_DOMAIN -> $(curl -s ifconfig.me)"
echo ""
read -p "DNS configured? Continue with SSL? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Obtain certificate and let Certbot configure Nginx
    echo "Obtaining SSL certificate..."
    sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect
    
    # Test auto-renewal
    echo "Testing SSL auto-renewal..."
    sudo certbot renew --dry-run
    
    echo ""
    echo "========================================="
    echo "  SSL Setup Complete!"
    echo "========================================="
    echo ""
    echo "Your site is now available at:"
    echo "  https://$DOMAIN"
    echo "  https://$WWW_DOMAIN"
    echo ""
    echo "SSL certificate will auto-renew before expiration."
    echo ""
else
    echo ""
    echo "SSL certificate not obtained."
    echo "Your site is running on HTTP at:"
    echo "  http://$DOMAIN"
    echo ""
    echo "To get SSL later, run:"
    echo "  sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
    echo ""
fi

# Show status
echo "Nginx status:"
sudo systemctl status nginx --no-pager

echo ""
echo "========================================="
echo "  Next Steps"
echo "========================================="
echo ""
echo "1. Update your .env file with HTTPS URL:"
echo "   BETTER_AUTH_URL=https://$DOMAIN"
echo ""
echo "2. Rebuild and restart your app:"
echo "   cd /home/ubuntu/kidokool-lms"
echo "   npm run build"
echo "   pm2 restart kidokool-lms"
echo ""
echo "3. Test your site:"
echo "   https://$DOMAIN"
echo ""
