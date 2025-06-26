import type { Env, CacheEntry } from './types'

interface GeminiClusterResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface ClusterAnalysis {
  clusters: ClusterGroup[];
  duplicates: DuplicateGroup[];
  optimization: OptimizationRecommendations;
  stats: ClusterStats;
}

interface ClusterGroup {
  id: string;
  originalPrompt: string;
  variations: string[];
  imageUrl: string;
  size: number;
  efficiency: number;
}

interface DuplicateGroup {
  concepts: string[];
  imageUrls: string[];
  recommendedMerge: boolean;
  savingsEstimate: number;
}

interface OptimizationRecommendations {
  mergeGroups: DuplicateGroup[];
  cleanupCandidates: string[];
  expansionOpportunities: string[];
  totalSavingsEstimate: number;
}

interface ClusterStats {
  totalClusters: number;
  averageClusterSize: number;
  efficiency: number;
  storageUtilization: number;
  duplicateRate: number;
}

// Enhanced logging for clustering operations
function logClustering(level: 'info' | 'warn' | 'error', requestId: string, message: string, metadata?: Record<string, unknown>, env?: Env) {
  const enableLogging = env?.ENABLE_REQUEST_LOGGING !== 'false';
  if (!enableLogging) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    requestId,
    message,
    service: 'clustering',
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
 * Analyze cache clusters and identify optimization opportunities
 */
export async function analyzeCacheClusters(env: Env, requestId: string): Promise<ClusterAnalysis> {
  try {
    logClustering('info', requestId, '🔍 [CLUSTER] Starting cluster analysis', {}, env);
    
    // Get all cache entries
    const allEntries = await getAllCacheEntries(env, requestId);
    
    if (allEntries.length === 0) {
      return {
        clusters: [],
        duplicates: [],
        optimization: {
          mergeGroups: [],
          cleanupCandidates: [],
          expansionOpportunities: [],
          totalSavingsEstimate: 0
        },
        stats: {
          totalClusters: 0,
          averageClusterSize: 0,
          efficiency: 0,
          storageUtilization: 0,
          duplicateRate: 0
        }
      };
    }
    
    // Group entries by semantic clusters
    const clusters = groupBySemanticClusters(allEntries, requestId, env);
    
    // Identify potential duplicates using Gemini
    const duplicates = await identifySemanticDuplicates(clusters, env, requestId);
    
    // Generate optimization recommendations
    const optimization = generateOptimizationRecommendations(clusters, duplicates);
    
    // Calculate statistics
    const stats = calculateClusterStats(clusters, allEntries, duplicates);
    
    logClustering('info', requestId, '🔍 [CLUSTER] Cluster analysis complete', {
      clustersFound: clusters.length,
      duplicatesFound: duplicates.length,
      efficiency: stats.efficiency,
      potentialSavings: optimization.totalSavingsEstimate
    }, env);
    
    return {
      clusters,
      duplicates,
      optimization,
      stats
    };
    
  } catch (error) {
    logClustering('error', requestId, '🔍 [CLUSTER] Cluster analysis failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, env);
    throw error;
  }
}

/**
 * Get all cache entries for analysis
 */
async function getAllCacheEntries(env: Env, requestId: string): Promise<Array<CacheEntry & { key: string }>> {
  try {
    const keys = await env.IMAGE_CACHE.list({ limit: 1000 }); // Analyze up to 1000 entries
    const entries: Array<CacheEntry & { key: string }> = [];
    
    logClustering('info', requestId, '📥 [FETCH] Fetching cache entries', {
      totalKeys: keys.keys.length
    }, env);
    
    // Fetch entries in batches to avoid timeouts
    const batchSize = 50;
    for (let i = 0; i < keys.keys.length; i += batchSize) {
      const batch = keys.keys.slice(i, i + batchSize);
      const batchPromises = batch.map(async (key) => {
        const value = await env.IMAGE_CACHE.get(key.name);
        if (value) {
          try {
            const entry = JSON.parse(value) as CacheEntry;
            return { ...entry, key: key.name };
          } catch {
            return null;
          }
        }
        return null;
      });
      
      const batchResults = await Promise.all(batchPromises);
      entries.push(...batchResults.filter(entry => entry !== null) as Array<CacheEntry & { key: string }>);
    }
    
    logClustering('info', requestId, '📥 [FETCH] Cache entries retrieved', {
      totalEntries: entries.length,
      semanticVariations: entries.filter(e => e.isSemanticVariation).length,
      originalPrompts: entries.filter(e => !e.isSemanticVariation).length
    }, env);
    
    return entries;
    
  } catch (error) {
    logClustering('error', requestId, '📥 [FETCH] Failed to fetch cache entries', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    return [];
  }
}

/**
 * Group entries by their semantic clusters
 */
function groupBySemanticClusters(
  entries: Array<CacheEntry & { key: string }>, 
  requestId: string, 
  env: Env
): ClusterGroup[] {
  const clusterMap = new Map<string, ClusterGroup>();
  
  for (const entry of entries) {
    const clusterId = entry.semanticCluster || entry.originalPrompt.toLowerCase();
    
    if (!clusterMap.has(clusterId)) {
      clusterMap.set(clusterId, {
        id: clusterId,
        originalPrompt: entry.originalPrompt,
        variations: [],
        imageUrl: entry.persistentUrl,
        size: 0,
        efficiency: 0
      });
    }
    
    const cluster = clusterMap.get(clusterId)!;
    if (entry.isSemanticVariation) {
      cluster.variations.push(entry.key);
    }
    cluster.size++;
  }
  
  // Calculate efficiency for each cluster
  const clusters = Array.from(clusterMap.values());
  for (const cluster of clusters) {
    // Efficiency = variations per original prompt (more variations = better)
    cluster.efficiency = cluster.variations.length / Math.max(1, cluster.size - cluster.variations.length);
  }
  
  logClustering('info', requestId, '🔗 [GROUP] Clusters grouped', {
    totalClusters: clusters.length,
    averageSize: clusters.reduce((sum, c) => sum + c.size, 0) / clusters.length,
    mostEfficient: clusters.sort((a, b) => b.efficiency - a.efficiency)[0]?.originalPrompt
  }, env);
  
  return clusters;
}

/**
 * Identify semantic duplicates using Gemini AI
 */
async function identifySemanticDuplicates(
  clusters: ClusterGroup[], 
  env: Env, 
  requestId: string
): Promise<DuplicateGroup[]> {
  if (!env.GEMINI_API_KEY || clusters.length < 2) {
    return [];
  }
  
  try {
    logClustering('info', requestId, '🔍 [DUPLICATE] Starting duplicate detection', {
      clustersToAnalyze: clusters.length
    }, env);
    
    // Take sample of clusters for analysis (limit to avoid API costs)
    const sampleClusters = clusters.slice(0, 20);
    const prompts = sampleClusters.map(c => c.originalPrompt);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze these storyboard prompts and identify semantic duplicates - prompts that would result in very similar or identical visual images.

Prompts to analyze:
${prompts.map((p, i) => `${i + 1}. "${p}"`).join('\n')}

Return ONLY a JSON array of duplicate groups. Each group should contain prompt numbers that are semantically equivalent:

Example format:
[
  [1, 3, 7],
  [2, 5],
  [10, 15, 18]
]

Only include groups with 2 or more prompts. If no duplicates found, return [].`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 300,
            topP: 0.8
          }
        })
      }
    );
    
    if (!response.ok) {
      logClustering('error', requestId, '🔍 [DUPLICATE] Gemini API error', {
        status: response.status
      }, env);
      return [];
    }
    
    const result = await response.json() as GeminiClusterResponse;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return [];
    }
    
    try {
      const duplicateIndices = JSON.parse(text);
      const duplicates: DuplicateGroup[] = [];
      
      if (Array.isArray(duplicateIndices)) {
        for (const group of duplicateIndices) {
          if (Array.isArray(group) && group.length >= 2) {
            const concepts = group.map((i: number) => prompts[i - 1]).filter(p => p);
            const imageUrls = group.map((i: number) => sampleClusters[i - 1]?.imageUrl).filter(url => url);
            
            if (concepts.length >= 2) {
              duplicates.push({
                concepts,
                imageUrls,
                recommendedMerge: true,
                savingsEstimate: (concepts.length - 1) * 100 // Estimate 100 bytes saved per merged entry
              });
            }
          }
        }
      }
      
      logClustering('info', requestId, '🔍 [DUPLICATE] Duplicate detection complete', {
        duplicateGroups: duplicates.length,
        totalDuplicates: duplicates.reduce((sum, g) => sum + g.concepts.length, 0)
      }, env);
      
      return duplicates;
      
    } catch (parseError) {
      logClustering('warn', requestId, '🔍 [DUPLICATE] Failed to parse duplicate analysis', {
        text,
        error: parseError instanceof Error ? parseError.message : String(parseError)
      }, env);
      return [];
    }
    
  } catch (error) {
    logClustering('error', requestId, '🔍 [DUPLICATE] Duplicate detection failed', {
      error: error instanceof Error ? error.message : String(error)
    }, env);
    return [];
  }
}

/**
 * Generate optimization recommendations
 */
function generateOptimizationRecommendations(
  clusters: ClusterGroup[], 
  duplicates: DuplicateGroup[]
): OptimizationRecommendations {
  // Find clusters with low efficiency (few variations)
  const lowEfficiencyClusters = clusters.filter(c => c.efficiency < 0.5 && c.size > 1);
  const expansionOpportunities = lowEfficiencyClusters.map(c => c.originalPrompt);
  
  // Find single-entry clusters for potential cleanup
  const cleanupCandidates = clusters
    .filter(c => c.size === 1) // Single-entry clusters
    .map(c => c.originalPrompt);
  
  const totalSavingsEstimate = duplicates.reduce((sum, d) => sum + d.savingsEstimate, 0);
  
  return {
    mergeGroups: duplicates.filter(d => d.recommendedMerge),
    cleanupCandidates: cleanupCandidates.slice(0, 10), // Limit recommendations
    expansionOpportunities: expansionOpportunities.slice(0, 5),
    totalSavingsEstimate
  };
}

/**
 * Calculate cluster statistics
 */
function calculateClusterStats(
  clusters: ClusterGroup[], 
  allEntries: Array<CacheEntry & { key: string }>, 
  duplicates: DuplicateGroup[]
): ClusterStats {
  const totalClusters = clusters.length;
  const averageClusterSize = clusters.length > 0 
    ? clusters.reduce((sum, c) => sum + c.size, 0) / clusters.length 
    : 0;
  
  const efficiency = clusters.length > 0
    ? clusters.reduce((sum, c) => sum + c.efficiency, 0) / clusters.length
    : 0;
  
  const semanticVariations = allEntries.filter(e => e.isSemanticVariation).length;
  const originalPrompts = allEntries.filter(e => !e.isSemanticVariation).length;
  const storageUtilization = originalPrompts > 0 ? semanticVariations / originalPrompts : 0;
  
  const duplicateEntries = duplicates.reduce((sum, d) => sum + d.concepts.length, 0);
  const duplicateRate = allEntries.length > 0 ? duplicateEntries / allEntries.length : 0;
  
  return {
    totalClusters,
    averageClusterSize,
    efficiency,
    storageUtilization,
    duplicateRate
  };
} 