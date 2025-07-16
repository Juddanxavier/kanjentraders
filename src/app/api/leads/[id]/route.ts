/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { UpdateLeadData } from '@/types/lead';
import { getCountryFilter } from '@/lib/auth/permissions';
import { generateWhiteLabelTrackingId } from '@/lib/utils/tracking-id';
import { sendLeadConvertedNotification } from '@/lib/utils/notifications';

// Helper to validate if user is an admin
const isAdmin = (role: string) => ['admin', 'super_admin'].includes(role);

// PUT /api/leads/[id] - Update a lead
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phoneNumber, destination, origin, weight, status, assignedToId } = body as UpdateLeadData;

    // Ensure admin can only update leads in their country scope
    const countryFilter = getCountryFilter(session.user);
    const whereClause = countryFilter 
      ? { id: params.id, country: countryFilter }
      : { id: params.id };

    const updatedLead = await prisma.lead.update({
      where: whereClause,
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(destination && { destination }),
        ...(origin && { origin }),
        ...(weight && { weight }),
        ...(status && { status }),
        ...(assignedToId !== undefined && { assignedToId }),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

// PATCH /api/leads/[id] - Update a lead (specifically for status changes)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Ensure admin can only update leads in their country scope
    const countryFilter = getCountryFilter(session.user);
    const whereClause = countryFilter 
      ? { id: params.id, country: countryFilter }
      : { id: params.id };

    // Get the current lead to check previous status
    const currentLead = await prisma.lead.findUnique({
      where: whereClause,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!currentLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Update the lead status
    const updatedLead = await prisma.lead.update({
      where: whereClause,
      data: { status },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // If status changed to SHIPPED, automatically create a shipment
    if (status === 'SHIPPED' && currentLead.status !== 'SHIPPED') {
      try {
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

        // Create shipment from lead
        const shipment = await prisma.shipment.create({
          data: {
            leadId: updatedLead.id,
            whiteLabelTrackingId: whiteLabelTrackingId!,
            trackingNumber: '', // Will be updated when real tracking is assigned
            carrier: 'PENDING', // Will be updated when real carrier is assigned
            status: 'PENDING',
            trackingStatus: 'PENDING',
            notes: `Automatically created from lead ${updatedLead.name} (${updatedLead.email})`,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Send notification to assigned user about lead conversion
        if (updatedLead.assignedToId) {
          try {
            await sendLeadConvertedNotification(updatedLead.assignedToId, {
              id: updatedLead.id,
              name: updatedLead.name,
              shipmentId: shipment.id,
              whiteLabelTrackingId: shipment.whiteLabelTrackingId,
            });
          } catch (notificationError) {
            console.error('Failed to send lead converted notification:', notificationError);
            // Continue execution - notification failure shouldn't break the process
          }
        }

        return NextResponse.json({
          ...updatedLead,
          shipment: {
            id: shipment.id,
            whiteLabelTrackingId: shipment.whiteLabelTrackingId,
            status: shipment.status,
          },
          message: 'Lead status updated and shipment created successfully',
        });
      } catch (shipmentError) {
        console.error('Error creating shipment for lead:', shipmentError);
        // Return the updated lead even if shipment creation fails
        return NextResponse.json({
          ...updatedLead,
          warning: 'Lead status updated but shipment creation failed',
        });
      }
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

// DELETE /api/leads/[id] - Delete a lead
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Ensure admin can only delete leads in their country scope
    const countryFilter = getCountryFilter(session.user);
    const whereClause = countryFilter 
      ? { id: params.id, country: countryFilter }
      : { id: params.id };

    await prisma.lead.delete({
      where: whereClause,
    });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
