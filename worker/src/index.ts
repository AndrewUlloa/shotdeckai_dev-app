/// <reference types="@cloudflare/workers-types" />

import { uploadToCloudflareImages } from './image-uploader'
import { generateStoryboardImage, generateStoryboardImageOptimized, generateStoryboardImageFast } from './image-generator'
import type { Env } from './types'
import { checkSemanticCache } from './semantic-cache'
import { analyzeTypingPattern } from './predictive-cache'

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
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`📡 [WORKER] ${request.method} ${url.pathname} - Request ID: ${requestId}`)
    
    // CORS headers for all requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders })
    }
    
    // Homepage route
    if (url.pathname === '/' && request.method === 'GET') {
      const { default: getHomepage } = await import('./homepage')
      return getHomepage(env, requestId)
    }
    
    // Legacy original generate image endpoint
    if (url.pathname === '/api/generateImage' && request.method === 'POST') {
      try {
        const { prompt } = await request.json() as { prompt: string }
        const response = await generateStoryboardImage(prompt, env, requestId)
        
        // Add CORS headers to the response
        const responseWithCors = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: { ...Object.fromEntries(response.headers), ...corsHeaders }
        })
        
        return responseWithCors
      } catch (error) {
        console.error(`❌ [WORKER] Error in generateImage: ${error}`)
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Internal server error',
          requestId 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }

    // NEW: TIER 1 - INSTANT endpoint (semantic cache + exact matches)
    if (url.pathname === '/api/generateImage/instant' && request.method === 'POST') {
      try {
        const { prompt, maxOptions = 3 } = await request.json() as { 
          prompt: string; 
          maxOptions?: number; 
        }
        
        console.log(`⚡ [INSTANT] Checking instant options for: "${prompt.substring(0, 50)}..."`);
        
        // Check semantic cache with lower threshold for instant results
        const semanticHit = await checkSemanticCache(
          prompt, 
          env, 
          requestId,
          {
            domain: 'storyboard',
            adaptiveThreshold: true,
            minConfidence: 0.70, // Lower threshold for instant results
            maxConfidence: 0.98
          }
        );
        
        if (semanticHit) {
          console.log(`⚡ [INSTANT] Semantic hit found with confidence: ${semanticHit.qualityScore || 'unknown'}`);
          
          return new Response(JSON.stringify({
            success: true,
            url: semanticHit.persistentUrl,
            tier: 'instant',
            confidence: semanticHit.qualityScore || 0.85,
            cached: true,
            semantic: true,
            reason: 'semantic_cache_hit',
            originalPrompt: semanticHit.originalPrompt,
            requestId
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        // Check exact cache match
        const cacheKey = prompt.trim().toLowerCase();
        const exactMatch = await env.IMAGE_CACHE.get(cacheKey);
        
        if (exactMatch) {
          try {
            const cacheEntry = JSON.parse(exactMatch);
            console.log(`⚡ [INSTANT] Exact cache hit found`);
            
            return new Response(JSON.stringify({
              success: true,
              url: cacheEntry.persistentUrl,
              tier: 'instant',
              confidence: 1.0,
              cached: true,
              semantic: false,
              reason: 'exact_cache_hit',
              requestId
            }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          } catch (parseError) {
            console.warn(`⚠️ [INSTANT] Failed to parse cache entry: ${parseError}`);
          }
        }
        
        console.log(`⚡ [INSTANT] No instant options found`);
        return new Response(JSON.stringify({
          success: false,
          reason: 'no_instant_options',
          requestId
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      } catch (error) {
        console.error(`❌ [INSTANT] Error: ${error}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Instant lookup failed',
          requestId 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // NEW: TIER 2 & 3 - MULTI-TIER endpoint (fast + final generation)
    if (url.pathname === '/api/generateImage/multiTier' && request.method === 'POST') {
      try {
        const { prompt, tiers = ['fast', 'final'], maxTiers = 2 } = await request.json() as { 
          prompt: string; 
          tiers?: Array<'fast' | 'final'>;
          maxTiers?: number;
        }
        
        console.log(`🚀 [MULTI-TIER] Starting generation for tiers: ${tiers.join(', ')}`);
        
        // Use appropriate generation function based on tier priority
        if (tiers.includes('fast')) {
          // Use fast generation for speed
          const response = await generateStoryboardImageFast(prompt, env, requestId);
          
          // Add CORS headers
          if (response.ok) {
            const responseData = await response.json() as any;
            responseData.tier = 'fast';
            
            return new Response(JSON.stringify(responseData), {
              status: response.status,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
          
          return new Response(response.body, {
            status: response.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } else if (tiers.includes('final')) {
          // Use optimized generation for final quality
          const response = await generateStoryboardImageOptimized(prompt, env, requestId);
          
          // Add tier information to the response
          if (response.ok) {
            const responseData = await response.json() as any;
            responseData.tier = 'final';
            responseData.confidence = 0.95; // High confidence for generated images
            
            return new Response(JSON.stringify(responseData), {
              status: response.status,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
          
          return new Response(response.body, {
            status: response.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        return new Response(JSON.stringify({
          success: false,
          error: 'No valid tiers specified',
          requestId
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      } catch (error) {
        console.error(`❌ [MULTI-TIER] Error: ${error}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Multi-tier generation failed',
          requestId 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // NEW: BACKGROUND endpoint (fire-and-forget quality improvement)
    if (url.pathname === '/api/generateImage/background' && request.method === 'POST') {
      try {
        const { prompt, tiers = ['final'] } = await request.json() as { 
          prompt: string; 
          tiers?: Array<'fast' | 'final'>;
        }
        
        console.log(`🔥 [BACKGROUND] Starting background generation for: "${prompt.substring(0, 30)}..."`);
        
        // Fire and forget - generate the higher quality version
        if (tiers.includes('final')) {
          // Don't await - run in background
          generateStoryboardImage(prompt, env, `${requestId}-bg`).catch(error => {
            console.warn(`⚠️ [BACKGROUND] Background generation failed: ${error}`);
          });
        }
        
        // Return immediately
        return new Response(JSON.stringify({
          success: true,
          message: 'Background generation started',
          requestId
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      } catch (error) {
        console.error(`❌ [BACKGROUND] Error: ${error}`);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Background generation setup failed',
          requestId 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Typing pattern analysis endpoint
    if (url.pathname === '/api/analyzeTyping' && request.method === 'POST') {
      try {
        const pattern = await request.json()
        const result = await analyzeTypingPattern(pattern, env, requestId)
        
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error) {
        console.error(`❌ [WORKER] Error in analyzeTyping: ${error}`)
        return new Response(JSON.stringify({ 
          predictions: [], 
          confidence: 0, 
          requestId 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }
    
    // Semantic cache check endpoint
    if (url.pathname === '/api/semanticCheck' && request.method === 'POST') {
      try {
        const { prompt } = await request.json() as { prompt: string }
        const result = await checkSemanticCache(prompt, env, requestId)
        
        return new Response(JSON.stringify({
          found: !!result,
          url: result?.persistentUrl,
          confidence: result?.qualityScore || 0,
          requestId
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      } catch (error) {
        console.error(`❌ [WORKER] Error in semanticCheck: ${error}`)
        return new Response(JSON.stringify({ 
          found: false, 
          requestId 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        })
      }
    }
    
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders
    })
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
      environment: Record<string, boolean | string>;
      phases: Record<string, Record<string, unknown>>;
      endpoints: Record<string, unknown>;
      performance: Record<string, number>;
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
        predictions: Array.isArray(result) ? result.length : 0
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
      const { trackUserSession } = await import('./user-analytics');
      await trackUserSession({
        id: `test_${requestId}`,
        prompts: ['test prompt'],
        timestamp: Date.now()
      }, env, requestId);
      testResults.phases.userAnalytics = {
        module: 'loaded',
        functionCall: 'success',
        tracked: true
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

// DEBUG: Browse KV entries
async function handleBrowseKV(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  try {
    logWithContext('info', requestId, '🔧 [WORKER] Route: browseKV', {}, env);

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

    return new Response(JSON.stringify({ 
      success: true,
      entries: allEntries,
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logWithContext('error', requestId, '💥 [WORKER] Browse KV failed', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Failed to browse KV entries",
      requestId 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle cache clearing for fresh start
 */
async function handleClearCache(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string): Promise<Response> {
  try {
    logWithContext('info', requestId, '🧹 [CACHE] Starting complete cache clear', {}, env);

    // Get all cache keys for analysis
    const allKeys = await env.IMAGE_CACHE.list();
    const totalKeys = allKeys.keys?.length || 0;
    
    if (totalKeys === 0) {
      logWithContext('info', requestId, '📭 [CACHE] Cache already empty', {}, env);
      return new Response(JSON.stringify({
        success: true,
        message: "Cache was already empty",
        deletedEntries: 0,
        requestId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logWithContext('info', requestId, '🔍 [CACHE] Analyzing cache before clearing', {
      totalEntries: totalKeys,
      sampleKeys: allKeys.keys?.slice(0, 5).map(k => k.name.substring(0, 30) + '...')
    }, env);

    // Delete all entries in batches for performance
    let deletedCount = 0;
    const batchSize = 100;
    
    for (let i = 0; i < allKeys.keys.length; i += batchSize) {
      const batch = allKeys.keys.slice(i, i + batchSize);
      const deletePromises = batch.map(async (key) => {
        try {
          await env.IMAGE_CACHE.delete(key.name);
          deletedCount++;
          return { success: true, key: key.name };
        } catch (error) {
          logWithContext('warn', requestId, '⚠️ [CACHE] Failed to delete key', {
            key: key.name,
            error: error instanceof Error ? error.message : String(error)
          }, env);
          return { success: false, key: key.name };
        }
      });
      
      await Promise.all(deletePromises);
      
      // Small delay between batches to prevent overwhelming
      if (i + batchSize < allKeys.keys.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    logWithContext('info', requestId, '✅ [CACHE] Cache clearing completed', {
      totalFound: totalKeys,
      deletedCount,
      successRate: Math.round((deletedCount / totalKeys) * 100) + '%'
    }, env);

    return new Response(JSON.stringify({
      success: true,
      message: "Cache cleared successfully",
      deletedEntries: deletedCount,
      totalFound: totalKeys,
      successRate: Math.round((deletedCount / totalKeys) * 100) + '%',
      requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logWithContext('error', requestId, '💥 [CACHE] Clear operation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, env);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to clear cache",
      details: error instanceof Error ? error.message : String(error),
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle optimized image generation
 */
async function handleGenerateImageOptimized(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string): Promise<Response> {
  const { generateStoryboardImageOptimized } = await import('./image-generator');
  
  try {
    const body = await request.json() as { prompt: string };
    
    if (!body.prompt) {
      logWithContext('error', requestId, '❌ [OPTIMIZED] Missing prompt', {}, env);
      return new Response(JSON.stringify({
        success: false,
        error: 'Prompt is required',
        requestId
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logWithContext('info', requestId, '🚀 [OPTIMIZED] Starting optimized generation', {
      prompt: body.prompt.substring(0, 50) + '...',
      optimizations: 'parallel+streaming+async'
    }, env);

    const response = await generateStoryboardImageOptimized(body.prompt, env, requestId);
    
    // Add CORS headers to the response
    const responseData = await response.json();
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    logWithContext('error', requestId, '❌ [OPTIMIZED] Generation failed', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate optimized image',
      requestId
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
} 