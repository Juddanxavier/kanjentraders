import { useCallback } from 'react';
import { useNotificationStore, NotificationOptions, NotificationAction } from '@/lib/store/notification-store';

export interface UseNotificationsReturn {
  // Core methods
  show: (options: NotificationOptions) => string;
  success: (title: string, description?: string, options?: Partial<NotificationOptions>) => string;
  error: (title: string, description?: string, options?: Partial<NotificationOptions>) => string;
  warning: (title: string, description?: string, options?: Partial<NotificationOptions>) => string;
  info: (title: string, description?: string, options?: Partial<NotificationOptions>) => string;
  
  // Convenience methods
  loading: (title: string, description?: string) => string;
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
      description?: string;
      category?: string;
    }
  ) => Promise<T>;
  
  // Management
  dismiss: (id: string) => void;
  dismissAll: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  
  // State
  notifications: ReturnType<typeof useNotificationStore>['notifications'];
  unreadCount: number;
  isEnabled: boolean;
  centerOpen: boolean;
  
  // Center management
  openCenter: () => void;
  closeCenter: () => void;
  toggleCenter: () => void;
  
  // Settings
  setEnabled: (enabled: boolean) => void;
  setCategoryEnabled: (category: string, enabled: boolean) => void;
  updatePreferences: (preferences: any) => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const store = useNotificationStore();
  
  const loading = useCallback((title: string, description?: string) => {
    return store.show({
      title,
      description,
      variant: 'info',
      persistent: true,
      category: 'system',
    });
  }, [store]);

  const promise = useCallback(async <T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
      description?: string;
      category?: string;
    }
  ): Promise<T> => {
    const loadingId = loading(options.loading, options.description);
    
    try {
      const result = await promise;
      
      store.dismiss(loadingId);
      
      const successMessage = typeof options.success === 'function' 
        ? options.success(result) 
        : options.success;
      
      store.success(successMessage, options.description, {
        category: options.category,
      });
      
      return result;
    } catch (error) {
      store.dismiss(loadingId);
      
      const errorMessage = typeof options.error === 'function' 
        ? options.error(error as Error) 
        : options.error;
      
      store.error(errorMessage, options.description, {
        category: options.category,
      });
      
      throw error;
    }
  }, [store, loading]);

  return {
    // Core methods
    show: store.show,
    success: store.success,
    error: store.error,
    warning: store.warning,
    info: store.info,
    
    // Convenience methods
    loading,
    promise,
    
    // Management
    dismiss: store.dismiss,
    dismissAll: store.clear,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    
    // State
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isEnabled: store.isEnabled,
    centerOpen: store.centerOpen,
    
    // Center management
    openCenter: store.openCenter,
    closeCenter: store.closeCenter,
    toggleCenter: store.toggleCenter,
    
    // Settings
    setEnabled: store.setEnabled,
    setCategoryEnabled: store.setCategoryEnabled,
    updatePreferences: store.updatePreferences,
  };
};

// Common notification patterns
export const notificationPatterns = {
  // Auth patterns
  auth: {
    signInSuccess: (username: string) => ({
      title: 'Welcome back!',
      description: `Successfully signed in as ${username}`,
      variant: 'success' as const,
      category: 'auth',
    }),
    
    signInError: (error: string) => ({
      title: 'Sign in failed',
      description: error,
      variant: 'error' as const,
      category: 'auth',
    }),
    
    signOutSuccess: () => ({
      title: 'Signed out',
      description: 'You have been successfully signed out',
      variant: 'info' as const,
      category: 'auth',
    }),
    
    sessionExpired: () => ({
      title: 'Session expired',
      description: 'Please sign in again to continue',
      variant: 'warning' as const,
      category: 'auth',
      persistent: true,
    }),
  },
  
  // CRUD operations
  crud: {
    createSuccess: (entity: string) => ({
      title: 'Created successfully',
      description: `${entity} has been created`,
      variant: 'success' as const,
    }),
    
    updateSuccess: (entity: string) => ({
      title: 'Updated successfully',
      description: `${entity} has been updated`,
      variant: 'success' as const,
    }),
    
    deleteSuccess: (entity: string) => ({
      title: 'Deleted successfully',
      description: `${entity} has been deleted`,
      variant: 'success' as const,
    }),
    
    operationFailed: (operation: string, error: string) => ({
      title: `${operation} failed`,
      description: error,
      variant: 'error' as const,
    }),
  },
  
  // System patterns
  system: {
    maintenance: (duration: string) => ({
      title: 'System maintenance',
      description: `System will be under maintenance for ${duration}`,
      variant: 'warning' as const,
      category: 'system',
      persistent: true,
    }),
    
    connectionLost: () => ({
      title: 'Connection lost',
      description: 'Attempting to reconnect...',
      variant: 'warning' as const,
      category: 'system',
    }),
    
    connectionRestored: () => ({
      title: 'Connection restored',
      description: 'You are back online',
      variant: 'success' as const,
      category: 'system',
    }),
  },
  
  // Shipment patterns
  shipment: {
    statusUpdate: (trackingNumber: string, status: string) => ({
      title: 'Shipment update',
      description: `${trackingNumber} is now ${status}`,
      variant: 'info' as const,
      category: 'shipment',
    }),
    
    delivered: (trackingNumber: string) => ({
      title: 'Package delivered',
      description: `${trackingNumber} has been delivered`,
      variant: 'success' as const,
      category: 'shipment',
    }),
    
    delayed: (trackingNumber: string, reason: string) => ({
      title: 'Shipment delayed',
      description: `${trackingNumber} is delayed: ${reason}`,
      variant: 'warning' as const,
      category: 'shipment',
    }),
  },
};

// Helper hook for specific notification types
export const useAuthNotifications = () => {
  const { show } = useNotifications();
  
  return {
    signInSuccess: (username: string) => show(notificationPatterns.auth.signInSuccess(username)),
    signInError: (error: string) => show(notificationPatterns.auth.signInError(error)),
    signOutSuccess: () => show(notificationPatterns.auth.signOutSuccess()),
    sessionExpired: () => show(notificationPatterns.auth.sessionExpired()),
  };
};

export const useShipmentNotifications = () => {
  const { show } = useNotifications();
  
  return {
    statusUpdate: (trackingNumber: string, status: string) => 
      show(notificationPatterns.shipment.statusUpdate(trackingNumber, status)),
    delivered: (trackingNumber: string) => 
      show(notificationPatterns.shipment.delivered(trackingNumber)),
    delayed: (trackingNumber: string, reason: string) => 
      show(notificationPatterns.shipment.delayed(trackingNumber, reason)),
  };
};

export const useCrudNotifications = () => {
  const { show } = useNotifications();
  
  return {
    createSuccess: (entity: string) => show(notificationPatterns.crud.createSuccess(entity)),
    updateSuccess: (entity: string) => show(notificationPatterns.crud.updateSuccess(entity)),
    deleteSuccess: (entity: string) => show(notificationPatterns.crud.deleteSuccess(entity)),
    operationFailed: (operation: string, error: string) => 
      show(notificationPatterns.crud.operationFailed(operation, error)),
  };
};
