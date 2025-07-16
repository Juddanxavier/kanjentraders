# Notification System

A self-hosted, real-time notification system for the parcel tracking application.

## Features

- ✅ **Real-time notifications** using Server-Sent Events (SSE)
- ✅ **Persistent storage** in PostgreSQL
- ✅ **Redis caching** for performance
- ✅ **Toast notifications** using Sonner
- ✅ **In-app notification center** with unread counts
- ✅ **Zustand state management**
- ✅ **TypeScript support**
- ✅ **Priority levels** (Low, Medium, High, Urgent)
- ✅ **Notification templates** for common use cases
- ✅ **Bulk notifications** for system-wide messages
- ✅ **Automatic cleanup** of expired notifications

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   API Routes    │    │   Services      │
│                 │    │                 │    │                 │
│ NotificationBell│◄──►│ /notifications  │◄──►│NotificationService│
│ NotificationCenter│  │ /stream         │    │ Redis PubSub    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Zustand Store   │    │ Server-Sent     │    │ PostgreSQL      │
│                 │    │ Events (SSE)    │    │ + Redis Cache   │
│ - notifications │    │                 │    │                 │
│ - unreadCount   │    │ Real-time       │    │ Persistent      │
│ - actions       │    │ Updates         │    │ Storage         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Run Database Migration

```bash
npm run db:migrate
```

### 2. Environment Variables

Ensure you have Redis configured:

```env
REDIS_URL=redis://localhost:6379
```

### 3. Usage in Components

```typescript
// Send a notification
import { sendWelcomeNotification } from '@/lib/utils/notifications';

await sendWelcomeNotification(userId);

// Use in components
import { useNotificationStore } from '@/lib/store/notification-store';

const { notifications, unreadCount } = useNotificationStore();
```

## API Endpoints

- `GET /api/notifications` - Get user notifications
- `POST /api/notifications` - Create notification (admin only)
- `PATCH /api/notifications/[id]` - Mark as read
- `DELETE /api/notifications/[id]` - Delete notification
- `POST /api/notifications/mark-all-read` - Mark all as read
- `GET /api/notifications/stream` - Real-time SSE stream

## Notification Types

- **System**: Maintenance, features, security alerts
- **Shipment**: Created, status updates, delivered, exceptions
- **Lead**: Assigned, status changes, converted
- **User**: Welcome, role changes, account locked

## Priority Levels

- **0 (Low)**: General information
- **1 (Medium)**: Important updates
- **2 (High)**: Urgent actions required
- **3 (Urgent)**: Critical alerts

## Helper Functions

```typescript
// Pre-built notification helpers
import {
  sendWelcomeNotification,
  sendShipmentStatusNotification,
  sendLeadAssignedNotification,
  sendMaintenanceNotification,
} from '@/lib/utils/notifications';

// Send to single user
await sendWelcomeNotification(userId);

// Send to multiple users
await sendMaintenanceNotification(userIds, {
  startTime: new Date(),
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
  description: 'Database maintenance'
});
```

## Components

### NotificationBell
Shows bell icon with unread count badge.

### NotificationCenter
Dropdown showing recent notifications with actions.

### NotificationItem
Individual notification display with icons and actions.

### NotificationProvider
Context provider for real-time connection.

## State Management

Uses Zustand for client-side state:

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string, userId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
}
```

## Real-time Updates

Uses Server-Sent Events for real-time notifications:

1. Client connects to `/api/notifications/stream`
2. Server pushes new notifications via Redis pub/sub
3. Client receives updates and shows toast + updates state
4. Automatic reconnection on connection loss

## Performance

- Redis caching for unread counts
- Cached recent notifications
- Efficient database queries with indexes
- Automatic cleanup of expired notifications

## Testing

Create test notifications:

```typescript
import { NotificationService } from '@/lib/services/notificationService';

await NotificationService.createFromTemplate(
  userId,
  'SYSTEM_FEATURE',
  { feature: 'New Dashboard' },
  {
    title: 'New Feature Available',
    message: 'Check out our new dashboard!',
    actionUrl: '/dashboard'
  }
);
```

## Deployment Notes

1. Ensure Redis is running
2. Database migrations are applied
3. Environment variables are set
4. Consider Redis persistence for production
5. Monitor Redis memory usage
6. Set up log rotation for notification logs

## Future Enhancements

- Email notifications
- Push notifications
- SMS notifications via Twilio
- Notification preferences UI
- Analytics dashboard
- A/B testing for notifications
- Notification templates editor
