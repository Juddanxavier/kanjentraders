/** @format */
'use client';
import React, { useEffect } from 'react';
import { useLeadStore } from '@/store/lead-store';
import { useAuthStore } from '@/lib/store/auth-store';
import LeadsDataTable from './leads-data-table';
import LeadsStats from './leads-stats';
import type { AuthUser } from '@/lib/auth/permissions';
interface LeadsManagementProps {
  user: AuthUser;
}
export default function LeadsManagement({ user }: LeadsManagementProps) {
  const { fetchLeads, fetchStats } = useLeadStore();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  useEffect(() => {
    // Only fetch if authenticated and not loading
    if (isAuthenticated && !authLoading) {
      // Use cached data if available, otherwise fetch fresh data
      const { leads, stats } = useLeadStore.getState();
      if (leads.length === 0) {
        fetchLeads();
      }
      if (!stats) {
        fetchStats();
      }
    }
  }, [isAuthenticated, authLoading, fetchLeads, fetchStats]);
  return (
    <div className='p-8'>
      {/* Header Section */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>Lead Management</h1>
        <p className='text-muted-foreground mt-2'>
          Manage leads, track progress, and convert prospects
        </p>
      </div>
      {/* Lead Analytics Section */}
      <div className='mb-8'>
        {/* <h2 className='text-xl font-semibold mb-4'>Lead Analytics</h2> */}
        <LeadsStats />
      </div>
      {/* Lead Management Section */}
      <div className='space-y-6'>
        {/* Leads Table Section */}
        <div className='space-y-4'>
          <div className='space-y-1'>
            <h2 className='text-xl font-semibold'>
              {user.role === 'super_admin'
                ? 'All Leads (Global)'
                : `Leads - ${user.country}`}
            </h2>
            <p className='text-muted-foreground text-sm'>
              {user.role === 'super_admin'
                ? 'View and manage leads from all countries'
                : `View and manage lead prospects in ${user.country}`}
            </p>
          </div>
          <LeadsDataTable />
        </div>
      </div>
    </div>
  );
}
