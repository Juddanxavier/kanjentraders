/** @format */
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/auth/permissions';
import type { AuthUser } from '@/lib/auth/permissions';
// DELETE /api/admin/users/sessions - Terminate all sessions for a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
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
    // Delete all sessions for the user
    const result = await prisma.session.deleteMany({
      where: { userId },
    });
    return NextResponse.json({ 
      success: true, 
      deletedSessions: result.count 
    });
  } catch (error) {
    console.error('Error terminating user sessions:', error);
    return NextResponse.json(
      { error: 'Failed to terminate sessions' },
      { status: 500 }
    );
  }
}
