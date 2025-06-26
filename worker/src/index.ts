/// <reference types="@cloudflare/workers-types" />

import { uploadToCloudflareImages } from './image-uploader'
import { generateStoryboardImage } from './image-generator'
import type { Env } from './types'

export type { Env } from './types'

// Enhanced logging utility for Workers Logs dashboard
function logWithContext(level: 'info' | 'warn' | 'error', requestId: string, message: string, metadata?: Record<string, unknown>, env?: Env) {
  const enableLogging = env?.ENABLE_REQUEST_LOGGING !== 'false';
  
  if (!enableLogging) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    service: 'shotdeck-image-cache',
    ...(metadata && { metadata })
  };
  
  // Use structured logging for Workers Logs dashboard
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const requestId = Math.random().toString(36).substring(7);
    const requestStartTime = Date.now();
    
    // Add CORS headers for calls from your Next.js app
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Enhanced request logging for Workers Logs
    logWithContext('info', requestId, '🔧 [WORKER] New request started', {
      method: request.method,
      path: url.pathname,
      userAgent: request.headers.get('User-Agent'),
      cf: {
        colo: request.cf?.colo,
        country: request.cf?.country,
        ray: request.cf?.ray
      }
    }, env);

    try {
      let response: Response;

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        logWithContext('info', requestId, '🔧 [WORKER] Handling OPTIONS preflight', {}, env);
        response = new Response(null, { headers: corsHeaders });
      }
      // Utility endpoint: Check if prompt is cached
      else if (url.pathname === '/api/checkCache' && request.method === 'POST') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: checkCache', {}, env);
        response = await handleCheckCache(request, env, corsHeaders, requestId);
      }
      // Utility endpoint: Upload FAL URL to Cloudflare Images  
      else if (url.pathname === '/api/uploadImage' && request.method === 'POST') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: uploadImage', {}, env);
        response = await handleUploadImage(request, env, corsHeaders, requestId);
      }
      // NEW: Full image generation endpoint
      else if (url.pathname === '/api/generateImage' && request.method === 'POST') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: generateImage', {}, env);
        response = await handleGenerateImage(request, env, corsHeaders, requestId);
      }
      // Semantic Cache: Manually expand cache for a prompt
      else if (url.pathname === '/api/expandCache' && request.method === 'POST') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: expandCache', {}, env);
        response = await handleExpandCache(request, env, corsHeaders, requestId);
      }
      // Semantic Cache: Get cache performance statistics
      else if (url.pathname === '/api/cacheStats' && request.method === 'GET') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: cacheStats', {}, env);
        response = await handleCacheStats(request, env, corsHeaders, requestId);
      }
      // Predictive Cache: Generate prompt predictions
      else if (url.pathname === '/api/predictPrompts' && request.method === 'POST') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: predictPrompts', {}, env);
        response = await handlePredictPrompts(request, env, corsHeaders, requestId);
      }
      // Clustering: Analyze cache clusters for optimization
      else if (url.pathname === '/api/analyzeClusters' && request.method === 'GET') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: analyzeClusters', {}, env);
        response = await handleAnalyzeClusters(request, env, corsHeaders, requestId);
      }
      // User Analytics: Track user behavior and patterns
      else if (url.pathname === '/api/userAnalytics' && request.method === 'GET') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: userAnalytics', {}, env);
        response = await handleUserAnalytics(request, env, corsHeaders, requestId);
      }
      // User Analytics: Track typing patterns
      else if (url.pathname === '/api/trackTyping' && request.method === 'POST') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: trackTyping', {}, env);
        response = await handleTrackTyping(request, env, corsHeaders, requestId);
      }
      // Simple status endpoint
      else if (url.pathname === '/') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: status', {}, env);
        response = new Response('ShotDeckAI Image Persistence Service - Ready', {
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      }
      else {
        logWithContext('warn', requestId, '❌ [WORKER] Route not found', { path: url.pathname }, env);
        response = new Response('Not Found', { status: 404, headers: corsHeaders });
      }

      const totalDuration = Date.now() - requestStartTime;
      logWithContext('info', requestId, '✅ [WORKER] Request completed', {
        status: response.status,
        duration: totalDuration,
        path: url.pathname
      }, env);

      return response;

    } catch (error) {
      const totalDuration = Date.now() - requestStartTime;
      logWithContext('error', requestId, '💥 [WORKER] Unhandled error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration: totalDuration,
        path: url.pathname
      }, env);

      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
}

// Check if a prompt is already cached
async function handleCheckCache(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  const startTime = Date.now();
  
  try {
    const body = await request.json() as { prompt?: string }
    const { prompt } = body

    logWithContext('info', requestId, '🔍 [CACHE] Checking cache', { prompt }, env);

    if (!prompt || typeof prompt !== 'string') {
      logWithContext('warn', requestId, '❌ [CACHE] Invalid prompt provided', { prompt }, env);
      return new Response(JSON.stringify({ error: "Prompt is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use the same caching pattern as your localStorage
    const cacheKey = prompt.trim().toLowerCase()
    
    // Check KV cache
    const kvStartTime = Date.now();
    const cachedImageData = await env.IMAGE_CACHE.get(cacheKey)
    const kvDuration = Date.now() - kvStartTime;
    
    if (cachedImageData) {
      const imageData = JSON.parse(cachedImageData)
      const totalDuration = Date.now() - startTime;
      
      logWithContext('info', requestId, '✅ [CACHE] Cache HIT', {
        cacheKey,
        kvDuration,
        totalDuration,
        imageId: imageData.cloudflareImageId,
        timestamp: imageData.timestamp
      }, env);
      
      return new Response(JSON.stringify({ 
        cached: true, 
        url: imageData.persistentUrl,
        timestamp: imageData.timestamp 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const totalDuration = Date.now() - startTime;
    logWithContext('info', requestId, '❌ [CACHE] Cache MISS', {
      cacheKey,
      kvDuration,
      totalDuration
    }, env);

    return new Response(JSON.stringify({ cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    logWithContext('error', requestId, '💥 [CACHE] Error during cache check', {
      error: error instanceof Error ? error.message : String(error),
      duration: totalDuration
    }, env);
    
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Upload a FAL URL to Cloudflare Images and cache it
async function handleUploadImage(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  const startTime = Date.now();
  
  try {
    const body = await request.json() as { prompt?: string; falUrl?: string }
    const { prompt, falUrl } = body

    logWithContext('info', requestId, '💾 [UPLOAD] Starting upload process', {
      prompt,
      falUrl
    }, env);

    if (!prompt || !falUrl) {
      logWithContext('warn', requestId, '❌ [UPLOAD] Missing required fields', {
        hasPrompt: !!prompt,
        hasFalUrl: !!falUrl
      }, env);
      
      return new Response(JSON.stringify({ error: "Prompt and falUrl are required" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Upload the FAL image to Cloudflare Images for persistence
    const uploadStartTime = Date.now();
    const cloudflareImageId = await uploadToCloudflareImages(falUrl, env)
    const uploadDuration = Date.now() - uploadStartTime;
    
    logWithContext('info', requestId, '✅ [UPLOAD] Cloudflare upload completed', {
      uploadDuration,
      cloudflareImageId
    }, env);

    // Create the persistent URL
    const persistentUrl = `https://imagedelivery.net/${env.CLOUDFLARE_IMAGE_ACCOUNT_HASH}/${cloudflareImageId}/public`

    // Cache both URLs with the same key pattern as localStorage
    const cacheKey = prompt.trim().toLowerCase()
    const cacheData = {
      originalFalUrl: falUrl,
      cloudflareImageId: cloudflareImageId,
      persistentUrl: persistentUrl,
      timestamp: Date.now()
    }

    const cacheStartTime = Date.now();
    await env.IMAGE_CACHE.put(cacheKey, JSON.stringify(cacheData))
    const cacheDuration = Date.now() - cacheStartTime;
    
    const totalDuration = Date.now() - startTime;
    
    logWithContext('info', requestId, '🎉 [UPLOAD] Upload and cache complete', {
      cacheKey,
      uploadDuration,
      cacheDuration,
      totalDuration,
      cloudflareImageId,
      persistentUrl
    }, env);

    return new Response(JSON.stringify({ 
      success: true,
      persistentUrl: persistentUrl,
      cloudflareImageId: cloudflareImageId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    logWithContext('error', requestId, '💥 [UPLOAD] Upload failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: totalDuration
    }, env);
    
    let errorMessage = "Failed to upload image"
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Full image generation with semantic cache integration
async function handleGenerateImage(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  try {
    const body = await request.json() as { prompt?: string }
    const { prompt } = body

    logWithContext('info', requestId, '🎨 [GENERATE] Starting semantic-enabled generation', { prompt }, env);

    if (!prompt || typeof prompt !== 'string') {
      logWithContext('warn', requestId, '❌ [GENERATE] Invalid prompt provided', { prompt }, env);
      return new Response(JSON.stringify({ error: "Prompt is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use the new semantic cache-enabled generation function
    const response = await generateStoryboardImage(prompt, env, requestId);
    const result = await response.json();
    
    // Add CORS headers to the response
    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logWithContext('error', requestId, '💥 [GENERATE] Generation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, env);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Failed to generate image",
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Manually expand semantic cache for a prompt and image
async function handleExpandCache(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  try {
    const body = await request.json() as { prompt?: string; imageUrl?: string; cloudflareImageId?: string }
    const { prompt, imageUrl, cloudflareImageId } = body

    logWithContext('info', requestId, '🧠 [EXPAND] Manual cache expansion requested', { prompt }, env);

    if (!prompt || !imageUrl || !cloudflareImageId) {
      return new Response(JSON.stringify({ 
        error: "Prompt, imageUrl, and cloudflareImageId are required" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Import the semantic cache functions
    const { expandSemanticCache } = await import('./semantic-cache');
    
    // Trigger expansion
    await expandSemanticCache(prompt, imageUrl, cloudflareImageId, env, requestId);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Semantic cache expansion completed",
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logWithContext('error', requestId, '💥 [EXPAND] Cache expansion failed', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Failed to expand cache",
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Get cache performance statistics
async function handleCacheStats(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  try {
    logWithContext('info', requestId, '📊 [STATS] Cache statistics requested', {}, env);

    // List all cache keys to analyze
    const keys = await env.IMAGE_CACHE.list();
    const allEntries = [];
    
    // Fetch a sample of cache entries for analysis
    const sampleSize = Math.min(keys.keys.length, 100); // Limit to avoid timeouts
    for (let i = 0; i < sampleSize; i++) {
      const key = keys.keys[i];
      const value = await env.IMAGE_CACHE.get(key.name);
      if (value) {
        try {
          const entry = JSON.parse(value);
          allEntries.push({
            key: key.name,
            ...entry
          });
        } catch {
          // Skip invalid entries
        }
      }
    }

    // Analyze cache statistics
    const stats = {
      totalEntries: keys.keys.length,
      analyzedEntries: allEntries.length,
      semanticVariations: allEntries.filter(e => e.isSemanticVariation).length,
      originalPrompts: allEntries.filter(e => !e.isSemanticVariation).length,
      clusters: {},
      oldestEntry: allEntries.length > 0 ? Math.min(...allEntries.map(e => e.timestamp || 0)) : null,
      newestEntry: allEntries.length > 0 ? Math.max(...allEntries.map(e => e.timestamp || 0)) : null,
      averageAge: 0
    };

    // Calculate cluster statistics
    const clusterCounts: Record<string, number> = {};
    for (const entry of allEntries) {
      if (entry.semanticCluster) {
        clusterCounts[entry.semanticCluster] = (clusterCounts[entry.semanticCluster] || 0) + 1;
      }
    }
    stats.clusters = clusterCounts;

    // Calculate average age
    const now = Date.now();
    const totalAge = allEntries.reduce((sum, entry) => {
      return sum + (now - (entry.timestamp || 0));
    }, 0);
    stats.averageAge = allEntries.length > 0 ? totalAge / allEntries.length : 0;

    logWithContext('info', requestId, '📊 [STATS] Cache statistics calculated', {
      totalEntries: stats.totalEntries,
      semanticVariations: stats.semanticVariations,
      clusterCount: Object.keys(stats.clusters).length
    }, env);

    return new Response(JSON.stringify({ 
      success: true,
      stats,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logWithContext('error', requestId, '💥 [STATS] Statistics calculation failed', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Failed to calculate cache statistics",
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Generate predictive prompt completions
async function handlePredictPrompts(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  try {
    const body = await request.json() as { 
      partial?: string; 
      sessionId?: string; 
      userAgent?: string 
    }
    const { partial, sessionId, userAgent } = body

    logWithContext('info', requestId, '🔮 [PREDICT] Prediction request received', { 
      partial, 
      sessionId 
    }, env);

    if (!partial || typeof partial !== 'string') {
      return new Response(JSON.stringify({ 
        error: "Partial input is required" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Import predictive cache functions
    const { analyzeTypingPattern } = await import('./predictive-cache');
    
    // Analyze typing pattern and generate predictions
    const result = await analyzeTypingPattern({
      partial,
      timestamp: Date.now(),
      sessionId: sessionId || 'anonymous',
      userAgent
    }, env, requestId);
    
    return new Response(JSON.stringify({ 
      success: true,
      predictions: result.predictions,
      confidence: result.confidence,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logWithContext('error', requestId, '💥 [PREDICT] Prediction failed', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Failed to generate predictions",
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Analyze cache clusters for optimization opportunities
async function handleAnalyzeClusters(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  try {
    logWithContext('info', requestId, '🔍 [CLUSTER] Cluster analysis requested', {}, env);

    // Import clustering functions
    const { analyzeCacheClusters } = await import('./clustering');
    
    // Perform cluster analysis
    const analysis = await analyzeCacheClusters(env, requestId);
    
    return new Response(JSON.stringify({ 
      success: true,
      analysis,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logWithContext('error', requestId, '💥 [CLUSTER] Cluster analysis failed', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Failed to analyze clusters",
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Get user behavior analytics
async function handleUserAnalytics(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  try {
    logWithContext('info', requestId, '📈 [ANALYTICS] User analytics requested', {}, env);

    // Import user analytics functions
    const { analyzeUserBehavior } = await import('./user-analytics');
    
    // Perform user behavior analysis
    const analytics = await analyzeUserBehavior(env, requestId);
    
    return new Response(JSON.stringify({ 
      success: true,
      analytics,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logWithContext('error', requestId, '💥 [ANALYTICS] User analytics failed', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Failed to analyze user behavior",
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Track user typing patterns
async function handleTrackTyping(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  try {
    const body = await request.json() as { 
      partial?: string;
      sessionId?: string;
      duration?: number;
      finalPrompt?: string;
      abandoned?: boolean;
    }
    const { partial, sessionId, duration, finalPrompt, abandoned } = body

    logWithContext('info', requestId, '⌨️ [TRACK] Typing pattern tracking', { 
      partial, 
      sessionId,
      duration 
    }, env);

    if (!partial || !sessionId || duration === undefined) {
      return new Response(JSON.stringify({ 
        error: "partial, sessionId, and duration are required" 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Import user analytics functions
    const { trackTypingPattern } = await import('./user-analytics');
    
    // Track the typing pattern
    await trackTypingPattern({
      timestamp: Date.now(),
      partial,
      finalPrompt,
      duration,
      abandoned
    }, sessionId, env, requestId);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: "Typing pattern tracked",
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logWithContext('error', requestId, '💥 [TRACK] Typing tracking failed', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Failed to track typing pattern",
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
} 