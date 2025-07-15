/** @format */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { authClient } from '@/lib/auth/auth-client';
import type { Session } from 'better-auth/types';
import type { AuthUser } from '@/lib/auth/permissions';
import { isAdmin as checkIsAdmin, isSuperAdmin as checkIsSuperAdmin } from '@/lib/auth/permissions';

interface AuthState {
  // State
  session: Session | null;
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setSession: (session: Session | null) => void;
  checkSession: () => Promise<void>;
  signOut: () => Promise<void>;
  clearSession: () => void;
  
  // Computed
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  hasRole: (role: AuthUser['role']) => boolean;
  canAccessCountry: (country: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      session: null,
      user: null,
      isLoading: true,
      isAuthenticated: false,

      // Actions
      setSession: (session) => {
        set({
          session,
          user: session?.user as AuthUser || null,
          isAuthenticated: !!session,
          isLoading: false,
        });
      },

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const { data } = await authClient.getSession();
          get().setSession(data);
        } catch (error) {
          console.error('Session check failed:', error);
          get().clearSession();
        }
      },

      signOut: async () => {
        try {
          await authClient.signOut();
          get().clearSession();
        } catch (error) {
          console.error('Sign out failed:', error);
          // Clear session anyway to ensure user is logged out locally
          get().clearSession();
        }
      },

      clearSession: () => {
        set({
          session: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Computed
      isAdmin: () => {
        const user = get().user;
        return checkIsAdmin(user);
      },

      isSuperAdmin: () => {
        const user = get().user;
        return checkIsSuperAdmin(user);
      },
      
      hasRole: (role) => {
        const user = get().user;
        return user?.role === role;
      },
      
      canAccessCountry: (country) => {
        const user = get().user;
        if (!user) return false;
        // Super admin can access all countries
        if (user.role === 'super_admin') return true;
        // Others can only access their own country
        return user.country === country;
      },
    }),
    {
      name: 'AuthStore',
    }
  )
);
