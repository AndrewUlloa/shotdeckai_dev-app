/// <reference types="@cloudflare/workers-types" />

import { uploadToCloudflareImages } from './image-uploader'
import { generateImage } from './image-generator'
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

// Full image generation: check cache, generate with FAL, upload to Cloudflare
async function handleGenerateImage(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  const startTime = Date.now();
  
  try {
    const body = await request.json() as { prompt?: string }
    const { prompt } = body

    logWithContext('info', requestId, '🎨 [GENERATE] Starting full generation process', { prompt }, env);

    if (!prompt || typeof prompt !== 'string') {
      logWithContext('warn', requestId, '❌ [GENERATE] Invalid prompt provided', { prompt }, env);
      return new Response(JSON.stringify({ error: "Prompt is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Step 1: Check cache first
    const cacheKey = prompt.trim().toLowerCase()
    const kvStartTime = Date.now();
    const cachedImageData = await env.IMAGE_CACHE.get(cacheKey)
    const kvDuration = Date.now() - kvStartTime;
    
    if (cachedImageData) {
      const imageData = JSON.parse(cachedImageData)
      const totalDuration = Date.now() - startTime;
      
      logWithContext('info', requestId, '✅ [GENERATE] Cache HIT - returning cached image', {
        cacheKey,
        kvDuration,
        totalDuration,
        imageId: imageData.cloudflareImageId
      }, env);
      
      return new Response(JSON.stringify({ 
        url: imageData.persistentUrl
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    logWithContext('info', requestId, '❌ [GENERATE] Cache MISS - generating new image', {
      cacheKey,
      kvDuration
    }, env);

    // Step 2: Generate with FAL AI
    if (!env.FAL_KEY) {
      logWithContext('error', requestId, '❌ [GENERATE] FAL_KEY not configured', {}, env);
      return new Response(JSON.stringify({ error: "Image generation service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    logWithContext('info', requestId, '🎨 [GENERATE] Starting FAL AI generation', { prompt }, env);
    const falStartTime = Date.now();

    // Use existing generateImage function
    const falImageUrl = await generateImage(prompt, env);
    const falDuration = Date.now() - falStartTime;

    logWithContext('info', requestId, '✅ [GENERATE] FAL AI generation complete', {
      duration: falDuration,
      falImageUrl
    }, env);

    // Step 3: Upload to Cloudflare Images
    logWithContext('info', requestId, '💾 [GENERATE] Uploading to Cloudflare Images', {}, env);
    const uploadStartTime = Date.now();
    
    const cloudflareImageId = await uploadToCloudflareImages(falImageUrl, env)
    const uploadDuration = Date.now() - uploadStartTime;

    // Step 4: Cache the result
    const persistentUrl = `https://imagedelivery.net/${env.CLOUDFLARE_IMAGE_ACCOUNT_HASH}/${cloudflareImageId}/public`
    const cacheData = {
      originalFalUrl: falImageUrl,
      cloudflareImageId: cloudflareImageId,
      persistentUrl: persistentUrl,
      timestamp: Date.now()
    }

    const cacheStartTime = Date.now();
    await env.IMAGE_CACHE.put(cacheKey, JSON.stringify(cacheData))
    const cacheDuration = Date.now() - cacheStartTime;
    
    const totalDuration = Date.now() - startTime;
    
    logWithContext('info', requestId, '🎉 [GENERATE] Full generation complete', {
      cacheKey,
      falDuration,
      uploadDuration,
      cacheDuration,
      totalDuration,
      cloudflareImageId,
      persistentUrl
    }, env);

    return new Response(JSON.stringify({ 
      url: persistentUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    
    logWithContext('error', requestId, '💥 [GENERATE] Generation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: totalDuration
    }, env);
    
    let errorMessage = "Failed to generate image"
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
} 