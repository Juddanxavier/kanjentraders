/** @format */

import Redis from 'ioredis';
import { Notification } from '@/types/notification';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const pub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class NotificationPubSub {
  private static subscribers = new Map<string, Redis>();

  /**
   * Publish a notification to a user's channel
   */
  static async publish(userId: string, notification: Notification): Promise<void> {
    try {
      const channel = `notifications:${userId}`;
      await pub.publish(channel, JSON.stringify(notification));
      console.log(`Published notification to channel: ${channel}`);
    } catch (error) {
      console.error('Error publishing notification:', error);
    }
  }

  /**
   * Subscribe to a user's notification channel
   */
  static subscribe(userId: string, callback: (notification: Notification) => void): Redis {
    const channel = `notifications:${userId}`;
    const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
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
      await redis.set(key, count.toString(), 'EX', 3600); // Expire in 1 hour
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
      const count = await redis.get(key);
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
      const key = `notifications:recent:${userId}`;
      await redis.set(key, JSON.stringify(notifications), 'EX', 1800); // Expire in 30 minutes
    } catch (error) {
      console.error('Error caching notifications:', error);
    }
  }

  /**
   * Get cached recent notifications for a user
   */
  static async getCachedRecentNotifications(userId: string): Promise<Notification[] | null> {
    try {
      const key = `notifications:recent:${userId}`;
      const cached = await redis.get(key);
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
      await redis.del(...keys);
    } catch (error) {
      console.error('Error clearing user cache:', error);
    }
  }

  /**
   * Disconnect all connections
   */
  static async disconnect(): Promise<void> {
    try {
      await redis.disconnect();
      await pub.disconnect();
      
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
