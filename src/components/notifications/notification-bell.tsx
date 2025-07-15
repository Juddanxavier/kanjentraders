'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/lib/store/notification-store';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function NotificationBell({ 
  className, 
  variant = 'ghost', 
  size = 'md' 
}: NotificationBellProps) {
  const { 
    unreadCount, 
    toggleCenter, 
    centerOpen, 
    connectionStatus,
    isConnected 
  } = useNotificationStore();

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonSize = {
    sm: 'sm',
    md: 'sm',
    lg: 'default'
  };

  return (
    <div className="relative">
      <Button
        variant={variant}
        size={buttonSize[size] as any}
        onClick={toggleCenter}
        className={cn(
          'relative',
          centerOpen && 'bg-accent',
          className
        )}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className={cn(iconSize[size], 'transition-colors')} />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        
        {/* Connection status indicator */}
        <div
          className={cn(
            'absolute -bottom-1 -right-1 h-2 w-2 rounded-full border border-background',
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          )}
          title={`Connection: ${connectionStatus}`}
        />
      </Button>
      
      {/* Pulse animation for new notifications */}
      {unreadCount > 0 && (
        <div className="absolute inset-0 rounded-full animate-pulse">
          <div className="absolute inset-0 rounded-full bg-red-400 opacity-25 animate-ping" />
        </div>
      )}
    </div>
  );
}
