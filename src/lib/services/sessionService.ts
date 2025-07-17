/** @format */
import { getSession } from '@/lib/auth/auth-server';
import { type AuthUser } from '@/lib/auth/permissions';

/**
 * Session Service
 * Centralized session management for both server and client components
 * Updated to use NextAuth.js
 */

/**
 * Get session in server components/API routes
 * @param requestHeaders - Optional headers (not used in NextAuth.js)
 */
export async function getServerSession(requestHeaders?: Headers) {
  try {
    // Use NextAuth.js server-side session management
    const session = await getSession();
    if (!session?.user) {
      return null;
    }
    
    return {
      user: session.user as AuthUser,
      session,
      // Add useful session metadata
      expiresAt: session.expires,
      isValid: session.expires ? new Date(session.expires) > new Date() : true
    };
  } catch (error) {
    console.error('Failed to get server session:', error);
    return null;
  }
}

/**
 * Get session in client components
 * Uses NextAuth.js client-side session retrieval
 */
export async function getClientSession() {
  try {
    // For client-side, we'll use the useSession hook instead
    // This function is kept for compatibility but should not be used directly
    throw new Error('Use useSession hook from next-auth/react in client components');
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
