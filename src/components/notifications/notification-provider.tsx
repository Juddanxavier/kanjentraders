'use client';

import React, { useEffect } from 'react';
import { useNotificationStore } from '@/lib/store/notification-store';
import { NotificationCenter } from './notification-center';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { setConnectionStatus, centerOpen, closeCenter } = useNotificationStore();

  useEffect(() => {
    // Set initial connection status
    setConnectionStatus('connected');

    // Listen for online/offline events
    const handleOnline = () => setConnectionStatus('connected');
    const handleOffline = () => setConnectionStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Handle clicks outside notification center
    const handleClickOutside = (event: MouseEvent) => {
      if (centerOpen) {
        const target = event.target as HTMLElement;
        const notificationCenter = document.getElementById('notification-center');
        const notificationBell = document.getElementById('notification-bell');
        
        if (
          notificationCenter &&
          !notificationCenter.contains(target) &&
          notificationBell &&
          !notificationBell.contains(target)
        ) {
          closeCenter();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [centerOpen, closeCenter, setConnectionStatus]);

  return (
    <>
      {children}
      
      {/* Notification Center Portal */}
      {centerOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16">
          <div id="notification-center">
            <NotificationCenter />
          </div>
        </div>
      )}
    </>
  );
}
