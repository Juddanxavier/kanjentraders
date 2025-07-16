/** @format */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useLeadsPagination } from '@/hooks/use-server-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Edit, 
  Trash, 
  PlaneTakeoff, 
  Plus, 
  Filter, 
  Search,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import EditLeadForm from './edit-lead-form';
import DeleteLeadDialog from './delete-lead-dialog';
import BulkActionsDialog from './bulk-actions-dialog';
import CreateLeadForm from './create-lead-form';
import { LeadWithDetails } from '@/types/lead';
import { LeadStatus } from '@/generated/prisma';
import { Pagination } from '@/components/ui/pagination';
import { useDebounce } from '@/hooks/use-debounce';

// Define the lead schema for the data table
const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phoneNumber: z.string().nullable(),
  origin: z.string(),
  destination: z.string(),
  weight: z.number(),
  status: z.nativeEnum(LeadStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  assignedTo: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).nullable(),
  createdBy: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
  }).nullable(),
  shipment: z.object({
    id: z.string(),
    whiteLabelTrackingId: z.string(),
    status: z.string(),
  }).nullable(),
});

type LeadData = z.infer<typeof leadSchema>;

export default function LeadsDataTableImproved() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  
  // UI state
  const [editingLead, setEditingLead] = useState<LeadWithDetails | null>(null);
  const [deletingLead, setDeletingLead] = useState<LeadWithDetails | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'update' | 'delete' | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'all'>('none');
  
  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [destinationFilter, setDestinationFilter] = useState<string>('all');
  
  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchInput, 300);
  
  // Server pagination hook
  const {
    data: leads,
    isLoading,
    error,
    pagination,
    actions,
  } = useLeadsPagination({
    enabled: isAuthenticated && !authLoading,
    onDataChange: (data, paginationData) => {
      // Reset selection when data changes
      setSelectedRows([]);
      setSelectAllMode('none');
    },
  });

  // Update filters when they change
  useEffect(() => {
    const filters = {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      origin: originFilter !== 'all' ? originFilter : undefined,
      destination: destinationFilter !== 'all' ? destinationFilter : undefined,
    };
    
    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    );
    
    actions.updateFilters(cleanFilters);
  }, [statusFilter, originFilter, destinationFilter, actions]);

  // Update search query when debounced value changes
  useEffect(() => {
    actions.updateSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, actions]);

  // Clear selection when pagination changes
  useEffect(() => {
    if (selectAllMode === 'none') {
      setSelectedRows([]);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, selectAllMode]);

  // Handle bulk actions
  const handleBulkUpdate = () => {
    setBulkActionType('update');
    setShowBulkDialog(true);
  };

  const handleBulkDelete = () => {
    setBulkActionType('delete');
    setShowBulkDialog(true);
  };

  const handleCloseBulkDialog = () => {
    setShowBulkDialog(false);
    setBulkActionType(null);
    setSelectedRows([]);
    setSelectAllMode('none');
  };

  // Handle select all functionality
  const handleSelectAll = (value: boolean) => {
    if (value) {
      if (selectAllMode === 'page') {
        // Select all across all pages
        const allIds = leads.map(lead => lead.id);
        setSelectedRows(allIds);
        setSelectAllMode('all');
      } else {
        // Select all on current page
        const pageIds = leads.map(lead => lead.id);
        setSelectedRows(pageIds);
        setSelectAllMode('page');
      }
    } else {
      setSelectedRows([]);
      setSelectAllMode('none');
    }
  };

  // Handle individual row selection
  const handleRowSelect = (rowId: string, value: boolean) => {
    if (value) {
      const newSelected = [...selectedRows, rowId];
      setSelectedRows(newSelected);
      
      // Check if all visible rows are now selected
      const allVisibleSelected = leads.every(lead => newSelected.includes(lead.id));
      if (allVisibleSelected && selectAllMode === 'none') {
        setSelectAllMode('page');
      }
    } else {
      const newSelected = selectedRows.filter(id => id !== rowId);
      setSelectedRows(newSelected);
      setSelectAllMode('none');
    }
  };

  // Calculate checkbox state for "Select All" header
  const getSelectAllState = () => {
    if (selectAllMode === 'all') {
      return true;
    }
    if (selectAllMode === 'page') {
      return 'indeterminate';
    }
    if (selectedRows.length === 0) {
      return false;
    }
    
    // Check if all visible rows are selected
    const allVisibleSelected = leads.every(lead => selectedRows.includes(lead.id));
    const someVisibleSelected = leads.some(lead => selectedRows.includes(lead.id));
    
    if (allVisibleSelected && leads.length > 0) {
      return true;
    }
    if (someVisibleSelected) {
      return 'indeterminate';
    }
    return false;
  };

  // Handle status update inline
  const handleStatusUpdate = async (leadId: string, newStatus: LeadStatus) => {
    try {
      // Call your update API here
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        // Refetch data to update the table
        actions.refetch();
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    const newSortOrder = pagination.sortBy === field && pagination.sortOrder === 'asc' ? 'desc' : 'asc';
    actions.updateSorting(field, newSortOrder);
  };

  // Get sorting icon
  const getSortIcon = (field: string) => {
    if (pagination.sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return pagination.sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Define columns for the leads table
  const columns: ColumnDef<LeadData>[] = [
    {
      id: 'select',
      header: () => (
        <div className='flex items-center justify-center'>
          <Checkbox
            checked={getSelectAllState()}
            onCheckedChange={handleSelectAll}
            aria-label='Select all'
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className='flex items-center justify-center'>
          <Checkbox
            checked={selectedRows.includes(row.original.id)}
            onCheckedChange={(value) => handleRowSelect(row.original.id, value)}
            aria-label='Select row'
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: () => (
        <Button variant="ghost" onClick={() => handleSort('name')} className="h-8 p-0">
          <span>Name</span>
          {getSortIcon('name')}
        </Button>
      ),
      cell: ({ row }) => <div className='font-medium'>{row.original.name}</div>,
    },
    {
      accessorKey: 'email',
      header: () => (
        <Button variant="ghost" onClick={() => handleSort('email')} className="h-8 p-0">
          <span>Email</span>
          {getSortIcon('email')}
        </Button>
      ),
      cell: ({ row }) => (
        <div className='text-muted-foreground'>{row.original.email}</div>
      ),
    },
    {
      accessorKey: 'phoneNumber',
      header: 'Phone',
      cell: ({ row }) => (
        <div className='text-muted-foreground'>
          {row.original.phoneNumber || 'N/A'}
        </div>
      ),
    },
    {
      id: 'route',
      header: 'Route',
      cell: ({ row }) => (
        <div className='flex items-center space-x-2 min-w-[200px]'>
          <span className='text-sm text-muted-foreground'>
            {row.original.origin}
          </span>
          <div className='flex items-center space-x-1 text-muted-foreground'>
            <div className='w-4 h-px border-t border-dashed border-muted-foreground/40'></div>
            <PlaneTakeoff className='h-4 w-4 text-muted-foreground transform ' />
            <div className='w-4 h-px border-t border-dashed border-muted-foreground/40'></div>
          </div>
          <span className='text-sm text-muted-foreground'>
            {row.original.destination}
          </span>
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'weight',
      header: () => (
        <Button variant="ghost" onClick={() => handleSort('weight')} className="h-8 p-0">
          <span>Weight (kg)</span>
          {getSortIcon('weight')}
        </Button>
      ),
      cell: ({ row }) => (
        <div className='text-muted-foreground'>{row.original.weight}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => (
        <Button variant="ghost" onClick={() => handleSort('status')} className="h-8 p-0">
          <span>Status</span>
          {getSortIcon('status')}
        </Button>
      ),
      cell: ({ row }) => {
        const statusOptions = [
          { value: 'NEW', label: 'New', color: 'text-blue-600' },
          { value: 'CONTACTED', label: 'Contacted', color: 'text-yellow-600' },
          { value: 'SHIPPED', label: 'Shipped', color: 'text-green-600' },
          { value: 'FAILED', label: 'Failed', color: 'text-red-600' },
        ];
        const currentStatus = statusOptions.find(option => option.value === row.original.status);
        return (
          <Select
            value={row.original.status}
            onValueChange={(value: LeadStatus) => handleStatusUpdate(row.original.id, value)}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue>
                <span className={`${currentStatus?.color} font-medium`}>
                  {currentStatus?.label}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className={`${option.color} font-medium`}>
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: () => (
        <Button variant="ghost" onClick={() => handleSort('createdAt')} className="h-8 p-0">
          <span>Created</span>
          {getSortIcon('createdAt')}
        </Button>
      ),
      cell: ({ row }) => (
        <div className='text-muted-foreground text-sm'>
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='data-[state=open]:bg-muted text-muted-foreground flex size-8'
                size='icon'>
                <span className='sr-only'>Open menu</span>⋮
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-32'>
              <DropdownMenuItem onClick={() => setEditingLead(lead as any)}>
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeletingLead(lead as any)}
                className='text-red-600'>
                <Trash className='mr-2 h-4 w-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  // Get unique filter options from the current data
  const uniqueOrigins = [...new Set(leads.map(lead => lead.origin))].sort();
  const uniqueDestinations = [...new Set(leads.map(lead => lead.destination))].sort();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Checking authentication...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Please log in to view leads.</div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Search and Filters */}
      <div className='flex flex-col gap-4'>
        {/* Search Bar */}
        <div className='relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search leads by name, email, or phone...'
            className='pl-8'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className='flex items-center space-x-4 p-4 bg-muted/50 rounded-lg'>
          <div className='flex items-center space-x-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium'>Filters:</span>
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='NEW'>New</SelectItem>
              <SelectItem value='CONTACTED'>Contacted</SelectItem>
              <SelectItem value='SHIPPED'>Shipped</SelectItem>
              <SelectItem value='FAILED'>Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Origin Filter */}
          <Select value={originFilter} onValueChange={setOriginFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Origin' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Origins</SelectItem>
              {uniqueOrigins.map(origin => (
                <SelectItem key={origin} value={origin}>{origin}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Destination Filter */}
          <Select value={destinationFilter} onValueChange={setDestinationFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Destination' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Destinations</SelectItem>
              {uniqueDestinations.map(destination => (
                <SelectItem key={destination} value={destination}>{destination}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {(statusFilter !== 'all' || originFilter !== 'all' || destinationFilter !== 'all' || searchInput) && (
            <Button 
              variant='ghost' 
              size='sm' 
              onClick={() => {
                setStatusFilter('all');
                setOriginFilter('all');
                setDestinationFilter('all');
                setSearchInput('');
              }}
            >
              Clear Filters
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            variant='outline'
            size='sm'
            onClick={actions.refetch}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {pagination.totalItems} lead{pagination.totalItems !== 1 ? 's' : ''} found
          </div>
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedRows.length} selected
                </span>
                {selectAllMode === 'all' && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    All {pagination.totalItems} items
                  </span>
                )}
                {selectAllMode === 'page' && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    Page only
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkUpdate}
                className="h-8"
              >
                Update Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 text-red-600 hover:text-red-700"
              >
                Delete Selected
              </Button>
            </div>
          )}
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id || column.accessorKey}>
                  {typeof column.header === 'string' ? column.header : typeof column.header === 'function' ? column.header({ table: {} as any }) : null}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading leads...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-red-600">Error: {error}</div>
                    <Button onClick={actions.refetch} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : leads.length > 0 ? (
              leads.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableCell key={column.id || column.accessorKey}>
                      {column.cell ? column.cell({ row: { original: row, getIsSelected: () => false, toggleSelected: () => {} } } as any) : (row as any)[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No leads found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={actions.goToPage}
        onItemsPerPageChange={actions.changeItemsPerPage}
        showRowsPerPage={true}
        showFirstLast={true}
        maxPageButtons={5}
        pageSizeOptions={[5, 10, 20, 50, 100]}
      />

      {/* Modals */}
      <CreateLeadForm
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <EditLeadForm
        open={!!editingLead}
        onClose={() => setEditingLead(null)}
        lead={editingLead}
      />
      <DeleteLeadDialog
        open={!!deletingLead}
        onClose={() => setDeletingLead(null)}
        lead={deletingLead}
      />
      <BulkActionsDialog
        open={showBulkDialog}
        onClose={handleCloseBulkDialog}
        selectedLeads={selectedRows}
        actionType={bulkActionType}
      />
    </div>
  );
}
