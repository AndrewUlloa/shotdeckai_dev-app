export interface Env {
  FAL_KEY: string
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_IMAGE_ACCOUNT_HASH: string
  IMAGE_CACHE: KVNamespace
  LOG_LEVEL?: string
  ENABLE_REQUEST_LOGGING?: string
} 