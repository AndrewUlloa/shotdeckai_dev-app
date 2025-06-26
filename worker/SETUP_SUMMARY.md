# 🎬 ShotDeckAI Image Cache Worker - Quick Setup

Everything is ready! Here's exactly what to do to get your persistent image caching working.

## 📋 What You Have Now

✅ **Complete Cloudflare Worker** with FAL integration  
✅ **Automatic KV caching** matching your local storage pattern  
✅ **Migration tool** to move existing cached images  
✅ **Integration guides** for seamless app connection  
✅ **Your MCP account ID** (`90ef8813b2a76f501305e3618331f70b`) pre-configured

## 🚀 5-Minute Setup

### Step 1: Run the Setup Script

```bash
cd worker
./setup-with-mcp.sh
```

This will:

- Install dependencies
- Create KV namespaces
- Update `wrangler.toml` with your MCP account
- Show you the exact commands to set secrets

### Step 2: Set Your Secrets

Run these commands and enter your values:

```bash
# Your FAL API key (from your .env.local)
npx wrangler secret put FAL_KEY

# Your account ID (already known from MCP)
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
# Enter: 90ef8813b2a76f501305e3618331f70b

# Get Cloudflare API token (Images permissions)
npx wrangler secret put CLOUDFLARE_API_TOKEN
# Get from: https://dash.cloudflare.com/profile/api-tokens

# Get Images account hash
npx wrangler secret put CLOUDFLARE_IMAGE_ACCOUNT_HASH
# Get from: https://dash.cloudflare.com -> Images
```

### Step 3: Test Locally

```bash
npm run dev
# Visit http://localhost:8787
# Try: http://localhost:8787/800x600/ninja-cat
```

### Step 4: Deploy

```bash
npm run deploy
# Your worker will be live at:
# https://shotdeck-image-cache.90ef8813b2a76f501305e3618331f70b.workers.dev
```

### Step 5: Migrate Existing Cache (Optional)

Open `worker/migrate-cache.html` in your browser to move your existing cached images.

## 🔗 Connect to Your App

Choose your integration approach:

### Option A: Quick Test (5 minutes)

Just change one URL in your app to test:

```typescript
// In components/story-input.tsx, replace:
const res = await fetch('/api/generateImage', {
// With:
const res = await fetch('https://your-worker-url.workers.dev/api/generateImage', {
```

### Option B: Production Integration (15 minutes)

Follow the complete guide in `INTEGRATION_GUIDE.md` for robust error handling and fallbacks.

## 📊 Expected Performance

| Scenario            | Local Storage   | Worker Cache | New Generation |
| ------------------- | --------------- | ------------ | -------------- |
| **Speed**           | ~10ms           | ~50ms        | ~3-5s          |
| **Persistence**     | ❌ Browser only | ✅ Forever   | ✅ Forever     |
| **Global Access**   | ❌ No           | ✅ Yes       | ✅ Yes         |
| **Mobile Friendly** | ⚠️ Limited      | ✅ Yes       | ✅ Yes         |

## 🎯 Your Caching Strategy

The worker preserves your exact caching pattern:

```json
// Your current localStorage:
{
  "pizza o": "https://v3.fal.media/files/tiger/ykLjJAo1rB_9u5rTSnvJo.png",
  "pizza on": "https://v3.fal.media/files/elephant/ctO_Yyu8fl8lpR59aQ_B8.png",
  "pizza on ear": "https://v3.fal.media/files/penguin/GPmpPAQ6gYyH5Ml_NuxFy.png"
}

// Worker KV storage:
{
  "prompt:pizza o": "cloudflare-image-id-1",
  "prompt:pizza on": "cloudflare-image-id-2",
  "prompt:pizza on ear": "cloudflare-image-id-3"
}
```

But with **persistent URLs** that work forever:

```
https://imagedelivery.net/your-hash/cloudflare-image-id-1/public
```

## 🌟 What You Get

### ✅ **Persistent Images**

- Images stored forever in Cloudflare's global network
- No more "image not found" errors after FAL URLs expire
- Global CDN delivery for lightning-fast loading

### ✅ **Same UX, Better Performance**

- Progressive typing still works ("pizza" → "pizza on" → "pizza on table")
- Local cache for instant responses
- Worker cache for global persistence
- Fallback to generation when needed

### ✅ **Professional Infrastructure**

- Cloudflare's 99.9% uptime SLA
- Global edge locations
- Automatic image optimization
- Built-in transformations (resize, crop, format conversion)

### ✅ **Cost-Effective**

- Cloudflare Workers: 100,000 requests/day free
- Cloudflare Images: 100,000 images free
- KV storage: 10GB free
- More than enough for your app! 💰

## 🔍 Monitoring & Debugging

```bash
# View real-time logs
npm run tail

# Check secrets are configured
npx wrangler secret list

# Test specific endpoints
curl https://your-worker-url.workers.dev/800x600/test-image
```

## 🚨 Troubleshooting

**Worker not responding?**

- Check secrets are set: `npx wrangler secret list`
- Verify account ID in `wrangler.toml`
- Check logs: `npm run tail`

**Images not generating?**

- Verify FAL_KEY is correct
- Check Cloudflare API token permissions
- Test locally first: `npm run dev`

**Cache not working?**

- Verify KV namespace IDs in `wrangler.toml`
- Check browser network tab for 200 responses

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Worker homepage loads at your worker URL
2. ✅ Test image generates: `/800x600/ninja-cat`
3. ✅ Second request for same image is instant (cached)
4. ✅ Images persist after browser refresh
5. ✅ Your app works with new API endpoints

## 📞 Next Steps

1. **Run the setup** - `./setup-with-mcp.sh`
2. **Test locally** - Generate a few test images
3. **Deploy** - `npm run deploy`
4. **Integrate** - Update your app (start with Option A)
5. **Monitor** - Watch performance with `npm run tail`
6. **Migrate** - Move existing cache when ready

## 🎬 The Result

Your ShotDeckAI app will now have:

- **Zero image expiration** - Images persist forever
- **Global performance** - Fast loading worldwide
- **Progressive enhancement** - Same great UX, better reliability
- **Scalable infrastructure** - Handles growth automatically

**Your placeholder zoo is ready!** 🦁🦒🐧

Need help? Check the detailed guides:

- `DEPLOYMENT_GUIDE.md` - Complete setup instructions
- `INTEGRATION_GUIDE.md` - App integration options
- `README.md` - Technical documentation

Let's make those storyboard images persistent! 🚀✨
