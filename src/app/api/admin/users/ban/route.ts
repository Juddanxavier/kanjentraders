/** @format */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/auth/permissions';
import type { AuthUser } from '@/lib/auth/permissions';

// POST /api/admin/users/ban - Ban or unban a user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, ban, reason, expiresAt } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const currentUser = session?.user as AuthUser | null;

    // Check permissions
    if (!currentUser || !canManageUsers(currentUser)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get target user to check country
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user can manage target user
    if (!canManageUsers(currentUser, targetUser.country)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update user ban status
    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: ban,
        banReason: ban ? reason : null,
        banExpires: ban && expiresAt ? new Date(expiresAt) : null,
      },
    });

    // If banning, terminate all active sessions
    if (ban) {
      await prisma.session.deleteMany({
        where: { userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user ban status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
