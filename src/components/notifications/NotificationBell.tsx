/** @format */

'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/lib/store/notification-store';
import { useSession } from '@/lib/auth/auth-client';
import { NotificationCenter } from './NotificationCenter';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications(session.user.id);
    }
  }, [session?.user?.id, fetchNotifications]);

  const handleClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="relative h-9 w-9"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <NotificationCenter
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
