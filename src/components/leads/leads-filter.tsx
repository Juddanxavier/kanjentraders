/** @format */

'use client';

import React, { useState } from 'react';
import { useLeadStore } from '@/store/lead-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Plus } from 'lucide-react';
import { LeadStatus } from '@/generated/prisma';
import { LeadFilters } from '@/types/lead';
import CreateLeadForm from './create-lead-form';

export default function LeadsFilter() {
  const { filters, setFilters, clearFilters, fetchLeads } = useLeadStore();
  const [localFilters, setLocalFilters] = useState<LeadFilters>(filters);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: LeadStatus.NEW, label: 'New' },
    { value: LeadStatus.CONTACTED, label: 'Contacted' },
    { value: LeadStatus.SHIPPED, label: 'Shipped' },
    { value: LeadStatus.FAILED, label: 'Failed' },
  ];

  const handleFilterChange = (key: keyof LeadFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    fetchLeads();
  };

  const resetFilters = () => {
    setLocalFilters({});
    clearFilters();
    fetchLeads();
  };

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter(v => v !== undefined && v !== null && v !== '').length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Lead Management</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-3">
        <div className="space-y-3">
          {/* Search and Status Filter */}
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search leads..."
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-7 h-8 text-sm"
              />
            </div>
            <Select
              value={localFilters.status || 'ALL'}
              onValueChange={(value) => handleFilterChange('status', value === 'ALL' ? undefined : value)}
            >
              <SelectTrigger className="w-full md:w-32 h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <Input
              placeholder="Destination"
              value={localFilters.destination || ''}
              onChange={(e) => handleFilterChange('destination', e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              placeholder="Origin"
              value={localFilters.origin || ''}
              onChange={(e) => handleFilterChange('origin', e.target.value)}
              className="h-8 text-sm"
            />
            <Input
              type="number"
              placeholder="Min weight"
              value={localFilters.weightMin || ''}
              onChange={(e) => handleFilterChange('weightMin', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="h-8 text-sm"
            />
            <Input
              type="number"
              placeholder="Max weight"
              value={localFilters.weightMax || ''}
              onChange={(e) => handleFilterChange('weightMax', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="h-8 text-sm"
            />
            <Input
              type="date"
              placeholder="From date"
              value={localFilters.dateFrom ? new Date(localFilters.dateFrom).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
              className="h-8 text-sm"
            />
            <Input
              type="date"
              placeholder="To date"
              value={localFilters.dateTo ? new Date(localFilters.dateTo).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
              className="h-8 text-sm"
            />
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button onClick={applyFilters} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFiltersCount()}
                  </Badge>
                )}
              </Button>
              {getActiveFiltersCount() > 0 && (
                <Button onClick={resetFilters} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Create Lead Modal */}
      <CreateLeadForm 
        open={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </Card>
  );
}
