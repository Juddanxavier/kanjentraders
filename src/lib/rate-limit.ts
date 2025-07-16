import { env } from './env';
import { redisService } from './services/redis-enhanced';
import { logger } from './logger';

// Redis-first rate limiter with in-memory fallback
interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private useRedis: boolean;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 5) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.useRedis = !!env.REDIS_URL;
  }

  async limit(identifier: string): Promise<{ success: boolean; remaining: number; resetTime: number }> {
    if (this.useRedis) {
      try {
        const result = await redisService.checkRateLimit(identifier, this.windowMs, this.maxRequests);
        return {
          success: result.allowed,
          remaining: result.remaining,
          resetTime: result.resetTime,
        };
      } catch (error) {
        logger.warn('Redis rate limiting failed, falling back to in-memory:', error);
        this.useRedis = false;
      }
    }

    // In-memory fallback
    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    const current = store.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or initialize
      const resetTime = now + this.windowMs;
      store.set(key, { count: 1, resetTime });
      return {
        success: true,
        remaining: this.maxRequests - 1,
        resetTime,
      };
    }
    
    if (current.count >= this.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime: current.resetTime,
      };
    }
    
    current.count++;
    return {
      success: true,
      remaining: this.maxRequests - current.count,
      resetTime: current.resetTime,
    };
  }

  async reset(identifier: string): Promise<void> {
    if (this.useRedis) {
      try {
        // Redis doesn't have a specific reset method, but we can delete the pattern
        await redisService.del(`rate_limit:${identifier}`);
        return;
      } catch (error) {
        logger.warn('Redis rate limit reset failed:', error);
      }
    }

    // In-memory fallback
    const key = `ratelimit:${identifier}`;
    store.delete(key);
  }

  // Cleanup expired entries (only for in-memory)
  cleanup(): void {
    if (this.useRedis) return; // Redis handles expiration automatically
    
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (now > value.resetTime) {
        store.delete(key);
      }
    }
  }
}
// Default rate limiter for auth operations
export const ratelimit = new RateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
// More restrictive rate limiter for sensitive operations
export const strictRateLimit = new RateLimiter(60 * 60 * 1000, 3); // 3 attempts per hour
// General API rate limiter
export const apiRateLimit = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    ratelimit.cleanup();
    strictRateLimit.cleanup();
    apiRateLimit.cleanup();
  }, 5 * 60 * 1000);
}
// Redis-based rate limiter for production (commented out for now)
/*
import Redis from 'ioredis';
class RedisRateLimiter {
  private redis: Redis;
  private windowMs: number;
  private maxRequests: number;
  constructor(redis: Redis, windowMs: number = 15 * 60 * 1000, maxRequests: number = 5) {
    this.redis = redis;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }
  async limit(identifier: string): Promise<{ success: boolean; remaining: number; resetTime: number }> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const window = Math.floor(now / this.windowMs);
    const windowKey = `${key}:${window}`;
    const multi = this.redis.multi();
    multi.incr(windowKey);
    multi.expire(windowKey, Math.ceil(this.windowMs / 1000));
    const results = await multi.exec();
    const count = results?.[0]?.[1] as number;
    const remaining = Math.max(0, this.maxRequests - count);
    const resetTime = (window + 1) * this.windowMs;
    return {
      success: count <= this.maxRequests,
      remaining,
      resetTime,
    };
  }
  async reset(identifier: string): Promise<void> {
    const pattern = `ratelimit:${identifier}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
// Initialize Redis rate limiter if Redis URL is provided
let redisClient: Redis | null = null;
if (env.REDIS_URL) {
  try {
    redisClient = new Redis(env.REDIS_URL);
    export const ratelimit = new RedisRateLimiter(redisClient, 15 * 60 * 1000, 5);
    export const strictRateLimit = new RedisRateLimiter(redisClient, 60 * 60 * 1000, 3);
    export const apiRateLimit = new RedisRateLimiter(redisClient, 15 * 60 * 1000, 100);
  } catch (error) {
    console.warn('Failed to initialize Redis rate limiter, falling back to in-memory:', error);
  }
}
*/
