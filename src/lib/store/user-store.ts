/** @format */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthUser } from '@/lib/auth/permissions';
interface UserState {
  // State
  currentUser: AuthUser | null;
  users: AuthUser[];
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
  setUsers: (users: AuthUser[]) => void;
  setSelectedUserIds: (ids: string[]) => void;
  toggleUserSelection: (userId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateFilter: <K extends keyof UserState['filters']>(
    key: K,
    value: UserState['filters'][K]
  ) => void;
  resetFilters: () => void;
  // Derived getters
  getFilteredUsers: () => AuthUser[];
  getSelectedUsers: () => AuthUser[];
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
