#!/bin/bash

# AletheianDocs - Vercel Deployment Script
# Created by Marwen Deiparine

echo "🚀 Deploying AletheianDocs to Vercel..."
echo "==========================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Logging in to Vercel..."
vercel login

# Deploy the application
echo "🚀 Deploying application..."
vercel --prod

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📝 Next steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - DATABASE_PUBLIC_URL: postgresql://postgres:bfElHUFOeBPnOvaIyesVJlzQUXRMfrJM@caboose.proxy.rlwy.net:58151/railway"
echo "   - NEXT_OPENWEATHER_API_KEY: 0eb62c55fecf8ba6269b46e8d04d67ba"
echo "   - JWT_SECRET: aletheiandocs_vercel_secret_2024_marwen"
echo "   - NODE_ENV: production"
echo ""
echo "2. Visit your deployed site and test the features"
echo "3. Login as admin (username: admin, password: admin123)"
echo ""
echo "🎉 AletheianDocs is now live on Vercel!"