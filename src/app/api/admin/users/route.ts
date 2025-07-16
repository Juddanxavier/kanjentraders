/** @format */
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { canManageUsers, getCountryFilter } from '@/lib/auth/permissions';
import type { AuthUser } from '@/lib/auth/permissions';
// GET /api/admin/users - Get all users (with permissions filter)
export async function GET() {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const user = session?.user as AuthUser | null;
    // Check permissions
    if (!user || !canManageUsers(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Get country filter based on user role
    const countryFilter = getCountryFilter(user);
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
        avatar: true,
        sessions: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            createdAt: true,
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
      const lastLogin = user.sessions.length > 0 
        ? user.sessions.reduce((latest, session) => 
            session.createdAt > latest ? session.createdAt : latest, 
            user.sessions[0].createdAt
          )
        : null;
      return {
        ...user,
        activeSessions,
        lastLogin,
        sessions: undefined, // Remove raw sessions data
      };
    });
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
    // Delete user (cascade will handle sessions and accounts)
    await prisma.user.delete({
      where: { id: userId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
