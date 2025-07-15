import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/auth/route-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authGuard(request);
    const { id } = params;
    
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        variant: true,
        category: true,
        priority: true,
        persistent: true,
        channel: true,
        read: true,
        dismissed: true,
        data: true,
        actions: true,
        groupId: true,
        leadId: true,
        shipmentId: true,
        readAt: true,
        dismissedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authGuard(request);
    const { id } = params;
    const body = await request.json();
    
    const { action, ...updateData } = body;
    
    // First, verify the notification belongs to the user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
    
    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    let data: any = {};
    
    if (action === 'mark-read') {
      data = {
        read: true,
        readAt: new Date(),
      };
    } else if (action === 'mark-unread') {
      data = {
        read: false,
        readAt: null,
      };
    } else if (action === 'dismiss') {
      data = {
        dismissed: true,
        dismissedAt: new Date(),
      };
    } else {
      // Direct update
      data = updateData;
    }
    
    const notification = await prisma.notification.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        variant: true,
        category: true,
        priority: true,
        persistent: true,
        channel: true,
        read: true,
        dismissed: true,
        data: true,
        actions: true,
        groupId: true,
        leadId: true,
        shipmentId: true,
        readAt: true,
        dismissedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authGuard(request);
    const { id } = params;
    
    // First, verify the notification belongs to the user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
    
    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    await prisma.notification.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
