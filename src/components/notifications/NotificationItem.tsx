/** @format */

'use client';

import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  Package, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  User,
  Shield,
  Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/lib/store/notification-store';
import { useSession } from 'next-auth/react';
import { Notification } from '@/types/notification';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'SYSTEM_MAINTENANCE':
      return <Wrench className="h-4 w-4 text-orange-500" />;
    case 'SYSTEM_FEATURE':
      return <Info className="h-4 w-4 text-blue-500" />;
    case 'SYSTEM_SECURITY':
      return <Shield className="h-4 w-4 text-red-500" />;
    case 'SHIPMENT_CREATED':
      return <Package className="h-4 w-4 text-green-500" />;
    case 'SHIPMENT_STATUS_UPDATE':
      return <Package className="h-4 w-4 text-blue-500" />;
    case 'SHIPMENT_DELIVERED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'SHIPMENT_EXCEPTION':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'LEAD_ASSIGNED':
      return <Users className="h-4 w-4 text-blue-500" />;
    case 'LEAD_STATUS_CHANGE':
      return <Users className="h-4 w-4 text-orange-500" />;
    case 'LEAD_CONVERTED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'USER_WELCOME':
      return <User className="h-4 w-4 text-green-500" />;
    case 'USER_ROLE_CHANGE':
      return <User className="h-4 w-4 text-blue-500" />;
    case 'USER_ACCOUNT_LOCKED':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 3: return 'bg-red-500';
    case 2: return 'bg-orange-500';
    case 1: return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead } = useNotificationStore();
  const { data: session } = useSession();

  const handleClick = async () => {
    if (!notification.readAt && session?.user?.id) {
      await markAsRead(notification.id, session.user.id);
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const isUnread = !notification.readAt;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
    addSuffix: true 
  });

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
        isUnread && "bg-blue-50 dark:bg-blue-900/20"
      )}
    >
      {/* Priority indicator */}
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
          "w-2 h-2 rounded-full",
          getPriorityColor(notification.priority)
        )} />
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className={cn(
              "text-sm font-medium truncate",
              isUnread && "font-semibold"
            )}>
              {notification.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.message}
            </p>
            
            {/* Additional data */}
            {notification.data && Object.keys(notification.data).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {Object.entries(notification.data).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key}: {String(value)}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Unread indicator */}
          {isUnread && (
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
          )}
        </div>

        {/* Timestamp */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {timeAgo}
          </span>
          
          {notification.actionUrl && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              View
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
