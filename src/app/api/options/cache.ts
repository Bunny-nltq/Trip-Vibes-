// In-memory cache cho /api/options (TTL 1 giờ)
export interface CacheEntry {
  timestamp: number;
  data: unknown;
}

export const memoryCache = new Map<string, CacheEntry>();
export const CACHE_TTL_MS = 60 * 60 * 1000;

export function clearOptionsCache() {
  memoryCache.clear();
}
