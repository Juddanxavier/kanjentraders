/** @format */
'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { AdminSiteHeader } from "@/components/admin-site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useSession } from "@/lib/auth/auth-client"
import data from "./data.json"

/**
 * SECURE ADMIN DASHBOARD PAGE
 * 
 * This page is protected by the admin layout in layout.tsx
 * Uses shadcn dashboard template for admin panel
 */

export default function AdminPage() {
  const { data: session } = useSession();
  
  if (!session) {
    return null;
  }
  
  // Filter data based on user's country (unless they're a super_admin)
  let filteredData = data;
  if (session.user.role === 'admin' && session.user.country) {
    // Regular admins only see data from their country
    filteredData = data.filter((item: any) => item.country === session.user.country);
  }
  // Super admins see all data
  
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
        <AdminSiteHeader user={{ name: session.user.name, email: session.user.email, image: session.user.image }} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={filteredData} userRole={session.user.role} userCountry={session.user.country} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
