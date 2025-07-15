'use client';

import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '@/lib/store/notification-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  BellOff, 
  Check, 
  CheckCheck, 
  X, 
  Trash2, 
  Settings, 
  Filter,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const NotificationIcon = ({ variant }: { variant: string }) => {
  switch (variant) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    centerOpen,
    categories,
    preferences,
    markAsRead,
    markAllAsRead,
    dismiss,
    clear,
    clearCategory,
    closeCenter,
    toggleCenter,
    updatePreferences,
    getNotificationsByCategory,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | string>('all');
  const [showSettings, setShowSettings] = useState(false);

  const filteredNotifications = () => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'unread') return notifications.filter(n => !n.read);
    return getNotificationsByCategory(activeTab);
  };

  const getCategoryColor = (category: string) => {
    return categories[category]?.color || '#6b7280';
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismiss(id);
  };

  const categoryTabs = Object.keys(categories).filter(
    category => categories[category].enabled
  );

  if (!centerOpen) return null;

  return (
    <Card className={cn('w-96 max-h-[500px] shadow-lg', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeCenter}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {showSettings && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Toast notifications</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updatePreferences({ toast: !preferences.toast })}
                >
                  {preferences.toast ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Sound notifications</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updatePreferences({ sound: !preferences.sound })}
                >
                  {preferences.sound ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Group similar</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updatePreferences({ groupSimilar: !preferences.groupSimilar })}
                >
                  {preferences.groupSimilar ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Filter className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <NotificationList 
              notifications={filteredNotifications()}
              onNotificationClick={handleNotificationClick}
              onDismiss={handleDismiss}
              getCategoryColor={getCategoryColor}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <NotificationList 
              notifications={filteredNotifications()}
              onNotificationClick={handleNotificationClick}
              onDismiss={handleDismiss}
              getCategoryColor={getCategoryColor}
            />
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <div className="p-4 space-y-2">
              {categoryTabs.map(category => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(category) }}
                    />
                    <span className="text-sm font-medium capitalize">{category}</span>
                    <Badge variant="secondary" className="ml-2">
                      {getNotificationsByCategory(category).filter(n => !n.read).length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearCategory(category)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="border-t p-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={notifications.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface NotificationListProps {
  notifications: any[];
  onNotificationClick: (id: string) => void;
  onDismiss: (id: string, e: React.MouseEvent) => void;
  getCategoryColor: (category: string) => string;
}

function NotificationList({ 
  notifications, 
  onNotificationClick, 
  onDismiss, 
  getCategoryColor 
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No notifications</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-1 p-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'group relative p-3 rounded-lg cursor-pointer transition-colors',
              'hover:bg-gray-50 dark:hover:bg-gray-800',
              !notification.read && 'bg-blue-50 dark:bg-blue-900/20'
            )}
            onClick={() => onNotificationClick(notification.id)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <NotificationIcon variant={notification.variant} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {notification.title}
                  </h4>
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(notification.category) }}
                  />
                </div>
                
                {notification.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {notification.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {notification.category}
                    </Badge>
                    {notification.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs">
                        High
                      </Badge>
                    )}
                    {notification.priority === 'critical' && (
                      <Badge variant="destructive" className="text-xs">
                        Critical
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => onDismiss(notification.id, e)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {!notification.read && (
              <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
