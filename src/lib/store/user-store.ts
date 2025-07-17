/** @format */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthUser } from '@/lib/auth/permissions';
import { toast } from 'sonner';

// Extended user type for admin operations
interface ExtendedUser extends AuthUser {
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean;
  banned?: boolean;
  banReason?: string | null;
  banExpires?: string | null;
  image?: string | null;
  lastLogin?: string;
  activeSessions?: number;
}
interface UserState {
  // State
  currentUser: AuthUser | null;
  users: ExtendedUser[];
  selectedUserIds: string[];
  isLoading: boolean;
  error: string | null;
  // Filters
  filters: {
    search: string;
    role: string;
    status: 'all' | 'active' | 'banned';
    country: string;
  };
  // Actions
  setCurrentUser: (user: AuthUser | null) => void;
  setUsers: (users: ExtendedUser[]) => void;
  setSelectedUserIds: (ids: string[]) => void;
  toggleUserSelection: (userId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateFilter: <K extends keyof UserState['filters']>(
    key: K,
    value: UserState['filters'][K]
  ) => void;
  resetFilters: () => void;
  // API actions
  fetchUsers: () => Promise<void>;
  banUser: (userId: string, ban: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  forceLogout: (userId: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<ExtendedUser>) => void;
  // Derived getters
  getFilteredUsers: () => ExtendedUser[];
  getSelectedUsers: () => ExtendedUser[];
}
const initialFilters = {
  search: '',
  role: 'all',
  status: 'all' as const,
  country: 'all',
};
export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentUser: null,
        users: [],
        selectedUserIds: [],
        isLoading: false,
        error: null,
        filters: initialFilters,
        // Actions
        setCurrentUser: (user) => set({ currentUser: user }),
        setUsers: (users) => set({ users, selectedUserIds: [] }),
        setSelectedUserIds: (ids) => set({ selectedUserIds: ids }),
        toggleUserSelection: (userId) => set((state) => ({
          selectedUserIds: state.selectedUserIds.includes(userId)
            ? state.selectedUserIds.filter(id => id !== userId)
            : [...state.selectedUserIds, userId]
        })),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        updateFilter: (key, value) => set((state) => ({
          filters: { ...state.filters, [key]: value }
        })),
        resetFilters: () => set({ filters: initialFilters }),
        
        // API actions with Redis caching
        fetchUsers: async () => {
          const state = get();
          if (state.isLoading) return; // Prevent multiple simultaneous requests
          
          try {
            set({ isLoading: true, error: null });
            const response = await fetch('/api/admin/users');
            if (!response.ok) {
              throw new Error('Failed to fetch users');
            }
            const data = await response.json();
            console.log('📊 Fetched users data:', data);
            console.log('📊 Users count:', data.length);
            set({ users: data, selectedUserIds: [] });
            toast.success(`Users loaded successfully (${data.length} users)`);
          } catch (error) {
            console.error('Error fetching users:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
            set({ error: errorMessage });
            toast.error('Failed to load users');
          } finally {
            set({ isLoading: false });
          }
        },
        
        banUser: async (userId: string, ban: boolean) => {
          try {
            const response = await fetch('/api/admin/users/ban', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, ban }),
            });
            if (!response.ok) {
              throw new Error('Failed to update user status');
            }
            
            // Optimistically update local state
            const state = get();
            const updatedUsers = state.users.map(user => 
              user.id === userId ? { ...user, banned: ban } : user
            );
            set({ users: updatedUsers });
            
            toast.success(ban ? 'User banned successfully' : 'User unbanned successfully');
          } catch (error) {
            console.error('Error updating user status:', error);
            toast.error('Failed to update user status');
          }
        },
        
        deleteUser: async (userId: string) => {
          try {
            const response = await fetch(`/api/admin/users?id=${userId}`, {
              method: 'DELETE',
            });
            if (!response.ok) {
              throw new Error('Failed to delete user');
            }
            
            // Optimistically update local state
            const state = get();
            const updatedUsers = state.users.filter(user => user.id !== userId);
            set({ users: updatedUsers });
            
            toast.success('User deleted successfully');
          } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Failed to delete user');
          }
        },
        
        forceLogout: async (userId: string) => {
          try {
            const response = await fetch(`/api/admin/users/sessions?userId=${userId}`, {
              method: 'DELETE',
            });
            if (!response.ok) {
              throw new Error('Failed to terminate sessions');
            }
            
            // Optimistically update local state
            const state = get();
            const updatedUsers = state.users.map(user => 
              user.id === userId ? { ...user, activeSessions: 0 } : user
            );
            set({ users: updatedUsers });
            
            toast.success('User sessions terminated successfully');
          } catch (error) {
            console.error('Error terminating sessions:', error);
            toast.error('Failed to terminate user sessions');
          }
        },
        
        updateUser: (userId: string, updates: Partial<ExtendedUser>) => {
          const state = get();
          const updatedUsers = state.users.map(user => 
            user.id === userId ? { ...user, ...updates } : user
          );
          set({ users: updatedUsers });
        },
        
        // Derived getters
        getFilteredUsers: () => {
          const state = get();
          const { users, filters } = state;
          return users.filter(user => {
            // Search filter
            if (filters.search) {
              const searchLower = filters.search.toLowerCase();
              const matchesSearch = 
                user.name?.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower);
              if (!matchesSearch) return false;
            }
            // Role filter
            if (filters.role !== 'all' && user.role !== filters.role) {
              return false;
            }
            // Status filter
            if (filters.status !== 'all') {
              const isActive = !user.banned;
              if (filters.status === 'active' && !isActive) return false;
              if (filters.status === 'banned' && isActive) return false;
            }
            // Country filter
            if (filters.country !== 'all' && user.country !== filters.country) {
              return false;
            }
            return true;
          });
        },
        getSelectedUsers: () => {
          const state = get();
          return state.users.filter(user => 
            state.selectedUserIds.includes(user.id)
          );
        },
      }),
      {
        name: 'user-store',
        // Only persist filters, not the actual user data
        partialize: (state) => ({ filters: state.filters }),
      }
    ),
    {
      name: 'UserStore',
    }
  )
);
