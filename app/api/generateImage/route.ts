import * as fal from "@fal-ai/serverless-client";

interface ImageGenerationResult {
  images?: Array<{ url: string }>;
}

// Cloudflare utility functions
async function checkCloudflareCache(prompt: string): Promise<string | null> {
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL || 'https://shotdeck-image-cache.andrewsperspective.workers.dev';
  
  console.log('🔍 [CACHE CHECK] Checking Cloudflare cache for:', prompt);
  console.log('🔍 [CACHE CHECK] Worker URL:', workerUrl);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${workerUrl}/api/checkCache`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      const result = await response.json() as { cached: boolean; url?: string };
      
      if (result.cached && result.url) {
        console.log('✅ [CACHE HIT] Found cached image in', duration + 'ms');
        console.log('✅ [CACHE HIT] URL:', result.url);
        return result.url;
      } else {
        console.log('❌ [CACHE MISS] No cached image found in', duration + 'ms');
        return null;
      }
    } else {
      console.error('⚠️ [CACHE ERROR] Response not ok:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('⚠️ [CACHE ERROR] Failed to check Cloudflare cache:', error);
    return null;
  }
}

async function uploadToCloudflare(prompt: string, falUrl: string): Promise<string> {
  const workerUrl = process.env.CLOUDFLARE_WORKER_URL || 'https://shotdeck-image-cache.andrewsperspective.workers.dev';
  
  console.log('💾 [UPLOAD] Starting upload to Cloudflare...');
  console.log('💾 [UPLOAD] Prompt:', prompt);
  console.log('💾 [UPLOAD] FAL URL:', falUrl);
  console.log('💾 [UPLOAD] Worker URL:', workerUrl);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${workerUrl}/api/uploadImage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, falUrl })
    });

    const duration = Date.now() - startTime;

    if (response.ok) {
      const result = await response.json() as { persistentUrl: string };
      console.log('✅ [UPLOAD SUCCESS] Uploaded to Cloudflare in', duration + 'ms');
      console.log('✅ [UPLOAD SUCCESS] Persistent URL:', result.persistentUrl);
      return result.persistentUrl;
    } else {
      const errorText = await response.text();
      console.error('❌ [UPLOAD FAILED] Status:', response.status);
      console.error('❌ [UPLOAD FAILED] Error:', errorText);
      console.log('⚠️ [FALLBACK] Returning original FAL URL:', falUrl);
      return falUrl;
    }
  } catch (error) {
    console.error('❌ [UPLOAD ERROR] Exception during upload:', error);
    console.log('⚠️ [FALLBACK] Returning original FAL URL:', falUrl);
    return falUrl;
  }
}

export async function POST(req: Request) {
  const requestStartTime = Date.now();
  
  try {
    // Configure FAL client inside the function to avoid build-time issues
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      console.error('❌ [SHOTDECK API] FAL_KEY not configured');
      return Response.json({ error: "Image generation service not configured" }, { status: 500 });
    }

    fal.config({
      credentials: falKey,
    });

    const body = await req.json() as { prompt?: string };
    const { prompt } = body;

    console.log('\n🎬 [SHOTDECK API] === NEW IMAGE REQUEST ===');
    console.log('🎬 [SHOTDECK API] Prompt:', prompt);
    console.log('🎬 [SHOTDECK API] Timestamp:', new Date().toISOString());

    if (!prompt) {
      console.error('❌ [SHOTDECK API] No prompt provided');
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 🔍 STEP 1: Check Cloudflare cache first (same pattern as localStorage)
    const cachedUrl = await checkCloudflareCache(prompt);
    if (cachedUrl) {
      const totalDuration = Date.now() - requestStartTime;
      console.log('🚀 [SHOTDECK API] Cache hit! Returning in', totalDuration + 'ms');
      console.log('🎬 [SHOTDECK API] === REQUEST COMPLETE (CACHED) ===\n');
      return Response.json({ url: cachedUrl });
    }

    // 🎨 STEP 2: Generate with FAL (exactly as before)
    console.log('🎨 [FAL GENERATION] Starting AI generation...');
    const falStartTime = Date.now();
    
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
          ],
          "example_prompt": [
            "Storyboard frame 14: low-angle close-up of Ki-woo tilting his head, teal sketch lines, flat gray shadows, orange highlight on his eyes, handwritten camera arrow indicating LOW ANGLE on the right margin",
            "Storyboard frame 17: medium shot, character hands a polished stone across a kitchen table, teal outlines, gray table & walls, single orange accent on the stone, arrow pointing PAN LEFT, quick handwritten note above"
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
          update.logs.forEach((log) => console.log('🎨 [FAL LOG]', log.message));
        }
      },
    }) as ImageGenerationResult;

    const falDuration = Date.now() - falStartTime;
    console.log('✅ [FAL GENERATION] Completed in', falDuration + 'ms');

    const falImageUrl = result.images?.[0]?.url;
    if (falImageUrl) {
      console.log('✅ [FAL GENERATION] Generated URL:', falImageUrl);
      
      // 💾 STEP 3: Upload to Cloudflare for persistence
      const persistentUrl = await uploadToCloudflare(prompt, falImageUrl);
      
      const totalDuration = Date.now() - requestStartTime;
      console.log('🚀 [SHOTDECK API] Total request time:', totalDuration + 'ms');
      console.log('🚀 [SHOTDECK API] Final URL:', persistentUrl);
      console.log('🎬 [SHOTDECK API] === REQUEST COMPLETE (NEW) ===\n');
      
      // Return the persistent URL instead of the temporary FAL URL
      return Response.json({ url: persistentUrl });
    } else {
      console.error('❌ [FAL GENERATION] No image URL in response');
      console.error('❌ [FAL GENERATION] Response:', JSON.stringify(result, null, 2));
      return Response.json({ error: "Unexpected API response structure" }, { status: 500 });
    }
  } catch (error) {
    const totalDuration = Date.now() - requestStartTime;
    console.error('💥 [SHOTDECK API] Error after', totalDuration + 'ms');
    console.error('💥 [SHOTDECK API] Error details:', error);
    
    let errorMessage = "An unexpected error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
