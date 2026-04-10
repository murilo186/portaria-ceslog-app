type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const inMemoryCache = new Map<string, CacheEntry>();

export function getCachedValue<T>(key: string): T | null {
  const cached = inMemoryCache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    inMemoryCache.delete(key);
    return null;
  }

  return cached.value as T;
}

export function setCachedValue<T>(key: string, value: T, ttlMs: number) {
  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function clearCachedValue(key: string) {
  inMemoryCache.delete(key);
}

export function clearCacheByPrefix(prefix: string) {
  for (const key of inMemoryCache.keys()) {
    if (key.startsWith(prefix)) {
      inMemoryCache.delete(key);
    }
  }
}