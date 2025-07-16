'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupportedCarriers, validateTrackingNumber } from '@/lib/services/shippoService';
import { Loader2, Package, User, ArrowRight, ArrowLeft, MapPin } from 'lucide-react';
import { toast } from 'sonner';

// Automatic carrier detection based on tracking number patterns
const detectCarrier = (trackingNumber: string): string => {
  const cleanTrackingNumber = trackingNumber.replace(/\s+/g, '').toUpperCase();
  // Shippo test patterns
  if (/^SHIPPO_/.test(cleanTrackingNumber)) {
    return 'shippo';
  }
  // UPS patterns
  if (/^1Z[0-9A-Z]{16}$/.test(cleanTrackingNumber)) {
    return 'ups';
  }
  // FedEx patterns
  if (/^[0-9]{12}$/.test(cleanTrackingNumber) || // FedEx Express
      /^[0-9]{14}$/.test(cleanTrackingNumber) || // FedEx Ground
      /^[0-9]{15}$/.test(cleanTrackingNumber) || // FedEx Ground
      /^[0-9]{20}$/.test(cleanTrackingNumber) || // FedEx Ground
      /^[0-9]{22}$/.test(cleanTrackingNumber)) { // FedEx SmartPost
    return 'fedex';
  }
  // USPS patterns
  if (/^[0-9]{20}$/.test(cleanTrackingNumber) || // USPS Priority Mail Express
      /^[0-9]{13}$/.test(cleanTrackingNumber) || // USPS Priority Mail
      /^[A-Z]{2}[0-9]{9}[A-Z]{2}$/.test(cleanTrackingNumber) || // USPS International
      /^[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{2}$/.test(cleanTrackingNumber)) { // USPS Certified Mail
    return 'usps';
  }
  // DHL patterns
  if (/^[0-9]{10}$/.test(cleanTrackingNumber) || // DHL Express
      /^[0-9]{11}$/.test(cleanTrackingNumber) || // DHL Express
      /^[A-Z]{3}[0-9]{7}$/.test(cleanTrackingNumber)) { // DHL eCommerce
    return 'dhl_express';
  }
  // Amazon patterns
  if (/^TBA[0-9]{12}$/.test(cleanTrackingNumber)) {
    return 'amazon';
  }
  // OnTrac patterns
  if (/^[DC][0-9]{13}$/.test(cleanTrackingNumber)) {
    return 'ontrac';
  }
  // LaserShip patterns
  if (/^1LS[0-9]{10}$/.test(cleanTrackingNumber)) {
    return 'lasership';
  }
  return ''; // No carrier detected
};
const createShipmentSchema = z.object({
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  carrier: z.string().min(1, 'Carrier is required'),
});
type CreateShipmentFormData = z.infer<typeof createShipmentSchema>;
interface CreateShipmentDialogProps {
  onSuccess: () => void;
}
export function CreateShipmentDialog({ onSuccess }: CreateShipmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const carriers = getSupportedCarriers();
  const form = useForm<CreateShipmentFormData>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      trackingNumber: '',
      carrier: '',
    },
  });
  // Watch for tracking number changes to auto-detect carrier
  const trackingNumber = form.watch('trackingNumber');
  // Auto-detect carrier when tracking number changes
  const handleTrackingNumberChange = (value: string) => {
    form.setValue('trackingNumber', value);
    if (value.length > 5) { // Only try to detect after some characters are entered
      const detectedCarrier = detectCarrier(value);
      if (detectedCarrier) {
        form.setValue('carrier', detectedCarrier);
        console.log(`Automatically detected carrier: ${carriers.find(c => c.code === detectedCarrier)?.name || detectedCarrier}`);
      }
    }
  };
  const onSubmit = async (data: CreateShipmentFormData) => {
    setLoading(true);
    try {
      // Validate tracking number format
      if (!validateTrackingNumber(data.carrier, data.trackingNumber)) {
        return;
      }
      // Create shipment via API - let the backend fetch data from Shippo and handle phone number validation
      const response = await fetch('/api/admin/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create shipment');
      }
      const result = await response.json();
      toast.success("Shipment created successfully!");
      onSuccess();
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast.error(error instanceof Error ? error.message : "Failed to create shipment");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Create Shipment</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shipment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="carrier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carrier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select carrier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {carriers.map((carrier) => (
                            <SelectItem key={carrier.code} value={carrier.code}>
                              {carrier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trackingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tracking Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter tracking number" 
                          onChange={(e) => handleTrackingNumberChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                <p>💡 <strong>Note:</strong> Once you submit, the system will automatically register the tracking number with Shippo and fetch real-time tracking information including status updates and delivery estimates.</p>
              </div>
            </CardContent>
          </Card>
          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="submit" 
              disabled={loading || !form.watch('carrier') || !form.watch('trackingNumber')}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Shipment
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
