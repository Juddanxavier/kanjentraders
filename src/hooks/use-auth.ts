/** @format */
import { useAuthStore } from '@/lib/store/auth-store';
import { useCallback } from 'react';
export function useAuth() {
  const {
    user,
    session,
    isAuthenticated,
    isLoading,
    isAdmin,
    isSuperAdmin,
    hasRole,
    canAccessCountry,
    signOut,
  } = useAuthStore();
  // Check if user is authenticated
  const checkAuth = useCallback(() => {
    return !isLoading && isAuthenticated;
  }, [isAuthenticated, isLoading]);
  // Check if user has required role
  const checkRole = useCallback((role: 'user' | 'admin' | 'super_admin') => {
    return !isLoading && isAuthenticated && hasRole(role);
  }, [isAuthenticated, isLoading, hasRole]);
  // Check if user is admin
  const checkAdmin = useCallback(() => {
    return !isLoading && isAuthenticated && isAdmin();
  }, [isAuthenticated, isLoading, isAdmin]);
  // Get auth status for conditional rendering
  const getAuthStatus = useCallback(() => {
    if (isLoading) return 'loading';
    if (!isAuthenticated) return 'unauthenticated';
    if (user?.banned) return 'banned';
    return 'authenticated';
  }, [isLoading, isAuthenticated, user?.banned]);
  return {
    // State
    user,
    session,
    isAuthenticated,
    isLoading,
    // Role checks (computed values)
    isAdmin: isAdmin(),
    isSuperAdmin: isSuperAdmin(),
    hasRole,
    canAccessCountry,
    // Check functions (for conditional logic)
    checkAuth,
    checkRole,
    checkAdmin,
    getAuthStatus,
    // Actions
    signOut,
    // User info helpers
    userRole: user?.role || null,
    userCountry: user?.country || null,
    userName: user?.name || user?.email?.split('@')[0] || 'User',
    userEmail: user?.email || null,
  };
}
