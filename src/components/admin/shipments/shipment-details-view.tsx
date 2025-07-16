'use client';
import { ShipmentDetailsDialog } from './shipment-details-dialog';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
interface TrackingEvent {
  status: string;
  status_details?: string;
  status_date: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  message?: string;
}
interface Shipment {
  id: string;
  leadId: string;
  trackingNumber: string;
  carrier: string;
  serviceType?: string;
  status: string;
  trackingStatus?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  weight?: number;
  packageType?: string;
  fromAddress?: any;
  toAddress?: any;
  trackingEvents?: TrackingEvent[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastTrackedAt?: string;
  lead: {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    destination: string;
    origin: string;
    weight: number;
  };
}
interface ShipmentDetailsViewProps {
  shipment: Shipment;
}
export function ShipmentDetailsView({ shipment }: ShipmentDetailsViewProps) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Shipments
      </Button>
      <ShipmentDetailsDialog shipment={shipment} onClose={() => {}} />
    </div>
  );
}
