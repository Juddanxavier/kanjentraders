import shippo from 'shippo';
import { prisma } from '@/lib/prisma';
import type { ShipmentData, TrackingEvent, ShippoTrackingResponse } from './shippoService';

// Initialize Shippo client - SERVER SIDE ONLY
const shippoClient = shippo(process.env.SHIPPO_API_KEY!);

/**
 * Create a shipment in Shippo for tracking
 */
export const createShipmentTracking = async (shipmentData: ShipmentData) => {
  try {
    // Register tracking with Shippo
    const trackingResponse = await shippoClient.track.create({
      carrier: shipmentData.carrier.toLowerCase(),
      tracking_number: shipmentData.trackingNumber,
    });

    console.log('Shippo tracking created:', trackingResponse);
    return trackingResponse;
  } catch (error) {
    console.error('Error creating Shippo tracking:', error);
    throw new Error(`Failed to create tracking: ${error}`);
  }
};

/**
 * Get tracking status from Shippo
 */
export const getTrackingStatus = async (carrier: string, trackingNumber: string): Promise<ShippoTrackingResponse> => {
  try {
    const trackingStatus = await shippoClient.track.get_status(carrier.toLowerCase(), trackingNumber);
    return trackingStatus as ShippoTrackingResponse;
  } catch (error) {
    console.error('Error getting tracking status:', error);
    throw new Error(`Failed to get tracking status: ${error}`);
  }
};

/**
 * Update shipment status in database from Shippo data
 */
export const updateShipmentFromShippo = async (trackingNumber: string, shippoData: ShippoTrackingResponse) => {
  try {
    // Map Shippo status to our internal status
    const mappedStatus = mapShippoStatusToInternal(shippoData.tracking_status);
    
    // Get the latest tracking event
    const latestEvent = shippoData.tracking_history?.[0];
    
    const updateData: any = {
      status: mappedStatus,
      trackingStatus: shippoData.tracking_status,
      trackingEvents: shippoData.tracking_history,
      lastTrackedAt: new Date(),
      shippoData: shippoData,
    };

    // Add delivery date if delivered
    if (mappedStatus === 'DELIVERED' && latestEvent?.status_date) {
      updateData.actualDelivery = new Date(latestEvent.status_date);
    }

    // Add estimated delivery if available
    if (shippoData.eta) {
      updateData.estimatedDelivery = new Date(shippoData.eta);
    }

    const updatedShipment = await prisma.shipment.update({
      where: { trackingNumber },
      data: updateData,
    });

    console.log('Shipment updated from Shippo:', updatedShipment.id);
    return updatedShipment;
  } catch (error) {
    console.error('Error updating shipment from Shippo:', error);
    throw new Error(`Failed to update shipment: ${error}`);
  }
};

/**
 * Map Shippo tracking status to our internal ShipmentStatus enum
 */
const mapShippoStatusToInternal = (shippoStatus: string): string => {
  const statusMap: Record<string, string> = {
    'UNKNOWN': 'UNKNOWN',
    'PRE_TRANSIT': 'PENDING',
    'TRANSIT': 'IN_TRANSIT',
    'DELIVERED': 'DELIVERED',
    'RETURNED': 'RETURNED',
    'FAILURE': 'EXCEPTION',
    'CANCELLED': 'CANCELLED',
    'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
  };

  return statusMap[shippoStatus] || 'UNKNOWN';
};

/**
 * Process webhook data from Shippo
 */
export const processWebhookData = async (webhookData: any) => {
  try {
    const { tracking_number, carrier, tracking_status, tracking_history } = webhookData;

    if (!tracking_number || !carrier) {
      throw new Error('Invalid webhook data: missing tracking_number or carrier');
    }

    // Find the shipment in our database
    const shipment = await prisma.shipment.findUnique({
      where: { trackingNumber: tracking_number },
    });

    if (!shipment) {
      console.warn(`Shipment not found for tracking number: ${tracking_number}`);
      return null;
    }

    // Update shipment with webhook data
    const shippoData: ShippoTrackingResponse = {
      tracking_number,
      carrier,
      tracking_status,
      tracking_history: tracking_history || [],
    };

    return await updateShipmentFromShippo(tracking_number, shippoData);
  } catch (error) {
    console.error('Error processing webhook data:', error);
    throw error;
  }
};
