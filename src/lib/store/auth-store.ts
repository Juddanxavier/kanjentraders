/** @format */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authClient } from '@/lib/auth/auth-client';
import type { AuthUser, UserRole } from '@/lib/auth/permissions';
import type { Session } from 'better-auth/types';

interface AuthState {
  // State
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  
  // Computed values
  isAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  hasRole: (role: 'user' | 'admin' | 'super_admin') => boolean;
  canAccessCountry: (country: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        setUser: (user) => set({ 
          user, 
          isAuthenticated: !!user && !user.banned 
        }),
        
  setSession: (session) => {
    const user = session?.user ? {
      ...session.user,
      role: (session.user.role as UserRole) || 'user',
      country: session.user.country || 'India',
      banned: session.user.banned || false,
      banReason: session.user.banReason || null,
      banExpires: session.user.banExpires || null,
      phoneNumber: session.user.phoneNumber || null,
      phoneNumberVerified: session.user.phoneNumberVerified || false,
    } as AuthUser : null;
    set({ 
      session,
      user,
      isAuthenticated: !!user && !user.banned,
      isLoading: false,
      error: null
    });
  },
        
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        
        signOut: async () => {
          try {
            set({ isLoading: true, error: null });
            await authClient.signOut();
            set({ 
              user: null, 
              session: null, 
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
          } catch (error) {
            console.error('Sign out error:', error);
            set({ 
              error: 'Failed to sign out',
              isLoading: false
            });
            throw error;
          }
        },
        
        checkSession: async () => {
          try {
            set({ isLoading: true, error: null });
            const session = await authClient.getSession();
            const user = session?.user ? {
              ...session.user,
              role: (session.user.role as UserRole) || 'user',
              country: session.user.country || 'India',
              banned: session.user.banned || false,
              banReason: session.user.banReason || null,
              banExpires: session.user.banExpires || null,
              phoneNumber: session.user.phoneNumber || null,
              phoneNumberVerified: session.user.phoneNumberVerified || false,
            } as AuthUser : null;
            
            set({ 
              session,
              user,
              isAuthenticated: !!user && !user.banned,
              isLoading: false,
              error: null
            });
          } catch (error) {
            console.error('Session check error:', error);
            set({ 
              user: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Session check failed'
            });
          }
        },
        
        // Computed values
        isAdmin: () => {
          const { user } = get();
          return user?.role === 'admin' || user?.role === 'super_admin';
        },
        
        isSuperAdmin: () => {
          const { user } = get();
          return user?.role === 'super_admin';
        },
        
        hasRole: (role: 'user' | 'admin' | 'super_admin') => {
          const { user } = get();
          if (!user) return false;
          
          // Super admin has all roles
          if (user.role === 'super_admin') return true;
          
          // Admin has admin and user roles
          if (user.role === 'admin' && (role === 'admin' || role === 'user')) return true;
          
          // User only has user role
          return user.role === role;
        },
        
        canAccessCountry: (country: string) => {
          const { user } = get();
          if (!user) return false;
          
          // Super admin can access all countries
          if (user.role === 'super_admin') return true;
          
          // Regular users can only access their own country
          return user.country === country;
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'AuthStore',
    }
  )
);
