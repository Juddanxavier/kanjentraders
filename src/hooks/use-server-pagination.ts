/** @format */

import { useEffect, useState } from 'react';
import { usePaginationStore } from '@/lib/store/pagination-store';

interface UseServerPaginationProps {
  table: 'leads' | 'users' | 'shipments';
  enabled?: boolean;
  onDataChange?: (data: any[], pagination: any) => void;
}

interface PaginationData {
  data: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function useServerPagination({
  table,
  enabled = true,
  onDataChange,
}: UseServerPaginationProps) {
  const {
    getPaginationState,
    setPaginationState,
    setTotalItems,
    setCurrentPage,
    setItemsPerPage,
    setFilters,
    setSorting,
    setSearchQuery,
    resetPagination,
  } = usePaginationStore();

  const paginationState = getPaginationState(table);
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: paginationState.currentPage.toString(),
        limit: paginationState.itemsPerPage.toString(),
        sortBy: paginationState.sortBy,
        sortOrder: paginationState.sortOrder,
        ...(paginationState.searchQuery && { searchQuery: paginationState.searchQuery }),
        ...paginationState.filters,
      });

      const response = await fetch(`/api/pagination/${table}?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: PaginationData = await response.json();
      
      setData(result.data);
      
      // Update Zustand store with server response
      setPaginationState(table, {
        ...paginationState,
        totalItems: result.pagination.totalItems,
        totalPages: result.pagination.totalPages,
        hasNextPage: result.pagination.hasNextPage,
        hasPreviousPage: result.pagination.hasPreviousPage,
      });

      onDataChange?.(result.data, result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Server pagination error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when pagination state changes
  useEffect(() => {
    fetchData();
  }, [
    paginationState.currentPage,
    paginationState.itemsPerPage,
    paginationState.sortBy,
    paginationState.sortOrder,
    paginationState.searchQuery,
    JSON.stringify(paginationState.filters),
    enabled,
  ]);

  const actions = {
    refetch: fetchData,
    goToPage: (page: number) => {
      setCurrentPage(table, page);
    },
    changeItemsPerPage: (itemsPerPage: number) => {
      setItemsPerPage(table, itemsPerPage);
      setCurrentPage(table, 1); // Reset to first page
    },
    updateFilters: (filters: Record<string, any>) => {
      setFilters(table, filters);
      setCurrentPage(table, 1); // Reset to first page
    },
    updateSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => {
      setSorting(table, sortBy, sortOrder);
      setCurrentPage(table, 1); // Reset to first page
    },
    updateSearchQuery: (searchQuery: string) => {
      setSearchQuery(table, searchQuery);
      setCurrentPage(table, 1); // Reset to first page
    },
    reset: () => {
      resetPagination(table);
    },
  };

  return {
    data,
    isLoading,
    error,
    pagination: paginationState,
    actions,
  };
}

// Convenience hooks for specific tables
export const useLeadsPagination = (props?: Omit<UseServerPaginationProps, 'table'>) =>
  useServerPagination({ table: 'leads', ...props });

export const useUsersPagination = (props?: Omit<UseServerPaginationProps, 'table'>) =>
  useServerPagination({ table: 'users', ...props });

export const useShipmentsPagination = (props?: Omit<UseServerPaginationProps, 'table'>) =>
  useServerPagination({ table: 'shipments', ...props });
