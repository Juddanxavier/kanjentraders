import { NextRequest, NextResponse } from 'next/server';
import { canManageParcels } from '@/lib/auth/permissions';
import { getServerSession } from '@/lib/services/sessionService';
import { prisma } from '@/lib/prisma';

// GET /api/admin/shipments/[id] - Get a specific shipment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Shipment ID is required' 
      }, { status: 400 });
    }
    
    // Get shipment with lead and user info
    const shipment = await prisma.shipment.findUnique({
      where: { id },
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
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                country: true
              }
            }
          }
        }
      }
    });
    
    if (!shipment) {
      return NextResponse.json({ 
        error: 'Shipment not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json(shipment);
    
  } catch (error) {
    console.error('Error fetching shipment:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/shipments/[id] - Delete a specific shipment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ 
        error: 'Shipment ID is required' 
      }, { status: 400 });
    }
    
    // Delete shipment and its associated lead if it's a tracking-only lead
    const deletedShipment = await prisma.$transaction(async (tx) => {
      // Get shipment to delete
      const shipmentToDelete = await tx.shipment.findUnique({
        where: { id },
        include: { lead: true }
      });
      
      if (!shipmentToDelete) {
        throw new Error('Shipment not found');
      }
      
      // Delete shipment
      await tx.shipment.delete({
        where: { id }
      });
      
      // Delete associated lead if it's a tracking-only lead
      if (shipmentToDelete.lead.email.includes('@system.local')) {
        await tx.lead.delete({
          where: { id: shipmentToDelete.lead.id }
        });
      }
      
      return shipmentToDelete;
    });
    
    return NextResponse.json({ 
      message: 'Shipment deleted successfully',
      deletedShipment: {
        id: deletedShipment.id,
        trackingNumber: deletedShipment.trackingNumber,
        carrier: deletedShipment.carrier
      }
    });
    
  } catch (error) {
    console.error('Error deleting shipment:', error);
    
    if (error instanceof Error && error.message === 'Shipment not found') {
      return NextResponse.json({ 
        error: 'Shipment not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
