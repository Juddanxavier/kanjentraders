import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/auth/route-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await authGuard(request);
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active') === 'true';
    
    const where: any = {};
    if (category) where.category = category;
    if (active !== undefined) where.active = active;
    
    const templates = await prisma.notificationTemplate.findMany({
      where,
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
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
    
    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authGuard(request);
    
    // Only admins can create templates
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
      variant = 'DEFAULT',
      priority = 'NORMAL',
      persistent = false,
      channel = 'BOTH',
      variables,
      active = true,
    } = body;
    
    if (!name || !category || !title) {
      return NextResponse.json(
        { error: 'Name, category, and title are required' },
        { status: 400 }
      );
    }
    
    const template = await prisma.notificationTemplate.create({
      data: {
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
      },
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
    console.error('Error creating notification template:', error);
    return NextResponse.json(
      { error: 'Failed to create notification template' },
      { status: 500 }
    );
  }
}
