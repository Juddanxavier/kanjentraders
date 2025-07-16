/** @format */

import Redis from 'ioredis';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

// Redis client configuration
const redisConfig = {
  host: env.REDIS_URL?.split('@')[1]?.split(':')[0] || 'localhost',
  port: parseInt(env.REDIS_URL?.split(':')[2] || '6379'),
  password: env.REDIS_URL?.split('@')[0]?.split(':')[2],
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Security settings
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  // Connection pooling
  family: 4,
  keepAlive: true,
  db: 0,
};

class RedisService {
  private static instance: RedisService;
  private redis: Redis | null = null;
  private publisher: Redis | null = null;
  private subscriber: Redis | null = null;

  private constructor() {
    this.initializeConnections();
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  private initializeConnections() {
    try {
      if (!env.REDIS_URL) {
        logger.warn('Redis URL not configured, falling back to in-memory storage');
        return;
      }

      this.redis = new Redis(redisConfig);
      this.publisher = new Redis(redisConfig);
      this.subscriber = new Redis(redisConfig);

      // Connection event handlers
      this.redis.on('connect', () => logger.info('Redis connected'));
      this.redis.on('error', (err) => logger.error('Redis error:', err));
      this.redis.on('ready', () => logger.info('Redis ready'));

      // Health check
      this.redis.ping().then(() => {
        logger.info('Redis health check passed');
      }).catch((err) => {
        logger.error('Redis health check failed:', err);
      });

    } catch (error) {
      logger.error('Failed to initialize Redis connections:', error);
    }
  }

  // Generic cache operations
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.redis) return null;
      
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      if (!this.redis) return false;
      
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.redis) return false;
      
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.redis) return false;
      
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // Session management
  async setSession(sessionId: string, sessionData: any, ttl: number = 24 * 60 * 60): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.set(key, sessionData, ttl);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `session:${sessionId}`;
    return await this.del(key);
  }

  // User data caching
  async cacheUser(userId: string, userData: any, ttl: number = 30 * 60): Promise<boolean> {
    const key = `user:${userId}`;
    return await this.set(key, userData, ttl);
  }

  async getCachedUser(userId: string): Promise<any | null> {
    const key = `user:${userId}`;
    return await this.get(key);
  }

  async invalidateUser(userId: string): Promise<boolean> {
    const key = `user:${userId}`;
    return await this.del(key);
  }

  // API response caching
  async cacheAPIResponse(endpoint: string, params: any, data: any, ttl: number = 15 * 60): Promise<boolean> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return await this.set(key, data, ttl);
  }

  async getCachedAPIResponse(endpoint: string, params: any): Promise<any | null> {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return await this.get(key);
  }

  // Lead data caching
  async cacheLeads(userId: string, filters: any, leads: any[], ttl: number = 5 * 60): Promise<boolean> {
    const key = `leads:${userId}:${JSON.stringify(filters)}`;
    return await this.set(key, leads, ttl);
  }

  async getCachedLeads(userId: string, filters: any): Promise<any[] | null> {
    const key = `leads:${userId}:${JSON.stringify(filters)}`;
    return await this.get(key);
  }

  async invalidateLeadsCache(userId: string): Promise<boolean> {
    try {
      if (!this.redis) return false;
      
      const pattern = `leads:${userId}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error(`Failed to invalidate leads cache for user ${userId}:`, error);
      return false;
    }
  }

  // Lead stats caching
  async cacheLeadStats(userId: string, stats: any, ttl: number = 10 * 60): Promise<boolean> {
    const key = `lead_stats:${userId}`;
    return await this.set(key, stats, ttl);
  }

  async getCachedLeadStats(userId: string): Promise<any | null> {
    const key = `lead_stats:${userId}`;
    return await this.get(key);
  }

  // Analytics caching
  async cacheAnalytics(type: string, country: string | null, data: any, ttl: number = 30 * 60): Promise<boolean> {
    const key = `analytics:${type}:${country || 'all'}`;
    return await this.set(key, data, ttl);
  }

  async getCachedAnalytics(type: string, country: string | null): Promise<any | null> {
    const key = `analytics:${type}:${country || 'all'}`;
    return await this.get(key);
  }

  // User preferences
  async setUserPreference(userId: string, key: string, value: any): Promise<boolean> {
    const prefKey = `prefs:${userId}:${key}`;
    return await this.set(prefKey, value);
  }

  async getUserPreference(userId: string, key: string): Promise<any | null> {
    const prefKey = `prefs:${userId}:${key}`;
    return await this.get(prefKey);
  }

  async getUserPreferences(userId: string): Promise<Record<string, any>> {
    try {
      if (!this.redis) return {};
      
      const pattern = `prefs:${userId}:*`;
      const keys = await this.redis.keys(pattern);
      const preferences: Record<string, any> = {};
      
      for (const key of keys) {
        const prefKey = key.split(':')[2];
        const value = await this.get(key);
        preferences[prefKey] = value;
      }
      
      return preferences;
    } catch (error) {
      logger.error(`Failed to get user preferences for ${userId}:`, error);
      return {};
    }
  }

  // Rate limiting
  async checkRateLimit(identifier: string, windowMs: number, maxRequests: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    try {
      if (!this.redis) {
        return { allowed: true, remaining: maxRequests - 1, resetTime: Date.now() + windowMs };
      }

      const key = `rate_limit:${identifier}`;
      const now = Date.now();
      const window = Math.floor(now / windowMs);
      const windowKey = `${key}:${window}`;

      const multi = this.redis.multi();
      multi.incr(windowKey);
      multi.expire(windowKey, Math.ceil(windowMs / 1000));
      
      const results = await multi.exec();
      const count = results?.[0]?.[1] as number || 0;
      
      const remaining = Math.max(0, maxRequests - count);
      const resetTime = (window + 1) * windowMs;
      
      return {
        allowed: count <= maxRequests,
        remaining,
        resetTime,
      };
    } catch (error) {
      logger.error(`Rate limit check failed for ${identifier}:`, error);
      return { allowed: true, remaining: maxRequests - 1, resetTime: Date.now() + windowMs };
    }
  }

  // Pub/Sub operations
  async publish(channel: string, message: any): Promise<boolean> {
    try {
      if (!this.publisher) return false;
      
      await this.publisher.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error(`Failed to publish to channel ${channel}:`, error);
      return false;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<boolean> {
    try {
      if (!this.subscriber) return false;
      
      await this.subscriber.subscribe(channel);
      
      this.subscriber.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            logger.error(`Failed to parse message from channel ${channel}:`, error);
          }
        }
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to subscribe to channel ${channel}:`, error);
      return false;
    }
  }

  async unsubscribe(channel: string): Promise<boolean> {
    try {
      if (!this.subscriber) return false;
      
      await this.subscriber.unsubscribe(channel);
      return true;
    } catch (error) {
      logger.error(`Failed to unsubscribe from channel ${channel}:`, error);
      return false;
    }
  }

  // Security operations
  async logSecurityEvent(userId: string, event: string, details: any): Promise<boolean> {
    const key = `security:${userId}:${Date.now()}`;
    const eventData = {
      event,
      details,
      timestamp: new Date().toISOString(),
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
    };
    
    return await this.set(key, eventData, 24 * 60 * 60); // 24 hours
  }

  async getSecurityEvents(userId: string, limit: number = 100): Promise<any[]> {
    try {
      if (!this.redis) return [];
      
      const pattern = `security:${userId}:*`;
      const keys = await this.redis.keys(pattern);
      const events: any[] = [];
      
      // Sort keys by timestamp (descending)
      const sortedKeys = keys.sort((a, b) => {
        const timestampA = parseInt(a.split(':')[2]);
        const timestampB = parseInt(b.split(':')[2]);
        return timestampB - timestampA;
      });
      
      // Get the most recent events
      for (const key of sortedKeys.slice(0, limit)) {
        const event = await this.get(key);
        if (event) {
          events.push(event);
        }
      }
      
      return events;
    } catch (error) {
      logger.error(`Failed to get security events for user ${userId}:`, error);
      return [];
    }
  }

  // Cleanup and maintenance
  async cleanup(): Promise<void> {
    try {
      if (!this.redis) return;
      
      // Clean up expired keys
      const patterns = [
        'rate_limit:*',
        'api:*',
        'leads:*',
        'analytics:*',
        'security:*',
      ];
      
      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        for (const key of keys) {
          const ttl = await this.redis.ttl(key);
          if (ttl === -1) {
            // Key has no expiration, set one
            await this.redis.expire(key, 24 * 60 * 60); // 24 hours
          }
        }
      }
      
      logger.info('Redis cleanup completed');
    } catch (error) {
      logger.error('Redis cleanup failed:', error);
    }
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    try {
      if (!this.redis) {
        return { healthy: false };
      }
      
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return { healthy: true, latency };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return { healthy: false };
    }
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.disconnect();
        this.redis = null;
      }
      if (this.publisher) {
        await this.publisher.disconnect();
        this.publisher = null;
      }
      if (this.subscriber) {
        await this.subscriber.disconnect();
        this.subscriber = null;
      }
      logger.info('Redis connections closed');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }
}

// Export singleton instance
export const redisService = RedisService.getInstance();

// Export for dependency injection
export default RedisService;
