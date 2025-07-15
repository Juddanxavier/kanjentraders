import { useState, useEffect } from 'react';
import { useNotificationStore } from '@/lib/store/notification-store';
import { 
  sendNotificationToUser, 
  sendNotificationFromTemplate,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  markNotificationAsRead
} from '@/lib/notifications/utils';

export function useNotifications() {
  const store = useNotificationStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: any, fallback: string) => {
    const message = error?.message || fallback;
    setError(message);
    store.error('Error', message);
  };

  const clearError = () => setError(null);

  const fetchNotifications = async (filters?: {
    category?: string;
    unread?: boolean;
    page?: number;
    limit?: number;
  }) => {
    setIsLoading(true);
    clearError();

    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.unread !== undefined) params.append('unread', String(filters.unread));
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      return data;
    } catch (error) {
      handleError(error, 'Failed to fetch notifications');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createNotification = async (notification: any) => {
    setIsLoading(true);
    clearError();

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });

      if (!response.ok) throw new Error('Failed to create notification');

      const data = await response.json();
      store.success('Notification sent', 'Notification has been sent successfully');
      return data.notification;
    } catch (error) {
      handleError(error, 'Failed to create notification');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const success = await markNotificationAsRead(notificationId);
      if (success) {
        store.markAsRead(notificationId);
      }
      return success;
    } catch (error) {
      handleError(error, 'Failed to mark notification as read');
      return false;
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    clearError();

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-all-read' }),
      });

      if (!response.ok) throw new Error('Failed to mark all notifications as read');

      store.markAllAsRead();
      store.success('All notifications marked as read');
      return true;
    } catch (error) {
      handleError(error, 'Failed to mark all notifications as read');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearNotifications = async (category?: string) => {
    setIsLoading(true);
    clearError();

    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);

      const response = await fetch(`/api/notifications?${params}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to clear notifications');

      if (category) {
        store.clearCategory(category);
      } else {
        store.clear();
      }
      
      store.success('Notifications cleared');
      return true;
    } catch (error) {
      handleError(error, 'Failed to clear notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    clearError();

    try {
      const settings = await getUserNotificationSettings();
      return settings;
    } catch (error) {
      handleError(error, 'Failed to fetch notification settings');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (settings: any) => {
    setIsLoading(true);
    clearError();

    try {
      const updatedSettings = await updateUserNotificationSettings(settings);
      if (updatedSettings) {
        store.success('Settings updated', 'Notification settings have been updated');
      }
      return updatedSettings;
    } catch (error) {
      handleError(error, 'Failed to update notification settings');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const sendToUser = async (userId: string, notification: any) => {
    setIsLoading(true);
    clearError();

    try {
      const notificationId = await sendNotificationToUser(userId, notification);
      if (notificationId) {
        store.success('Notification sent', 'Notification has been sent to user');
      }
      return notificationId;
    } catch (error) {
      handleError(error, 'Failed to send notification to user');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const sendFromTemplate = async (templateId: string, userId: string, variables: any) => {
    setIsLoading(true);
    clearError();

    try {
      const notificationId = await sendNotificationFromTemplate(templateId, userId, variables);
      if (notificationId) {
        store.success('Notification sent', 'Notification has been sent from template');
      }
      return notificationId;
    } catch (error) {
      handleError(error, 'Failed to send notification from template');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isLoading,
    error,
    clearError,

    // Store access
    ...store,

    // API operations
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    fetchSettings,
    updateSettings,
    sendToUser,
    sendFromTemplate,
  };
}

export default useNotifications;
