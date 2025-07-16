/** @format */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Package, 
  User, 
  Settings, 
  Sparkles,
  Trash2,
  RefreshCw 
} from 'lucide-react';

interface HealthCheck {
  timestamp: string;
  status: 'healthy' | 'unhealthy' | 'error';
  checks: {
    [key: string]: {
      status: 'ok' | 'error' | 'warning';
      message: string;
    };
  };
}

export function NotificationTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);

  const testNotifications = [
    {
      type: 'welcome',
      label: 'Welcome',
      icon: <User className="w-4 h-4" />,
      description: 'Welcome message for new users',
      priority: 1,
    },
    {
      type: 'shipment',
      label: 'Shipment Update',
      icon: <Package className="w-4 h-4" />,
      description: 'Package status update',
      priority: 2,
    },
    {
      type: 'system',
      label: 'System Alert',
      icon: <AlertCircle className="w-4 h-4" />,
      description: 'System maintenance warning',
      priority: 3,
    },
    {
      type: 'lead',
      label: 'Lead Assignment',
      icon: <User className="w-4 h-4" />,
      description: 'New lead assigned',
      priority: 2,
    },
    {
      type: 'feature',
      label: 'New Feature',
      icon: <Sparkles className="w-4 h-4" />,
      description: 'New feature announcement',
      priority: 1,
    },
  ];

  const sendTestNotification = async (type: string, priority: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, priority }),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const data = await response.json();
      toast.success('Test notification sent!', {
        description: `Created: ${data.notification.title}`,
      });
    } catch (error) {
      toast.error('Failed to send notification', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/notifications', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear notifications');
      }

      toast.success('Test notifications cleared!');
    } catch (error) {
      toast.error('Failed to clear notifications', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test/notifications/health');
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }

      const data = await response.json();
      setHealthCheck(data);
      
      if (data.status === 'healthy') {
        toast.success('Health check passed!');
      } else {
        toast.warning('Health check found issues');
      }
    } catch (error) {
      toast.error('Health check failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification System Tester
          </CardTitle>
          <CardDescription>
            Test and debug your notification system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Notifications */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Test Notifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {testNotifications.map((notification) => (
                <Button
                  key={notification.type}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => sendTestNotification(notification.type, notification.priority)}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    {notification.icon}
                    <span className="font-medium">{notification.label}</span>
                    <Badge variant={notification.priority === 3 ? 'destructive' : 'secondary'}>
                      P{notification.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground text-left">
                    {notification.description}
                  </p>
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={runHealthCheck}
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Health Check
            </Button>
            <Button
              onClick={clearTestNotifications}
              disabled={isLoading}
              variant="outline"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Test Notifications
            </Button>
          </div>

          {/* Health Check Results */}
          {healthCheck && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Health Check Results</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Overall Status:</span>
                  <Badge
                    variant={
                      healthCheck.status === 'healthy'
                        ? 'default'
                        : healthCheck.status === 'unhealthy'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {healthCheck.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {healthCheck.timestamp}
                  </span>
                </div>
                
                <div className="grid gap-2">
                  {Object.entries(healthCheck.checks).map(([key, check]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 p-2 rounded border"
                    >
                      {getStatusIcon(check.status)}
                      <span className="font-medium capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm">{check.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">How to Test:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Click "Run Health Check" to verify the system is working</li>
              <li>Click any test notification type to send a test notification</li>
              <li>Check the notification bell in the header for updates</li>
              <li>Verify toast notifications appear</li>
              <li>Test the real-time SSE connection</li>
              <li>Use "Clear Test Notifications" to cleanup</li>
            </ol>
          </div>

          {/* Browser Testing */}
          <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Browser Testing:</h4>
            <p className="text-sm mb-2">
              Open developer tools and check the Network tab for:
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>POST requests to /api/test/notifications</li>
              <li>EventSource connection to /api/notifications/stream</li>
              <li>Real-time notification updates</li>
              <li>Console logs for debugging</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
