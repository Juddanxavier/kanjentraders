/** @format */

import { redisService } from './redis-enhanced';
import { logger } from '@/lib/logger';

class RedisMiddleware {
  private cleanupInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.startBackgroundTasks();
  }

  private startBackgroundTasks() {
    // Run cleanup every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 30 * 60 * 1000);

    // Run health check every 5 minutes
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    logger.info('Redis middleware background tasks started');
  }

  private async performCleanup() {
    try {
      await redisService.cleanup();
      logger.info('Redis cleanup completed successfully');
    } catch (error) {
      logger.error('Redis cleanup failed:', error);
    }
  }

  private async performHealthCheck() {
    try {
      const health = await redisService.healthCheck();
      if (health.healthy) {
        logger.debug(`Redis health check passed (latency: ${health.latency}ms)`);
      } else {
        logger.warn('Redis health check failed');
      }
    } catch (error) {
      logger.error('Redis health check error:', error);
    }
  }

  // Middleware function for Next.js API routes
  static async apiMiddleware(userId?: string, operation?: string) {
    if (!userId || !operation) return;

    try {
      // Log API usage for analytics
      await redisService.set(
        `api_usage:${userId}:${operation}:${Date.now()}`,
        {
          userId,
          operation,
          timestamp: new Date().toISOString(),
        },
        60 * 60 // 1 hour
      );

      // Track rate limiting
      const rateLimitResult = await redisService.checkRateLimit(
        `api:${userId}`,
        60 * 1000, // 1 minute window
        100 // 100 requests per minute
      );

      if (!rateLimitResult.allowed) {
        logger.warn(`Rate limit exceeded for user ${userId}`);
        return { rateLimited: true, remaining: 0, resetTime: rateLimitResult.resetTime };
      }

      return { rateLimited: false, remaining: rateLimitResult.remaining };
    } catch (error) {
      logger.error('Redis middleware error:', error);
      return { rateLimited: false, remaining: 99 }; // Fallback
    }
  }

  // Cache invalidation patterns
  static async invalidateUserData(userId: string) {
    try {
      await Promise.all([
        redisService.invalidateUser(userId),
        redisService.invalidateLeadsCache(userId),
        redisService.del(`notifications:recent:${userId}`),
        redisService.del(`lead_stats:${userId}`),
      ]);
      logger.info(`All cache invalidated for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to invalidate cache for user ${userId}:`, error);
    }
  }

  // Bulk operations
  static async bulkCacheInvalidation(userIds: string[]) {
    try {
      await Promise.all(
        userIds.map(userId => RedisMiddleware.invalidateUserData(userId))
      );
      logger.info(`Bulk cache invalidation completed for ${userIds.length} users`);
    } catch (error) {
      logger.error('Bulk cache invalidation failed:', error);
    }
  }

  // Analytics data aggregation
  static async aggregateUserActivity(userId: string, timeframe: 'hour' | 'day' | 'week' = 'day') {
    try {
      const now = Date.now();
      const timeWindows = {
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
      };

      const windowSize = timeWindows[timeframe];
      const startTime = now - windowSize;

      // This would typically scan through activity logs
      // For now, we'll return a placeholder structure
      const activityData = {
        userId,
        timeframe,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(now).toISOString(),
        activities: [],
        metrics: {
          totalActions: 0,
          uniqueTypes: 0,
          avgResponseTime: 0,
        },
      };

      // Cache the aggregated data
      await redisService.set(
        `activity_summary:${userId}:${timeframe}`,
        activityData,
        Math.floor(windowSize / 1000) // TTL in seconds
      );

      return activityData;
    } catch (error) {
      logger.error(`Failed to aggregate user activity for ${userId}:`, error);
      return null;
    }
  }

  // Performance monitoring
  static async trackPerformance(operation: string, duration: number, success: boolean) {
    try {
      const timestamp = Date.now();
      const key = `perf:${operation}:${Math.floor(timestamp / (5 * 60 * 1000))}`; // 5-minute buckets

      await redisService.set(
        key,
        {
          operation,
          duration,
          success,
          timestamp,
        },
        300 // 5 minutes
      );

      logger.debug(`Performance tracked: ${operation} took ${duration}ms (${success ? 'success' : 'failure'})`);
    } catch (error) {
      logger.error('Failed to track performance:', error);
    }
  }

  // Security monitoring
  static async trackSecurityEvent(userId: string, event: string, details: any) {
    try {
      await redisService.logSecurityEvent(userId, event, details);
      
      // Check for suspicious patterns
      const recentEvents = await redisService.getSecurityEvents(userId, 10);
      const failedLogins = recentEvents.filter(e => e.event === 'login_failed').length;
      
      if (failedLogins >= 5) {
        logger.warn(`Suspicious activity detected for user ${userId}: ${failedLogins} failed logins`);
        // Could trigger additional security measures here
      }
    } catch (error) {
      logger.error('Failed to track security event:', error);
    }
  }

  // Notification management
  static async scheduleNotification(userId: string, notification: any, delayMs: number) {
    try {
      const scheduledTime = Date.now() + delayMs;
      await redisService.set(
        `scheduled_notification:${userId}:${scheduledTime}`,
        notification,
        Math.ceil(delayMs / 1000) + 60 // TTL slightly longer than delay
      );
      
      logger.info(`Notification scheduled for user ${userId} in ${delayMs}ms`);
    } catch (error) {
      logger.error('Failed to schedule notification:', error);
    }
  }

  // Graceful shutdown
  async shutdown() {
    logger.info('Shutting down Redis middleware...');
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    await redisService.disconnect();
    logger.info('Redis middleware shutdown completed');
  }
}

// Export singleton instance
export const redisMiddleware = new RedisMiddleware();

// Export the class for dependency injection
export default RedisMiddleware;
