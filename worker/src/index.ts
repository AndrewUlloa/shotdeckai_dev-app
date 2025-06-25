/// <reference types="@cloudflare/workers-types" />

import { uploadToCloudflareImages } from './image-uploader'

export interface Env {
  FAL_KEY: string
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_IMAGE_ACCOUNT_HASH: string
  IMAGE_CACHE: KVNamespace
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const requestId = Math.random().toString(36).substring(7);
    
    // Add CORS headers for calls from your Next.js app
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    console.log(`\n🔧 [WORKER ${requestId}] === NEW REQUEST ===`);
    console.log(`🔧 [WORKER ${requestId}] Method: ${request.method}`);
    console.log(`🔧 [WORKER ${requestId}] Path: ${url.pathname}`);
    console.log(`🔧 [WORKER ${requestId}] Timestamp: ${new Date().toISOString()}`);

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      console.log(`🔧 [WORKER ${requestId}] Handling OPTIONS preflight`);
      return new Response(null, { headers: corsHeaders })
    }

    // Utility endpoint: Check if prompt is cached
    if (url.pathname === '/api/checkCache' && request.method === 'POST') {
      console.log(`🔧 [WORKER ${requestId}] Route: checkCache`);
      return await handleCheckCache(request, env, corsHeaders, requestId)
    }

    // Utility endpoint: Upload FAL URL to Cloudflare Images  
    if (url.pathname === '/api/uploadImage' && request.method === 'POST') {
      console.log(`🔧 [WORKER ${requestId}] Route: uploadImage`);
      return await handleUploadImage(request, env, corsHeaders, requestId)
    }

    // Simple status endpoint
    if (url.pathname === '/') {
      console.log(`🔧 [WORKER ${requestId}] Route: status`);
      return new Response('ShotDeckAI Image Persistence Service - Ready', {
        headers: { 'Content-Type': 'text/plain', ...corsHeaders }
      })
    }

    console.log(`❌ [WORKER ${requestId}] Route not found: ${url.pathname}`);
    return new Response('Not Found', { status: 404, headers: corsHeaders })
  }
}

// Check if a prompt is already cached
async function handleCheckCache(request: Request, env: Env, corsHeaders: Record<string, string>, requestId: string) {
  const startTime = Date.now();
  
  try {
    const body = await request.json() as { prompt?: string }
    const { prompt } = body

    console.log(`🔍 [CACHE ${requestId}] Checking for prompt: "${prompt}"`);

    if (!prompt || typeof prompt !== 'string') {
      console.error(`❌ [CACHE ${requestId}] Invalid prompt provided`);
      return new Response(JSON.stringify({ error: "Prompt is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use the same caching pattern as your localStorage
    const cacheKey = prompt.trim().toLowerCase()
    console.log(`🔍 [CACHE ${requestId}] Cache key: "${cacheKey}"`);
    
    // Check KV cache
    const kvStartTime = Date.now();
    const cachedImageData = await env.IMAGE_CACHE.get(cacheKey)
    const kvDuration = Date.now() - kvStartTime;
    
    if (cachedImageData) {
      const imageData = JSON.parse(cachedImageData)
      const totalDuration = Date.now() - startTime;
      
      console.log(`✅ [CACHE ${requestId}] HIT! Found in KV in ${kvDuration}ms`);
      console.log(`✅ [CACHE ${requestId}] Image data:`, {
        persistentUrl: imageData.persistentUrl,
        cloudflareImageId: imageData.cloudflareImageId,
        timestamp: new Date(imageData.timestamp).toISOString()
      });
      console.log(`✅ [CACHE ${requestId}] Total response time: ${totalDuration}ms`);
      
      return new Response(JSON.stringify({ 
        cached: true, 
        url: imageData.persistentUrl,
        timestamp: imageData.timestamp 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const totalDuration = Date.now() - startTime;
    console.log(`❌ [CACHE ${requestId}] MISS! Not found in KV (checked in ${kvDuration}ms)`);
    console.log(`❌ [CACHE ${requestId}] Total response time: ${totalDuration}ms`);

    return new Response(JSON.stringify({ cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`💥 [CACHE ${requestId}] Error after ${totalDuration}ms:`, error);
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

    console.log(`💾 [UPLOAD ${requestId}] Starting upload process`);
    console.log(`💾 [UPLOAD ${requestId}] Prompt: "${prompt}"`);
    console.log(`💾 [UPLOAD ${requestId}] FAL URL: ${falUrl}`);

    if (!prompt || !falUrl) {
      console.error(`❌ [UPLOAD ${requestId}] Missing required fields:`, { prompt: !!prompt, falUrl: !!falUrl });
      return new Response(JSON.stringify({ error: "Prompt and falUrl are required" }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Upload the FAL image to Cloudflare Images for persistence
    console.log(`📤 [UPLOAD ${requestId}] Uploading to Cloudflare Images...`);
    const uploadStartTime = Date.now();
    
    const cloudflareImageId = await uploadToCloudflareImages(falUrl, env)
    const uploadDuration = Date.now() - uploadStartTime;
    
    console.log(`✅ [UPLOAD ${requestId}] Upload completed in ${uploadDuration}ms`);
    console.log(`✅ [UPLOAD ${requestId}] Cloudflare Image ID: ${cloudflareImageId}`);

    // Create the persistent URL
    const persistentUrl = `https://imagedelivery.net/${env.CLOUDFLARE_IMAGE_ACCOUNT_HASH}/${cloudflareImageId}/public`
    console.log(`🔗 [UPLOAD ${requestId}] Persistent URL: ${persistentUrl}`);

    // Cache both URLs with the same key pattern as localStorage
    const cacheKey = prompt.trim().toLowerCase()
    const cacheData = {
      originalFalUrl: falUrl,
      cloudflareImageId: cloudflareImageId,
      persistentUrl: persistentUrl,
      timestamp: Date.now()
    }

    console.log(`💾 [UPLOAD ${requestId}] Caching with key: "${cacheKey}"`);
    const cacheStartTime = Date.now();
    
    await env.IMAGE_CACHE.put(cacheKey, JSON.stringify(cacheData))
    const cacheDuration = Date.now() - cacheStartTime;
    
    const totalDuration = Date.now() - startTime;
    console.log(`✅ [UPLOAD ${requestId}] Cached in KV in ${cacheDuration}ms`);
    console.log(`🎉 [UPLOAD ${requestId}] COMPLETE! Total time: ${totalDuration}ms`);
    console.log(`🔧 [WORKER ${requestId}] === REQUEST COMPLETE ===\n`);

    return new Response(JSON.stringify({ 
      success: true,
      persistentUrl: persistentUrl,
      cloudflareImageId: cloudflareImageId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`💥 [UPLOAD ${requestId}] Error after ${totalDuration}ms:`, error);
    
    let errorMessage = "Failed to upload image"
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    console.log(`🔧 [WORKER ${requestId}] === REQUEST FAILED ===\n`);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
} 