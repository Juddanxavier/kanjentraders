/** @format */
"use client"
import * as React from "react"
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconBan,
  IconTrash,
  IconKey,
  IconMail,
  IconUserCheck,
  IconUserX,
  IconDeviceMobile,
  IconWorld,
  IconEye,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import type { AuthUser, UserRole } from "@/lib/auth/permissions"
import { AddUserDialog } from "@/components/admin/add-user-dialog"
import { EditUserDialog } from "@/components/admin/edit-user-dialog"
import { useUserStore } from "@/lib/store/user-store"
import { toast } from "sonner"
interface User {
  id: string
  email: string
  name: string | null
  role: UserRole
  country: string
  createdAt: string
  emailVerified: boolean
  phoneNumber: string | null
  phoneNumberVerified: boolean
  banned: boolean
  banReason: string | null
  banExpires: string | null
  image: string | null
  lastLogin?: string
  activeSessions?: number
}
interface UsersTableProps {
  currentUser: AuthUser
}
export function UsersTable({ currentUser }: UsersTableProps) {
  const router = useRouter()
  
  // Zustand store with all actions
  const { 
    users, 
    isLoading, 
    error,
    filters,
    updateFilter,
    getFilteredUsers,
    fetchUsers,
    banUser,
    deleteUser,
    forceLogout
  } = useUserStore()
  
  // Local table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  
  // Get filtered users from store - memoize to prevent re-renders
  const filteredUsers = React.useMemo(() => {
    const filtered = getFilteredUsers();
    console.log('🔍 Raw users in store:', users);
    console.log('🔍 Filtered users:', filtered);
    console.log('🔍 Current filters:', filters);
    return filtered;
  }, [getFilteredUsers, users, filters])
  
  // Fetch users only once or when needed
  React.useEffect(() => {
    if (users.length === 0) {
      fetchUsers()
    }
  }, [users.length, fetchUsers])
  // Memoize handlers to prevent re-creation - now using Zustand actions
  const handleBanUser = React.useCallback(async (userId: string, ban: boolean) => {
    await banUser(userId, ban)
  }, [banUser])
  
  const handleDeleteUser = React.useCallback(async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }
    await deleteUser(userId)
  }, [deleteUser])
  
  const handleResetPassword = React.useCallback(async (userId: string) => {
    try {
      // TODO: Implement password reset API with NextAuth.js
      toast.info('Password reset functionality coming soon')
    } catch (error) {
      toast.error('Failed to reset password')
    }
  }, [])
  
  const handleForceLogout = React.useCallback(async (userId: string) => {
    await forceLogout(userId)
  }, [forceLogout])
  // Memoize columns to prevent re-creation
  const columns: ColumnDef<User>[] = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original
        return (
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
        )
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role
        return (
          <Badge variant={role === "super_admin" ? "default" : role === "admin" ? "secondary" : "outline"}>
            {role.replace("_", " ")}
          </Badge>
        )
      },
    },
    {
      accessorKey: "country",
      header: "Country",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconWorld className="h-4 w-4 text-muted-foreground" />
          {row.original.country}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original
        if (user.banned) {
          return (
            <Badge variant="destructive">
              Banned
            </Badge>
          )
        }
        return (
          <Badge variant="outline" className="border-green-500 text-green-600">
            Active
          </Badge>
        )
      },
    },
    {
      accessorKey: "verification",
      header: "Verification",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex gap-1">
            {user.emailVerified && (
              <Badge variant="outline" className="gap-1">
                <IconMail className="h-3 w-3" />
                Email
              </Badge>
            )}
            {user.phoneNumberVerified && (
              <Badge variant="outline" className="gap-1">
                <IconDeviceMobile className="h-3 w-3" />
                Phone
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "sessions",
      header: "Sessions",
      cell: ({ row }) => {
        const sessions = row.original.activeSessions || 0
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{sessions}</span>
            {sessions > 0 && (
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => {
        return format(new Date(row.original.createdAt), "MMM d, yyyy")
      },
    },
    {
      accessorKey: "lastLogin",
      header: "Last Active",
      cell: ({ row }) => {
        if (!row.original.lastLogin) return "Never"
        return format(new Date(row.original.lastLogin), "MMM d, HH:mm")
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original
        const canManage = currentUser.role === 'super_admin' || 
          (currentUser.role === 'admin' && user.country === currentUser.country)
        if (!canManage) return null
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                <IconEye className="mr-2 h-4 w-4" />
                View User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResetPassword(user.id)}>
                <IconKey className="mr-2 h-4 w-4" />
                Reset Password
              </DropdownMenuItem>
              {user.activeSessions > 0 && (
                <DropdownMenuItem onClick={() => handleForceLogout(user.id)}>
                  <IconUserX className="mr-2 h-4 w-4" />
                  Force Logout
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {user.banned ? (
                <DropdownMenuItem onClick={() => handleBanUser(user.id, false)}>
                  <IconUserCheck className="mr-2 h-4 w-4" />
                  Unban User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => handleBanUser(user.id, true)}
                  className="text-orange-600 focus:text-orange-600"
                >
                  <IconBan className="mr-2 h-4 w-4" />
                  Ban User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => handleDeleteUser(user.id)}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [currentUser, handleBanUser, handleDeleteUser, handleForceLogout, setEditingUser])
  const table = useReactTable({
    data: filteredUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter: filters.search,
    },
  })
  return (
    <div className='space-y-4'>
      {/* Toolbar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-1 items-center space-x-2'>
          <div className='relative flex-1 md:max-w-sm'>
            <IconSearch className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search users...'
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              className='pl-8'
            />
          </div>
          <Select
            value={filters.role}
            onValueChange={(value) => updateFilter('role', value)}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='All roles' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All roles</SelectItem>
              <SelectItem value='user'>User</SelectItem>
              <SelectItem value='admin'>Admin</SelectItem>
              <SelectItem value='super_admin'>Super Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(value) => updateFilter('status', value as 'all' | 'active' | 'banned')}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='All status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All status</SelectItem>
              <SelectItem value='active'>Active</SelectItem>
              <SelectItem value='banned'>Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AddUserDialog currentUser={currentUser} onSuccess={fetchUsers} />
      </div>
      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader className='bg-muted sticky top-0 z-10'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'>
                  Loading users...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'>
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <div className='flex-1 text-sm text-muted-foreground'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='flex items-center space-x-6 lg:space-x-8'>
          <div className='flex items-center space-x-2'>
            <p className='text-sm font-medium'>Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}>
              <SelectTrigger className='h-8 w-[70px]'>
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side='top'>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}>
              Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </div>
      </div>
      {/* Edit User Dialog */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onSuccess={fetchUsers}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
