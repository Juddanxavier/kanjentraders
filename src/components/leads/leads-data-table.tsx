/** @format */

'use client';

import React, { useState } from 'react';
import { useLeadStore } from '@/store/lead-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash, PlaneTakeoff, Plus, Filter, Dot, Phone, CheckCircle2, X, Circle } from 'lucide-react';
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
import { DataTable } from '@/components/data-table';

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
});

type LeadData = z.infer<typeof leadSchema>;

export default function LeadsDataTable() {
  const { leads, isLoading, error, fetchLeads, updateLead } = useLeadStore();
  const [editingLead, setEditingLead] = useState<LeadWithDetails | null>(null);
  const [deletingLead, setDeletingLead] = useState<LeadWithDetails | null>(
    null
  );
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<
    'update' | 'delete' | null
  >(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [destinationFilter, setDestinationFilter] = useState<string>('all');

  // Fetch leads on component mount
  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Transform leads data to match the schema
  const tableData: LeadData[] = leads
    .filter((lead) => {
      if (statusFilter && statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (originFilter && originFilter !== 'all' && lead.origin !== originFilter) return false;
      if (destinationFilter && destinationFilter !== 'all' && lead.destination !== destinationFilter) return false;
      return true;
    })
    .map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phoneNumber: lead.phoneNumber,
      origin: lead.origin,
      destination: lead.destination,
      weight: lead.weight,
      status: lead.status,
      createdAt: new Date(lead.createdAt),
      updatedAt: new Date(lead.updatedAt),
    }));

  // Get unique values for filter dropdowns
  const uniqueOrigins = [...new Set(leads.map(lead => lead.origin))].sort();
  const uniqueDestinations = [...new Set(leads.map(lead => lead.destination))].sort();

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
  };

  // Handle status update inline
  const handleStatusUpdate = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLead(leadId, { status: newStatus });
      toast.success('Status updated successfully!');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Define columns for the leads table
  const columns: ColumnDef<LeadData>[] = [
    {
      id: 'select',
      header: () => (
        <div className='flex items-center justify-center'>
          <Checkbox
            checked={
              selectedRows.length === tableData.length && tableData.length > 0
                ? true
                : selectedRows.length > 0
                ? 'indeterminate'
                : false
            }
            onCheckedChange={(value) => value ? setSelectedRows(tableData.map(row => row.id)) : setSelectedRows([])}
            aria-label='Select all'
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className='flex items-center justify-center'>
          <Checkbox
            checked={selectedRows.includes(row.original.id)}
            onCheckedChange={(value) => {
              if (value) {
                setSelectedRows([...selectedRows, row.original.id]);
              } else {
                setSelectedRows(selectedRows.filter(id => id !== row.original.id));
              }
            }}
            aria-label='Select row'
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <div className='font-medium'>{row.original.name}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
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
      header: 'Weight (kg)',
      cell: ({ row }) => (
        <div className='text-muted-foreground'>{row.original.weight}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
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
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const lead = leads.find((l) => l.id === row.original.id);
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
              <DropdownMenuItem onClick={() => lead && setEditingLead(lead)}>
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => lead && setDeletingLead(lead)}
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

  return (
    <div className='space-y-4'>
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
        {(statusFilter !== 'all' || originFilter !== 'all' || destinationFilter !== 'all') && (
          <Button 
            variant='ghost' 
            size='sm' 
            onClick={() => {
              setStatusFilter('all');
              setOriginFilter('all');
              setDestinationFilter('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {tableData.length} lead{tableData.length !== 1 ? 's' : ''} found
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Use a simple table for leads */}
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
                    <Button onClick={fetchLeads} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : tableData.length > 0 ? (
              tableData.map((row, index) => (
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
