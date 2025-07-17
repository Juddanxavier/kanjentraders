/** @format */

/**
 * NEXTAUTH.JS COMPATIBLE AUTH STORE
 * 
 * This is a compatibility layer for components that still reference the old auth store.
 * It uses NextAuth.js hooks under the hood and provides a similar interface.
 * 
 * NOTE: This should be gradually phased out in favor of direct NextAuth.js usage.
 */

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useCallback } from 'react';
import { type AuthUser, type UserRole } from '@/lib/auth/permissions';

export function useAuthStore() {
  const { data: session, status } = useSession();
  
  const user = session?.user as AuthUser | null;
  const isAuthenticated = !!session;
  const isLoading = status === 'loading';

  // Role checking functions
  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user) return false;
    
    if (role === 'super_admin') {
      return user.role === 'super_admin';
    }
    
    if (role === 'admin') {
      return user.role === 'admin' || user.role === 'super_admin';
    }
    
    return true; // All authenticated users have 'user' role
  }, [user]);

  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  const isSuperAdmin = useCallback((): boolean => {
    return hasRole('super_admin');
  }, [hasRole]);

  const canAccessCountry = useCallback((country: string): boolean => {
    if (!user) return false;
    
    if (user.role === 'super_admin') {
      return true; // Super admins can access all countries
    }
    
    return user.country === country;
  }, [user]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await nextAuthSignOut({ callbackUrl: '/auth/signin' });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  return {
    // State
    user,
    session,
    isAuthenticated,
    isLoading,
    
    // Role checking functions
    hasRole,
    isAdmin,
    isSuperAdmin,
    canAccessCountry,
    
    // Actions
    signOut,
    
    // Computed properties for backward compatibility
    userRole: user?.role || null,
    userCountry: user?.country || null,
    userName: user?.name || user?.email?.split('@')[0] || 'User',
    userEmail: user?.email || null,
  };
}

// Re-export for backward compatibility
export const useAuth = useAuthStore;
