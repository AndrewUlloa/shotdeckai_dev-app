export interface Env {
  FAL_KEY: string
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_IMAGE_ACCOUNT_HASH: string
  IMAGE_CACHE: KVNamespace
  LOG_LEVEL?: string
  ENABLE_REQUEST_LOGGING?: string
  
  // Semantic Cache Expansion
  GEMINI_API_KEY?: string
  ENABLE_SEMANTIC_CACHE?: string
  SEMANTIC_EXPANSION_COUNT?: string
  PREDICTION_ACCURACY_THRESHOLD?: string
}

/**
 * Enhanced cache entry structure based on industry research
 * Supports domain-specific optimization and analytics
 */
export interface CacheEntry {
  originalPrompt: string;
  persistentUrl: string;
  cloudflareImageId: string;
  timestamp: number;
  
  // Multi-tier system support
  tier?: 'instant' | 'fast' | 'final';
  
  // Enhanced semantic cache metadata (2024-2025 industry standards)
  isSemanticVariation?: boolean;
  semanticCluster?: string;
  
  // Domain-specific optimization
  domain?: 'storyboard' | 'general';
  expansionStrategy?: 'conservative' | 'aggressive' | 'adaptive';
  qualityScore?: number;
  
  // Variation tracking for analytics
  variationIndex?: number;
  generatedAt?: number;
  parentPrompt?: string;
  
  // Performance analytics
  cacheHits?: number;
  lastAccessed?: number;
  
  // TTL and expiration management
  expiresAt?: number;
  refreshAt?: number;
  
  // Optimization tracking
  optimized?: boolean;
}

/**
 * Upload configuration for optimized Cloudflare uploads
 */
export interface UploadConfig {
  accountId: string;
  apiToken: string;
  accountHash: string;
  optimizations: {
    streaming: boolean;
    compression: string;
    format: string;
  };
}

/**
 * Image generation result with optimization metadata
 */
export interface GenerationResult {
  imageUrl: string | undefined;
  generationTime: number;
} 