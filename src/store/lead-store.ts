/** @format */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { LeadWithDetails, CreateLeadData, UpdateLeadData, LeadFilters, LeadStats, LeadSort } from '@/types/lead';
import { logger } from '@/lib/logger';

// Redis operations are handled server-side only
// No Redis imports in client stores
interface LeadStore {
  // State
  leads: LeadWithDetails[];
  stats: LeadStats | null;
  filters: LeadFilters;
  sort: LeadSort;
  isLoading: boolean;
  error: string | null;
  selectedLead: LeadWithDetails | null;
  // Actions
  setLeads: (leads: LeadWithDetails[]) => void;
  setStats: (stats: LeadStats) => void;
  setFilters: (filters: LeadFilters) => void;
  setSort: (sort: LeadSort) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedLead: (lead: LeadWithDetails | null) => void;
  // CRUD operations
  createLead: (data: CreateLeadData) => Promise<void>;
  updateLead: (id: string, data: UpdateLeadData) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  fetchLeads: () => Promise<void>;
  fetchStats: () => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  // Utility functions
  clearFilters: () => void;
  reset: () => void;
}
const initialFilters: LeadFilters = {};
const initialSort: LeadSort = { field: 'createdAt', order: 'desc' };
export const useLeadStore = create<LeadStore>()
  (
    persist(
      devtools(
        (set, get) => ({
          // Initial state
          leads: [],
          stats: null,
          filters: initialFilters,
          sort: initialSort,
          isLoading: false,
          error: null,
          selectedLead: null,
      // Setters
      setLeads: (leads) => set({ leads }),
      setStats: (stats) => set({ stats }),
      setFilters: (filters) => set({ filters }),
      setSort: (sort) => set({ sort }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSelectedLead: (selectedLead) => set({ selectedLead }),
      // CRUD operations
      createLead: async (data: CreateLeadData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            throw new Error('Failed to create lead');
          }
          const newLead = await response.json();
          
          // Cache invalidation is handled server-side
          
          set((state) => ({ 
            leads: [newLead, ...state.leads],
            isLoading: false 
          }));
          
          // Refresh stats
          get().fetchStats();
          logger.info('Lead created and cache invalidated');
        } catch (error) {
          logger.error('Failed to create lead:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create lead',
            isLoading: false 
          });
        }
      },
      updateLead: async (id: string, data: UpdateLeadData) => {
        // For simple status updates, don't show loading state to prevent table flickering
        const isStatusOnlyUpdate = Object.keys(data).length === 1 && 'status' in data;
        
        if (!isStatusOnlyUpdate) {
          set({ isLoading: true, error: null });
        } else {
          set({ error: null });
        }
        
        try {
          const response = await fetch(`/api/leads/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
          });
          if (!response.ok) {
            throw new Error('Failed to update lead');
          }
          const updatedLead = await response.json();
          
          // Cache invalidation is handled server-side
          
          set((state) => ({
            leads: state.leads.map((lead) => 
              lead.id === id ? updatedLead : lead
            ),
            selectedLead: state.selectedLead?.id === id ? updatedLead : state.selectedLead,
            isLoading: false
          }));
          
          // Only refresh stats if status changed (affects statistics)
          if ('status' in data) {
            get().fetchStats();
          }
          
          logger.info('Lead updated and cache invalidated');
        } catch (error) {
          logger.error('Failed to update lead:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update lead',
            isLoading: false 
          });
        }
      },
      deleteLead: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`/api/leads/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!response.ok) {
            throw new Error('Failed to delete lead');
          }
          
          // Cache invalidation is handled server-side
          
          set((state) => ({
            leads: state.leads.filter((lead) => lead.id !== id),
            selectedLead: state.selectedLead?.id === id ? null : state.selectedLead,
            isLoading: false
          }));
          
          // Refresh stats
          get().fetchStats();
          logger.info('Lead deleted and cache invalidated');
        } catch (error) {
          logger.error('Failed to delete lead:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete lead',
            isLoading: false 
          });
        }
      },
      fetchLeads: async () => {
        set({ isLoading: true, error: null });
        try {
          const { filters, sort } = get();
          
          // Redis caching is handled server-side
          const params = new URLSearchParams();
          // Add filters to params
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              params.append(key, value.toString());
            }
          });
          // Add sort to params
          params.append('sortField', sort.field);
          params.append('sortOrder', sort.order);
          
          const response = await fetch(`/api/leads?${params.toString()}`, {
            credentials: 'include',
          });
          if (!response.ok) {
            throw new Error('Failed to fetch leads');
          }
          
          const leads = await response.json();
          
          set({ leads, isLoading: false });
          logger.info('Fetched leads successfully');
        } catch (error) {
          logger.error('Failed to fetch leads:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch leads',
            isLoading: false 
          });
        }
      },
      fetchStats: async () => {
        try {
          // Redis caching is handled server-side
          const response = await fetch('/api/leads/stats', {
            credentials: 'include',
          });
          if (!response.ok) {
            throw new Error('Failed to fetch stats');
          }
          
          const stats = await response.json();
          
          set({ stats });
          logger.info('Fetched lead stats successfully');
        } catch (error) {
          logger.error('Failed to fetch lead stats:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch stats'
          });
        }
      },
      bulkUpdateStatus: async (ids: string[], status: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/leads/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'update', ids, status }),
          });
          if (!response.ok) {
            throw new Error('Failed to bulk update leads');
          }
          // Refresh leads and stats
          await get().fetchLeads();
          await get().fetchStats();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to bulk update leads',
            isLoading: false 
          });
        }
      },
      bulkDelete: async (ids: string[]) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch('/api/leads/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'delete', ids }),
          });
          if (!response.ok) {
            throw new Error('Failed to bulk delete leads');
          }
          // Refresh leads and stats
          await get().fetchLeads();
          await get().fetchStats();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to bulk delete leads',
            isLoading: false 
          });
        }
      },
      // Utility functions
      clearFilters: () => set({ filters: initialFilters }),
      reset: () => set({
        leads: [],
        stats: null,
        filters: initialFilters,
        sort: initialSort,
        isLoading: false,
        error: null,
        selectedLead: null,
      }),
        }),
        {
          name: 'lead-store',
        }
      ),
      {
        name: 'lead-cache',
        getStorage: () => localStorage,
        // Only persist data that's useful across sessions
        partialize: (state) => ({
          leads: state.leads,
          stats: state.stats,
          filters: state.filters,
          sort: state.sort,
          // Don't persist loading states or selected items
        }),
      }
    )
  );
