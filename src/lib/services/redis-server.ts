/** @format */

import { Notification } from '@/types/notification';

// Type definitions for Redis operations
interface RedisClient {
  publish(channel: string, message: string): Promise<number>;
  subscribe(channel: string, callback?: (err: Error | null) => void): void;
  unsubscribe(channel: string): void;
  on(event: string, callback: (channel: string, message: string) => void): void;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  get(key: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<number>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  expire(key: string, seconds: number): Promise<number>;
  disconnect(): Promise<void>;
}

// Server-only Redis client factory
function createRedisClient(): RedisClient {
  if (typeof window !== 'undefined') {
    throw new Error('Redis client can only be used on the server side');
  }
  
  // Dynamic import of ioredis only on server
  const Redis = require('ioredis');
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 0,
    connectTimeout: 10000,
    commandTimeout: 5000,
  });
  
  // Add connection error handling to prevent memory leaks
  client.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
  
  client.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });
  
  client.on('ready', () => {
    console.log('⚡ Redis ready for operations');
  });
  
  client.on('close', () => {
    console.log('❌ Redis connection closed');
  });
  
  return client;
}

// Singleton instances
let redisClient: RedisClient | null = null;
let pubClient: RedisClient | null = null;

function getRedisClient(): RedisClient {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}

// Export the Redis client for external use - only create if Redis is enabled
export const redis = process.env.REDIS_URL ? getRedisClient() : null;

function getPubClient(): RedisClient {
  if (!pubClient) {
    pubClient = createRedisClient();
  }
  return pubClient;
}

export class ServerRedisService {
  private static subscribers = new Map<string, RedisClient>();

  /**
   * Publish a notification to a user's channel
   */
  static async publish(userId: string, notification: Notification): Promise<void> {
    try {
      const channel = `notifications:${userId}`;
      const pubClient = getPubClient();
      await pubClient.publish(channel, JSON.stringify(notification));
      console.log(`Published notification to channel: ${channel}`);
    } catch (error) {
      console.error('Error publishing notification:', error);
    }
  }

  /**
   * Subscribe to a user's notification channel
   */
  static subscribe(userId: string, callback: (notification: Notification) => void): RedisClient {
    const channel = `notifications:${userId}`;
    const subscriber = createRedisClient();
    
    subscriber.subscribe(channel, (err) => {
      if (err) {
        console.error('Failed to subscribe to channel:', err);
        return;
      }
      console.log(`Subscribed to channel: ${channel}`);
    });

    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const notification = JSON.parse(message) as Notification;
          callback(notification);
        } catch (error) {
          console.error('Error parsing notification message:', error);
        }
      }
    });

    this.subscribers.set(userId, subscriber);
    return subscriber;
  }

  /**
   * Unsubscribe from a user's notification channel
   */
  static unsubscribe(userId: string): void {
    const subscriber = this.subscribers.get(userId);
    if (subscriber) {
      subscriber.unsubscribe(`notifications:${userId}`);
      subscriber.disconnect();
      this.subscribers.delete(userId);
      console.log(`Unsubscribed from channel: notifications:${userId}`);
    }
  }

  /**
   * Cache notification count for a user
   */
  static async setUnreadCount(userId: string, count: number): Promise<void> {
    try {
      const key = `notifications:unread:${userId}`;
      const client = getRedisClient();
      await client.set(key, count.toString(), 'EX', 3600); // Expire in 1 hour
    } catch (error) {
      console.error('Error setting unread count:', error);
    }
  }

  /**
   * Get cached notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const key = `notifications:unread:${userId}`;
      const client = getRedisClient();
      const count = await client.get(key);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Cache recent notifications for a user
   */
  static async cacheRecentNotifications(userId: string, notifications: Notification[]): Promise<void> {
    try {
      if (!process.env.REDIS_URL) {
        console.warn('Redis not configured, skipping cache');
        return;
      }
      const key = `notifications:recent:${userId}`;
      const client = getRedisClient();
      await client.set(key, JSON.stringify(notifications), 'EX', 1800); // Expire in 30 minutes
    } catch (error) {
      console.error('Error caching notifications:', error);
    }
  }

  /**
   * Get cached recent notifications for a user
   */
  static async getCachedRecentNotifications(userId: string): Promise<Notification[] | null> {
    try {
      if (!process.env.REDIS_URL) {
        return null;
      }
      const key = `notifications:recent:${userId}`;
      const client = getRedisClient();
      const cached = await client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached notifications:', error);
      return null;
    }
  }

  /**
   * Clear all cached data for a user
   */
  static async clearUserCache(userId: string): Promise<void> {
    try {
      const keys = [
        `notifications:unread:${userId}`,
        `notifications:recent:${userId}`,
      ];
      const client = getRedisClient();
      await client.del(...keys);
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }

  /**
   * Generic cache set method
   */
  static async setCache(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    try {
      if (!process.env.REDIS_URL) {
        console.warn('Redis not configured, skipping cache');
        return;
      }
      const client = getRedisClient();
      await client.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  /**
   * Generic cache get method
   */
  static async getCache(key: string): Promise<any> {
    try {
      if (!process.env.REDIS_URL) {
        return null;
      }
      const client = getRedisClient();
      const cached = await client.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  }

  /**
   * Clear cache by key
   */
  static async clearCache(key: string): Promise<void> {
    try {
      const client = getRedisClient();
      await client.del(key);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Disconnect all connections
   */
  static async disconnect(): Promise<void> {
    try {
      if (redisClient) {
        await redisClient.disconnect();
        redisClient = null;
      }
      if (pubClient) {
        await pubClient.disconnect();
        pubClient = null;
      }
      
      // Disconnect all subscribers
      for (const [userId, subscriber] of this.subscribers) {
        await subscriber.disconnect();
      }
      this.subscribers.clear();
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }
}

// Export alias for backward compatibility
export const NotificationPubSub = ServerRedisService;
