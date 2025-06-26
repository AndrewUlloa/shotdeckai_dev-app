import type { Env } from './types'

interface UserSession {
  id: string;
  timestamp: number;
  prompts: string[];
  typingPatterns: TypingEvent[];
  predictions: PredictionEvent[];
  cacheHits: number;
  cacheMisses: number;
  userAgent?: string;
}

interface TypingEvent {
  timestamp: number;
  partial: string;
  finalPrompt?: string;
  duration: number;
  abandoned?: boolean;
}

interface PredictionEvent {
  timestamp: number;
  partial: string;
  predictions: string[];
  actualChoice?: string;
  accuracy: number;
  confidence: number;
}

interface UserAnalytics {
  totalSessions: number;
  averageSessionLength: number;
  commonPatterns: string[];
  predictionAccuracy: number;
  cacheHitRate: number;
  improvementOpportunities: string[];
  behaviorInsights: BehaviorInsight[];
}

interface BehaviorInsight {
  pattern: string;
  frequency: number;
  confidence: number;
  recommendation: string;
}

// Enhanced logging for user analytics
function logAnalytics(level: 'info' | 'warn' | 'error', requestId: string, message: string, metadata?: Record<string, unknown>, env?: Env) {
  const enableLogging = env?.ENABLE_REQUEST_LOGGING !== 'false';
  if (!enableLogging) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    service: 'user-analytics',
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
 * Track user session data for analytics (privacy-safe)
 */
export async function trackUserSession(
  sessionData: Partial<UserSession>, 
  env: Env, 
  requestId: string
): Promise<void> {
  try {
    logAnalytics('info', requestId, '📊 [TRACK] Recording user session', {
      sessionId: sessionData.id,
      promptCount: sessionData.prompts?.length,
      typingEvents: sessionData.typingPatterns?.length
    }, env);
    
    // Privacy-safe: Only store anonymized patterns, no personal data
    const anonymizedSession: UserSession = {
      id: sessionData.id || generateSessionId(),
      timestamp: Date.now(),
      prompts: sessionData.prompts || [],
      typingPatterns: sessionData.typingPatterns || [],
      predictions: sessionData.predictions || [],
      cacheHits: sessionData.cacheHits || 0,
      cacheMisses: sessionData.cacheMisses || 0,
      userAgent: anonymizeUserAgent(sessionData.userAgent)
    };
    
    // Store session data in KV with expiration (30 days)
    const sessionKey = `session:${anonymizedSession.id}`;
    await env.IMAGE_CACHE.put(
      sessionKey, 
      JSON.stringify(anonymizedSession),
      { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
    );
    
    logAnalytics('info', requestId, '📊 [TRACK] Session recorded successfully', {
      sessionId: anonymizedSession.id,
      dataSize: JSON.stringify(anonymizedSession).length
    }, env);
    
  } catch (error) {
    logAnalytics('error', requestId, '📊 [TRACK] Failed to track session', {
      error: error instanceof Error ? error.message : String(error),
      sessionId: sessionData.id
    }, env);
  }
}

/**
 * Track typing pattern for real-time learning
 */
export async function trackTypingPattern(
  pattern: TypingEvent,
  sessionId: string,
  env: Env,
  requestId: string
): Promise<void> {
  try {
    logAnalytics('info', requestId, '⌨️ [TYPE] Recording typing pattern', {
      sessionId,
      partial: pattern.partial,
      duration: pattern.duration
    }, env);
    
    // Get existing session or create new one
    const sessionKey = `session:${sessionId}`;
    const existingSession = await env.IMAGE_CACHE.get(sessionKey);
    
    let session: UserSession;
    if (existingSession) {
      session = JSON.parse(existingSession) as UserSession;
    } else {
      session = {
        id: sessionId,
        timestamp: Date.now(),
        prompts: [],
        typingPatterns: [],
        predictions: [],
        cacheHits: 0,
        cacheMisses: 0
      };
    }
    
    // Add typing pattern
    session.typingPatterns.push(pattern);
    
    // Update session with extended TTL
    await env.IMAGE_CACHE.put(
      sessionKey,
      JSON.stringify(session),
      { expirationTtl: 30 * 24 * 60 * 60 }
    );
    
    logAnalytics('info', requestId, '⌨️ [TYPE] Typing pattern recorded', {
      sessionId,
      totalPatterns: session.typingPatterns.length
    }, env);
    
  } catch (error) {
    logAnalytics('error', requestId, '⌨️ [TYPE] Failed to track typing pattern', {
      error: error instanceof Error ? error.message : String(error),
      sessionId
    }, env);
  }
}

/**
 * Track prediction accuracy for learning
 */
export async function trackPredictionAccuracy(
  prediction: PredictionEvent,
  sessionId: string,
  env: Env,
  requestId: string
): Promise<void> {
  try {
    logAnalytics('info', requestId, '🎯 [PREDICT] Recording prediction accuracy', {
      sessionId,
      accuracy: prediction.accuracy,
      confidence: prediction.confidence
    }, env);
    
    // Get existing session
    const sessionKey = `session:${sessionId}`;
    const existingSession = await env.IMAGE_CACHE.get(sessionKey);
    
    if (existingSession) {
      const session = JSON.parse(existingSession) as UserSession;
      session.predictions.push(prediction);
      
      // Update session
      await env.IMAGE_CACHE.put(
        sessionKey,
        JSON.stringify(session),
        { expirationTtl: 30 * 24 * 60 * 60 }
      );
      
      logAnalytics('info', requestId, '🎯 [PREDICT] Prediction accuracy recorded', {
        sessionId,
        totalPredictions: session.predictions.length,
        averageAccuracy: session.predictions.reduce((sum, p) => sum + p.accuracy, 0) / session.predictions.length
      }, env);
    }
    
  } catch (error) {
    logAnalytics('error', requestId, '🎯 [PREDICT] Failed to track prediction accuracy', {
      error: error instanceof Error ? error.message : String(error),
      sessionId
    }, env);
  }
}

/**
 * Analyze user behavior patterns across all sessions
 */
export async function analyzeUserBehavior(env: Env, requestId: string): Promise<UserAnalytics> {
  try {
    logAnalytics('info', requestId, '📈 [ANALYZE] Starting user behavior analysis', {}, env);
    
    // Get all user sessions
    const sessionKeys = await env.IMAGE_CACHE.list({ prefix: 'session:' });
    const sessions: UserSession[] = [];
    
    // Fetch sessions in batches
    const batchSize = 20;
    for (let i = 0; i < sessionKeys.keys.length; i += batchSize) {
      const batch = sessionKeys.keys.slice(i, i + batchSize);
      const batchPromises = batch.map(async (key) => {
        const value = await env.IMAGE_CACHE.get(key.name);
        if (value) {
          try {
            return JSON.parse(value) as UserSession;
          } catch {
            return null;
          }
        }
        return null;
      });
      
      const batchResults = await Promise.all(batchPromises);
      sessions.push(...batchResults.filter(s => s !== null) as UserSession[]);
    }
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageSessionLength: 0,
        commonPatterns: [],
        predictionAccuracy: 0,
        cacheHitRate: 0,
        improvementOpportunities: [],
        behaviorInsights: []
      };
    }
    
    // Analyze patterns
    const analytics = calculateUserAnalytics(sessions);
    
    logAnalytics('info', requestId, '📈 [ANALYZE] User behavior analysis complete', {
      totalSessions: analytics.totalSessions,
      predictionAccuracy: analytics.predictionAccuracy,
      cacheHitRate: analytics.cacheHitRate,
      insightsCount: analytics.behaviorInsights.length
    }, env);
    
    return analytics;
    
  } catch (error) {
    logAnalytics('error', requestId, '📈 [ANALYZE] User behavior analysis failed', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    throw error;
  }
}

/**
 * Calculate user analytics from session data
 */
function calculateUserAnalytics(sessions: UserSession[]): UserAnalytics {
  const totalSessions = sessions.length;
  const averageSessionLength = sessions.reduce((sum, s) => sum + s.prompts.length, 0) / totalSessions;
  
  // Extract common prompt patterns
  const allPrompts = sessions.flatMap(s => s.prompts);
  const promptFrequency = allPrompts.reduce((freq: Record<string, number>, prompt) => {
    const key = prompt.toLowerCase().trim();
    freq[key] = (freq[key] || 0) + 1;
    return freq;
  }, {});
  
  const commonPatterns = Object.entries(promptFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([prompt]) => prompt);
  
  // Calculate prediction accuracy
  const allPredictions = sessions.flatMap(s => s.predictions);
  const predictionAccuracy = allPredictions.length > 0
    ? allPredictions.reduce((sum, p) => sum + p.accuracy, 0) / allPredictions.length
    : 0;
  
  // Calculate cache hit rate
  const totalCacheAttempts = sessions.reduce((sum, s) => sum + s.cacheHits + s.cacheMisses, 0);
  const totalCacheHits = sessions.reduce((sum, s) => sum + s.cacheHits, 0);
  const cacheHitRate = totalCacheAttempts > 0 ? totalCacheHits / totalCacheAttempts : 0;
  
  // Generate behavior insights
  const behaviorInsights = generateBehaviorInsights(sessions, promptFrequency);
  
  // Identify improvement opportunities
  const improvementOpportunities = identifyImprovementOpportunities(
    sessions, 
    predictionAccuracy, 
    cacheHitRate
  );
  
  return {
    totalSessions,
    averageSessionLength,
    commonPatterns,
    predictionAccuracy,
    cacheHitRate,
    improvementOpportunities,
    behaviorInsights
  };
}

/**
 * Generate behavior insights from user data
 */
function generateBehaviorInsights(
  sessions: UserSession[], 
  promptFrequency: Record<string, number>
): BehaviorInsight[] {
  const insights: BehaviorInsight[] = [];
  
  // Insight 1: Most common prompt patterns
  const topPrompts = Object.entries(promptFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  if (topPrompts.length > 0) {
    insights.push({
      pattern: `Top prompt: "${topPrompts[0][0]}"`,
      frequency: topPrompts[0][1],
      confidence: 0.9,
      recommendation: 'Consider expanding semantic variations for this popular prompt'
    });
  }
  
  // Insight 2: Session length patterns
  const avgSessionLength = sessions.reduce((sum, s) => sum + s.prompts.length, 0) / sessions.length;
  if (avgSessionLength > 5) {
    insights.push({
      pattern: 'Long user sessions detected',
      frequency: sessions.filter(s => s.prompts.length > 5).length,
      confidence: 0.8,
      recommendation: 'Users are engaged - consider predictive cache warming for multi-prompt sessions'
    });
  }
  
  // Insight 3: Prediction accuracy trends
  const recentSessions = sessions.filter(s => Date.now() - s.timestamp < 7 * 24 * 60 * 60 * 1000); // Last 7 days
  if (recentSessions.length > 10) {
    const recentAccuracy = recentSessions.flatMap(s => s.predictions)
      .reduce((sum, p) => sum + p.accuracy, 0) / Math.max(1, recentSessions.flatMap(s => s.predictions).length);
    
    if (recentAccuracy < 0.4) {
      insights.push({
        pattern: 'Low prediction accuracy detected',
        frequency: recentSessions.length,
        confidence: 0.7,
        recommendation: 'Adjust prediction algorithms or expand training data'
      });
    }
  }
  
  return insights;
}

/**
 * Identify opportunities for improvement
 */
function identifyImprovementOpportunities(
  sessions: UserSession[],
  predictionAccuracy: number,
  cacheHitRate: number
): string[] {
  const opportunities: string[] = [];
  
  if (cacheHitRate < 0.5) {
    opportunities.push('Expand semantic cache variations to improve hit rate');
  }
  
  if (predictionAccuracy < 0.4) {
    opportunities.push('Improve prediction algorithms with more context');
  }
  
  const avgTypingDuration = sessions.flatMap(s => s.typingPatterns)
    .reduce((sum, p) => sum + p.duration, 0) / 
    Math.max(1, sessions.flatMap(s => s.typingPatterns).length);
  
  if (avgTypingDuration > 5000) { // 5 seconds
    opportunities.push('Users spend long time typing - implement auto-complete suggestions');
  }
  
  const abandonedTyping = sessions.flatMap(s => s.typingPatterns)
    .filter(p => p.abandoned).length;
  
  if (abandonedTyping > sessions.length * 0.2) {
    opportunities.push('High typing abandonment rate - improve user experience');
  }
  
  return opportunities;
}

/**
 * Generate anonymous session ID
 */
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Anonymize user agent for privacy
 */
function anonymizeUserAgent(userAgent?: string): string | undefined {
  if (!userAgent) return undefined;
  
  // Extract only basic browser info, remove specific versions and identifying data
  const basicInfo = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/i);
  return basicInfo ? basicInfo[0] : 'Unknown';
} 