'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  Filter,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { CreateShipmentDialog } from './create-shipment-dialog';
import { useToast } from '@/hooks/use-toast';

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

type SortField = 'whiteLabelTrackingId' | 'customerName' | 'carrier' | 'status' | 'createdAt' | 'estimatedDelivery';
type SortOrder = 'asc' | 'desc';

export function ShipmentManagement() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Filtering states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Bulk selection states
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  // Fetch shipments
  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/admin/shipments');
      if (response.ok) {
        const data = await response.json();
        setShipments(data.shipments);
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch shipments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshTracking = async (shipmentId: string) => {
    try {
      const response = await fetch(`/api/admin/shipments/${shipmentId}/refresh`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Tracking information refreshed',
        });
        fetchShipments();
      } else {
        throw new Error('Failed to refresh tracking');
      }
    } catch (error) {
      console.error('Error refreshing tracking:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh tracking information',
        variant: 'destructive',
      });
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
        toast({
          title: 'Success',
          description: 'Shipment deleted successfully',
        });
        fetchShipments();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete shipment');
      }
    } catch (error) {
      console.error('Error deleting shipment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete shipment',
        variant: 'destructive',
      });
    }
  };

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

  // Helper functions for bulk operations
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedShipments(paginatedShipments.map(s => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const handleSelectShipment = (shipmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedShipments(prev => [...prev, shipmentId]);
    } else {
      setSelectedShipments(prev => prev.filter(id => id !== shipmentId));
      setSelectAll(false);
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
      
      toast({
        title: 'Success',
        description: `${selectedShipments.length} shipments deleted successfully`,
      });
      
      setSelectedShipments([]);
      setSelectAll(false);
      fetchShipments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete some shipments',
        variant: 'destructive',
      });
    }
  };

  const handleBulkRefresh = async () => {
    if (selectedShipments.length === 0) return;

    try {
      const promises = selectedShipments.map(id => 
        fetch(`/api/admin/shipments/${id}/refresh`, { method: 'POST' })
      );
      
      await Promise.all(promises);
      
      toast({
        title: 'Success',
        description: `${selectedShipments.length} shipments refreshed successfully`,
      });
      
      setSelectedShipments([]);
      setSelectAll(false);
      fetchShipments();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh some shipments',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    const exportData = filteredAndSortedShipments.map(shipment => ({
      'White Label ID': shipment.whiteLabelTrackingId,
      'Tracking Number': shipment.trackingNumber,
      'Customer Name': shipment.lead.name,
      'Customer Email': shipment.lead.email,
      'Origin': shipment.lead.origin,
      'Destination': shipment.lead.destination,
      'Carrier': shipment.carrier,
      'Status': shipment.status,
      'Tracking Status': shipment.trackingStatus || 'N/A',
      'Estimated Delivery': shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : 'N/A',
      'Created At': new Date(shipment.createdAt).toLocaleDateString(),
    }));

    const csvContent = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shipments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  // Get unique carriers for filter
  const uniqueCarriers = [...new Set(shipments.map(s => s.carrier))].sort();
  const uniqueStatuses = [...new Set(shipments.map(s => s.status))].sort();

  // Filter by date range
  const filterByDateRange = (shipment: Shipment) => {
    if (dateRangeFilter === 'all') return true;
    
    const now = new Date();
    const createdAt = new Date(shipment.createdAt);
    
    switch (dateRangeFilter) {
      case 'today':
        return createdAt.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return createdAt >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return createdAt >= monthAgo;
      default:
        return true;
    }
  };

  // Apply all filters and sorting
  const filteredAndSortedShipments = useMemo(() => {
    let filtered = shipments.filter(shipment => {
      // Search filter
      const searchMatch = shipment.whiteLabelTrackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.carrier.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const statusMatch = statusFilter === 'all' || shipment.status === statusFilter;
      
      // Carrier filter
      const carrierMatch = carrierFilter === 'all' || shipment.carrier === carrierFilter;
      
      // Date range filter
      const dateMatch = filterByDateRange(shipment);
      
      return searchMatch && statusMatch && carrierMatch && dateMatch;
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'whiteLabelTrackingId':
          aValue = a.whiteLabelTrackingId;
          bValue = b.whiteLabelTrackingId;
          break;
        case 'customerName':
          aValue = a.lead.name;
          bValue = b.lead.name;
          break;
        case 'carrier':
          aValue = a.carrier;
          bValue = b.carrier;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'estimatedDelivery':
          aValue = a.estimatedDelivery ? new Date(a.estimatedDelivery) : new Date(0);
          bValue = b.estimatedDelivery ? new Date(b.estimatedDelivery) : new Date(0);
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [shipments, searchTerm, statusFilter, carrierFilter, dateRangeFilter, sortField, sortOrder]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedShipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShipments = filteredAndSortedShipments.slice(startIndex, endIndex);
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, carrierFilter, dateRangeFilter]);
  
  const filteredShipments = filteredAndSortedShipments;

  const stats = {
    total: shipments.length,
    pending: shipments.filter(s => s.status === 'PENDING').length,
    inTransit: shipments.filter(s => s.status === 'IN_TRANSIT').length,
    delivered: shipments.filter(s => s.status === 'DELIVERED').length,
    exceptions: shipments.filter(s => s.status === 'EXCEPTION').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

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

      {/* Combined Controls Bar */}
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map(uStatus => (
                  <SelectItem key={uStatus} value={uStatus}>{uStatus}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                {uniqueCarriers.map(uCarrier => (
                  <SelectItem key={uCarrier} value={uCarrier}>{uCarrier}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {filteredShipments.length} shipment{filteredShipments.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Bulk Actions - Show only when items are selected */}
          {selectedShipments.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkRefresh}
                className="text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh ({selectedShipments.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedShipments.length})
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchShipments()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <Button 
            onClick={() => setShowCreateDialog(true)} 
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead width="1%">  {/* Checkbox column */}
                <Checkbox checked={selectAll} onCheckedChange={handleSelectAll} />
              </TableHead>
              <TableHead>White Label ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Carrier</TableHead>
              <TableHead>Tracking Status</TableHead>
              <TableHead>Estimated Delivery</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading shipments...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedShipments.length > 0 ? (
              paginatedShipments.map((shipment) => (
                <TableRow key={shipment.id} className="hover:bg-muted/50">
                  <TableCell>  {/* Checkbox for bulk action */}
                    <Checkbox
                      checked={selectedShipments.includes(shipment.id)}
                      onCheckedChange={(checked) => handleSelectShipment(shipment.id, checked)}
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
                        <Button
                          variant="ghost"
                          className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                          size="icon"
                        >
                          <span className="sr-only">Open menu</span>⋮
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
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
                          Refresh
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteShipment(shipment.id, shipment.trackingNumber)}
                          className="text-red-600"
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

      {/* Pagination Controls */}
      <div className="flex justify-between items-center py-2">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Page {currentPage}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
        <div>
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, shipments.length)} of {shipments.length} shipments
        </div>
      </div>

      {/* Create Shipment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <CreateShipmentDialog
            onSuccess={() => {
              setShowCreateDialog(false);
              fetchShipments();
            }}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
}
