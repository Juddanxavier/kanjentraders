/** @format */

'use client';

import React, { useState } from 'react';
import { Pagination, usePagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

// Example component showing how to use the pagination component
export function UsersTableExample() {
  // Mock data - replace with actual data from your store/API
  const [users] = useState<User[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active', createdAt: '2024-01-01' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'active', createdAt: '2024-01-02' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'user', status: 'inactive', createdAt: '2024-01-03' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com', role: 'user', status: 'active', createdAt: '2024-01-04' },
    { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com', role: 'user', status: 'active', createdAt: '2024-01-05' },
    { id: '6', name: 'Diana Davis', email: 'diana@example.com', role: 'user', status: 'inactive', createdAt: '2024-01-06' },
    { id: '7', name: 'Eve Miller', email: 'eve@example.com', role: 'user', status: 'active', createdAt: '2024-01-07' },
    { id: '8', name: 'Frank Garcia', email: 'frank@example.com', role: 'user', status: 'active', createdAt: '2024-01-08' },
    { id: '9', name: 'Grace Martinez', email: 'grace@example.com', role: 'user', status: 'inactive', createdAt: '2024-01-09' },
    { id: '10', name: 'Henry Anderson', email: 'henry@example.com', role: 'user', status: 'active', createdAt: '2024-01-10' },
    { id: '11', name: 'Ivy Taylor', email: 'ivy@example.com', role: 'user', status: 'active', createdAt: '2024-01-11' },
    { id: '12', name: 'Jack Thomas', email: 'jack@example.com', role: 'user', status: 'inactive', createdAt: '2024-01-12' },
  ]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Helper functions for badge colors
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'user':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  // Filter users based on selected filters
  const filteredUsers = users.filter(user => {
    if (statusFilter !== 'all' && user.status !== statusFilter) return false;
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    return true;
  });

  // Use the pagination hook
  const pagination = usePagination(filteredUsers.length, 5, 1);

  // Get paginated data
  const paginatedUsers = filteredUsers.slice(
    pagination.startIndex,
    pagination.startIndex + pagination.itemsPerPage
  );

  // Reset to first page when filters change
  React.useEffect(() => {
    pagination.setCurrentPage(1);
  }, [statusFilter, roleFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== 'all' || roleFilter !== 'all') && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setStatusFilter('all');
              setRoleFilter('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.createdAt}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Component */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={filteredUsers.length}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={pagination.handlePageChange}
        onItemsPerPageChange={pagination.handleItemsPerPageChange}
        showRowsPerPage={true}
        showFirstLast={true}
        maxPageButtons={5}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </div>
  );
}

// Example of pagination for a different use case (simplified)
export function SimpleTableWithPagination({ data }: { data: any[] }) {
  const pagination = usePagination(data.length, 10, 1);
  
  const paginatedData = data.slice(
    pagination.startIndex,
    pagination.startIndex + pagination.itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* Your table content here */}
      <div className="border rounded-lg p-4">
        {paginatedData.map((item, index) => (
          <div key={index} className="p-2 border-b">
            {JSON.stringify(item)}
          </div>
        ))}
      </div>

      {/* Simple pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={data.length}
        itemsPerPage={pagination.itemsPerPage}
        onPageChange={pagination.handlePageChange}
        onItemsPerPageChange={pagination.handleItemsPerPageChange}
        showFirstLast={false}
        maxPageButtons={3}
        pageSizeOptions={[10, 25, 50]}
      />
    </div>
  );
}
