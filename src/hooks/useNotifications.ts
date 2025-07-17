/** @format */

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNotificationStore } from '@/lib/store/notification-store';
import { useSession } from 'next-auth/react';

export function useNotifications() {
  const { addNotification } = useNotificationStore();
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    let eventSource: EventSource | null = null;

    const connectToNotifications = () => {
      // Create EventSource for Server-Sent Events
      eventSource = new EventSource(`/api/notifications/stream`);

      eventSource.onopen = () => {
        console.log('Connected to notification stream');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Skip connection messages
          if (data.type === 'connected') {
            return;
          }

          // Add notification to store
          addNotification(data);

          // Show toast notification
          const toastOptions = {
            description: data.message,
            action: data.actionUrl ? {
              label: 'View',
              onClick: () => window.location.href = data.actionUrl,
            } : undefined,
          };

          switch (data.priority) {
            case 3: // Urgent
              toast.error(data.title, toastOptions);
              break;
            case 2: // High
              toast.warning(data.title, toastOptions);
              break;
            case 1: // Medium
              toast.info(data.title, toastOptions);
              break;
            default: // Low
              toast.success(data.title, toastOptions);
              break;
          }
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Notification stream error:', error);
        eventSource?.close();
        
        // Reconnect after 5 seconds
        setTimeout(connectToNotifications, 5000);
      };
    };

    connectToNotifications();

    return () => {
      eventSource?.close();
    };
  }, [session?.user?.id, addNotification]);

  return {
    // Hook doesn't need to return anything for now
    // But could return connection status, etc. in the future
  };
}
