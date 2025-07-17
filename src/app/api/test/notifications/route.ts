/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/auth-server';
import { NotificationService } from '@/lib/services/notificationService';
import { NotificationType } from '@/generated/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type = 'test', priority = 1 } = body;

    // Create different types of test notifications
    const testNotifications = {
      welcome: {
        type: 'USER_WELCOME' as NotificationType,
        title: 'Welcome to the Platform! 🎉',
        message: 'Thank you for joining us. Start by exploring your dashboard.',
        priority: 1,
        actionUrl: '/dashboard',
      },
      shipment: {
        type: 'SHIPMENT_STATUS_UPDATE' as NotificationType,
        title: 'Package Update 📦',
        message: 'Your shipment GT12345678 is now in transit.',
        priority: 2,
        actionUrl: '/shipments/GT12345678',
      },
      system: {
        type: 'SYSTEM_MAINTENANCE' as NotificationType,
        title: 'System Maintenance ⚠️',
        message: 'Scheduled maintenance will begin at 2:00 AM UTC.',
        priority: 3,
        actionUrl: '/maintenance',
      },
      lead: {
        type: 'LEAD_ASSIGNED' as NotificationType,
        title: 'New Lead Assigned 👤',
        message: 'You have been assigned a new lead from Mumbai.',
        priority: 2,
        actionUrl: '/leads',
      },
      feature: {
        type: 'SYSTEM_FEATURE' as NotificationType,
        title: 'New Feature Available ✨',
        message: 'Try out our new analytics dashboard!',
        priority: 1,
        actionUrl: '/analytics',
      },
    };

    const notificationConfig = testNotifications[type] || testNotifications.welcome;

    const notification = await NotificationService.create({
      userId: session.user.id,
      type: notificationConfig.type,
      title: notificationConfig.title,
      message: notificationConfig.message,
      priority: priority || notificationConfig.priority,
      actionUrl: notificationConfig.actionUrl,
      data: {
        testNotification: true,
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      notification,
      message: 'Test notification created successfully',
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    return NextResponse.json(
      { error: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's notifications
    const result = await NotificationService.getForUser(session.user.id, 1, 10);
    const unreadCount = await NotificationService.getUnreadCount(session.user.id);

    return NextResponse.json({
      notifications: result.notifications,
      unreadCount,
      total: result.total,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all test notifications for the user
    await NotificationService.deleteMany({
      userId: session.user.id,
      data: {
        path: ['testNotification'],
        equals: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'All test notifications deleted',
    });
  } catch (error) {
    console.error('Error deleting test notifications:', error);
    return NextResponse.json(
      { error: 'Failed to delete test notifications' },
      { status: 500 }
    );
  }
}
