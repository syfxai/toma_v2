// In-memory sliding window rate limiter for API endpoints
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, RateLimitEntry>();

// Clean up expired records every 2 minutes
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of ipStore.entries()) {
      if (now > entry.resetAt) {
        ipStore.delete(key);
      }
    }
  }, 2 * 60 * 1000);
  timer.unref?.();
}

export function getClientIp(req: any): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

export function checkRateLimit(
  ip: string,
  endpointKey: string,
  maxRequests: number,
  windowMs: number = 60 * 1000
): { limited: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const key = `${endpointKey}:${ip}`;
  const entry = ipStore.get(key);

  if (!entry || now > entry.resetAt) {
    ipStore.set(key, { count: 1, resetAt: now + windowMs });
    return { 
      limited: false, 
      remaining: maxRequests - 1, 
      resetInSec: Math.ceil(windowMs / 1000) 
    };
  }

  if (entry.count >= maxRequests) {
    const resetInSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return { limited: true, remaining: 0, resetInSec };
  }

  entry.count += 1;
  const resetInSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return { limited: false, remaining: maxRequests - entry.count, resetInSec };
}
