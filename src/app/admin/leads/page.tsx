/** @format */
import { AppSidebar } from "@/components/app-sidebar"
import { AdminSiteHeader } from "@/components/admin-site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { getSession } from '@/lib/auth/auth-server';
import { redirect } from 'next/navigation';
import { canManageUsers } from '@/lib/auth/permissions';
import type { AuthUser } from '@/lib/auth/permissions';
import LeadsManagement from '@/components/leads/leads-management';
/**
 * SECURE ADMIN LEADS PAGE
 * 
 * This page is protected by:
 * 1. Middleware - Cookie-based fast redirect
 * 2. Layout - Full session and admin role validation
 * 3. This page - Additional admin-specific checks
 * 
 * Uses shadcn dashboard template for admin panel
 */
export default async function AdminLeadsPage() {
  // Get session for admin info (already validated in layout)
const session = await getSession();
  // This should never happen due to middleware validation, but safety check
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
    return <div>Access denied</div>;
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
        <AdminSiteHeader user={session.user as AuthUser} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <LeadsManagement user={session.user} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
