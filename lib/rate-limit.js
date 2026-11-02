const buckets = (globalThis.__cvRateBuckets ??= new Map());

export function takeToken(key, windowMs) {
  const now = Date.now();
  const last = buckets.get(key) ?? 0;
  const elapsed = now - last;

  if (elapsed < windowMs) {
    return { allowed: false, retryAfterMs: windowMs - elapsed };
  }

  buckets.set(key, now);
  return { allowed: true, retryAfterMs: 0 };
}
