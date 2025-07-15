import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { AdminSiteHeader } from '@/components/admin-site-header';
import { ShipmentDetailsView } from '@/components/admin/shipments/shipment-details-view';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';

export const metadata: Metadata = {
  title: 'Shipment Details - Admin Dashboard',
  description: 'View detailed shipment information',
};

async function getShipment(id: string, requestHeaders: Headers) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/shipments/${id}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Cookie': requestHeaders.get('cookie') || '',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return null;
  }
}

export default async function ShipmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  const user = session?.user;
  const shipment = await getShipment(id, requestHeaders);

  if (!shipment) {
    notFound();
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
        <AdminSiteHeader user={{ name: user?.name, email: user?.email, image: user?.image }} />
        <div className="flex flex-1 flex-col">
          <div className="p-8">
            <ShipmentDetailsView shipment={shipment} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
