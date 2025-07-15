'use client';

import React from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/notifications/notification-center';

const NotificationsPage = () => {
  const {
    notifications,
    fetchNotifications,
    markAllAsRead,
    clearNotifications,
    isLoading,
    error,
  } = useNotifications();

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Notifications</h1>

      {error && <div className="text-red-500">Error: {error}</div>}

      <div className="mb-4 space-x-2">
        <Button onClick={markAllAsRead} disabled={isLoading}>
          Mark All as Read
        </Button>
        <Button onClick={() => clearNotifications()} disabled={isLoading}>
          Clear All Notifications
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div>No notifications available.</div>
      ) : (
        <NotificationCenter className="mt-4" />
      )}
    </div>
  );
};

export default NotificationsPage;
