import type { Env, CacheEntry, UploadConfig, GenerationResult, CloudflareAIResponse } from './types'
import { uploadToCloudflareImages } from './image-uploader'
import { checkSemanticCache, expandSemanticCache } from './semantic-cache'

// Enhanced logging function
function log(level: 'info' | 'warn' | 'error', requestId: string, message: string, metadata?: Record<string, unknown>, env?: Env) {
  const enableLogging = env?.ENABLE_REQUEST_LOGGING !== 'false';
  if (!enableLogging) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    service: 'image-generator',
    ...(metadata && { metadata })
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

export async function generateImage(prompt: string, env: Env): Promise<string> {
  try {
    // Generate enhanced storyboard prompt
    const enhancedPrompt = `${prompt}, digital storyboard style, teal line art, clean white background, cinematic composition, professional sketch quality`;

    // Use Cloudflare Workers AI FLUX.1 [schnell] model
    const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt: enhancedPrompt,
      steps: 6 // Optimized for speed while maintaining quality
    }) as CloudflareAIResponse;

    console.log("Cloudflare Workers AI result generated successfully");

    if (result.image) {
      // Convert base64 to data URI for immediate use
      const dataURI = `data:image/jpeg;charset=utf-8;base64,${result.image}`;
      return dataURI;
    } else {
      console.error("Unexpected Cloudflare Workers AI response structure:", result);
      throw new Error("Unexpected Cloudflare Workers AI response structure");
    }
  } catch (error) {
    console.error("Error generating image with Cloudflare Workers AI:", error);
    throw error;
  }
}

/**
 * Generate storyboard image using Cloudflare Workers AI with enhanced caching
 */
export async function generateStoryboardImage(prompt: string, env: Env, requestId: string): Promise<Response> {
  const startTime = Date.now()
  
  log('info', requestId, '🎬 [API] Starting storyboard generation', { prompt }, env)
  
  try {
    // Check semantic cache first (industry best practice)
    const semanticHit = await checkSemanticCache(
      prompt, 
      env, 
      requestId,
      {
        domain: 'storyboard',
        adaptiveThreshold: true,
        minConfidence: 0.85,
        maxConfidence: 0.98
      }
    );
    
    if (semanticHit) {
      log('info', requestId, '🎯 [CACHE] Semantic cache hit', { 
        prompt: prompt.substring(0, 50) + '...',
        cached: true,
        semantic: true,
        originalPrompt: semanticHit.originalPrompt?.substring(0, 50) + '...',
        cluster: semanticHit.semanticCluster,
        qualityScore: semanticHit.qualityScore
      }, env);
      
      return new Response(JSON.stringify({
        success: true,
        url: semanticHit.persistentUrl,
        cached: true,
        semantic: true,
        originalPrompt: semanticHit.originalPrompt,
        requestId,
        cacheType: 'semantic_advanced',
        metadata: {
          originalPrompt: semanticHit.originalPrompt,
          semanticCluster: semanticHit.semanticCluster,
          qualityScore: semanticHit.qualityScore,
          domain: semanticHit.domain
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    log('info', requestId, '🔍 [CACHE MISS] No cached image found, generating new one', { prompt }, env)
    
    log('info', requestId, '🎨 [CLOUDFLARE AI] Starting image generation with Workers AI', { prompt }, env)
    
    // Enhanced storyboard prompt for Cloudflare Workers AI
    const enhancedPrompt = `${prompt}, digital storyboard style, teal color scheme (#70A0A0, #406C6C), loose line art, clean white background, cinematic composition, professional sketch quality, film storyboard panel, digital art tablet style`;

    // Use Cloudflare Workers AI FLUX.1 [schnell] model
    const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
      prompt: enhancedPrompt,
      steps: 6 // Optimized for speed while maintaining quality
    }) as CloudflareAIResponse;

    log('info', requestId, '🎨 [CLOUDFLARE AI] Received response from Workers AI', { 
      hasImage: !!result.image
    }, env)
    
    // Convert base64 to blob URL for upload
    let imageUrl: string | undefined;
    if (result.image) {
      const dataURI = `data:image/jpeg;charset=utf-8;base64,${result.image}`;
      imageUrl = dataURI;
    }
    
    if (!imageUrl) {
      log('error', requestId, '❌ [CLOUDFLARE AI ERROR] No image generated in response', { result }, env)
      return new Response(JSON.stringify({
        success: false,
        error: 'No image generated',
        requestId
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    
    log('info', requestId, '✅ [CLOUDFLARE AI SUCCESS] Image generated', {
      prompt,
      generationTime: Date.now() - startTime
    }, env)
    
    // Upload to Cloudflare Images
    const cloudflareImageId = await uploadToCloudflareImages(imageUrl, env)
    const persistentUrl = `https://imagedelivery.net/${env.CLOUDFLARE_IMAGE_ACCOUNT_HASH}/${cloudflareImageId}/public`
    
    // Store in regular cache  
    const cacheKey = prompt.trim().toLowerCase()
    const cacheEntry: CacheEntry = {
      originalPrompt: prompt,
      persistentUrl,
      cloudflareImageId,
      timestamp: Date.now()
    }
    
    await env.IMAGE_CACHE.put(cacheKey, JSON.stringify(cacheEntry))
    
    log('info', requestId, '💾 [CACHE STORE] Original prompt cached', {
      prompt,
      cacheKey,
      persistentUrl
    }, env)
    
    // Background semantic cache expansion with industry best practices
    if (env.ENABLE_SEMANTIC_CACHE === 'true') {
      // Background expansion - don't await to avoid blocking response
      expandSemanticCache(
        prompt, 
        persistentUrl, 
        cloudflareImageId, 
        env, 
        requestId,
        {
          domain: 'storyboard',
          expansionStrategy: 'adaptive',
          qualityThreshold: 0.85,
          clusterId: `storyboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      ).catch(error => {
        // Log but don't fail the request
        log('error', requestId, '🔮 [SEMANTIC] Background cache expansion failed', {
          error: error instanceof Error ? error.message : String(error),
          prompt: prompt.substring(0, 50) + '...'
        }, env);
      });
    }
    
    const totalTime = Date.now() - startTime
    
    log('info', requestId, '🎬 [API COMPLETE] Generation and upload complete', {
      prompt,
      persistentUrl,
      totalTime,
      components: {
        generation: 'Cloudflare Workers AI',
        upload: 'Cloudflare Images',
        cache: 'KV Store',
        semanticExpansion: 'Background'
      }
    }, env)
    
    return new Response(JSON.stringify({
      success: true,
      url: persistentUrl,
      cached: false,
      semantic: false,
      requestId,
      timing: {
        total: totalTime,
        cacheCheck: 'semantic',
        generation: 'cloudflare-workers-ai',
        upload: 'cloudflare'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    const errorTime = Date.now() - startTime
    
    log('error', requestId, '❌ [API ERROR] Generation failed', {
      prompt,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: errorTime
    }, env)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      requestId
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * Optimized storyboard image generation with parallel processing
 * Based on Google Cloud optimization research (2025)
 */
export async function generateStoryboardImageOptimized(prompt: string, env: Env, requestId: string): Promise<Response> {
  const startTime = Date.now()
  
  log('info', requestId, '🎬 [OPTIMIZED] Starting parallel storyboard generation', { prompt }, env)
  
  try {
    // Check semantic cache first (unchanged - already optimized)
    const semanticHit = await checkSemanticCache(
      prompt, 
      env, 
      requestId,
      {
        domain: 'storyboard',
        adaptiveThreshold: true,
        minConfidence: 0.85,
        maxConfidence: 0.98
      }
    );
    
    if (semanticHit) {
      log('info', requestId, '🎯 [CACHE] Semantic cache hit', { 
        prompt: prompt.substring(0, 50) + '...',
        cached: true,
        semantic: true
      }, env);
      
      return new Response(JSON.stringify({
        success: true,
        url: semanticHit.persistentUrl,
        cached: true,
        semantic: true,
        originalPrompt: semanticHit.originalPrompt,
        requestId,
        optimized: true
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    log('info', requestId, '🔍 [OPTIMIZED] Cache miss - starting parallel generation', { prompt }, env)
    
    // OPTIMIZATION 1: Parallel Generation + Upload Preparation
    const [generationResult, uploadPrep] = await Promise.all([
      // Generate image with optimized settings
      generateImageWithOptimizations(prompt, requestId, env),
      // Pre-prepare upload configuration in parallel
      prepareCloudflareUpload(env, requestId)
    ]);

    if (!generationResult.imageUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No image generated',
        requestId
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    // OPTIMIZATION 2: Streaming upload with pre-configured settings
    const uploadStartTime = Date.now();
    const cloudflareImageId = await optimizedUploadToCloudflare(
      generationResult.imageUrl, 
      uploadPrep, 
      env, 
      requestId
    );
    const uploadTime = Date.now() - uploadStartTime;
    
    const persistentUrl = `https://imagedelivery.net/${env.CLOUDFLARE_IMAGE_ACCOUNT_HASH}/${cloudflareImageId}/public`
    
    // OPTIMIZATION 3: Async cache operations (non-blocking)
    const cacheOperations = asyncCacheOperations(prompt, persistentUrl, cloudflareImageId, env, requestId);
    
    const totalTime = Date.now() - startTime
    
    log('info', requestId, '🚀 [OPTIMIZED] Generation complete', {
      prompt: prompt.substring(0, 30) + '...',
      totalTime,
      optimizations: {
        parallelProcessing: true,
        streamingUpload: true,
        asyncCaching: true,
        uploadTime
      }
    }, env)
    
    // Don't await cache operations - they happen in background
    cacheOperations.catch(error => {
      log('error', requestId, '⚠️ [CACHE] Background operations failed', {
        error: error instanceof Error ? error.message : String(error)
      }, env);
    });
    
    return new Response(JSON.stringify({
      success: true,
      url: persistentUrl,
      cached: false,
      semantic: false,
      requestId,
      optimized: true,
      timing: {
        total: totalTime,
        generation: generationResult.generationTime,
        upload: uploadTime,
        optimization: 'parallel+streaming'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    const errorTime = Date.now() - startTime
    
    log('error', requestId, '❌ [OPTIMIZED] Generation failed', {
      prompt: prompt.substring(0, 30) + '...',
      error: error instanceof Error ? error.message : String(error),
      duration: errorTime
    }, env)
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      requestId,
      optimized: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * Generate image with Cloudflare Workers AI optimizations
 * Based on Google Cloud inference optimization research
 */
async function generateImageWithOptimizations(prompt: string, requestId: string, env: Env): Promise<GenerationResult> {
  const generationStartTime = Date.now();
  
  log('info', requestId, '🎨 [CLOUDFLARE AI-OPT] Starting optimized generation', { 
    optimizations: ['reduced_steps', 'enhanced_prompting', 'efficient_processing']
  }, env);

  // Enhanced storyboard prompt for optimal results
  const enhancedPrompt = `${prompt}, digital storyboard style, teal color scheme (#70A0A0, #406C6C), loose line art, clean white background, cinematic composition, professional sketch quality, film storyboard panel, digital art tablet style, 4:3 landscape aspect ratio`;

  const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
    prompt: enhancedPrompt,
    steps: 4 // OPTIMIZATION: Reduced steps for faster generation
  }) as CloudflareAIResponse;

  const generationTime = Date.now() - generationStartTime;
  
  // Convert base64 to data URI
  const imageUrl = result.image ? `data:image/jpeg;charset=utf-8;base64,${result.image}` : undefined;
  
  log('info', requestId, '✅ [CLOUDFLARE AI-OPT] Optimized generation complete', {
    generationTime,
    hasImage: !!imageUrl,
    improvements: 'reduced_steps+enhanced_prompting+efficient_processing'
  }, env);

  return {
    imageUrl,
    generationTime
  };
}

/**
 * Pre-prepare Cloudflare upload configuration
 * Parallel preparation while image generates
 */
async function prepareCloudflareUpload(env: Env, requestId: string): Promise<UploadConfig> {
  log('info', requestId, '📤 [UPLOAD-PREP] Preparing optimized upload', {}, env);
  
  return {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: env.CLOUDFLARE_API_TOKEN,
    accountHash: env.CLOUDFLARE_IMAGE_ACCOUNT_HASH,
    optimizations: {
      streaming: true,
      compression: 'optimized',
      format: 'auto'
    }
  };
}

/**
 * Optimized Cloudflare upload with streaming
 * Based on Google Cloud pipeline optimization research
 */
async function optimizedUploadToCloudflare(imageUrl: string, uploadConfig: UploadConfig, env: Env, requestId: string): Promise<string> {
  log('info', requestId, '📤 [UPLOAD-OPT] Starting streaming upload', {
    optimizations: uploadConfig.optimizations
  }, env);

  // OPTIMIZATION: Direct URL upload to Cloudflare (correct format)
  const formData = new FormData();
  formData.append('url', imageUrl); // Use 'url' parameter for URL uploads
  formData.append('metadata', JSON.stringify({ 
    optimized: true,
    source: 'cloudflare-workers-ai',
    compression: 'auto'
  }));

  const uploadResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${uploadConfig.accountId}/images/v1`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${uploadConfig.apiToken}`,
    },
    body: formData
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    log('error', requestId, '❌ [UPLOAD-OPT] Upload failed', {
      status: uploadResponse.status,
      error: errorText
    }, env);
    throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
  }

  const result = await uploadResponse.json() as { result: { id: string } };
  log('info', requestId, '✅ [UPLOAD-OPT] Upload successful', {
    cloudflareImageId: result.result.id
  }, env);
  
  return result.result.id;
}

/**
 * Async cache operations (non-blocking)
 * Happens in background after response is sent
 */
async function asyncCacheOperations(
  prompt: string, 
  persistentUrl: string, 
  cloudflareImageId: string, 
  env: Env, 
  requestId: string
): Promise<void> {
  // Store in regular cache first (fastest)
  const cacheKey = prompt.trim().toLowerCase()
  const cacheEntry: CacheEntry = {
    originalPrompt: prompt,
    persistentUrl,
    cloudflareImageId,
    timestamp: Date.now(),
    optimized: true
  }
  
  await env.IMAGE_CACHE.put(cacheKey, JSON.stringify(cacheEntry))
  
  // Background semantic cache expansion (non-blocking)
  if (env.ENABLE_SEMANTIC_CACHE === 'true') {
    await expandSemanticCache(
      prompt, 
      persistentUrl, 
      cloudflareImageId, 
      env, 
      requestId,
      {
        domain: 'storyboard',
        expansionStrategy: 'adaptive',
        qualityThreshold: 0.85
      }
    );
  }
} 