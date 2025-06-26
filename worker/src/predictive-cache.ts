import type { Env, CacheEntry } from './types'
import { generateStoryboardImage } from './image-generator'

interface PredictionResult {
  predictions: string[];
  confidence: number;
  requestId: string;
}

interface TypingPattern {
  partial: string;
  timestamp: number;
  sessionId: string;
  userAgent?: string;
}

interface GeminiPredictiveResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

// Enhanced logging for predictive operations
function logPredictive(level: 'info' | 'warn' | 'error', requestId: string, message: string, metadata?: Record<string, unknown>, env?: Env) {
  const enableLogging = env?.ENABLE_REQUEST_LOGGING !== 'false';
  if (!enableLogging) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    service: 'predictive-cache',
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
 * Generate predictive prompt completions using Gemini 1.5 Flash
 */
export async function generatePredictivePrompts(
  partialInput: string, 
  recentPrompts: string[], 
  env: Env, 
  requestId: string
): Promise<string[]> {
  if (!env.GEMINI_API_KEY) {
    logPredictive('warn', requestId, '🔮 [PREDICT] Gemini API key not configured', {}, env);
    return [];
  }
  
  const predictionCount = 3; // Generate top 3 predictions
  
  try {
    logPredictive('info', requestId, '🔮 [PREDICT] Starting prediction generation', { 
      partialInput, 
      recentPromptsCount: recentPrompts.length 
    }, env);
    
    // Build context from recent prompts
    const contextPrompts = recentPrompts.slice(-5).join('", "'); // Last 5 prompts for context
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Complete this storyboard prompt based on the partial user input and recent context.

Current partial input: "${partialInput}"

Recent user prompts for context: ["${contextPrompts}"]

Generate ${predictionCount} most likely completions for the storyboard prompt.

Requirements:
- Complete the partial input logically
- Suitable for film/video storyboard generation
- Consider the context of recent prompts
- Keep completions concise and specific
- Return ONLY a JSON array of ${predictionCount} completion strings

Examples:
Input: "man walk"
Output: ["man walking down street", "man walking through door", "man walking up stairs"]

Input: "close up"  
Output: ["close up of face", "close up of hands", "close up of object"]

Generate ${predictionCount} completions for: "${partialInput}"`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 150,
            topP: 0.8
          }
        })
      }
    );
    
    if (!response.ok) {
      logPredictive('error', requestId, '🔮 [PREDICT] Gemini API error', {
        status: response.status,
        statusText: response.statusText
      }, env);
      return [];
    }
    
    const result = await response.json() as GeminiPredictiveResponse;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      logPredictive('error', requestId, '🔮 [PREDICT] Empty response from Gemini', { result }, env);
      return [];
    }
    
    // Parse JSON response
    try {
      const predictions = JSON.parse(text);
      if (Array.isArray(predictions)) {
        logPredictive('info', requestId, '🔮 [PREDICT] Successfully generated predictions', {
          partialInput,
          predictionCount: predictions.length,
          predictions
        }, env);
        return predictions.filter(p => typeof p === 'string' && p.trim().length > 0);
      }
    } catch (parseError) {
      // Fallback: extract strings from text using regex
      logPredictive('warn', requestId, '🔮 [PREDICT] JSON parse failed, using regex fallback', { 
        text,
        error: parseError instanceof Error ? parseError.message : String(parseError)
      }, env);
      const matches = text.match(/"([^"]+)"/g);
      if (matches) {
        const predictions = matches.map((s: string) => s.slice(1, -1));
        logPredictive('info', requestId, '🔮 [PREDICT] Extracted predictions with regex', {
          predictionCount: predictions.length
        }, env);
        return predictions;
      }
    }
    
    logPredictive('error', requestId, '🔮 [PREDICT] Failed to parse predictions', { text }, env);
    return [];
    
  } catch (error) {
    logPredictive('error', requestId, '🔮 [PREDICT] Exception during prediction', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, env);
    return [];
  }
}

/**
 * Analyze typing patterns and trigger predictive cache warming
 */
export async function analyzeTypingPattern(
  pattern: TypingPattern,
  env: Env,
  requestId: string
): Promise<PredictionResult> {
  try {
    logPredictive('info', requestId, '📊 [PATTERN] Analyzing typing pattern', {
      partial: pattern.partial,
      sessionId: pattern.sessionId
    }, env);
    
    // Don't predict for very short inputs
    if (pattern.partial.length < 3) {
      return {
        predictions: [],
        confidence: 0,
        requestId
      };
    }
    
    // Get recent prompts for context (from cache)
    const recentPrompts = await getRecentPrompts(env, requestId);
    
    // Generate predictions
    const predictions = await generatePredictivePrompts(
      pattern.partial,
      recentPrompts,
      env,
      requestId
    );
    
    // Calculate confidence based on prediction quality
    const confidence = calculatePredictionConfidence(pattern.partial, predictions);
    
    // Trigger background cache warming for high-confidence predictions
    if (confidence > parseFloat(env.PREDICTION_ACCURACY_THRESHOLD || '0.4')) {
      warmCacheInBackground(predictions, env, requestId);
    }
    
    logPredictive('info', requestId, '📊 [PATTERN] Pattern analysis complete', {
      partial: pattern.partial,
      predictionCount: predictions.length,
      confidence,
      shouldWarmCache: confidence > parseFloat(env.PREDICTION_ACCURACY_THRESHOLD || '0.4')
    }, env);
    
    return {
      predictions,
      confidence,
      requestId
    };
    
  } catch (error) {
    logPredictive('error', requestId, '📊 [PATTERN] Pattern analysis failed', {
      partial: pattern.partial,
      error: error instanceof Error ? error.message : String(error)
    }, env);
    
    return {
      predictions: [],
      confidence: 0,
      requestId
    };
  }
}

/**
 * Get recent prompts from cache for context
 */
async function getRecentPrompts(env: Env, requestId: string): Promise<string[]> {
  try {
    // Get list of recent cache keys
    const keys = await env.IMAGE_CACHE.list({ limit: 20 });
    const recentPrompts: string[] = [];
    
    // Sample recent entries for context
    for (const key of keys.keys.slice(0, 10)) {
      const value = await env.IMAGE_CACHE.get(key.name);
      if (value) {
        try {
          const entry = JSON.parse(value) as CacheEntry;
          if (entry.originalPrompt && !entry.isSemanticVariation) {
            recentPrompts.push(entry.originalPrompt);
          }
        } catch {
          // Skip invalid entries
        }
      }
    }
    
    logPredictive('info', requestId, '📊 [CONTEXT] Retrieved recent prompts', {
      count: recentPrompts.length
    }, env);
    
    return recentPrompts;
    
  } catch (error) {
    logPredictive('error', requestId, '📊 [CONTEXT] Failed to get recent prompts', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    return [];
  }
}

/**
 * Calculate prediction confidence score
 */
function calculatePredictionConfidence(partial: string, predictions: string[]): number {
  if (predictions.length === 0) return 0;
  
  // Base confidence on various factors
  let confidence = 0;
  
  // Factor 1: Number of successful predictions (more = better)
  confidence += Math.min(predictions.length / 3, 1) * 0.3;
  
  // Factor 2: Input length (longer partial = higher confidence)
  confidence += Math.min(partial.length / 20, 1) * 0.3;
  
  // Factor 3: Prediction quality (longer predictions = more specific = better)
  const avgPredictionLength = predictions.reduce((sum, p) => sum + p.length, 0) / predictions.length;
  confidence += Math.min(avgPredictionLength / 30, 1) * 0.4;
  
  return Math.min(confidence, 1);
}

/**
 * Background cache warming for high-confidence predictions
 */
async function warmCacheInBackground(predictions: string[], env: Env, requestId: string): Promise<void> {
  logPredictive('info', requestId, '🔥 [WARM] Starting background cache warming', {
    predictions
  }, env);
  
  // Don't await - run in background
  predictions.forEach(async (prediction, index) => {
    try {
      // Check if already cached
      const cacheKey = prediction.trim().toLowerCase();
      const existing = await env.IMAGE_CACHE.get(cacheKey);
      
      if (!existing) {
        // Generate with a slight delay to avoid overwhelming the system
        setTimeout(async () => {
          const warmRequestId = `${requestId}-warm-${index}`;
          logPredictive('info', warmRequestId, '🔥 [WARM] Generating predicted image', {
            prediction,
            originalRequestId: requestId
          }, env);
          
          try {
            await generateStoryboardImage(prediction, env, warmRequestId);
            logPredictive('info', warmRequestId, '🔥 [WARM] Successfully warmed cache', {
              prediction
            }, env);
          } catch (error) {
            logPredictive('error', warmRequestId, '🔥 [WARM] Cache warming failed', {
              prediction,
              error: error instanceof Error ? error.message : String(error)
            }, env);
          }
        }, index * 2000); // Stagger requests by 2 seconds
      }
    } catch (error) {
      logPredictive('error', requestId, '🔥 [WARM] Cache warming setup failed', {
        prediction,
        error: error instanceof Error ? error.message : String(error)
      }, env);
    }
  });
} 