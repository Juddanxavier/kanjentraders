'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Package, 
  User, 
  MapPin, 
  Calendar, 
  Truck, 
  Clock, 
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Plane,
  Home,
  Building,
  ArrowRight,
  Circle
} from 'lucide-react';
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
  whiteLabelTrackingId: string;
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
interface ShipmentDetailsDialogProps {
  shipment: Shipment;
  onClose: () => void;
}
export function ShipmentDetailsDialog({ shipment, onClose }: ShipmentDetailsDialogProps) {
  const [refreshing, setRefreshing] = useState(false);
  
  // Parse tracking events from JSON string
  const trackingEvents = useMemo(() => {
    if (!shipment.trackingEvents) return [];
    try {
      return typeof shipment.trackingEvents === 'string' 
        ? JSON.parse(shipment.trackingEvents) 
        : shipment.trackingEvents;
    } catch (error) {
      console.error('Error parsing tracking events:', error);
      return [];
    }
  }, [shipment.trackingEvents]);
  const handleRefreshTracking = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/admin/shipments/${shipment.id}/refresh`, {
        method: 'POST',
      });
      if (response.ok) {
        toast.success('Tracking information refreshed successfully');
        // Refresh the page or update the shipment data
        window.location.reload();
      } else {
        throw new Error('Failed to refresh tracking');
      }
    } catch (error) {
      console.error('Error refreshing tracking:', error);
      toast.error('Failed to refresh tracking information');
    } finally {
      setRefreshing(false);
    }
  };
  
  const copyTrackingNumber = () => {
    navigator.clipboard.writeText(shipment.trackingNumber);
    toast.success('Tracking number copied to clipboard');
  };
  
  const copyWhiteLabelTrackingId = () => {
    navigator.clipboard.writeText(shipment.whiteLabelTrackingId);
    toast.success('White label tracking ID copied to clipboard');
  };
  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    // More specific icon mapping based on common tracking statuses
    if (normalizedStatus.includes('delivered')) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (normalizedStatus.includes('out_for_delivery') || normalizedStatus.includes('out for delivery')) {
      return <Truck className="h-4 w-4 text-yellow-600" />;
    }
    if (normalizedStatus.includes('in_transit') || normalizedStatus.includes('in transit')) {
      return <ArrowRight className="h-4 w-4 text-blue-600" />;
    }
    if (normalizedStatus.includes('departed') || normalizedStatus.includes('left')) {
      return <Plane className="h-4 w-4 text-purple-600" />;
    }
    if (normalizedStatus.includes('arrived') || normalizedStatus.includes('received')) {
      return <Building className="h-4 w-4 text-indigo-600" />;
    }
    if (normalizedStatus.includes('exception') || normalizedStatus.includes('delayed')) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    if (normalizedStatus.includes('returned') || normalizedStatus.includes('return')) {
      return <XCircle className="h-4 w-4 text-orange-600" />;
    }
    if (normalizedStatus.includes('pickup') || normalizedStatus.includes('collected')) {
      return <Package className="h-4 w-4 text-green-600" />;
    }
    if (normalizedStatus.includes('pre_transit') || normalizedStatus.includes('label created')) {
      return <Circle className="h-4 w-4 text-gray-600" />;
    }
    // Default fallback
    return <Package className="h-4 w-4 text-gray-600" />;
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'IN_TRANSIT':
        return 'bg-blue-100 text-blue-800';
      case 'OUT_FOR_DELIVERY':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'EXCEPTION':
        return 'bg-red-100 text-red-800';
      case 'RETURNED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  const formatLocation = (location?: { city?: string; state?: string; country?: string }) => {
    if (!location) return 'Unknown';
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.join(', ');
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-5 w-5" />
        <h1 className="text-2xl font-semibold">Shipment Details</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tracking Information
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshTracking}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    White Label Tracking ID
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm font-semibold text-blue-600">{shipment.whiteLabelTrackingId}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyWhiteLabelTrackingId}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Carrier Tracking Number
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm">{shipment.trackingNumber}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyTrackingNumber}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Carrier
                  </label>
                  <div className="mt-1 font-medium">{shipment.carrier}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusIcon(shipment.status)}
                    <Badge className={getStatusColor(shipment.status)}>
                      {shipment.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Service Type
                  </label>
                  <div className="mt-1">{shipment.serviceType || 'N/A'}</div>
                </div>
              </div>
              {shipment.estimatedDelivery && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Estimated Delivery
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(shipment.estimatedDelivery)}
                  </div>
                </div>
              )}
              {shipment.actualDelivery && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Actual Delivery
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {formatDate(shipment.actualDelivery)}
                  </div>
                </div>
              )}
              {shipment.lastTrackedAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {formatDate(shipment.lastTrackedAt)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Tracking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tracking Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trackingEvents && trackingEvents.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                  <div className="space-y-6">
                    {trackingEvents.map((event, index) => (
                      <div key={index} className="relative flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center">
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {event.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(event.status_date)}
                            </span>
                          </div>
                          <div className="text-sm font-medium">
                            {formatLocation(event.location)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {event.message || event.status_details || 'Status update'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tracking events available</p>
                  <p className="text-sm">Click refresh to get latest updates</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Right Column - Customer & Address Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <div className="mt-1 font-medium">{shipment.lead.name}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="mt-1">{shipment.lead.email}</div>
              </div>
              {shipment.lead.phoneNumber && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="mt-1">{shipment.lead.phoneNumber}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Original Weight</label>
                <div className="mt-1">{shipment.lead.weight} kg</div>
              </div>
            </CardContent>
          </Card>
          {/* Package Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Weight</label>
                <div className="mt-1">{shipment.weight || shipment.lead.weight} kg</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Package Type</label>
                <div className="mt-1 capitalize">{shipment.packageType || 'N/A'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <div className="mt-1 text-sm">{formatDate(shipment.createdAt)}</div>
              </div>
            </CardContent>
          </Card>
          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Addresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {shipment.fromAddress && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">From</label>
                  <div className="mt-1 text-sm">
                    <div className="font-medium">{shipment.fromAddress.name}</div>
                    <div>{shipment.fromAddress.street1}</div>
                    <div>
                      {shipment.fromAddress.city}, {shipment.fromAddress.state} {shipment.fromAddress.zip}
                    </div>
                    <div>{shipment.fromAddress.country}</div>
                  </div>
                </div>
              )}
              {shipment.toAddress && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">To</label>
                  <div className="mt-1 text-sm">
                    <div className="font-medium">{shipment.toAddress.name}</div>
                    <div>{shipment.toAddress.street1}</div>
                    <div>
                      {shipment.toAddress.city}, {shipment.toAddress.state} {shipment.toAddress.zip}
                    </div>
                    <div>{shipment.toAddress.country}</div>
                  </div>
                </div>
              )}
              {!shipment.fromAddress && !shipment.toAddress && (
                <div>
                  <div className="text-sm text-muted-foreground">
                    <div><strong>From:</strong> {shipment.lead.origin}</div>
                    <div><strong>To:</strong> {shipment.lead.destination}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Notes */}
          {shipment.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{shipment.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
