/** @format */
import { authClient } from '@/lib/auth/auth-client';
import { type AuthUser } from '@/lib/auth/permissions';
/**
 * Client Session Service
 * Functions that can be safely used in client components
 */
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
 * Get user role from client session
 */
export async function getClientUserRole(): Promise<AuthUser['role'] | null> {
  const sessionData = await getClientSession();
  return sessionData?.user.role || null;
}
/**
 * Check if user is authenticated on client side
 */
export async function isClientAuthenticated(): Promise<boolean> {
  const sessionData = await getClientSession();
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
