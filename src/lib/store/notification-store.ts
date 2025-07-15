import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { toast as sonnerToast } from 'sonner';

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'destructive';
}

export interface NotificationOptions {
  id?: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  data?: Record<string, any>;
  category?: string;
  dismissible?: boolean;
  position?: 'top-center' | 'top-right' | 'bottom-right' | 'bottom-center' | 'bottom-left' | 'top-left';
  priority?: 'low' | 'normal' | 'high' | 'critical';
  channel?: 'toast' | 'center' | 'both';
  userId?: string;
  groupId?: string;
}

export interface StoredNotification extends NotificationOptions {
  id: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
  userId?: string;
}

interface NotificationState {
  // Core state
  notifications: StoredNotification[];
  unreadCount: number;
  isEnabled: boolean;
  defaultDuration: number;
  maxNotifications: number;
  
  // Categories and preferences
  categories: Record<string, { enabled: boolean; color?: string; channels?: string[] }>;
  preferences: {
    toast: boolean;
    center: boolean;
    sound: boolean;
    desktop: boolean;
    email: boolean;
    groupSimilar: boolean;
    maxToasts: number;
  };
  
  // UI state
  centerOpen: boolean;
  activeToasts: string[];
  
  // Real-time connection
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

interface NotificationActions {
  // Core notification methods
  show: (options: NotificationOptions) => string;
  success: (title: string, description?: string, options?: Partial<NotificationOptions>) => string;
  error: (title: string, description?: string, options?: Partial<NotificationOptions>) => string;
  warning: (title: string, description?: string, options?: Partial<NotificationOptions>) => string;
  info: (title: string, description?: string, options?: Partial<NotificationOptions>) => string;
  
  // Management methods
  dismiss: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
  clearCategory: (category: string) => void;
  
  // Center management
  openCenter: () => void;
  closeCenter: () => void;
  toggleCenter: () => void;
  
  // Settings
  setEnabled: (enabled: boolean) => void;
  setDefaultDuration: (duration: number) => void;
  setCategoryEnabled: (category: string, enabled: boolean) => void;
  updatePreferences: (preferences: Partial<NotificationState['preferences']>) => void;
  
  // Getters
  getNotifications: () => StoredNotification[];
  getUnreadNotifications: () => StoredNotification[];
  getNotificationsByCategory: (category: string) => StoredNotification[];
  
  // Batch operations
  showBatch: (notifications: NotificationOptions[]) => void;
  
  // Real-time connection
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
}

type NotificationStore = NotificationState & NotificationActions;

const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_DURATION = 5000;

export const useNotificationStore = create<NotificationStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      isEnabled: true,
      defaultDuration: DEFAULT_DURATION,
      maxNotifications: 100,
      
      categories: {
        auth: { enabled: true, color: '#3b82f6', channels: ['toast', 'center'] },
        system: { enabled: true, color: '#10b981', channels: ['toast', 'center'] },
        user: { enabled: true, color: '#8b5cf6', channels: ['toast', 'center'] },
        shipment: { enabled: true, color: '#f59e0b', channels: ['toast', 'center'] },
        admin: { enabled: true, color: '#ef4444', channels: ['toast', 'center'] },
        lead: { enabled: true, color: '#06b6d4', channels: ['toast', 'center'] },
      },
      
      preferences: {
        toast: true,
        center: true,
        sound: true,
        desktop: false,
        email: false,
        groupSimilar: true,
        maxToasts: 5,
      },
      
      centerOpen: false,
      activeToasts: [],
      isConnected: false,
      connectionStatus: 'disconnected',

      // Core notification methods
      show: (options: NotificationOptions) => {
        const state = get();
        
        if (!state.isEnabled) return '';
        
        const category = options.category || 'system';
        if (!state.categories[category]?.enabled) return '';

        const id = options.id || generateId();
        const timestamp = Date.now();
        
        // Create stored notification
        const notification: StoredNotification = {
          ...options,
          id,
          timestamp,
          read: false,
          dismissed: false,
          variant: options.variant || 'default',
          category,
          channel: options.channel || 'both',
          priority: options.priority || 'normal',
        };

        // Add to store if using center channel
        if (options.channel !== 'toast') {
          set((state) => {
            const newNotifications = [notification, ...state.notifications];
            
            // Limit notifications
            if (newNotifications.length > state.maxNotifications) {
              newNotifications.splice(state.maxNotifications);
            }
            
            return {
              notifications: newNotifications,
              unreadCount: state.unreadCount + 1,
            };
          });
        }

        // Show toast if using toast channel
        if (options.channel !== 'center' && state.preferences.toast) {
          const message = options.description ? `${options.title}\n${options.description}` : options.title;
          
          const toastOptions = {
            id,
            duration: options.persistent ? Infinity : (options.duration ?? state.defaultDuration),
            action: options.actions?.length ? {
              label: options.actions[0].label,
              onClick: options.actions[0].action,
            } : undefined,
            cancel: options.actions?.length > 1 ? {
              label: options.actions[1].label,
              onClick: options.actions[1].action,
            } : undefined,
            onDismiss: () => {
              set((state) => ({
                activeToasts: state.activeToasts.filter(t => t !== id)
              }));
            },
          };

          // Track active toast
          set((state) => ({
            activeToasts: [...state.activeToasts, id]
          }));

          switch (options.variant) {
            case 'success':
              sonnerToast.success(message, toastOptions);
              break;
            case 'error':
              sonnerToast.error(message, toastOptions);
              break;
            case 'warning':
              sonnerToast.warning(message, toastOptions);
              break;
            case 'info':
              sonnerToast.info(message, toastOptions);
              break;
            default:
              sonnerToast(message, toastOptions);
              break;
          }
        }

        return id;
      },

    success: (title, description, options = {}) => {
      return get().show({
        title,
        description,
        variant: 'success',
        ...options,
      });
    },

    error: (title, description, options = {}) => {
      return get().show({
        title,
        description,
        variant: 'error',
        ...options,
      });
    },

    warning: (title, description, options = {}) => {
      return get().show({
        title,
        description,
        variant: 'warning',
        ...options,
      });
    },

    info: (title, description, options = {}) => {
      return get().show({
        title,
        description,
        variant: 'info',
        ...options,
      });
    },

      // Management methods
      dismiss: (id: string) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, dismissed: true } : n
          ),
          activeToasts: state.activeToasts.filter(t => t !== id)
        }));
        sonnerToast.dismiss(id);
      },

      markAsRead: (id: string) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id);
          if (!notification || notification.read) return state;

          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clear: () => {
        set(() => ({
          notifications: [],
          unreadCount: 0,
          activeToasts: [],
        }));
        sonnerToast.dismiss();
      },

      clearCategory: (category: string) => {
        set((state) => {
          const categoryNotifications = state.notifications.filter((n) => n.category === category);
          const unreadCategoryCount = categoryNotifications.filter((n) => !n.read).length;
          
          // Dismiss active toasts for this category
          categoryNotifications.forEach((n) => {
            if (state.activeToasts.includes(n.id)) {
              sonnerToast.dismiss(n.id);
            }
          });

          return {
            notifications: state.notifications.filter((n) => n.category !== category),
            unreadCount: Math.max(0, state.unreadCount - unreadCategoryCount),
            activeToasts: state.activeToasts.filter(id => 
              !categoryNotifications.some(n => n.id === id)
            ),
          };
        });
      },

      // Center management
      openCenter: () => {
        set(() => ({ centerOpen: true }));
      },

      closeCenter: () => {
        set(() => ({ centerOpen: false }));
      },

      toggleCenter: () => {
        set((state) => ({ centerOpen: !state.centerOpen }));
      },

      // Settings
      setEnabled: (enabled: boolean) => {
        set(() => ({ isEnabled: enabled }));
        if (!enabled) {
          sonnerToast.dismiss();
        }
      },

      setDefaultDuration: (duration: number) => {
        set(() => ({ defaultDuration: duration }));
      },

      setCategoryEnabled: (category: string, enabled: boolean) => {
        set((state) => ({
          categories: {
            ...state.categories,
            [category]: { ...state.categories[category], enabled },
          },
        }));
      },

      updatePreferences: (preferences: Partial<NotificationState['preferences']>) => {
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
        }));
      },

      // Getters
      getNotifications: () => get().notifications,
      getUnreadNotifications: () => get().notifications.filter((n) => !n.read),
      getNotificationsByCategory: (category: string) => 
        get().notifications.filter((n) => n.category === category),

      // Batch operations
      showBatch: (notifications: NotificationOptions[]) => {
        notifications.forEach((notification) => {
          get().show(notification);
        });
      },

      // Real-time connection
      setConnectionStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => {
        set(() => ({ 
          connectionStatus: status,
          isConnected: status === 'connected'
        }));
      },
    })),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
        categories: state.categories,
        isEnabled: state.isEnabled,
        defaultDuration: state.defaultDuration,
      }),
    }
  )
);

// Auto-cleanup old notifications
if (typeof window !== 'undefined') {
  setInterval(() => {
    const store = useNotificationStore.getState();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    const expiredNotifications = store.notifications.filter(
      (n) => n.timestamp < oneDayAgo && n.dismissed
    );
    
    if (expiredNotifications.length > 0) {
      useNotificationStore.setState((state) => ({
        notifications: state.notifications.filter(
          (notification) => !expiredNotifications.some(exp => exp.id === notification.id)
        ),
      }));
    }
  }, 60000); // Check every minute
}
