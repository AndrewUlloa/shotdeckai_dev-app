import type { Env, CacheEntry } from './types'

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

// Enhanced logging for semantic operations
function logSemantic(level: 'info' | 'warn' | 'error', requestId: string, message: string, metadata?: Record<string, unknown>, env?: Env) {
  const enableLogging = env?.ENABLE_REQUEST_LOGGING !== 'false';
  if (!enableLogging) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    service: 'semantic-cache',
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

/**
 * Generate semantic variations of a prompt using Gemini 1.5 Flash
 */
export async function generateSemanticVariations(prompt: string, env: Env, requestId: string): Promise<string[]> {
  if (!env.GEMINI_API_KEY) {
    logSemantic('warn', requestId, '🧠 [SEMANTIC] Gemini API key not configured', {}, env);
    return [];
  }
  
  const expansionCount = parseInt(env.SEMANTIC_EXPANSION_COUNT || '6');
  
  try {
    logSemantic('info', requestId, '🧠 [SEMANTIC] Starting variation generation', { 
      prompt, 
      expansionCount 
    }, env);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Create ${expansionCount} semantically identical storyboard prompts for: "${prompt}"

Requirements:
- Same visual concept, different wording only
- Suitable for film/video storyboard generation
- Keep core meaning absolutely identical
- Vary only: synonyms, article usage, word order, prepositions
- Return ONLY a JSON array of strings, no other text

Examples for "cat on table":
["cat sitting on table", "feline on table surface", "cat positioned on table", "table with cat on it", "cat atop table", "cat resting on table"]

Generate ${expansionCount} variations for: "${prompt}"`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 200,
            topP: 0.8
          }
        })
      }
    );
    
    if (!response.ok) {
      logSemantic('error', requestId, '🧠 [SEMANTIC] Gemini API error', {
        status: response.status,
        statusText: response.statusText
      }, env);
      return [];
    }
    
    const result = await response.json() as GeminiResponse;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      logSemantic('error', requestId, '🧠 [SEMANTIC] Empty response from Gemini', { result }, env);
      return [];
    }
    
    // Parse JSON response
    try {
      const variations = JSON.parse(text);
      if (Array.isArray(variations)) {
        logSemantic('info', requestId, '🧠 [SEMANTIC] Successfully generated variations', {
          prompt,
          variationCount: variations.length,
          variations: variations.slice(0, 3) // Log only first 3 for brevity
        }, env);
        return variations.filter(v => typeof v === 'string' && v.trim().length > 0);
      }
    } catch (parseError) {
      // Fallback: extract strings from text using regex
      logSemantic('warn', requestId, '🧠 [SEMANTIC] JSON parse failed, using regex fallback', { 
        text, 
        error: parseError instanceof Error ? parseError.message : String(parseError) 
      }, env);
      const matches = text.match(/"([^"]+)"/g);
      if (matches) {
        const variations = matches.map((s: string) => s.slice(1, -1));
        logSemantic('info', requestId, '🧠 [SEMANTIC] Extracted variations with regex', {
          variationCount: variations.length
        }, env);
        return variations;
      }
    }
    
    logSemantic('error', requestId, '🧠 [SEMANTIC] Failed to parse variations', { text }, env);
    return [];
    
  } catch (error) {
    logSemantic('error', requestId, '🧠 [SEMANTIC] Exception during generation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, env);
    return [];
  }
}

/**
 * Expand cache with semantic variations after successful image generation
 */
export async function expandSemanticCache(
  originalPrompt: string, 
  persistentUrl: string, 
  cloudflareImageId: string, 
  env: Env, 
  requestId: string
): Promise<void> {
  const enableSemanticCache = env.ENABLE_SEMANTIC_CACHE !== 'false';
  
  if (!enableSemanticCache) {
    logSemantic('info', requestId, '🧠 [SEMANTIC] Semantic cache disabled', {}, env);
    return;
  }
  
  try {
    const startTime = Date.now();
    
    // Generate semantic variations
    const variations = await generateSemanticVariations(originalPrompt, env, requestId);
    
    if (variations.length === 0) {
      logSemantic('warn', requestId, '🧠 [SEMANTIC] No variations generated', { originalPrompt }, env);
      return;
    }
    
    // Create cache entries for all variations
    const cachePromises = variations.map(async (variation) => {
      const cacheKey = variation.trim().toLowerCase();
      const cacheEntry: CacheEntry = {
        originalPrompt,
        persistentUrl,
        cloudflareImageId,
        timestamp: Date.now(),
        isSemanticVariation: true,
        semanticCluster: originalPrompt.toLowerCase()
      };
      
      try {
        await env.IMAGE_CACHE.put(cacheKey, JSON.stringify(cacheEntry));
        return { success: true, variation };
      } catch (error) {
        logSemantic('error', requestId, '🧠 [SEMANTIC] Failed to cache variation', {
          variation,
          error: error instanceof Error ? error.message : String(error)
        }, env);
        return { success: false, variation };
      }
    });
    
    const results = await Promise.all(cachePromises);
    const successCount = results.filter(r => r.success).length;
    const duration = Date.now() - startTime;
    
    logSemantic('info', requestId, '🧠 [SEMANTIC] Cache expansion complete', {
      originalPrompt,
      totalVariations: variations.length,
      successfulCaches: successCount,
      duration,
      variations: variations
    }, env);
    
  } catch (error) {
    logSemantic('error', requestId, '🧠 [SEMANTIC] Cache expansion failed', {
      originalPrompt,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, env);
  }
}

/**
 * Check if a prompt exists in semantic cache and return the original image
 */
export async function checkSemanticCache(prompt: string, env: Env, requestId: string): Promise<CacheEntry | null> {
  try {
    const cacheKey = prompt.trim().toLowerCase();
    const cachedData = await env.IMAGE_CACHE.get(cacheKey);
    
    if (cachedData) {
      const cacheEntry = JSON.parse(cachedData) as CacheEntry;
      
      logSemantic('info', requestId, '🧠 [SEMANTIC] Cache hit detected', {
        prompt,
        isSemanticVariation: cacheEntry.isSemanticVariation,
        originalPrompt: cacheEntry.originalPrompt,
        semanticCluster: cacheEntry.semanticCluster
      }, env);
      
      return cacheEntry;
    }
    
    return null;
  } catch (error) {
    logSemantic('error', requestId, '🧠 [SEMANTIC] Cache check failed', {
      prompt,
      error: error instanceof Error ? error.message : String(error)
    }, env);
    return null;
  }
} 