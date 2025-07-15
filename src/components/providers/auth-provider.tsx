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
  const { setSession, checkSession } = useAuthStore();
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

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return <>{children}</>;
}
