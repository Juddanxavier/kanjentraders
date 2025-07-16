/** @format */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useShipmentsPagination } from '@/hooks/use-server-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  Search, 
  Eye, 
  RefreshCw,
  Truck,
  MapPin,
  Calendar,
  AlertCircle,
  Trash2,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { CreateShipmentDialog } from './create-shipment-dialog';

interface Shipment {
  id: string;
  leadId: string;
  whiteLabelTrackingId: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  trackingStatus?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
  lead: {
    name: string;
    email: string;
    destination: string;
    origin: string;
  };
}

interface ShipmentStats {
  total: number;
  pending: number;
  inTransit: number;
  delivered: number;
  exceptions: number;
}

export function ShipmentManagementImproved() {
  const router = useRouter();
  
  // UI state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'all'>('none');
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0,
    pending: 0,
    inTransit: 0,
    delivered: 0,
    exceptions: 0,
  });
  
  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  
  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchInput, 300);
  
  // Server pagination hook
  const {
    data: shipments,
    isLoading,
    error,
    pagination,
    actions,
  } = useShipmentsPagination({
    enabled: true,
    onDataChange: (data, paginationData) => {
      // Reset selection when data changes
      setSelectedShipments([]);
      setSelectAllMode('none');
    },
  });

  // Fetch stats separately
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/shipments/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Update filters when they change
  useEffect(() => {
    const filters = {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      carrier: carrierFilter !== 'all' ? carrierFilter : undefined,
      dateRange: dateRangeFilter !== 'all' ? dateRangeFilter : undefined,
    };
    
    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    );
    
    actions.updateFilters(cleanFilters);
  }, [statusFilter, carrierFilter, dateRangeFilter, actions]);

  // Update search query when debounced value changes
  useEffect(() => {
    actions.updateSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, actions]);

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'OUT_FOR_DELIVERY':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
      case 'EXCEPTION':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'RETURNED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  // Individual shipment actions
  const handleRefreshTracking = async (shipmentId: string) => {
    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}/refresh`, {
        method: 'POST',
      });
      if (response.ok) {
        actions.refetch();
        fetchStats();
      } else {
        throw new Error('Failed to refresh tracking');
      }
    } catch (error) {
      console.error('Error refreshing tracking:', error);
    }
  };

  const handleDeleteShipment = async (shipmentId: string, trackingNumber: string) => {
    if (!confirm(`Are you sure you want to delete shipment ${trackingNumber}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        actions.refetch();
        fetchStats();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete shipment');
      }
    } catch (error) {
      console.error('Error deleting shipment:', error);
    }
  };

  // Bulk actions
  const handleBulkRefresh = async () => {
    if (selectedShipments.length === 0) return;
    
    try {
      const promises = selectedShipments.map(id => 
        fetch(`/api/admin/shipments/${id}/refresh`, { method: 'POST' })
      );
      await Promise.all(promises);
      setSelectedShipments([]);
      setSelectAllMode('none');
      actions.refetch();
      fetchStats();
    } catch (error) {
      console.error('Error in bulk refresh:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedShipments.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedShipments.length} shipments? This action cannot be undone.`)) {
      return;
    }

    try {
      const promises = selectedShipments.map(id => 
        fetch(`/api/admin/shipments/${id}`, { method: 'DELETE' })
      );
      await Promise.all(promises);
      setSelectedShipments([]);
      setSelectAllMode('none');
      actions.refetch();
      fetchStats();
    } catch (error) {
      console.error('Error in bulk delete:', error);
    }
  };

  // Handle select all functionality
  const handleSelectAll = (value: boolean) => {
    if (value) {
      if (selectAllMode === 'page') {
        // Select all across all pages
        setSelectAllMode('all');
        // Note: In a real implementation, you might want to track this differently
        // For now, we'll just select all visible items
        const allIds = shipments.map(shipment => shipment.id);
        setSelectedShipments(allIds);
      } else {
        // Select all on current page
        const pageIds = shipments.map(shipment => shipment.id);
        setSelectedShipments(pageIds);
        setSelectAllMode('page');
      }
    } else {
      setSelectedShipments([]);
      setSelectAllMode('none');
    }
  };

  // Handle individual row selection
  const handleRowSelect = (shipmentId: string, value: boolean) => {
    if (value) {
      const newSelected = [...selectedShipments, shipmentId];
      setSelectedShipments(newSelected);
      
      // Check if all visible rows are now selected
      const allVisibleSelected = shipments.every(shipment => newSelected.includes(shipment.id));
      if (allVisibleSelected && selectAllMode === 'none') {
        setSelectAllMode('page');
      }
    } else {
      const newSelected = selectedShipments.filter(id => id !== shipmentId);
      setSelectedShipments(newSelected);
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
    if (selectedShipments.length === 0) {
      return false;
    }
    
    // Check if all visible rows are selected
    const allVisibleSelected = shipments.every(shipment => selectedShipments.includes(shipment.id));
    const someVisibleSelected = shipments.some(shipment => selectedShipments.includes(shipment.id));
    
    if (allVisibleSelected && shipments.length > 0) {
      return true;
    }
    if (someVisibleSelected) {
      return 'indeterminate';
    }
    return false;
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

  // Export functionality
  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/shipments/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            carrier: carrierFilter !== 'all' ? carrierFilter : undefined,
            dateRange: dateRangeFilter !== 'all' ? dateRangeFilter : undefined,
          },
          searchQuery: debouncedSearchQuery,
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shipments-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Get unique values for filters (from server response metadata)
  const uniqueCarriers = ['UPS', 'FedEx', 'DHL', 'USPS']; // This should come from server
  const uniqueStatuses = ['PENDING', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'RETURNED'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.exceptions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col gap-4'>
        {/* Search Bar */}
        <div className='relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search shipments by tracking ID, customer name, email, carrier...'
            className='pl-8'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className='flex items-center space-x-4 p-4 bg-muted/50 rounded-lg'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm font-medium'>Filters:</span>
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Statuses</SelectItem>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Carrier Filter */}
          <Select value={carrierFilter} onValueChange={setCarrierFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Carrier' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Carriers</SelectItem>
              {uniqueCarriers.map(carrier => (
                <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Date Range' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Dates</SelectItem>
              <SelectItem value='today'>Today</SelectItem>
              <SelectItem value='week'>This Week</SelectItem>
              <SelectItem value='month'>This Month</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {(statusFilter !== 'all' || carrierFilter !== 'all' || dateRangeFilter !== 'all' || searchInput) && (
            <Button 
              variant='ghost' 
              size='sm' 
              onClick={() => {
                setStatusFilter('all');
                setCarrierFilter('all');
                setDateRangeFilter('all');
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
            onClick={() => {
              actions.refetch();
              fetchStats();
            }}
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
            {pagination.totalItems} shipment{pagination.totalItems !== 1 ? 's' : ''} found
          </div>
          {selectedShipments.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {selectedShipments.length} selected
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
                onClick={handleBulkRefresh}
                className="h-8 text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Shipment
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={getSelectAllState()}
                  onCheckedChange={handleSelectAll}
                  aria-label='Select all'
                />
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('whiteLabelTrackingId')} className="h-8 p-0">
                  <span>White Label ID</span>
                  {getSortIcon('whiteLabelTrackingId')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('customerName')} className="h-8 p-0">
                  <span>Customer</span>
                  {getSortIcon('customerName')}
                </Button>
              </TableHead>
              <TableHead>Route</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('status')} className="h-8 p-0">
                  <span>Status</span>
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('carrier')} className="h-8 p-0">
                  <span>Carrier</span>
                  {getSortIcon('carrier')}
                </Button>
              </TableHead>
              <TableHead>Tracking Status</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('estimatedDelivery')} className="h-8 p-0">
                  <span>Estimated Delivery</span>
                  {getSortIcon('estimatedDelivery')}
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading shipments...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-red-600">Error: {error}</div>
                    <Button onClick={actions.refetch} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : shipments.length > 0 ? (
              shipments.map((shipment) => (
                <TableRow key={shipment.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedShipments.includes(shipment.id)}
                      onCheckedChange={(value) => handleRowSelect(shipment.id, value)}
                      aria-label='Select row'
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {shipment.whiteLabelTrackingId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{shipment.lead.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {shipment.lead.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2 min-w-[200px]">
                      <span className="text-sm text-muted-foreground">
                        {shipment.lead.origin}
                      </span>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <div className="w-4 h-px border-t border-dashed border-muted-foreground/40"></div>
                        <Truck className="h-4 w-4 text-muted-foreground transform" />
                        <div className="w-4 h-px border-t border-dashed border-muted-foreground/40"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {shipment.lead.destination}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(shipment.status)}>
                      {shipment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{shipment.carrier}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {shipment.trackingStatus ? (
                        <span className="capitalize">
                          {shipment.trackingStatus.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {shipment.estimatedDelivery
                        ? new Date(shipment.estimatedDelivery).toLocaleDateString()
                        : 'N/A'
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(`/admin/shipments/${shipment.id}`);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRefreshTracking(shipment.id)}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Tracking
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteShipment(shipment.id, shipment.trackingNumber)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No shipments found.
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
        pageSizeOptions={[10, 20, 30, 40, 50]}
      />

      {/* Create Shipment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <CreateShipmentDialog
            onSuccess={() => {
              setShowCreateDialog(false);
              actions.refetch();
              fetchStats();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
