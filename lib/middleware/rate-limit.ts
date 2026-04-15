import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export interface RateLimitOptions {
  max?: number;
  window?: number;
  keyPrefix?: string;
}

const defaultOptions: RateLimitOptions = {
  max: 100,
  window: 60,
  keyPrefix: 'ratelimit',
};

export async function withRateLimit(
  request: NextRequest,
  options: RateLimitOptions = defaultOptions
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const { max = 100, window = 60, keyPrefix = 'ratelimit' } = options;
  
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const key = `${keyPrefix}:${ip}`;
  
  try {
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, window);
    }
    
    const ttl = await redis.ttl(key);
    const remaining = Math.max(0, max - current);
    const reset = Math.floor(Date.now() / 1000) + ttl;
    
    return {
      allowed: current <= max,
      remaining,
      reset,
    };
  } catch (error) {
    return {
      allowed: true,
      remaining: max,
      reset: Math.floor(Date.now() / 1000) + window,
    };
  }
}

export function createRateLimitMiddleware(options: RateLimitOptions = defaultOptions) {
  return async function rateLimitMiddleware(request: NextRequest) {
    const { allowed, remaining, reset } = await withRateLimit(request, options);
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': reset.toString(),
          },
        }
      );
    }
    
    return null;
  };
}
