#!/bin/bash
# ==============================================
# SSL Certificate Setup with Let's Encrypt
# ==============================================

set -e

echo "🔒 Setting up SSL certificates with Let's Encrypt..."

# Check if .env.prod exists
if [ ! -f .env.prod ]; then
    echo "❌ Error: .env.prod file not found!"
    exit 1
fi

# Load environment variables
export $(cat .env.prod | grep -v '^#' | xargs)

# Validate required variables
if [ -z "$DOMAIN" ] || [ -z "$API_DOMAIN" ] || [ -z "$SSL_EMAIL" ]; then
    echo "❌ Error: DOMAIN, API_DOMAIN, and SSL_EMAIL must be set in .env.prod"
    exit 1
fi

echo "📧 Email: $SSL_EMAIL"
echo "🌐 Domains: $DOMAIN, www.$DOMAIN, $API_DOMAIN"

# Install certbot if not present
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot
fi

# Stop nginx temporarily
echo "🛑 Stopping nginx..."
docker-compose -f docker-compose.prod.yml stop nginx

# Obtain certificates
echo "🔑 Obtaining SSL certificates..."
sudo certbot certonly --standalone \
    --email $SSL_EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN \
    -d $API_DOMAIN

# Copy certificates to nginx directory
echo "📋 Copying certificates..."
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem

# Restart nginx
echo "🚀 Starting nginx..."
docker-compose -f docker-compose.prod.yml up -d nginx

echo ""
echo "✅ SSL certificates installed successfully!"
echo ""
echo "📝 Certificate renewal:"
echo "   Certificates will expire in 90 days."
echo "   Set up a cron job to run: certbot renew --quiet"
echo ""
echo "   Example cron job (runs daily at 3am):"
echo "   0 3 * * * certbot renew --quiet && cd $(pwd) && ./scripts/ssl-setup.sh"
echo ""
