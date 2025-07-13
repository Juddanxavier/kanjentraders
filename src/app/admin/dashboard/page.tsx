/** @format */

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { AdminSiteHeader } from "@/components/admin-site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';

import data from "./data.json"

/**
 * SECURE ADMIN DASHBOARD PAGE
 * 
 * This page is protected by:
 * 1. Middleware - Cookie-based fast redirect
 * 2. Layout - Full session and admin role validation
 * 3. This page - Additional admin-specific checks
 * 
 * Uses shadcn dashboard template for admin panel
 */

export default async function AdminPage() {
  // Get session for admin info (already validated in layout)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // This should never happen due to layout validation, but safety check
  if (!session?.user || session.user.role !== 'admin') {
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
        <AdminSiteHeader user={session.user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
