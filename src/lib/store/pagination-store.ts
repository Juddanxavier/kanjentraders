/** @format */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters: Record<string, any>;
  searchQuery?: string;
}

export interface PaginationStore {
  // State for different tables
  leads: PaginationState;
  users: PaginationState;
  shipments: PaginationState;
  notifications: PaginationState;
  
  // Actions
  updatePagination: (table: string, updates: Partial<PaginationState>) => void;
  resetPagination: (table: string) => void;
  setPage: (table: string, page: number) => void;
  setItemsPerPage: (table: string, itemsPerPage: number) => void;
  setFilters: (table: string, filters: Record<string, any>) => void;
  setSort: (table: string, sortBy: string, sortOrder: 'asc' | 'desc') => void;
  setSearch: (table: string, searchQuery: string) => void;
  
  // Computed values
  getStartIndex: (table: string) => number;
  getEndIndex: (table: string) => number;
  hasNextPage: (table: string) => boolean;
  hasPreviousPage: (table: string) => boolean;
}

const defaultPaginationState: PaginationState = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0,
  filters: {},
  searchQuery: '',
};

export const usePaginationStore = create<PaginationStore>()(
  persist(
    (set, get) => ({
      // Initialize states for different tables
      leads: { ...defaultPaginationState, itemsPerPage: 5 },
      users: { ...defaultPaginationState, itemsPerPage: 10 },
      shipments: { ...defaultPaginationState, itemsPerPage: 10 },
      notifications: { ...defaultPaginationState, itemsPerPage: 20 },

      updatePagination: (table: string, updates: Partial<PaginationState>) => {
        set((state) => ({
          [table]: {
            ...state[table as keyof PaginationStore],
            ...updates,
            totalPages: Math.ceil(
              (updates.totalItems ?? (state[table as keyof PaginationStore] as PaginationState)?.totalItems ?? 0) / 
              (updates.itemsPerPage ?? (state[table as keyof PaginationStore] as PaginationState)?.itemsPerPage ?? 10)
            ),
          },
        }));
      },

      resetPagination: (table: string) => {
        set((state) => ({
          [table]: {
            ...defaultPaginationState,
            itemsPerPage: (state[table as keyof PaginationStore] as PaginationState)?.itemsPerPage ?? 10,
          },
        }));
      },

      setPage: (table: string, page: number) => {
        set((state) => {
          const tableState = state[table as keyof PaginationStore] as PaginationState;
          return {
            [table]: {
              ...tableState,
              currentPage: Math.max(1, Math.min(page, tableState.totalPages)),
            },
          };
        });
      },

      setItemsPerPage: (table: string, itemsPerPage: number) => {
        set((state) => {
          const tableState = state[table as keyof PaginationStore] as PaginationState;
          return {
            [table]: {
              ...tableState,
              itemsPerPage,
              currentPage: 1, // Reset to first page when changing items per page
              totalPages: Math.ceil(tableState.totalItems / itemsPerPage),
            },
          };
        });
      },

      setFilters: (table: string, filters: Record<string, any>) => {
        set((state) => {
          const tableState = state[table as keyof PaginationStore] as PaginationState;
          return {
            [table]: {
              ...tableState,
              filters,
              currentPage: 1, // Reset to first page when filters change
            },
          };
        });
      },

      setSort: (table: string, sortBy: string, sortOrder: 'asc' | 'desc') => {
        set((state) => {
          const tableState = state[table as keyof PaginationStore] as PaginationState;
          return {
            [table]: {
              ...tableState,
              sortBy,
              sortOrder,
              currentPage: 1, // Reset to first page when sorting changes
            },
          };
        });
      },

      setSearch: (table: string, searchQuery: string) => {
        set((state) => {
          const tableState = state[table as keyof PaginationStore] as PaginationState;
          return {
            [table]: {
              ...tableState,
              searchQuery,
              currentPage: 1, // Reset to first page when search changes
            },
          };
        });
      },

      // Computed values
      getStartIndex: (table: string) => {
        const tableState = get()[table as keyof PaginationStore] as PaginationState;
        return (tableState.currentPage - 1) * tableState.itemsPerPage;
      },

      getEndIndex: (table: string) => {
        const tableState = get()[table as keyof PaginationStore] as PaginationState;
        return Math.min(
          tableState.currentPage * tableState.itemsPerPage,
          tableState.totalItems
        );
      },

      hasNextPage: (table: string) => {
        const tableState = get()[table as keyof PaginationStore] as PaginationState;
        return tableState.currentPage < tableState.totalPages;
      },

      hasPreviousPage: (table: string) => {
        const tableState = get()[table as keyof PaginationStore] as PaginationState;
        return tableState.currentPage > 1;
      },
    }),
    {
      name: 'pagination-store',
      partialize: (state) => ({
        leads: state.leads,
        users: state.users,
        shipments: state.shipments,
        notifications: state.notifications,
      }),
    }
  )
);

// Custom hook for easier usage
export const usePaginationForTable = (tableName: string) => {
  const store = usePaginationStore();
  const tableState = store[tableName as keyof PaginationStore] as PaginationState;
  
  return {
    // State
    currentPage: tableState.currentPage,
    itemsPerPage: tableState.itemsPerPage,
    totalItems: tableState.totalItems,
    totalPages: tableState.totalPages,
    filters: tableState.filters,
    searchQuery: tableState.searchQuery,
    sortBy: tableState.sortBy,
    sortOrder: tableState.sortOrder,
    
    // Actions
    setPage: (page: number) => store.setPage(tableName, page),
    setItemsPerPage: (itemsPerPage: number) => store.setItemsPerPage(tableName, itemsPerPage),
    setFilters: (filters: Record<string, any>) => store.setFilters(tableName, filters),
    setSort: (sortBy: string, sortOrder: 'asc' | 'desc') => store.setSort(tableName, sortBy, sortOrder),
    setSearch: (searchQuery: string) => store.setSearch(tableName, searchQuery),
    updatePagination: (updates: Partial<PaginationState>) => store.updatePagination(tableName, updates),
    resetPagination: () => store.resetPagination(tableName),
    
    // Computed
    startIndex: store.getStartIndex(tableName),
    endIndex: store.getEndIndex(tableName),
    hasNextPage: store.hasNextPage(tableName),
    hasPreviousPage: store.hasPreviousPage(tableName),
  };
};
