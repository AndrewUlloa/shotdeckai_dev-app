# ShotDeckAI Image Cache Worker

A Cloudflare Worker that generates and caches AI-generated placeholder images using FAL AI and Cloudflare Images.

## Features

- 🎨 Generates images using FAL AI's Flux Schnell model
- 💾 Caches images in Cloudflare Images for persistence
- ⚡ Fast serving with Cloudflare KV metadata caching
- 🔄 Dynamic image transformations (resizing, cropping)
- 🎬 Storyboard-style aesthetic matching ShotDeckAI's design

## Quick Start

### 1. Install Dependencies

```bash
cd worker
npm install
```

### 2. Set up KV Namespace

```bash
# Create KV namespace for production
npm run setup-kv

# Create KV namespace for preview/development
npm run setup-kv-preview
```

Update the namespace IDs in `wrangler.toml` with the output from these commands.

### 3. Configure Secrets

Set up your environment variables using Wrangler secrets:

```bash
# FAL API Key
npx wrangler secret put FAL_KEY

# Cloudflare Account ID (found in your Cloudflare dashboard)
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID

# Cloudflare API Token (Images Read/Write permissions)
npx wrangler secret put CLOUDFLARE_API_TOKEN

# Cloudflare Images Account Hash (found in Images dashboard)
npx wrangler secret put CLOUDFLARE_IMAGE_ACCOUNT_HASH
```

### 4. Development

```bash
# Run locally
npm run dev
```

### 5. Deploy

```bash
# Deploy to Cloudflare
npm run deploy
```

## Usage

### Generate Images

Visit URLs in the format: `https://your-worker.your-subdomain.workers.dev/WIDTHxHEIGHT/animal-description`

Examples:

- `/800x600/sunglasses-sloth` - Cool sloth with sunglasses
- `/512x512/ninja-penguin` - Stealthy penguin
- `/1024x768/psychic-goat` - Mystical goat

### Cache Control

- Add `?redo` to bypass cache and generate a new image
- Images are automatically cached for fast subsequent requests
- Transformations are applied dynamically by Cloudflare Images

## Architecture

1. **Request Processing**: Worker parses URL for dimensions and description
2. **Cache Check**: Looks up cached image ID in Cloudflare KV
3. **Image Generation**: Uses FAL AI if not cached
4. **Storage**: Uploads to Cloudflare Images for persistence
5. **Transformation**: Applies dynamic resizing/cropping
6. **Response**: Serves optimized image with appropriate headers

## API Integration

The worker uses the same FAL AI configuration as the main ShotDeckAI app:

- Model: `fal-ai/flux-1/schnell`
- Style: Digital storyboard with teal linework
- Optimized for fast generation (8 inference steps)
- Consistent with ShotDeckAI's visual aesthetic

## Monitoring

```bash
# View worker logs in real-time
npm run tail
```

## Troubleshooting

### Common Issues

1. **"namespace not found"** - Run the KV setup commands and update `wrangler.toml`
2. **"unauthorized"** - Check your API tokens and account IDs
3. **"failed to upload"** - Verify Cloudflare Images API token permissions

### Debug Tips

- Check worker logs with `npm run tail`
- Test locally with `npm run dev` before deploying
- Verify secrets are set with `npx wrangler secret list`

## Performance

- ⚡ Cached images: ~50ms response time
- 🚀 New generations: ~3-5 seconds (cold start)
- 💾 Storage: Persistent in Cloudflare Images
- 🌍 Edge serving: Global CDN distribution
