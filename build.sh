#!/bin/bash

# Build script for ShotDeckAI app

echo "🚀 Starting build process..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.18.0 or higher"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v)
echo "📦 Using Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run the build
echo "🏗️  Building the application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Output directory: ./out"
else
    echo "❌ Build failed!"
    exit 1
fi 