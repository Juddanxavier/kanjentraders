/** @format */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/auth-server';
import { prisma } from '@/lib/prisma';
import { canManageUsers, getCountryFilter } from '@/lib/auth/permissions';
import type { AuthUser } from '@/lib/auth/permissions';
import { ServerRedisService } from '@/lib/services/redis-server';
// GET /api/admin/users - Get all users (with permissions filter)
export async function GET() {
  try {
    // Get session
    const session = await getSession();
    const user = session?.user as AuthUser | null;
    // Check permissions
    if (!user || !canManageUsers(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get country filter based on user role
    const countryFilter = getCountryFilter(user);
    
    // Try to get from Redis cache first
    const cacheKey = `users:${user.role}:${countryFilter || 'all'}`;
    try {
      const cachedUsers = await ServerRedisService.getCache(cacheKey);
      if (cachedUsers) {
        console.log('📦 Returning cached users (Cache Hit)');
        return NextResponse.json(cachedUsers);
      }
      console.log('💾 Cache miss, fetching from database');
    } catch (cacheError) {
      console.warn('⚠️  Cache read failed, falling back to database:', cacheError);
    }
    
    // Fetch users with filters
    const users = await prisma.user.findMany({
      where: countryFilter ? { country: countryFilter } : undefined,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        createdAt: true,
        emailVerified: true,
        phoneNumber: true,
        phoneNumberVerified: true,
        banned: true,
        banReason: true,
        banExpires: true,
        image: true,
        sessions: {
          where: {
            expires: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            sessionToken: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    // Transform data to include session info
    const transformedUsers = users.map(user => {
      const activeSessions = user.sessions.length;
      // Note: Cannot calculate lastLogin since Session model doesn't have createdAt field
      return {
        ...user,
        emailVerified: user.emailVerified !== null, // Transform DateTime to boolean
        activeSessions,
        lastLogin: null, // Would need createdAt field in Session model
        sessions: undefined, // Remove raw sessions data
      };
    });
    
    // Cache the results for 5 minutes
    try {
      await ServerRedisService.setCache(cacheKey, transformedUsers, 300);
      console.log('💾 Cached users data');
    } catch (cacheError) {
      console.warn('⚠️  Cache write failed:', cacheError);
    }
    
    return NextResponse.json(transformedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
// DELETE /api/admin/users - Delete a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
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
    // Delete user (cascade will handle sessions and accounts)
    await prisma.user.delete({
      where: { id: userId },
    });
    
    // Invalidate cache after user deletion
    try {
      const cacheKeys = [
        `users:admin:${targetUser.country}`,
        `users:super_admin:all`,
        `users:admin:all`
      ];
      
      for (const key of cacheKeys) {
        await ServerRedisService.clearCache(key);
      }
      console.log('🗑️  Invalidated user cache after deletion');
    } catch (cacheError) {
      console.warn('⚠️  Cache invalidation failed:', cacheError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
