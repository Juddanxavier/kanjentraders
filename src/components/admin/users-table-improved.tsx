/** @format */
'use client';

import React, { useState, useEffect } from 'react';
import { useUsersPagination } from '@/hooks/use-server-pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  RefreshCw,
  Edit,
  Trash,
  Ban,
  UserCheck,
  UserX,
  Key,
  Mail,
  Phone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  World,
  User,
  Shield,
  Crown
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import { format } from 'date-fns';
import type { AuthUser, UserRole } from '@/lib/auth/permissions';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  country: string;
  createdAt: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneNumberVerified: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  image: string | null;
  lastLogin?: string;
  activeSessions?: number;
}

interface UsersTableImprovedProps {
  currentUser: AuthUser;
}

export function UsersTableImproved({ currentUser }: UsersTableImprovedProps) {
  // UI state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAllMode, setSelectAllMode] = useState<'none' | 'page' | 'all'>('none');
  
  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  
  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchInput, 300);
  
  // Server pagination hook
  const {
    data: users,
    isLoading,
    error,
    pagination,
    actions,
  } = useUsersPagination({
    enabled: true,
    onDataChange: (data, paginationData) => {
      // Reset selection when data changes
      setSelectedRows([]);
      setSelectAllMode('none');
    },
  });

  // Update filters when they change
  useEffect(() => {
    const filters = {
      role: roleFilter !== 'all' ? roleFilter : undefined,
      banned: statusFilter === 'banned' ? true : statusFilter === 'active' ? false : undefined,
      country: countryFilter !== 'all' ? countryFilter : undefined,
    };
    
    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    );
    
    actions.updateFilters(cleanFilters);
  }, [roleFilter, statusFilter, countryFilter, actions]);

  // Update search query when debounced value changes
  useEffect(() => {
    actions.updateSearchQuery(debouncedSearchQuery);
  }, [debouncedSearchQuery, actions]);

  // Handle bulk actions
  const handleBulkBan = async (ban: boolean) => {
    if (selectedRows.length === 0) return;
    
    const action = ban ? 'ban' : 'unban';
    if (!confirm(`Are you sure you want to ${action} ${selectedRows.length} user(s)?`)) {
      return;
    }

    try {
      await Promise.all(
        selectedRows.map(userId => 
          fetch('/api/admin/users/ban', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ban }),
          })
        )
      );
      
      setSelectedRows([]);
      setSelectAllMode('none');
      actions.refetch();
    } catch (error) {
      console.error('Error in bulk ban operation:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedRows.length} user(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(
        selectedRows.map(userId => 
          fetch(`/api/admin/users?id=${userId}`, {
            method: 'DELETE',
          })
        )
      );
      
      setSelectedRows([]);
      setSelectAllMode('none');
      actions.refetch();
    } catch (error) {
      console.error('Error in bulk delete operation:', error);
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
        const allIds = users.map(user => user.id);
        setSelectedRows(allIds);
      } else {
        // Select all on current page
        const pageIds = users.map(user => user.id);
        setSelectedRows(pageIds);
        setSelectAllMode('page');
      }
    } else {
      setSelectedRows([]);
      setSelectAllMode('none');
    }
  };

  // Handle individual row selection
  const handleRowSelect = (userId: string, value: boolean) => {
    if (value) {
      const newSelected = [...selectedRows, userId];
      setSelectedRows(newSelected);
      
      // Check if all visible rows are now selected
      const allVisibleSelected = users.every(user => newSelected.includes(user.id));
      if (allVisibleSelected && selectAllMode === 'none') {
        setSelectAllMode('page');
      }
    } else {
      const newSelected = selectedRows.filter(id => id !== userId);
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
    const allVisibleSelected = users.every(user => selectedRows.includes(user.id));
    const someVisibleSelected = users.some(user => selectedRows.includes(user.id));
    
    if (allVisibleSelected && users.length > 0) {
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

  // Individual user actions
  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      const response = await fetch('/api/admin/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ban }),
      });
      
      if (response.ok) {
        actions.refetch();
      }
    } catch (error) {
      console.error('Error updating user ban status:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        actions.refetch();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleForceLogout = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/sessions?userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        actions.refetch();
      }
    } catch (error) {
      console.error('Error forcing logout:', error);
    }
  };

  // Get role icon
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get unique values for filters
  const uniqueCountries = [...new Set(users.map(user => user.country))].sort();

  return (
    <div className='space-y-4'>
      {/* Search and Filters */}
      <div className='flex flex-col gap-4'>
        {/* Search Bar */}
        <div className='relative'>
          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search users by name, email...'
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
          
          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Roles</SelectItem>
              <SelectItem value='user'>User</SelectItem>
              <SelectItem value='admin'>Admin</SelectItem>
              <SelectItem value='super_admin'>Super Admin</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='banned'>Banned</SelectItem>
            </SelectContent>
          </Select>

          {/* Country Filter */}
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Country' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Countries</SelectItem>
              {uniqueCountries.map(country => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {(roleFilter !== 'all' || statusFilter !== 'all' || countryFilter !== 'all' || searchInput) && (
            <Button 
              variant='ghost' 
              size='sm' 
              onClick={() => {
                setRoleFilter('all');
                setStatusFilter('all');
                setCountryFilter('all');
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
            {pagination.totalItems} user{pagination.totalItems !== 1 ? 's' : ''} found
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
                onClick={() => handleBulkBan(false)}
                className="h-8 text-green-600 hover:text-green-700"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Unban Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkBan(true)}
                className="h-8 text-orange-600 hover:text-orange-700"
              >
                <Ban className="h-4 w-4 mr-2" />
                Ban Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 text-red-600 hover:text-red-700"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
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
                <Button variant="ghost" onClick={() => handleSort('name')} className="h-8 p-0">
                  <span>User</span>
                  {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('role')} className="h-8 p-0">
                  <span>Role</span>
                  {getSortIcon('role')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('country')} className="h-8 p-0">
                  <span>Country</span>
                  {getSortIcon('country')}
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Sessions</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('createdAt')} className="h-8 p-0">
                  <span>Joined</span>
                  {getSortIcon('createdAt')}
                </Button>
              </TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading users...
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-red-600">Error: {error}</div>
                    <Button onClick={actions.refetch} variant="outline" size="sm">
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length > 0 ? (
              users.map((user) => {
                const canManage = currentUser.role === 'super_admin' || 
                  (currentUser.role === 'admin' && user.country === currentUser.country);
                
                return (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(user.id)}
                        onCheckedChange={(value) => handleRowSelect(user.id, value)}
                        aria-label='Select row'
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                          <AvatarFallback>
                            {user.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || "No name"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                        {getRoleIcon(user.role)}
                        {user.role.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <World className="h-4 w-4 text-muted-foreground" />
                        {user.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.emailVerified && (
                          <Badge variant="outline" className="gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </Badge>
                        )}
                        {user.phoneNumberVerified && (
                          <Badge variant="outline" className="gap-1">
                            <Phone className="h-3 w-3" />
                            Phone
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{user.activeSessions || 0}</span>
                        {(user.activeSessions || 0) > 0 && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? format(new Date(user.lastLogin), "MMM d, HH:mm") : "Never"}
                    </TableCell>
                    <TableCell>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {}}>
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            {(user.activeSessions || 0) > 0 && (
                              <DropdownMenuItem onClick={() => handleForceLogout(user.id)}>
                                <UserX className="mr-2 h-4 w-4" />
                                Force Logout
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {user.banned ? (
                              <DropdownMenuItem onClick={() => handleBanUser(user.id, false)}>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Unban User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleBanUser(user.id, true)}
                                className="text-orange-600 focus:text-orange-600"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Ban User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  No users found.
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

      {/* Modals */}
      <AddUserDialog 
        currentUser={currentUser} 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={actions.refetch}
      />
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={actions.refetch}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
