import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
}

export async function withCache(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  const { ttl = 300, keyPrefix = 'api' } = options;
  
  const cacheKey = `${keyPrefix}:${request.url}`;
  
  try {
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': `public, max-age=${ttl}`,
        },
      });
    }
    
    const response = await handler(request);
    
    if (response.status === 200) {
      const data = await response.json();
      await redis.setex(cacheKey, ttl, JSON.stringify(data));
    }
    
    return response;
  } catch (error) {
    return handler(request);
  }
}
