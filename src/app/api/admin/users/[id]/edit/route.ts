/** @format */

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/auth/permissions';
import type { AuthUser } from '@/lib/auth/permissions';

// PATCH /api/admin/users/[id]/edit - Update user details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, role, country, phoneNumber } = body;
    const userId = id;

    // Get session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const currentUser = session?.user as AuthUser | null;

    // Check permissions
    if (!currentUser || !canManageUsers(currentUser)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get target user to check permissions
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        country: true, 
        role: true,
        email: true 
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user can manage target user
    if (!canManageUsers(currentUser, targetUser.country)) {
      return NextResponse.json(
        { error: 'You can only manage users in your country' },
        { status: 403 }
      );
    }

    // Only super admins can change country
    if (country !== targetUser.country && currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can change user country' },
        { status: 403 }
      );
    }

    // Only super admins can assign super admin role
    if (role === 'super_admin' && currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can assign super admin role' },
        { status: 403 }
      );
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        role,
        country,
        phoneNumber: phoneNumber || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        phoneNumber: true,
      },
    });

    // Log the admin action
    console.log('Admin updated user:', {
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      targetUserId: userId,
      targetUserEmail: targetUser.email,
      changes: {
        role: targetUser.role !== role ? `${targetUser.role} -> ${role}` : null,
        country: targetUser.country !== country ? `${targetUser.country} -> ${country}` : null,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
