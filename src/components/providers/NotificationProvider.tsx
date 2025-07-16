/** @format */

'use client';

import { useNotifications } from '@/hooks/useNotifications';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  // This hook sets up the real-time notification connection
  useNotifications();

  return <>{children}</>;
}
