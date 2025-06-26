import * as fal from "@fal-ai/serverless-client";
import type { Env, CacheEntry } from './types'
import { uploadToCloudflareImages } from './image-uploader'
import { checkSemanticCache, expandSemanticCache } from './semantic-cache'

interface ImageGenerationResult {
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
    
    // Configure FAL client with the API key
    fal.config({
      credentials: env.FAL_KEY,
    });

    log('info', requestId, '🎨 [FAL] Starting image generation with official client', { prompt }, env)
    
    // Use the official FAL client library for generation
    const result = await fal.subscribe("fal-ai/flux/schnell", {
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
          log('info', requestId, '🎨 [FAL PROGRESS] Generation in progress', { status: update.status }, env)
        }
      },
    }) as ImageGenerationResult;

    log('info', requestId, '🎨 [FAL RESPONSE] Received response from FAL', { 
      hasImages: !!result.images,
      imageCount: result.images?.length || 0 
    }, env)
    
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
        generation: 'FAL AI',
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