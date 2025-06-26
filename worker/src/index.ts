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
      let cacheStatus = 'unknown';
      let subrequestCount = 0;
      let kvLookups = 0;
      let externalApiCalls = 0;

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
        subrequestCount++; // Track as potential subrequest
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
      // TEST: Comprehensive system test
      else if (url.pathname === '/api/testSystem' && request.method === 'GET') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: testSystem', {}, env);
        response = await handleSystemTest(request, env, corsHeaders, requestId);
      }
      // Simple status endpoint
      else if (url.pathname === '/') {
        logWithContext('info', requestId, '🔧 [WORKER] Route: status', {}, env);
        
        // Add environment check to status
        const envStatus = {
          FAL_KEY: !!env.FAL_KEY ? '✅ Set' : '❌ Missing',
          GEMINI_API_KEY: !!env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
          CLOUDFLARE_ACCOUNT_ID: !!env.CLOUDFLARE_ACCOUNT_ID ? '✅ Set' : '❌ Missing',
          CLOUDFLARE_API_TOKEN: !!env.CLOUDFLARE_API_TOKEN ? '✅ Set' : '❌ Missing',
          CLOUDFLARE_IMAGE_ACCOUNT_HASH: !!env.CLOUDFLARE_IMAGE_ACCOUNT_HASH ? '✅ Set' : '❌ Missing',
          IMAGE_CACHE: !!env.IMAGE_CACHE ? '✅ Available' : '❌ Missing',
          SEMANTIC_CACHE_ENABLED: env.ENABLE_SEMANTIC_CACHE !== 'false' ? '✅ Enabled' : '⚠️ Disabled'
        };
        
        logWithContext('info', requestId, '🔧 [WORKER] Environment status', envStatus, env);
        
        const statusMessage = `ShotDeckAI Image Persistence Service - Ready
        
Environment Status:
- FAL_KEY: ${envStatus.FAL_KEY}
- GEMINI_API_KEY: ${envStatus.GEMINI_API_KEY}
- CLOUDFLARE_ACCOUNT_ID: ${envStatus.CLOUDFLARE_ACCOUNT_ID}
- CLOUDFLARE_API_TOKEN: ${envStatus.CLOUDFLARE_API_TOKEN}
- CLOUDFLARE_IMAGE_ACCOUNT_HASH: ${envStatus.CLOUDFLARE_IMAGE_ACCOUNT_HASH}
- IMAGE_CACHE: ${envStatus.IMAGE_CACHE}
- SEMANTIC_CACHE: ${envStatus.SEMANTIC_CACHE_ENABLED}

Available Endpoints:
- POST /api/generateImage - Main image generation
- POST /api/expandCache - Manual semantic expansion
- GET /api/cacheStats - Cache performance metrics
- POST /api/predictPrompts - Prompt predictions
- GET /api/analyzeClusters - Cache cluster analysis
- GET /api/userAnalytics - User behavior analytics
- POST /api/trackTyping - Track typing patterns
- GET /api/testSystem - Comprehensive system test`;
        
        response = new Response(statusMessage, {
          headers: { 'Content-Type': 'text/plain', ...corsHeaders }
        });
      }
      else {
        logWithContext('warn', requestId, '❌ [WORKER] Route not found', { path: url.pathname }, env);
        response = new Response('Not Found', { status: 404, headers: corsHeaders });
      }

      const totalDuration = Date.now() - requestStartTime;
      
      // Determine cache status based on response content
      if (response.headers.get('content-type')?.includes('application/json')) {
        try {
          const responseClone = response.clone();
          const json = await responseClone.json() as { cached?: boolean; semantic?: boolean; success?: boolean };
          if (json.cached === true) {
            cacheStatus = json.semantic ? 'semantic_hit' : 'kv_hit';
            kvLookups++;
          } else if (json.success === false) {
            cacheStatus = 'error';
          } else {
            cacheStatus = 'generated';
            externalApiCalls++; // New generation = external API call
          }
        } catch {
          cacheStatus = 'unknown';
        }
      }
      
      logWithContext('info', requestId, '✅ [WORKER] Request completed', {
        status: response.status,
        duration: totalDuration,
        path: url.pathname,
        cloudflareMetrics: {
          cacheStatus,
          kvLookups, 
          externalApiCalls,
          subrequestCount,
          // This helps correlate with Cloudflare Analytics
          explanation: {
            cached_subrequests: kvLookups > 0 && cacheStatus.includes('hit') ? 'KV cache hit (not counted by CF)' : 'No KV hits',
            uncached_subrequests: externalApiCalls > 0 ? `External API calls: ${externalApiCalls}` : 'No external calls',
            cf_analytics_note: 'CF analytics only counts HTTP cache, not KV cache'
          }
        }
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

// TEST: Comprehensive system test
async function handleSystemTest(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  try {
    logWithContext('info', requestId, '🧪 [TEST] Starting comprehensive system test', {}, env);
    
    const testResults: {
      timestamp: string;
      requestId: string;
      environment: Record<string, any>;
      phases: Record<string, any>;
      endpoints: Record<string, any>;
      performance: Record<string, any>;
      errors: string[];
    } = {
      timestamp: new Date().toISOString(),
      requestId,
      environment: {},
      phases: {},
      endpoints: {},
      performance: {},
      errors: []
    };

    // Test 1: Environment Variables
    logWithContext('info', requestId, '🧪 [TEST] Phase 1: Environment check', {}, env);
    testResults.environment = {
      FAL_KEY: !!env.FAL_KEY,
      GEMINI_API_KEY: !!env.GEMINI_API_KEY,
      CLOUDFLARE_ACCOUNT_ID: !!env.CLOUDFLARE_ACCOUNT_ID,
      CLOUDFLARE_API_TOKEN: !!env.CLOUDFLARE_API_TOKEN,
      CLOUDFLARE_IMAGE_ACCOUNT_HASH: !!env.CLOUDFLARE_IMAGE_ACCOUNT_HASH,
      IMAGE_CACHE: !!env.IMAGE_CACHE,
      LOG_LEVEL: env.LOG_LEVEL || 'info',
      ENABLE_REQUEST_LOGGING: env.ENABLE_REQUEST_LOGGING !== 'false'
    };

    // Test 2: KV Cache Access
    logWithContext('info', requestId, '🧪 [TEST] Phase 2: KV Cache test', {}, env);
    try {
      const testKey = `test_${requestId}`;
      const testData = { test: true, timestamp: Date.now() };
      
      await env.IMAGE_CACHE.put(testKey, JSON.stringify(testData));
      const retrieved = await env.IMAGE_CACHE.get(testKey);
      await env.IMAGE_CACHE.delete(testKey);
      
      testResults.phases.kvCache = {
        working: !!retrieved,
        canWrite: true,
        canRead: !!retrieved,
        canDelete: true
      };
    } catch (error) {
      testResults.phases.kvCache = { working: false, error: String(error) };
      testResults.errors.push(`KV Cache: ${error}`);
    }

    // Test 3: Semantic Cache (Phase 1)
    logWithContext('info', requestId, '🧪 [TEST] Phase 3: Semantic cache test', {}, env);
    try {
      const { checkSemanticCache } = await import('./semantic-cache');
      const result = await checkSemanticCache('test prompt for system check', env, requestId);
      testResults.phases.semanticCache = {
        module: 'loaded',
        functionCall: 'success',
        result: result ? 'cache_hit' : 'cache_miss'
      };
    } catch (error) {
      testResults.phases.semanticCache = { working: false, error: String(error) };
      testResults.errors.push(`Semantic Cache: ${error}`);
    }

    // Test 4: Predictive Cache (Phase 2)
    logWithContext('info', requestId, '🧪 [TEST] Phase 4: Predictive cache test', {}, env);
    try {
      const { generatePredictivePrompts } = await import('./predictive-cache');
      const result = await generatePredictivePrompts('test partial', [], env, requestId);
      testResults.phases.predictiveCache = {
        module: 'loaded',
        functionCall: 'success',
        predictions: result?.predictions?.length || 0
      };
    } catch (error) {
      testResults.phases.predictiveCache = { working: false, error: String(error) };
      testResults.errors.push(`Predictive Cache: ${error}`);
    }

    // Test 5: Cluster Analysis (Phase 3)
    logWithContext('info', requestId, '🧪 [TEST] Phase 5: Cluster analysis test', {}, env);
    try {
      const { analyzeCacheClusters } = await import('./clustering');
      const result = await analyzeCacheClusters(env, requestId);
      testResults.phases.clusterAnalysis = {
        module: 'loaded',
        functionCall: 'success',
        clusters: result?.clusters?.length || 0
      };
    } catch (error) {
      testResults.phases.clusterAnalysis = { working: false, error: String(error) };
      testResults.errors.push(`Cluster Analysis: ${error}`);
    }

    // Test 6: User Analytics (Phase 4)
    logWithContext('info', requestId, '🧪 [TEST] Phase 6: User analytics test', {}, env);
    try {
      const { trackUserBehavior } = await import('./user-analytics');
      const result = await trackUserBehavior({
        sessionId: `test_${requestId}`,
        prompt: 'test prompt',
        accuracy: 0.8,
        timestamp: Date.now()
      }, env, requestId);
      testResults.phases.userAnalytics = {
        module: 'loaded',
        functionCall: 'success',
        tracked: !!result
      };
    } catch (error) {
      testResults.phases.userAnalytics = { working: false, error: String(error) };
      testResults.errors.push(`User Analytics: ${error}`);
    }

    // Test 7: Performance Metrics
    const endTime = Date.now();
    const startTime = endTime - 5000; // Assuming 5 second max test time
    testResults.performance = {
      testDuration: endTime - startTime,
      errorsCount: testResults.errors.length,
      successfulPhases: Object.values(testResults.phases).filter(p => p.working !== false).length,
      totalPhases: Object.keys(testResults.phases).length
    };

    // Calculate overall health score
    const healthScore = Math.round(
      (testResults.performance.successfulPhases / testResults.performance.totalPhases) * 100
    );

    logWithContext('info', requestId, '🧪 [TEST] System test completed', {
      healthScore,
      errors: testResults.errors.length,
      phases: testResults.performance.successfulPhases + '/' + testResults.performance.totalPhases
    }, env);

    return new Response(JSON.stringify({ 
      success: true,
      healthScore,
      testResults,
      summary: {
        overallHealth: healthScore >= 80 ? '✅ Healthy' : healthScore >= 50 ? '⚠️ Degraded' : '❌ Critical',
        readyForProduction: healthScore >= 80 && testResults.environment.FAL_KEY,
        nextSteps: healthScore < 100 ? [
          !testResults.environment.GEMINI_API_KEY ? 'Set GEMINI_API_KEY for full semantic features' : null,
          testResults.errors.length > 0 ? 'Check error logs for issues' : null
        ].filter(Boolean) : ['System fully operational']
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logWithContext('error', requestId, '💥 [TEST] System test failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, env);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "System test failed",
      details: error instanceof Error ? error.message : String(error),
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} 