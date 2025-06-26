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

export interface CacheEntry {
  originalPrompt: string;
  persistentUrl: string;
  cloudflareImageId: string;
  timestamp: number;
  isSemanticVariation?: boolean;
  semanticCluster?: string;
  userBehaviorData?: {
    accuracy: number;
    usage: number;
  };
} 