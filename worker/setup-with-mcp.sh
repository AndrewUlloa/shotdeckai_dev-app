#!/bin/bash

# ShotDeckAI Image Cache Worker Setup with MCP
# Uses your existing Cloudflare MCP configuration

set -e

echo "🎬 Setting up ShotDeckAI Image Cache Worker with MCP..."
echo "Using Cloudflare Account: 427699ca78bfbbfa80d62636b0d962c0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the worker directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the worker/ directory${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🔧 Setting up KV namespaces...${NC}"

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  wrangler not found globally, using local version...${NC}"
    WRANGLER="npx wrangler"
else
    WRANGLER="wrangler"
fi

# Create KV namespaces
echo "Creating IMAGE_CACHE namespace for production..."
PROD_NAMESPACE_OUTPUT=$($WRANGLER kv:namespace create "IMAGE_CACHE" 2>&1)
PROD_NAMESPACE_ID=$(echo "$PROD_NAMESPACE_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo "Creating IMAGE_CACHE namespace for preview..."
PREVIEW_NAMESPACE_OUTPUT=$($WRANGLER kv:namespace create "IMAGE_CACHE" --preview 2>&1)
PREVIEW_NAMESPACE_ID=$(echo "$PREVIEW_NAMESPACE_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)

echo -e "${GREEN}✅ Created namespaces:${NC}"
echo "  Production ID: $PROD_NAMESPACE_ID"
echo "  Preview ID: $PREVIEW_NAMESPACE_ID"

# Update wrangler.toml with the correct namespace IDs and account
echo -e "${BLUE}📝 Updating wrangler.toml...${NC}"

cat > wrangler.toml << EOF
# Cloudflare Worker for ShotDeckAI Image Caching
name = "shotdeck-image-cache"
main = "src/index.ts"
compatibility_date = "2024-09-27"
compatibility_flags = ["nodejs_compat"]

# Using your correct account ID  
account_id = "427699ca78bfbbfa80d62636b0d962c0"

# KV namespace for caching image metadata
[[kv_namespaces]]
binding = "IMAGE_CACHE"
preview_id = "$PREVIEW_NAMESPACE_ID"
id = "$PROD_NAMESPACE_ID"
EOF

echo -e "${GREEN}✅ Updated wrangler.toml with your MCP account${NC}"

echo -e "${YELLOW}🔐 Now you need to set up secrets...${NC}"
echo "Please run these commands one by one and enter the values when prompted:"
echo ""
echo -e "${BLUE}# Your FAL API key (same one from your .env.local)${NC}"
echo "$WRANGLER secret put FAL_KEY"
echo ""
echo -e "${BLUE}# Your Cloudflare Account ID (already set from MCP)${NC}"
echo "$WRANGLER secret put CLOUDFLARE_ACCOUNT_ID"
echo "  Enter: 427699ca78bfbbfa80d62636b0d962c0"
echo ""
echo -e "${BLUE}# Cloudflare API Token (with Images permissions)${NC}"
echo "$WRANGLER secret put CLOUDFLARE_API_TOKEN"
echo "  Get from: https://dash.cloudflare.com/profile/api-tokens"
echo "  Use the 'Read and write to Cloudflare Stream and Images' template"
echo ""
echo -e "${BLUE}# Cloudflare Images Account Hash${NC}"
echo "$WRANGLER secret put CLOUDFLARE_IMAGE_ACCOUNT_HASH"
echo "  Get from: https://dash.cloudflare.com -> Images -> Account Hash"
echo ""

echo -e "${YELLOW}💡 Quick setup commands:${NC}"
echo "Once you have all the values, you can set them up quickly:"
echo ""
echo "# Test locally:"
echo "npm run dev"
echo ""
echo "# Deploy to production:"
echo "npm run deploy"
echo ""
echo "# View logs:"
echo "npm run tail"

echo -e "${GREEN}🎉 Setup script completed!${NC}"
echo -e "${BLUE}Your worker will be available at: https://shotdeck-image-cache.427699ca78bfbbfa80d62636b0d962c0.workers.dev${NC}"

echo ""
echo -e "${YELLOW}📋 Integration with your app:${NC}"
echo "Once deployed, you can use the worker in two ways:"
echo ""
echo "1. As a drop-in replacement for your current API:"
echo "   Change your fetch URL from '/api/generateImage' to:"
echo "   'https://your-worker-url.workers.dev/api/generateImage'"
echo ""
echo "2. As a placeholder image service:"
echo "   Use URLs like: https://your-worker-url.workers.dev/800x600/ninja-cat"
echo ""
echo "The worker will cache images just like your local app,"
echo "but they'll persist in Cloudflare Images forever! 🚀" 