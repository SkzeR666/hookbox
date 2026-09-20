import { RATE_LIMIT_PER_MINUTE } from "@hookbox/core";

const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const window = 60_000;
  let hits = buckets.get(key) ?? [];
  hits = hits.filter((t) => now - t < window);
  if (hits.length >= RATE_LIMIT_PER_MINUTE) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

setInterval(
  () => {
    const now = Date.now();
    for (const [k, hits] of buckets) {
      const fresh = hits.filter((t) => now - t < 60_000);
      if (fresh.length === 0) buckets.delete(k);
      else buckets.set(k, fresh);
    }
  },
  120_000,
).unref();