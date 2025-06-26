import * as fal from "@fal-ai/serverless-client";
import type { Env, CacheEntry } from './types'
import { uploadToCloudflareImages } from './image-uploader'
import { checkSemanticCache, expandSemanticCache } from './semantic-cache'

interface ImageGenerationResult {
  images?: Array<{ url: string }>;
}

interface FalResponse {
  images?: Array<{ url: string }>;
}

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
  // Configure FAL client with the API key
  fal.config({
    credentials: env.FAL_KEY,
  });

  try {
    const result = await fal.subscribe("fal-ai/flux-1/schnell", {
      input: {
        prompt: `${prompt} {
          "style_name": "DigitalStoryboard_Teal",
          "medium": "digital sketch (tablet, pressure-sensitive pen)",
          "brush_stroke": "loose teal linework ≈2 pt, variable opacity, minimal cross-hatching",
          "edges": "crisp teal rectangular panel borders; internal arrows & notes in lighter teal",
          "color_palette": {
            "primary": ["#70A0A0", "#406C6C"],               // teal lines & borders
            "accents": ["#DF7425"],                           // orange emphasis (props / cues)
            "complementary": ["#E0E0E0", "#BDBDBD", "#FFFFFF"]// flat gray fills & paper white
          },
          "detail_level": "low-medium on characters & key props, very low on background",
          "background": "plain white (no texture)",
          "texture_overlay": "none (clean digital canvas)",
          "lighting": "flat fill with sparse gray shadow blocks",
          "ideal_subjects": [
            "dialogue two-shots",
            "dynamic action silhouettes",
            "prop hand-offs",
            "establishing wides"
          ],
          "file_format_hint": [
            "PNG (transparent or white background)",
            "PSD with separate line & fill layers"
          ]
        }`,
        image_size: "landscape_4_3",
        num_inference_steps: 8,
        enable_safety_checker: true,
        num_images: 1,
        seed: 42,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs.forEach((log) => console.log(log.message));
        }
      },
    }) as ImageGenerationResult;

    console.log("FAL API call result:", JSON.stringify(result, null, 2));

    const imageUrl = result.images?.[0]?.url;
    if (imageUrl) {
      return imageUrl;
    } else {
      console.error("Unexpected FAL API response structure:", result);
      throw new Error("Unexpected FAL API response structure");
    }
  } catch (error) {
    console.error("Error generating image with FAL:", error);
    throw error;
  }
}

/**
 * Generate storyboard image using FAL API with enhanced caching
 */
export async function generateStoryboardImage(prompt: string, env: Env, requestId: string): Promise<Response> {
  const startTime = Date.now()
  
  log('info', requestId, '🎬 [API] Starting storyboard generation', { prompt }, env)
  
  try {
    // First, check semantic cache
    const cachedEntry = await checkSemanticCache(prompt, env, requestId);
    if (cachedEntry) {
      log('info', requestId, '🔍 [CACHE HIT] Returning cached image from semantic cache', {
        prompt,
        cachedUrl: cachedEntry.persistentUrl,
        isSemanticVariation: cachedEntry.isSemanticVariation,
        originalPrompt: cachedEntry.originalPrompt,
        timeSaved: Date.now() - startTime
      }, env)
      
      return new Response(JSON.stringify({
        success: true,
        imageUrl: cachedEntry.persistentUrl,
        cached: true,
        semantic: true,
        originalPrompt: cachedEntry.originalPrompt,
        requestId
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    log('info', requestId, '🔍 [CACHE MISS] No cached image found, generating new one', { prompt }, env)
    
    // ... existing code for FAL AI generation ...
    
    const falResponse = await fetch('https://queue.fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${env.FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Professional storyboard frame: ${prompt}. Cinematic composition, clean lines, professional film pre-production style`,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        enable_safety_checker: false
      })
    })
    
    if (!falResponse.ok) {
      log('error', requestId, '❌ [FAL ERROR] Generation failed', {
        status: falResponse.status,
        statusText: falResponse.statusText
      }, env)
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Image generation failed',
        requestId
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const result = await falResponse.json() as FalResponse
    const imageUrl = result.images?.[0]?.url
    
    if (!imageUrl) {
      log('error', requestId, '❌ [FAL ERROR] No image URL in response', { result }, env)
      return new Response(JSON.stringify({
        success: false,
        error: 'No image generated',
        requestId
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    
    log('info', requestId, '✅ [FAL SUCCESS] Image generated', {
      prompt,
      imageUrl,
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
    
    // Background semantic cache expansion (don't await to avoid blocking response)
    expandSemanticCache(prompt, persistentUrl, cloudflareImageId, env, requestId)
      .catch(error => {
        log('error', requestId, '🧠 [SEMANTIC ERROR] Background expansion failed', {
          prompt,
          error: error instanceof Error ? error.message : String(error)
        }, env)
      })
    
    const totalTime = Date.now() - startTime
    
    log('info', requestId, '🎬 [API COMPLETE] Generation and upload complete', {
      prompt,
      persistentUrl,
      totalTime,
      components: {
        generation: 'FAL AI',
        upload: 'Cloudflare Images',
        cache: 'KV Store',
        semanticExpansion: 'Background'
      }
    }, env)
    
    return new Response(JSON.stringify({
      success: true,
      imageUrl: persistentUrl,
      cached: false,
      semantic: false,
      requestId,
      timing: {
        total: totalTime,
        cacheCheck: 'semantic',
        generation: 'fal',
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