/** @format */
import { auth } from '@/lib/auth/auth';
import { authClient } from '@/lib/auth/auth-client';
import { type AuthUser } from '@/lib/auth/permissions';
import { headers } from 'next/headers';
/**
 * Session Service
 * Centralized session management for both server and client components
 */
/**
 * Get session in server components/API routes
 * @param requestHeaders - Optional headers, will use next/headers if not provided
 */
export async function getServerSession(requestHeaders?: Headers) {
  try {
    // Use Better-Auth's built-in session management
    const session = await auth.api.getSession({
      headers: requestHeaders || (await headers())
    });
    if (!session?.user) {
      return null;
    }
    // Better-Auth automatically handles cookie caching
    // No need for manual Redis caching
    return {
      user: session.user as AuthUser,
      session,
      // Add useful session metadata
      expiresAt: session.expiresAt,
      isValid: new Date(session.expiresAt) > new Date()
    };
  } catch (error) {
    console.error('Failed to get server session:', error);
    return null;
  }
}
/**
 * Get session in client components
 * Uses the authClient for client-side session retrieval
 */
export async function getClientSession() {
  try {
    const session = await authClient.getSession();
    if (!session?.user) {
      return null;
    }
    return {
      user: session.user as AuthUser,
      session
    };
  } catch (error) {
    console.error('Failed to get client session:', error);
    return null;
  }
}
/**
 * Get user role from session
 * @param isClient - Whether this is being called from client side
 */
export async function getUserRole(isClient: boolean = false): Promise<AuthUser['role'] | null> {
  const sessionData = isClient ? await getClientSession() : await getServerSession();
  return sessionData?.user.role || null;
}
/**
 * Check if user is authenticated
 * @param isClient - Whether this is being called from client side
 */
export async function isAuthenticated(isClient: boolean = false): Promise<boolean> {
  const sessionData = isClient ? await getClientSession() : await getServerSession();
  return !!sessionData;
}
/**
 * Get redirect path based on user role
 * @param role - User role
 */
export function getRoleBasedRedirectPath(role: AuthUser['role'] | null): string {
  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/admin';
    case 'user':
      return '/dashboard';
    default:
      return '/signin';
  }
}
