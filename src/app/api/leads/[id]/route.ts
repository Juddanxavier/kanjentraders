/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { UpdateLeadData } from '@/types/lead';
import { getCountryFilter } from '@/lib/auth/permissions';

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
