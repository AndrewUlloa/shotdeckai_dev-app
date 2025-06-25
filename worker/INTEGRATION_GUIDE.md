# 🔗 ShotDeckAI Worker Integration Guide

This guide shows you how to integrate your new Cloudflare Worker with your existing ShotDeckAI app for persistent image caching.

## 🎯 Integration Options

You have three ways to integrate the worker with your app:

### Option 1: Drop-in API Replacement (Recommended)

Replace your current API calls with the worker URL for instant persistence.

### Option 2: Fallback Caching

Use the worker as a fallback when local cache misses.

### Option 3: Hybrid Approach

Use local cache for speed, worker for persistence.

## 🚀 Option 1: Drop-in API Replacement

### Step 1: Update Environment Variables

Add your worker URL to your environment variables:

```bash
# .env.local
NEXT_PUBLIC_WORKER_URL=https://shotdeck-image-cache.your-subdomain.workers.dev
```

### Step 2: Create a Worker API Client

Create `lib/worker-client.ts`:

```typescript
interface WorkerResponse {
  url: string;
  error?: string;
}

class WorkerClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async generateImage(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generateImage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Worker error: ${response.status}`);
    }

    const result: WorkerResponse = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    return result.url;
  }

  async getPlaceholderImage(
    width: number,
    height: number,
    description: string
  ): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/${width}x${height}/${description}`
    );

    if (!response.ok) {
      throw new Error(`Placeholder error: ${response.status}`);
    }

    // Return the URL that was used to fetch the image
    return response.url;
  }
}

export const workerClient = new WorkerClient(
  process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787"
);
```

### Step 3: Update Your Story Input Component

Modify `components/story-input.tsx`:

```typescript
// Add this import
import { workerClient } from "@/lib/worker-client";

// Replace the generateImage query function:
const { isLoading, error } = useQuery({
  queryKey: ["generateImage", prompt, shouldGenerate],
  queryFn: async () => {
    onGenerationStart?.();

    // Use worker instead of local API
    const imageUrl = await workerClient.generateImage(prompt);

    if (imageUrl) {
      // Still save to local cache for instant access
      saveToCache(prompt, imageUrl);

      onImageGenerated(imageUrl);
      setLastGeneratedPrompt(prompt.trim().toLowerCase());
      setShouldGenerate(false);
      setUserState("settled");
    }

    return { url: imageUrl };
  },
  enabled: shouldGenerate && !!prompt.trim(),
  staleTime: Infinity,
  retry: 1,
});
```

## 🔄 Option 2: Fallback Caching

Keep your existing setup but add worker fallback:

```typescript
// In your generateImage query function:
queryFn: async () => {
  onGenerationStart?.();

  try {
    // Try local API first
    const res = await fetch('/api/generateImage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.url) {
        saveToCache(prompt, json.url);
        onImageGenerated(json.url);
        return json;
      }
    }
  } catch (error) {
    console.warn('Local API failed, trying worker:', error);
  }

  // Fallback to worker
  try {
    const imageUrl = await workerClient.generateImage(prompt);
    saveToCache(prompt, imageUrl);
    onImageGenerated(imageUrl);
    return { url: imageUrl };
  } catch (error) {
    console.error('Worker also failed:', error);
    throw error;
  }
},
```

## 🔀 Option 3: Hybrid Approach

Best of both worlds - local cache + worker persistence:

```typescript
// Create lib/hybrid-cache.ts
export class HybridCache {
  private workerClient: WorkerClient;

  constructor(workerUrl: string) {
    this.workerClient = new WorkerClient(workerUrl);
  }

  async getImage(prompt: string): Promise<string> {
    // 1. Check local cache first
    const localUrl = getCachedImage(prompt);
    if (localUrl) {
      console.log("Local cache hit:", prompt);
      return localUrl;
    }

    // 2. Check worker cache
    try {
      const workerUrl = await this.workerClient.generateImage(prompt);

      // Save to local cache for next time
      saveToCache(prompt, workerUrl);

      return workerUrl;
    } catch (error) {
      console.error("Hybrid cache failed:", error);
      throw error;
    }
  }
}

export const hybridCache = new HybridCache(
  process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787"
);
```

## 📱 Mobile Considerations

For mobile users with limited storage, prioritize the worker:

```typescript
// In your component:
const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
const preferWorker =
  isMobile || !localStorage.getItem("shotdeckai_image_cache");

// Use worker-first strategy on mobile
if (preferWorker) {
  // Use Option 1 (worker-first)
} else {
  // Use Option 3 (hybrid)
}
```

## 🔧 Environment Setup

### Development

```bash
# .env.local
NEXT_PUBLIC_WORKER_URL=http://localhost:8787
```

### Production

```bash
# .env.production
NEXT_PUBLIC_WORKER_URL=https://shotdeck-image-cache.your-subdomain.workers.dev
```

## 📊 Performance Monitoring

Add performance tracking:

```typescript
// In your component
const trackImageGeneration = (source: "local" | "worker", duration: number) => {
  console.log(`Image generated via ${source} in ${duration}ms`);

  // Add your analytics here
  // analytics.track('image_generation', { source, duration })
};

// Use in your query function:
const startTime = Date.now();
// ... generate image ...
const duration = Date.now() - startTime;
trackImageGeneration("worker", duration);
```

## 🐛 Error Handling

Robust error handling for production:

```typescript
const generateWithFallback = async (prompt: string) => {
  const errors: Error[] = [];

  // Try local first
  try {
    return await generateLocal(prompt);
  } catch (error) {
    errors.push(error as Error);
    console.warn("Local generation failed:", error);
  }

  // Try worker
  try {
    return await workerClient.generateImage(prompt);
  } catch (error) {
    errors.push(error as Error);
    console.error("Worker generation failed:", error);
  }

  // Both failed
  throw new Error(
    `All generation methods failed: ${errors.map((e) => e.message).join(", ")}`
  );
};
```

## 🎨 UI Updates

Show users where images are coming from:

```tsx
// Add cache source indicator
{
  isLoading && (
    <div className="flex items-center gap-2">
      <Spinner />
      <span>
        {cacheSource === "local"
          ? "⚡ Loading from cache..."
          : cacheSource === "worker"
          ? "☁️ Generating with AI..."
          : "🎨 Creating your storyboard..."}
      </span>
    </div>
  );
}
```

## 🚀 Migration Steps

1. **Deploy your worker** using `./setup-with-mcp.sh`
2. **Test locally** with `npm run dev` in the worker directory
3. **Migrate existing cache** using `migrate-cache.html`
4. **Update your app** with one of the integration options above
5. **Deploy to production** and update environment variables

## 💡 Pro Tips

- **Progressive Enhancement**: Start with Option 2 (fallback), then move to Option 1
- **Cache Warming**: Pre-populate worker cache with common prompts
- **Analytics**: Track cache hit rates to optimize performance
- **Monitoring**: Use `npm run tail` to monitor worker performance

Your images will now persist forever in Cloudflare's global network! 🌍✨
