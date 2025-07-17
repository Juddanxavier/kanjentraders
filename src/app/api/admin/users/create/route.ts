/** @format */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/auth-server';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/auth/permissions';
import type { AuthUser } from '@/lib/auth/permissions';
import bcrypt from 'bcryptjs';
// POST /api/admin/users/create - Create a new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role, country, phoneNumber } = body;
    // Validate required fields
    if (!email || !password || !name || !role || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    // Get session
    const session = await getSession();
    const currentUser = session?.user as AuthUser | null;
    // Check permissions
    if (!currentUser || !canManageUsers(currentUser)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check if current user can create users in the specified country
    if (currentUser.role !== 'super_admin' && country !== currentUser.country) {
      return NextResponse.json(
        { error: 'You can only create users in your country' },
        { status: 403 }
      );
    }
    // Check if current user can assign the specified role
    if (role === 'super_admin' && currentUser.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can create super admin accounts' },
        { status: 403 }
      );
    }
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        role,
        country,
        phoneNumber: phoneNumber || null,
        emailVerified: false,
        phoneNumberVerified: false,
      },
    });
// Create an account record for the user (required by NextAuth.js with credentials provider)
    await prisma.account.create({
      data: {
        id: `${newUser.id}-email`,
        accountId: newUser.email,
        providerId: 'email',
        userId: newUser.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    // Log the admin action
    console.log('Admin created user:', {
      adminId: currentUser.id,
      adminEmail: currentUser.email,
      newUserId: newUser.id,
      newUserEmail: newUser.email,
      newUserRole: newUser.role,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        country: newUser.country,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
