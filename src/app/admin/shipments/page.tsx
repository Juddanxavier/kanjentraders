import { Metadata } from 'next';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AdminSiteHeader } from '@/components/admin-site-header';
import { ShipmentManagement } from '@/components/admin/shipments/shipment-management';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
export const metadata: Metadata = {
  title: 'Shipments - Admin Dashboard',
  description: 'Manage shipments and tracking information',
};
export default async function ShipmentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const user = session?.user;
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
        <AdminSiteHeader user={{ name: user?.name, email: user?.email, image: user?.image }} />
        <div className="flex flex-1 flex-col">
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight">Shipments</h2>
            </div>
            <ShipmentManagement />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
