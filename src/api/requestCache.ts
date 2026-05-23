const inflight = new Map<string, Promise<unknown>>();
const responseCache = new Map<string, { expires: number; value: unknown }>();

const DEFAULT_TTL_MS = 90_000;

function cacheKey(method: string, url: string, token?: string | null): string {
  return `${method}:${url}:${token ?? ''}`;
}

export function clearApiCache(): void {
  inflight.clear();
  responseCache.clear();
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttlMs?: number; force?: boolean },
): Promise<T> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const force = options?.force ?? false;
  const now = Date.now();

  if (!force) {
    const cached = responseCache.get(key);
    if (cached && cached.expires > now) {
      return cached.value as T;
    }
    const pending = inflight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }
  }

  const request = fetcher()
    .then((value) => {
      responseCache.set(key, { expires: Date.now() + ttlMs, value });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}

export function setCachedValue<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  responseCache.set(key, { expires: Date.now() + ttlMs, value });
}

export function invalidateCacheKey(key: string): void {
  responseCache.delete(key);
  inflight.delete(key);
}

export function historyCacheKey(token: string): string {
  return cacheKey('GET', '/locator/history', token);
}

export function profileCacheKey(token: string): string {
  return cacheKey('GET', '/users/me', token);
}
