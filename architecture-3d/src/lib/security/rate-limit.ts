/**
 * Sliding-window rate limiter (in-memory, per server instance).
 * For multi-instance deployments, replace the store with Redis; the interface stays the same.
 */
const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

export interface Limit { limit: number; windowMs: number }

export const LIMITS = {
  auth: { limit: 8, windowMs: 10 * 60_000 },
  passwordReset: { limit: 4, windowMs: 60 * 60_000 },
  publicForm: { limit: 6, windowMs: 10 * 60_000 },
  ai: { limit: 8, windowMs: 60 * 60_000 },
  upload: { limit: 30, windowMs: 60 * 60_000 },
  write: { limit: 120, windowMs: 10 * 60_000 },
  analytics: { limit: 240, windowMs: 10 * 60_000 },
} satisfies Record<string, Limit>;

export function checkRate(key: string, { limit, windowMs }: Limit, now = Date.now()): { ok: boolean; retryAfter: number } {
  if (now - lastSweep > 60_000) {
    for (const [k, v] of buckets) if (!v.length || now - (v[v.length - 1] as number) > 3_600_000) buckets.delete(k);
    lastSweep = now;
  }
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - (hits[0] as number))) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfter: 0 };
}

export function resetRateLimits() {
  buckets.clear();
}
