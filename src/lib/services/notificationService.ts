/** @format */

import { prisma } from '@/lib/prisma';
import { NotificationPubSub } from './redis-server';
import { 
  Notification, 
  CreateNotificationData, 
  NOTIFICATION_TEMPLATES 
} from '@/types/notification';
import { NotificationType } from '@/generated/prisma';

export class NotificationService {
  /**
   * Create a new notification
   */
  static async create(data: CreateNotificationData): Promise<Notification> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          actionUrl: data.actionUrl,
          priority: data.priority ?? 0,
          expiresAt: data.expiresAt,
        },
      });

      // Publish to Redis for real-time updates
      await NotificationPubSub.publish(data.userId, notification);

      // Update cached unread count
      await this.updateUnreadCount(data.userId);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create a notification using a template
   */
  static async createFromTemplate(
    userId: string,
    type: NotificationType,
    data?: any,
    overrides?: Partial<CreateNotificationData>
  ): Promise<Notification> {
    const template = NOTIFICATION_TEMPLATES[type];
    
    return this.create({
      userId,
      type: template.type,
      title: overrides?.title || template.title,
      message: overrides?.message || template.message,
      data,
      actionUrl: overrides?.actionUrl || template.actionUrl,
      priority: overrides?.priority || template.priority,
      expiresAt: overrides?.expiresAt,
    });
  }

  /**
   * Get notifications for a user with pagination
   */
  static async getForUser(
    userId: string,
    page = 1,
    limit = 20,
    includeRead = true
  ): Promise<{
    notifications: Notification[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      // Try to get from cache first
      if (page === 1 && limit === 20) {
        const cached = await NotificationPubSub.getCachedRecentNotifications(userId);
        if (cached) {
          const filtered = includeRead ? cached : cached.filter(n => !n.readAt);
          return {
            notifications: filtered,
            total: filtered.length,
            hasMore: false,
          };
        }
      }

      const where = {
        userId,
        ...(includeRead ? {} : { readAt: null }),
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      // Cache first page
      if (page === 1) {
        await NotificationPubSub.cacheRecentNotifications(userId, notifications);
      }

      return {
        notifications,
        total,
        hasMore: total > page * limit,
      };
    } catch (error) {
      console.error('Error getting notifications for user:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      // Try cache first
      const cached = await NotificationPubSub.getUnreadCount(userId);
      if (cached > 0) {
        return cached;
      }

      const count = await prisma.notification.count({
        where: {
          userId,
          readAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });

      // Cache the count
      await NotificationPubSub.setUnreadCount(userId, count);
      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(id: string, userId: string): Promise<void> {
    try {
      await prisma.notification.update({
        where: { id, userId },
        data: { readAt: new Date() },
      });

      // Update cached count
      await this.updateUnreadCount(userId);
      
      // Clear cached notifications
      await NotificationPubSub.clearUserCache(userId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      // Clear cache
      await NotificationPubSub.clearUserCache(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async delete(id: string, userId: string): Promise<void> {
    try {
      await prisma.notification.delete({
        where: { id, userId },
      });

      // Update cached count
      await this.updateUnreadCount(userId);
      
      // Clear cached notifications
      await NotificationPubSub.clearUserCache(userId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpired(): Promise<void> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      console.log(`Cleaned up ${result.count} expired notifications`);
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }

  /**
   * Update cached unread count for a user
   */
  private static async updateUnreadCount(userId: string): Promise<void> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          readAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      });

      await NotificationPubSub.setUnreadCount(userId, count);
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  }

  /**
   * Send notification to multiple users
   */
  static async createBulk(
    userIds: string[],
    type: NotificationType,
    data?: any,
    overrides?: Partial<CreateNotificationData>
  ): Promise<Notification[]> {
    try {
      const template = NOTIFICATION_TEMPLATES[type];
      const notifications: Notification[] = [];

      for (const userId of userIds) {
        const notification = await this.create({
          userId,
          type: template.type,
          title: overrides?.title || template.title,
          message: overrides?.message || template.message,
          data,
          actionUrl: overrides?.actionUrl || template.actionUrl,
          priority: overrides?.priority || template.priority,
          expiresAt: overrides?.expiresAt,
        });

        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }
}
