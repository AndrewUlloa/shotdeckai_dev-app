export const runtime = 'edge';

interface GenerateImageResponse {
  url?: string;
  error?: string;
  tier?: 'instant' | 'fast' | 'final';
  confidence?: number;
  cached?: boolean;
  semantic?: boolean;
  fallbacks?: Array<{
    url: string;
    tier: 'instant' | 'fast' | 'final';
    confidence: number;
    reason: string;
  }>;
}

interface MultiTierRequest {
  prompt: string;
  tiers?: Array<'instant' | 'fast' | 'final'>;
  maxTiers?: number;
  instantOnly?: boolean;
}

export async function POST(req: Request) {
  const requestStartTime = Date.now();
  
  try {
    const body = await req.json() as MultiTierRequest;
    const { prompt, tiers = ['instant', 'fast', 'final'], maxTiers = 3, instantOnly = false } = body;

    console.log('\n🎬 [SHOTDECK API] === MULTI-TIER REQUEST ===');
    console.log('🎬 [SHOTDECK API] Prompt:', prompt);
    console.log('🎬 [SHOTDECK API] Requested tiers:', tiers);
    console.log('🎬 [SHOTDECK API] Instant only:', instantOnly);
    console.log('🎬 [SHOTDECK API] Timestamp:', new Date().toISOString());

    if (!prompt) {
      console.error('❌ [SHOTDECK API] No prompt provided');
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const workerUrl = process.env.CLOUDFLARE_WORKER_URL || 'https://shotdeck-image-cache.andrewsperspective.workers.dev';
    
    // TIER 1: INSTANT - Try semantic cache and exact matches first
    if (tiers.includes('instant')) {
      console.log('⚡ [TIER 1] Checking instant options (cache + semantic)');
      
      const instantResponse = await fetch(`${workerUrl}/api/generateImage/instant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxOptions: 3 })
      });

      if (instantResponse.ok) {
        const instantResult = await instantResponse.json() as GenerateImageResponse;
        if (instantResult.url) {
          const instantTime = Date.now() - requestStartTime;
          console.log('⚡ [TIER 1] Instant result found in', instantTime + 'ms');
          
          // If instant only requested, return immediately
          if (instantOnly) {
            console.log('🎬 [SHOTDECK API] === INSTANT ONLY COMPLETE ===\n');
            return Response.json({
              ...instantResult,
              tier: 'instant',
              timing: { instant: instantTime, total: instantTime }
            });
          }
          
          // Otherwise, start background generation for better tiers
          triggerBackgroundGeneration(prompt, tiers.filter(t => t !== 'instant'), workerUrl);
          
          console.log('🎬 [SHOTDECK API] === INSTANT COMPLETE (BACKGROUND CONTINUING) ===\n');
          return Response.json({
            ...instantResult,
            tier: 'instant',
            backgroundGeneration: true,
            timing: { instant: instantTime }
          });
        }
      }
    }

    // TIER 2 & 3: FAST + FINAL - Full generation with multiple quality options
    console.log('🔄 [MULTI-TIER] No instant results, proceeding to generation');
    
    const startTime = Date.now();
    const response = await fetch(`${workerUrl}/api/generateImage/multiTier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt, 
        tiers: tiers.filter(t => t !== 'instant'),
        maxTiers 
      })
    });

    const duration = Date.now() - startTime;
    const totalDuration = Date.now() - requestStartTime;

    if (response.ok) {
      const result = await response.json() as GenerateImageResponse;
      console.log('✅ [SHOTDECK API] Multi-tier response in', duration + 'ms');
      console.log('🚀 [SHOTDECK API] Total request time:', totalDuration + 'ms');
      console.log('🎬 [SHOTDECK API] === MULTI-TIER COMPLETE ===\n');
      
      return Response.json({
        ...result,
        timing: {
          generation: duration,
          total: totalDuration
        }
      });
    } else {
      const errorText = await response.text();
      console.error('❌ [SHOTDECK API] Worker error:', response.status, errorText);
      console.log('🎬 [SHOTDECK API] === REQUEST FAILED ===\n');
      
      return Response.json(
        { error: "Image generation service unavailable" }, 
        { status: response.status }
      );
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

// Background generation for progressive enhancement
async function triggerBackgroundGeneration(
  prompt: string, 
  remainingTiers: Array<'fast' | 'final'>, 
  workerUrl: string
): Promise<void> {
  // Don't await - fire and forget for background processing
  try {
    fetch(`${workerUrl}/api/generateImage/background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, tiers: remainingTiers })
    }).catch(error => {
      console.warn('⚠️ [BACKGROUND] Background generation failed:', error);
    });
  } catch (error) {
    console.warn('⚠️ [BACKGROUND] Failed to trigger background generation:', error);
  }
}
