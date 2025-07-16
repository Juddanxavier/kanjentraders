/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { NotificationService } from '@/lib/services/notificationService';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {} as any,
    };

    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.checks.database = { status: 'ok', message: 'Database connected' };
    } catch (error) {
      healthCheck.checks.database = { status: 'error', message: 'Database connection failed' };
      healthCheck.status = 'unhealthy';
    }

    // Check notification table
    try {
      const count = await prisma.notification.count();
      healthCheck.checks.notifications_table = { 
        status: 'ok', 
        message: `Notification table accessible (${count} records)` 
      };
    } catch (error) {
      healthCheck.checks.notifications_table = { 
        status: 'error', 
        message: 'Notification table not accessible' 
      };
      healthCheck.status = 'unhealthy';
    }

    // Check Redis connection (if available)
    try {
      // Import Redis service if available
      const { NotificationPubSub } = await import('@/lib/services/redis-server');
      // Try to get unread count which uses Redis
      const unreadCount = await NotificationService.getUnreadCount(session.user.id);
      healthCheck.checks.redis = { 
        status: 'ok', 
        message: `Redis connected (unread count: ${unreadCount})` 
      };
    } catch (error) {
      healthCheck.checks.redis = { 
        status: 'warning', 
        message: 'Redis not available or connection failed' 
      };
      // Redis is not critical, so don't mark as unhealthy
    }

    // Check user session
    try {
      healthCheck.checks.user_session = { 
        status: 'ok', 
        message: `User session valid (${session.user.email})` 
      };
    } catch (error) {
      healthCheck.checks.user_session = { 
        status: 'error', 
        message: 'User session invalid' 
      };
      healthCheck.status = 'unhealthy';
    }

    // Check SSE endpoint
    try {
      const fs = require('fs');
      const path = require('path');
      const sseRoutePath = path.join(process.cwd(), 'src/app/api/notifications/stream/route.ts');
      const sseRouteExists = fs.existsSync(sseRoutePath);
      
      if (sseRouteExists) {
        healthCheck.checks.sse_endpoint = { 
          status: 'ok', 
          message: 'SSE endpoint route exists' 
        };
      } else {
        healthCheck.checks.sse_endpoint = { 
          status: 'error', 
          message: 'SSE endpoint route not found' 
        };
        healthCheck.status = 'unhealthy';
      }
    } catch (error) {
      healthCheck.checks.sse_endpoint = { 
        status: 'error', 
        message: 'Cannot verify SSE endpoint' 
      };
      healthCheck.status = 'unhealthy';
    }

    // Check notification service methods
    try {
      const testUserId = session.user.id;
      const result = await NotificationService.getForUser(testUserId, 1, 1);
      const unreadCount = await NotificationService.getUnreadCount(testUserId);
      
      healthCheck.checks.notification_service = { 
        status: 'ok', 
        message: `Service methods working (${result.notifications.length} notifications, ${unreadCount} unread)` 
      };
    } catch (error) {
      healthCheck.checks.notification_service = { 
        status: 'error', 
        message: 'Notification service methods failing' 
      };
      healthCheck.status = 'unhealthy';
    }

    return NextResponse.json(healthCheck);
  } catch (error) {
    console.error('Error in notification health check:', error);
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        message: 'Health check failed',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
