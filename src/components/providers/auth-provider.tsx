/** @format */
'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { authClient } from '@/lib/auth/auth-client';
import { useRouter } from 'next/navigation';
interface AuthProviderProps {
  children: React.ReactNode;
}
export function AuthProvider({ children }: AuthProviderProps) {
  const { setSession, checkSession, isAuthenticated, user } = useAuthStore();
  const { data: session, isPending, error } = authClient.useSession();
  const router = useRouter();
  
  // Sync better-auth session with Zustand store
  useEffect(() => {
    if (!isPending) {
      setSession(session);
    }
  }, [session, isPending, setSession]);
  
  // Handle auth errors
  useEffect(() => {
    if (error) {
      console.error('Auth error:', error);
      // Don't redirect here - let components handle their own redirects
      // This prevents conflicts with better-auth's built-in redirect handling
    }
  }, [error]);
  
  // Smart session checking: Only check if we don't have persisted auth or session is invalid
  useEffect(() => {
    // If we have persisted auth state but no active session, verify it's still valid
    if (isAuthenticated && user && !session && !isPending) {
      checkSession();
    }
    // If we have no persisted auth and no session, check for session
    else if (!isAuthenticated && !session && !isPending) {
      checkSession();
    }
  }, [isAuthenticated, user, session, isPending, checkSession]);
  
  return <>{children}</>;
}
