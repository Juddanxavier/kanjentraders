import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/auth/route-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await authGuard(request);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    const skip = (page - 1) * limit;
    
    const where = {
      userId: user.id,
      ...(category && { category: category.toUpperCase() }),
      ...(unreadOnly && { read: false }),
    };
    
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
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
      }),
      prisma.notification.count({ where }),
    ]);
    
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });
    
    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request);
    const body = await request.json();
    
    const {
      title,
      description,
      variant = 'DEFAULT',
      category = 'SYSTEM',
      priority = 'NORMAL',
      persistent = false,
      channel = 'BOTH',
      data,
      actions,
      groupId,
      leadId,
      shipmentId,
      expiresAt,
      targetUserId, // For admin creating notifications for specific users
    } = body;
    
    // If targetUserId is provided, check if current user is admin
    let userId = user.id;
    if (targetUserId) {
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Unauthorized to create notifications for other users' },
          { status: 403 }
        );
      }
      userId = targetUserId;
    }
    
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        description,
        variant: variant.toUpperCase(),
        category: category.toUpperCase(),
        priority: priority.toUpperCase(),
        persistent,
        channel: channel.toUpperCase(),
        data,
        actions,
        groupId,
        leadId,
        shipmentId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
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
    
    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authGuard(request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'mark-all-read') {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
      
      return NextResponse.json({ message: 'All notifications marked as read' });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authGuard(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    const where = {
      userId: user.id,
      ...(category && { category: category.toUpperCase() }),
    };
    
    await prisma.notification.deleteMany({ where });
    
    return NextResponse.json({ 
      message: category ? `${category} notifications cleared` : 'All notifications cleared' 
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
