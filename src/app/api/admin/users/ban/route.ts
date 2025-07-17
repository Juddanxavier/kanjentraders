/** @format */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/auth-server';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/auth/permissions';
import type { AuthUser } from '@/lib/auth/permissions';
import { ServerRedisService } from '@/lib/services/redis-server';
// POST /api/admin/users/ban - Ban or unban a user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, ban, reason, expiresAt } = body;
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    // Get session
    const session = await getSession();
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
    // Additional check: regular admins can only manage users in their country
    if (currentUser.role === 'admin' && currentUser.country !== targetUser.country) {
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
    
    // Invalidate cache after user ban/unban
    try {
      const cacheKeys = [
        `users:admin:${targetUser.country}`,
        `users:super_admin:all`,
        `users:admin:all`
      ];
      
      for (const key of cacheKeys) {
        await ServerRedisService.clearCache(key);
      }
      console.log('🗑️  Invalidated user cache after ban/unban');
    } catch (cacheError) {
      console.warn('⚠️  Cache invalidation failed:', cacheError);
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
