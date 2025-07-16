// Client-side service - no Shippo imports
// All Shippo operations should be done via API routes
// Types for better type safety
export interface ShipmentData {
  trackingNumber: string;
  carrier: string;
  serviceType?: string;
  fromAddress?: {
    name: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  toAddress?: {
    name: string;
    street1: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  packageType?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: string;
  };
}
export interface TrackingEvent {
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
export interface ShippoTrackingResponse {
  tracking_number: string;
  carrier: string;
  tracking_status: string;
  tracking_history: TrackingEvent[];
  eta?: string;
  servicelevel?: {
    name: string;
    token: string;
  };
}
// Server-side functions are handled by API routes
// Client-side code should only call API endpoints
/**
 * Get all carriers supported by Shippo
 */
export const getSupportedCarriers = () => {
  return [
    { code: 'shippo', name: 'Shippo (Test)' },
    { code: 'fedex', name: 'FedEx' },
    { code: 'ups', name: 'UPS' },
    { code: 'usps', name: 'USPS' },
    { code: 'dhl_express', name: 'DHL Express' },
    { code: 'dhl_ecommerce', name: 'DHL eCommerce' },
    { code: 'aramex', name: 'Aramex' },
    { code: 'australia_post', name: 'Australia Post' },
    { code: 'canada_post', name: 'Canada Post' },
    { code: 'royal_mail', name: 'Royal Mail' },
    { code: 'india_post', name: 'India Post' },
    { code: 'singapore_post', name: 'Singapore Post' },
    { code: 'hongkong_post', name: 'Hong Kong Post' },
  ];
};
/**
 * Validate tracking number format for different carriers
 */
export const validateTrackingNumber = (carrier: string, trackingNumber: string): boolean => {
  const patterns: Record<string, RegExp> = {
    'fedex': /^[0-9]{12,14}$/,
    'ups': /^1Z[0-9A-Z]{16}$/,
    'usps': /^[0-9]{13,34}$/,
    'dhl_express': /^[0-9]{10,11}$/,
    'dhl_ecommerce': /^[0-9]{10,11}$/,
  };
  const pattern = patterns[carrier.toLowerCase()];
  if (!pattern) {
    // If no specific pattern, just check it's not empty
    return trackingNumber.length > 0;
  }
  return pattern.test(trackingNumber);
};
