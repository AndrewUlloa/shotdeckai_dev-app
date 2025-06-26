# 🚀 ShotDeckAI Image Cache Worker - Deployment Guide

This guide walks you through deploying your image caching worker that uses FAL AI and Cloudflare's caching infrastructure.

## Prerequisites

- Cloudflare account (free tier works!)
- FAL AI account with API key
- Node.js installed locally

## Step 1: Install Dependencies

Navigate to the worker directory and install dependencies:

```bash
cd worker
npm install
```

## Step 2: Set Up Cloudflare Account

### Get Your Cloudflare Account ID

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Copy your Account ID from the right sidebar

### Create API Token for Cloudflare Images

1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Read and write to Cloudflare Stream and Images" template
4. Add account resource: `Include - All accounts`
5. Add zone resources: `Include - All zones`
6. Continue to summary and create token
7. **Save this token securely** - you won't see it again

### Get Your Cloudflare Images Account Hash

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click "Images" in the left sidebar
3. Copy the "Account Hash" from the right side

## Step 3: Create KV Namespaces

Create KV namespaces for caching image metadata:

```bash
# Create production namespace
npx wrangler kv:namespace create "IMAGE_CACHE"

# Create preview namespace for development
npx wrangler kv:namespace create "IMAGE_CACHE" --preview
```

**Important:** Update `wrangler.toml` with the namespace IDs from the output:

```toml
[[kv_namespaces]]
binding = "IMAGE_CACHE"
preview_id = "your-preview-namespace-id-here"
id = "your-production-namespace-id-here"
```

## Step 4: Configure Secrets

Set up environment variables using Wrangler:

```bash
# Your FAL API key (same one you use in your Next.js app)
npx wrangler secret put FAL_KEY

# Your Cloudflare Account ID
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID

# Your Cloudflare API Token (from Step 2)
npx wrangler secret put CLOUDFLARE_API_TOKEN

# Your Cloudflare Images Account Hash (from Step 2)
npx wrangler secret put CLOUDFLARE_IMAGE_ACCOUNT_HASH
```

## Step 5: Test Locally

Run the worker locally to test:

```bash
npm run dev
```

Visit [localhost:8787](http://localhost:8787) to see the homepage.

Test image generation:

- [localhost:8787/800x600/ninja-cat](http://localhost:8787/800x600/ninja-cat)
- [localhost:8787/512x512/space-dog](http://localhost:8787/512x512/space-dog)

## Step 6: Deploy to Cloudflare

Deploy your worker:

```bash
npm run deploy
```

You'll get a URL like: `https://shotdeck-image-cache.your-subdomain.workers.dev`

## Step 7: Test Production

Test your deployed worker:

1. Visit the worker URL to see the homepage
2. Try generating an image: `https://your-worker-url.workers.dev/800x600/robot-unicorn`
3. Check that subsequent requests are fast (cached)
4. Try the `?redo` parameter to bypass cache

## Monitoring

View real-time logs:

```bash
npm run tail
```

Check secrets are configured:

```bash
npx wrangler secret list
```

## Troubleshooting

### Common Issues

**"KV namespace not found"**

- Run the KV setup commands and update `wrangler.toml`

**"Unauthorized" errors**

- Check your API tokens have correct permissions
- Verify account ID is correct

**"Failed to upload to Cloudflare Images"**

- Ensure your API token has Images write permissions
- Check your account hash is correct

**Images not generating**

- Verify your FAL_KEY is set correctly
- Check worker logs with `npm run tail`

### Performance Tips

- First generation: ~3-5 seconds (cold start)
- Cached images: ~50ms response time
- Images persist indefinitely in Cloudflare Images
- Global CDN distribution for fast serving

## Usage Examples

Once deployed, your worker creates a placeholder image service:

```
GET /800x600/sunglasses-sloth
GET /512x512/ninja-penguin
GET /1024x768/robot-unicorn
GET /400x300/psychic-cat?redo  # Bypass cache
```

Perfect for:

- Placeholder images in designs
- Testing responsive layouts
- Storyboard mockups
- Creative inspiration

## Integration with Your App

You can now use your worker URLs in your ShotDeckAI app for placeholder images:

```tsx
<Image
  src="https://your-worker.workers.dev/800x600/placeholder-scene"
  alt="Placeholder"
  width={800}
  height={600}
/>
```

The images will match your app's storyboard aesthetic and load lightning fast! 🎬⚡
