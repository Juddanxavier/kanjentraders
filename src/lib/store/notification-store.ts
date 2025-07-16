/** @format */

import { create } from 'zustand';
import { Notification } from '@/types/notification';
import { logger } from '@/lib/logger';
import { useAuthStore } from '@/lib/store/auth-store';

// Redis operations are handled server-side only
// No Redis imports in client stores

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;

  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string, userId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  subscribeToUpdates: (userId: string) => void;
  unsubscribeFromUpdates: (userId: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isConnected: false,

  fetchNotifications: async (userId) => {
    set({ isLoading: true });
    try {
      // Redis caching is handled server-side
      const response = await fetch(`/api/notifications?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      
      set({ notifications: data.notifications, unreadCount: data.total });
      logger.info('Fetched notifications successfully');
    } catch (error) {
      logger.error('Failed to fetch notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id, userId) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === id ? { ...notification, readAt: new Date() } : notification
        ),
        unreadCount: Math.max(state.unreadCount - 1, 0),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async (userId) => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          readAt: notification.readAt || new Date(),
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  subscribeToUpdates: (userId) => {
    if (typeof window === 'undefined') return; // Server-side guard
    
    try {
      const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`);
      
      eventSource.onopen = () => {
        set({ isConnected: true });
        logger.info('Connected to notification stream');
      };
      
      eventSource.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          get().addNotification(notification);
          logger.info('Received real-time notification:', notification);
        } catch (error) {
          logger.error('Failed to parse notification:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        logger.error('Notification stream error:', error);
        set({ isConnected: false });
      };
      
      // Store the EventSource for cleanup
      (window as any).notificationEventSource = eventSource;
    } catch (error) {
      logger.error('Failed to subscribe to notifications:', error);
    }
  },

  unsubscribeFromUpdates: (userId) => {
    if (typeof window === 'undefined') return; // Server-side guard
    
    const eventSource = (window as any).notificationEventSource;
    if (eventSource) {
      eventSource.close();
      delete (window as any).notificationEventSource;
      set({ isConnected: false });
      logger.info('Disconnected from notification stream');
    }
  },
}));

