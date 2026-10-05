// ponytail: in-memory per-instance. Upgrade to Redis/Upstash if multi-region rate limiting matters.
const store = new Map<string, { count: number; resetAt: number }>();
const MAX_ENTRIES = 5000;

export function rateLimit(ip: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.resetAt < now) store.delete(k);
  }
  const entry = store.get(ip);
  if (!entry) {
    if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value!);
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function getClientIp(request: Request): string {
  // x-real-ip is set by Vercel's edge from the TCP connection — cannot be spoofed
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  // Rightmost entry in x-forwarded-for is appended by the trusted proxy, not user-supplied
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',').at(-1)!.trim();
  return 'unknown';
}
