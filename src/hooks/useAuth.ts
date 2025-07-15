/** @format */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import type { Session } from 'better-auth/types';

interface UseAuthReturn {
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * Client-side hook for authentication
 * Uses Better-Auth's built-in session management
 */
export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  // Fetch session on mount
  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const sessionData = await authClient.getSession();
      setSession(sessionData);
      setError(null);
    } catch (err) {
      setError(err as Error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authClient.signOut();
      setSession(null);
      router.push('/signin');
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  const refreshSession = async () => {
    await fetchSession();
  };

  return {
    session,
    loading,
    error,
    signOut,
    refreshSession,
  };
}

/**
 * Example usage:
 * 
 * function UserProfile() {
 *   const { session, loading, signOut } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!session) return <div>Not authenticated</div>;
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {session.user.email}</p>
 *       <button onClick={signOut}>Sign Out</button>
 *     </div>
 *   );
 * }
 */
