import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/auth/route-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authGuard(request);
    
    const template = await prisma.notificationTemplate.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        category: true,
        title: true,
        description: true,
        variant: true,
        priority: true,
        persistent: true,
        channel: true,
        variables: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching notification template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification template' },
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
    
    // Only admins can update templates
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      name,
      category,
      title,
      description,
      variant,
      priority,
      persistent,
      channel,
      variables,
      active,
    } = body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (variant !== undefined) updateData.variant = variant;
    if (priority !== undefined) updateData.priority = priority;
    if (persistent !== undefined) updateData.persistent = persistent;
    if (channel !== undefined) updateData.channel = channel;
    if (variables !== undefined) updateData.variables = variables;
    if (active !== undefined) updateData.active = active;
    
    const template = await prisma.notificationTemplate.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        category: true,
        title: true,
        description: true,
        variant: true,
        priority: true,
        persistent: true,
        channel: true,
        variables: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error updating notification template:', error);
    return NextResponse.json(
      { error: 'Failed to update notification template' },
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
    
    // Only admins can delete templates
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    await prisma.notificationTemplate.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification template:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification template' },
      { status: 500 }
    );
  }
}
