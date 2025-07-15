/** @format */

'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ClientProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  onUnauthenticated?: () => void;
  onUnauthorized?: () => void;
  onBanned?: () => void;
}

/**
 * Client-side protected route component
 * Uses callbacks for better-auth compatibility
 */
export function ClientProtectedRoute({ 
  children, 
  requireAdmin = false,
  onUnauthenticated,
  onUnauthorized,
  onBanned
}: ClientProtectedRouteProps) {
  const router = useRouter();
  const { getAuthStatus, checkAuth, checkAdmin } = useAuth();
  const authStatus = getAuthStatus();

  useEffect(() => {
    const handleAuthCheck = () => {
      switch (authStatus) {
        case 'unauthenticated':
          if (onUnauthenticated) {
            onUnauthenticated();
          } else {
            router.push('/signin?error=unauthenticated');
          }
          break;
          
        case 'banned':
          if (onBanned) {
            onBanned();
          } else {
            router.push('/signin?error=account_banned');
          }
          break;
          
        case 'authenticated':
          if (requireAdmin && !checkAdmin()) {
            if (onUnauthorized) {
              onUnauthorized();
            } else {
              router.push('/dashboard?error=unauthorized');
            }
          }
          break;
      }
    };

    // Only run auth check when not loading
    if (authStatus !== 'loading') {
      handleAuthCheck();
    }
  }, [authStatus, requireAdmin, checkAdmin, onUnauthenticated, onUnauthorized, onBanned, router]);

  // Show loading state
  if (authStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render children until authentication is confirmed
  if (authStatus !== 'authenticated' || (requireAdmin && !checkAdmin())) {
    return null;
  }

  return <>{children}</>;
}
