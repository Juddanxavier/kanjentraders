import { NextRequest, NextResponse } from 'next/server';
import { canManageParcels, getCountryFilter } from '@/lib/auth/permissions';
import { getServerSession } from '@/lib/services/sessionService';
import { prisma } from '@/lib/prisma';
import { validateTrackingNumber } from '@/lib/services/shippoService';
import { generateWhiteLabelTrackingId } from '@/lib/utils/tracking-id';
// Shippo API integration
const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY;
const SHIPPO_BASE_URL = 'https://api.goshippo.com';
// Function to register tracking with Shippo
async function registerTracking(carrier: string, trackingNumber: string) {
  if (!SHIPPO_API_KEY) {
    throw new Error('Shippo API key not configured');
  }
  const response = await fetch(`${SHIPPO_BASE_URL}/tracks/`, {
    method: 'POST',
    headers: {
      'Authorization': `ShippoToken ${SHIPPO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      carrier,
      tracking_number: trackingNumber
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Shippo API error: ${error.detail || 'Unknown error'}`);
  }
  return await response.json();
}
// Function to get tracking info from Shippo
async function getTrackingInfo(carrier: string, trackingNumber: string) {
  if (!SHIPPO_API_KEY) {
    throw new Error('Shippo API key not configured');
  }
  const response = await fetch(`${SHIPPO_BASE_URL}/tracks/${carrier}/${trackingNumber}`, {
    headers: {
      'Authorization': `ShippoToken ${SHIPPO_API_KEY}`
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Shippo API error: ${error.detail || 'Unknown error'}`);
  }
  return await response.json();
}
// POST /api/admin/shipments - Create a new shipment
export async function POST(request: NextRequest) {
  try {
    // Get session using session service
    const sessionData = await getServerSession(request.headers);
    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = sessionData;
    // Check if user can manage parcels
    if (!canManageParcels(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { trackingNumber, carrier } = body;
    // Validate required fields
    if (!trackingNumber || !carrier) {
      return NextResponse.json({ 
        error: 'Missing required fields: trackingNumber and carrier are required' 
      }, { status: 400 });
    }
    // Validate tracking number format
    if (!validateTrackingNumber(carrier, trackingNumber)) {
      return NextResponse.json({ 
        error: `Invalid tracking number format for ${carrier}` 
      }, { status: 400 });
    }
    // Check if tracking number already exists
    const existingShipment = await prisma.shipment.findFirst({
      where: { trackingNumber }
    });
    if (existingShipment) {
      return NextResponse.json({ 
        error: 'A shipment with this tracking number already exists' 
      }, { status: 400 });
    }
    // Create a generic lead for tracking-only shipments
    const lead = await prisma.lead.create({
      data: {
        name: 'Tracking Only',
        email: `tracking-${trackingNumber}@system.local`,
        destination: 'Unknown', // Will be updated from Shippo API
        origin: 'Unknown', // Will be updated from Shippo API
        weight: 0, // Will be updated from Shippo API
        status: 'SHIPPED',
        country: user.country,
        createdById: user.id,
        assignedToId: null // No user assignment for tracking-only
      }
    });
    // Register tracking with Shippo and get initial tracking info
    let shippoData = null;
    let trackingStatus = 'UNKNOWN';
    let estimatedDelivery = null;
    let trackingEvents = null;
    try {
      // Register tracking with Shippo
      const trackingResponse = await registerTracking(carrier, trackingNumber);
      shippoData = trackingResponse;
      // Get current tracking info
      const trackingInfo = await getTrackingInfo(carrier, trackingNumber);
      // Extract tracking details
      if (trackingInfo) {
        trackingStatus = trackingInfo.tracking_status?.status || 'UNKNOWN';
        estimatedDelivery = trackingInfo.eta ? new Date(trackingInfo.eta) : null;
        trackingEvents = trackingInfo.tracking_history || [];
      }
    } catch (shippoError) {
      console.warn('Shippo API error (continuing with basic shipment):', shippoError);
      // Continue with shipment creation even if Shippo fails
    }
    // Map Shippo status to our internal status
    const mapShippoStatus = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'delivered': return 'DELIVERED';
        case 'in_transit': return 'IN_TRANSIT';
        case 'out_for_delivery': return 'OUT_FOR_DELIVERY';
        case 'exception': return 'EXCEPTION';
        case 'returned': return 'RETURNED';
        case 'cancelled': return 'CANCELLED';
        default: return 'PENDING';
      }
    };
    // Generate unique white label tracking ID
    let whiteLabelTrackingId: string;
    let isUnique = false;
    while (!isUnique) {
      whiteLabelTrackingId = generateWhiteLabelTrackingId();
      // Check if this ID already exists
      const existingId = await prisma.shipment.findUnique({
        where: { whiteLabelTrackingId }
      });
      if (!existingId) {
        isUnique = true;
      }
    }
    // Create shipment with Shippo data
    const shipment = await prisma.shipment.create({
      data: {
        leadId: lead.id,
        whiteLabelTrackingId: whiteLabelTrackingId!,
        trackingNumber,
        carrier,
        status: mapShippoStatus(trackingStatus),
        trackingStatus,
        estimatedDelivery,
        trackingEvents: trackingEvents ? JSON.stringify(trackingEvents) : null,
        shippoData: shippoData ? JSON.stringify(shippoData) : null,
        lastTrackedAt: new Date(),
        notes: `Created by ${user.name || user.email} via admin panel`
      }
    });
    return NextResponse.json({ 
      message: 'Shipment created successfully and registered with Shippo for tracking!',
      shipment: {
        id: shipment.id,
        whiteLabelTrackingId: shipment.whiteLabelTrackingId,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        status: shipment.status,
        trackingStatus: shipment.trackingStatus,
        estimatedDelivery: shipment.estimatedDelivery,
        trackingEvents: trackingEvents ? trackingEvents.length : 0
      }
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
// GET /api/admin/shipments - Get all shipments (filtered by permissions)
export async function GET(request: NextRequest) {
  try {
    // Get session using session service
    const sessionData = await getServerSession(request.headers);
    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = sessionData;
    // Check if user can manage parcels
    if (!canManageParcels(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get country filter based on user role
    const countryFilter = getCountryFilter(user);
    
    // Get shipments with lead and user info (filtered by country)
    const shipments = await prisma.shipment.findMany({
      where: {
        lead: countryFilter ? { country: countryFilter } : undefined
      },
      include: {
        lead: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneNumber: true,
                country: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ shipments });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
// DELETE /api/admin/shipments - Delete multiple shipments
export async function DELETE(request: NextRequest) {
  try {
    // Get session using session service
    const sessionData = await getServerSession(request.headers);
    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = sessionData;
    // Check if user can manage parcels
    if (!canManageParcels(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { shipmentIds } = body;
    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      return NextResponse.json({ 
        error: 'shipmentIds array is required' 
      }, { status: 400 });
    }
    // Delete shipments and their associated leads
    const deletedShipments = await prisma.$transaction(async (tx) => {
      // Get shipments to delete
      const shipmentsToDelete = await tx.shipment.findMany({
        where: { id: { in: shipmentIds } },
        include: { lead: true }
      });
      // Delete shipments
      await tx.shipment.deleteMany({
        where: { id: { in: shipmentIds } }
      });
      // Delete associated leads (only if they're tracking-only leads)
      const leadsToDelete = shipmentsToDelete
        .filter(s => s.lead.email.includes('@system.local'))
        .map(s => s.lead.id);
      if (leadsToDelete.length > 0) {
        await tx.lead.deleteMany({
          where: { id: { in: leadsToDelete } }
        });
      }
      return shipmentsToDelete;
    });
    return NextResponse.json({ 
      message: `Successfully deleted ${deletedShipments.length} shipment(s)`,
      deletedCount: deletedShipments.length
    });
  } catch (error) {
    console.error('Error deleting shipments:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
