/** @format */

'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth/auth-client';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Auth guard component that works with better-auth redirects
 * Uses better-auth's built-in redirect handling
 */
export function AuthGuard({ 
  children, 
  requireAdmin = false, 
  fallback 
}: AuthGuardProps) {
  const { getAuthStatus, checkAdmin } = useAuth();
  const router = useRouter();
  const authStatus = getAuthStatus();

  useEffect(() => {
    // Use better-auth's built-in redirect handling
    if (authStatus === 'unauthenticated') {
      // Let better-auth handle the redirect with proper callback URL
      const currentUrl = window.location.pathname + window.location.search;
      authClient.signIn.social('google', {
        callbackURL: currentUrl
      });
    }
  }, [authStatus]);

  // Show loading state
  if (authStatus === 'loading') {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle unauthenticated users
  if (authStatus === 'unauthenticated') {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Handle banned users
  if (authStatus === 'banned') {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Account Suspended</h2>
          <p className="text-muted-foreground">Your account has been suspended. Please contact support.</p>
        </div>
      </div>
    );
  }

  // Handle admin requirement
  if (requireAdmin && !checkAdmin()) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting pages
 */
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options: { requireAdmin?: boolean } = {}
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <AuthGuard requireAdmin={options.requireAdmin}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}
