/** @format */
import { redirect } from 'next/navigation';
import { AdminSiteHeader } from '@/components/admin-site-header';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { UsersTableImproved } from '@/components/admin/users-table-improved';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { canManageUsers } from '@/lib/auth/permissions';
import type { AuthUser } from '@/lib/auth/permissions';
import { getSession } from '@/lib/auth/auth-server';

export default async function UsersPageImproved() {
  // Get session for admin info
  const session = await getSession();
  const user = session?.user as AuthUser | null;

  // Check if user can manage users
  if (!user || !canManageUsers(user)) {
    redirect('/dashboard');
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AdminSiteHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="p-8">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground mt-2">
                Manage users, roles, and permissions with server-side pagination
              </p>
            </div>

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  {user.role === 'super_admin' 
                    ? 'View and manage users from all countries with advanced filtering and pagination'
                    : `View and manage users from ${user.country} with advanced filtering and pagination`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsersTableImproved currentUser={user} />
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
