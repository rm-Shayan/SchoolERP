const TTL = 30_000;
const cache = new Map<string, { expires: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();

export async function cached<T>(key: string, request: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const active = pending.get(key);
  if (active) return active as Promise<T>;
  const promise = request().then((value) => {
    cache.set(key, { value, expires: Date.now() + TTL });
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, promise);
  return promise;
}

export function invalidate(prefix: string) {
  for (const key of cache.keys()) if (key.startsWith(prefix)) cache.delete(key);
}
