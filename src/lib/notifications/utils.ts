import { NotificationOptions } from '@/lib/store/notification-store';

export type NotificationTemplate = {
  id: string;
  name: string;
  category: string;
  title: string;
  description?: string;
  variant: 'DEFAULT' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  persistent: boolean;
  channel: 'TOAST' | 'CENTER' | 'BOTH' | 'EMAIL';
  variables?: Record<string, any>;
  active: boolean;
};

/**
 * Replace variables in a template string with actual values
 */
export function replaceVariables(
  template: string, 
  variables: Record<string, any>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

/**
 * Create a notification from a template
 */
export function createNotificationFromTemplate(
  template: NotificationTemplate,
  variables: Record<string, any> = {}
): NotificationOptions {
  return {
    title: replaceVariables(template.title, variables),
    description: template.description 
      ? replaceVariables(template.description, variables)
      : undefined,
    variant: template.variant.toLowerCase() as any,
    priority: template.priority.toLowerCase() as any,
    persistent: template.persistent,
    channel: template.channel.toLowerCase() as any,
    category: template.category,
    data: variables,
  };
}

/**
 * Send notification to specific user via API
 */
export async function sendNotificationToUser(
  userId: string, 
  notification: NotificationOptions
): Promise<string | null> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...notification,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    const data = await response.json();
    return data.notification.id;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
}

/**
 * Send notification using template
 */
export async function sendNotificationFromTemplate(
  templateId: string,
  userId: string,
  variables: Record<string, any> = {}
): Promise<string | null> {
  try {
    // Fetch template
    const templateResponse = await fetch(`/api/notifications/templates/${templateId}`);
    if (!templateResponse.ok) {
      throw new Error('Template not found');
    }

    const { template } = await templateResponse.json();
    
    // Create notification from template
    const notification = createNotificationFromTemplate(template, variables);
    
    // Send notification
    return await sendNotificationToUser(userId, notification);
  } catch (error) {
    console.error('Error sending notification from template:', error);
    return null;
  }
}

/**
 * Batch send notifications
 */
export async function sendBatchNotifications(
  notifications: Array<{
    userId: string;
    notification: NotificationOptions;
  }>
): Promise<Array<{ userId: string; notificationId: string | null }>> {
  const results = await Promise.all(
    notifications.map(async ({ userId, notification }) => {
      const notificationId = await sendNotificationToUser(userId, notification);
      return { userId, notificationId };
    })
  );

  return results;
}

/**
 * Get user's notification settings
 */
export async function getUserNotificationSettings(userId?: string) {
  try {
    const response = await fetch('/api/notifications/settings');
    if (!response.ok) {
      throw new Error('Failed to fetch notification settings');
    }

    const data = await response.json();
    return data.settings;
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return null;
  }
}

/**
 * Update user's notification settings
 */
export async function updateUserNotificationSettings(
  settings: Record<string, any>
) {
  try {
    const response = await fetch('/api/notifications/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error('Failed to update notification settings');
    }

    const data = await response.json();
    return data.settings;
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return null;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'mark-read' }),
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Common notification templates
 */
export const NOTIFICATION_TEMPLATES = {
  WELCOME: {
    title: 'Welcome to {{appName}}!',
    description: 'Thank you for joining us, {{userName}}. Get started by exploring our features.',
    variant: 'SUCCESS' as const,
    category: 'AUTH',
    priority: 'NORMAL' as const,
  },
  SHIPMENT_CREATED: {
    title: 'New Shipment Created',
    description: 'Shipment {{trackingNumber}} has been created for {{customerName}}.',
    variant: 'INFO' as const,
    category: 'SHIPMENT',
    priority: 'NORMAL' as const,
  },
  SHIPMENT_DELIVERED: {
    title: 'Shipment Delivered',
    description: 'Shipment {{trackingNumber}} has been delivered successfully.',
    variant: 'SUCCESS' as const,
    category: 'SHIPMENT',
    priority: 'HIGH' as const,
  },
  SYSTEM_ERROR: {
    title: 'System Error',
    description: 'An error occurred: {{errorMessage}}',
    variant: 'ERROR' as const,
    category: 'SYSTEM',
    priority: 'HIGH' as const,
  },
  LEAD_ASSIGNED: {
    title: 'New Lead Assigned',
    description: 'Lead {{leadName}} has been assigned to you.',
    variant: 'INFO' as const,
    category: 'LEAD',
    priority: 'NORMAL' as const,
  },
};
