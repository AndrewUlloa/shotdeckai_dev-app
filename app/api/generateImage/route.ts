export const runtime = 'edge';

interface GenerateImageResponse {
  url?: string;
  error?: string;
}

export async function POST(req: Request) {
  const requestStartTime = Date.now();
  
  try {
    const body = await req.json() as { prompt?: string };
    const { prompt } = body;

    console.log('\n🎬 [SHOTDECK API] === NEW IMAGE REQUEST ===');
    console.log('🎬 [SHOTDECK API] Prompt:', prompt);
    console.log('🎬 [SHOTDECK API] Timestamp:', new Date().toISOString());

    if (!prompt) {
      console.error('❌ [SHOTDECK API] No prompt provided');
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Proxy everything to the Cloudflare Worker
    const workerUrl = process.env.CLOUDFLARE_WORKER_URL || 'https://shotdeck-image-cache.andrewsperspective.workers.dev';
    
    console.log('🔄 [SHOTDECK API] Proxying to worker:', workerUrl);
    
    const startTime = Date.now();
    const response = await fetch(`${workerUrl}/api/generateImage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const duration = Date.now() - startTime;
    const totalDuration = Date.now() - requestStartTime;

    if (response.ok) {
      const result = await response.json() as GenerateImageResponse;
      console.log('✅ [SHOTDECK API] Worker response in', duration + 'ms');
      console.log('🚀 [SHOTDECK API] Total request time:', totalDuration + 'ms');
      console.log('🎬 [SHOTDECK API] === REQUEST COMPLETE ===\n');
      
      return Response.json(result);
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
