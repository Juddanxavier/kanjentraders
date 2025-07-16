/** @format */
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LeadsDataTableImproved from '@/components/leads/leads-data-table-improved';
import { useLeadsPagination, useUsersPagination, useShipmentsPagination } from '@/hooks/use-server-pagination';

export default function PaginationDemo() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Redis-Backed Pagination Demo</h1>
          <Badge variant="outline">Server-Side Pagination</Badge>
        </div>
        
        <p className="text-muted-foreground">
          This demo showcases the new Redis-backed pagination system with Zustand state management.
          The system provides efficient server-side pagination with caching, search, filtering, and sorting capabilities.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✓ Redis Caching</h4>
                <p className="text-sm text-muted-foreground">
                  Server-side responses are cached in Redis for improved performance
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✓ Zustand State Management</h4>
                <p className="text-sm text-muted-foreground">
                  Global pagination state management with persistence across page navigations
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✓ Real-time Search</h4>
                <p className="text-sm text-muted-foreground">
                  Debounced search functionality with server-side filtering
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✓ Advanced Filtering</h4>
                <p className="text-sm text-muted-foreground">
                  Multiple filter options with automatic cache invalidation
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✓ Column Sorting</h4>
                <p className="text-sm text-muted-foreground">
                  Server-side sorting with visual indicators
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-600">✓ Bulk Operations</h4>
                <p className="text-sm text-muted-foreground">
                  Select all across pages with bulk actions support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Implementation */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Architecture Components:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <code>PaginationService</code> - Server-side pagination with Redis caching</li>
                  <li>• <code>usePaginationStore</code> - Zustand store for pagination state</li>
                  <li>• <code>useServerPagination</code> - React hook for server-side pagination</li>
                  <li>• <code>CacheInvalidator</code> - Cache invalidation utilities</li>
                  <li>• API routes - RESTful endpoints for paginated data</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Cache Strategy:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Data cached by table, page, filters, and search query</li>
                  <li>• Separate count cache for pagination metadata</li>
                  <li>• Automatic cache invalidation on data mutations</li>
                  <li>• Configurable TTL per table type</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Basic Usage:</h4>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                  <code>{`// Using the server pagination hook
const { data, isLoading, error, pagination, actions } = useLeadsPagination({
  enabled: true,
  onDataChange: (data, paginationData) => {
    // Handle data changes
  },
});

// Update filters
actions.updateFilters({ status: 'NEW', origin: 'New York' });

// Update search
actions.updateSearchQuery('john@example.com');

// Change page
actions.goToPage(2);`}</code>
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">API Integration:</h4>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
                  <code>{`// API endpoints automatically handle:
GET /api/pagination/leads?page=1&limit=10&status=NEW&searchQuery=john

// Response format:
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}`}</code>
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Live Demo - Leads Table</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsDataTableImproved />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Additional demo component showing multiple pagination instances
export function MultiTablePaginationDemo() {
  const leadsData = useLeadsPagination();
  const usersData = useUsersPagination();
  const shipmentsData = useShipmentsPagination();

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Multiple Table Pagination Demo</h2>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads Pagination State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Items: {leadsData.pagination.totalItems}</div>
              <div>Current Page: {leadsData.pagination.currentPage}</div>
              <div>Total Pages: {leadsData.pagination.totalPages}</div>
              <div>Loading: {leadsData.isLoading ? 'Yes' : 'No'}</div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => leadsData.actions.goToPage(1)}>
                  First Page
                </Button>
                <Button size="sm" onClick={() => leadsData.actions.changeItemsPerPage(25)}>
                  25 Per Page
                </Button>
                <Button size="sm" onClick={() => leadsData.actions.updateFilters({ status: 'NEW' })}>
                  Filter New
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users Pagination State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Items: {usersData.pagination.totalItems}</div>
              <div>Current Page: {usersData.pagination.currentPage}</div>
              <div>Total Pages: {usersData.pagination.totalPages}</div>
              <div>Loading: {usersData.isLoading ? 'Yes' : 'No'}</div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => usersData.actions.goToPage(1)}>
                  First Page
                </Button>
                <Button size="sm" onClick={() => usersData.actions.changeItemsPerPage(10)}>
                  10 Per Page
                </Button>
                <Button size="sm" onClick={() => usersData.actions.updateFilters({ role: 'ADMIN' })}>
                  Filter Admins
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipments Pagination State</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Items: {shipmentsData.pagination.totalItems}</div>
              <div>Current Page: {shipmentsData.pagination.currentPage}</div>
              <div>Total Pages: {shipmentsData.pagination.totalPages}</div>
              <div>Loading: {shipmentsData.isLoading ? 'Yes' : 'No'}</div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => shipmentsData.actions.goToPage(1)}>
                  First Page
                </Button>
                <Button size="sm" onClick={() => shipmentsData.actions.changeItemsPerPage(20)}>
                  20 Per Page
                </Button>
                <Button size="sm" onClick={() => shipmentsData.actions.updateFilters({ status: 'DELIVERED' })}>
                  Filter Delivered
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
