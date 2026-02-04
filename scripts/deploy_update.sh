#!/bin/bash

echo "🚀 Starting Deployment..."

# 1. Pull latest changes
echo "⬇️ Pulling latest changes..."
git pull origin main

# 2. Install dependencies (in case of new packages)
echo "📦 Installing dependencies..."
npm install

# 3. Generate Prisma Client
echo "🧬 Generating Prisma Client..."
npx prisma generate

# 4. Migrate Database (Critical for new indexes)
echo "🗄️ Applying database migrations..."
npx prisma migrate deploy

# 5. Build Application
echo "🏗️ Building application..."
npm run build

# 6. Restart Server (assuming PM2 is used, otherwise manual restart needed)
echo "♻️ Restarting server..."
if command -v pm2 &> /dev/null; then
    pm2 reload all
    echo "✅ PM2 Reloaded"
else
    echo "⚠️ PM2 not found. Please restart your Next.js server manually."
    echo "Example: npm run start"
fi

echo "✅ Deployment Complete! Changes should be live."
