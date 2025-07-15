/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { LeadStatus } from '@/generated/prisma';
import { getCountryFilter } from '@/lib/auth/permissions';

// Helper to validate if user is an admin
const isAdmin = (role: string) => ['admin', 'super_admin'].includes(role);

// POST /api/leads/bulk - Bulk operations on leads
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ids, status } = body as { action: 'update' | 'delete'; ids: string[]; status?: LeadStatus };

    // Ensure admin can only perform bulk operations on leads in their country scope
    const countryFilter = getCountryFilter(session.user);
    const whereClause = {
      id: { in: ids },
      ...(countryFilter && { country: countryFilter })
    };

    if (action === 'update' && status) {
      // Bulk update status
      await prisma.lead.updateMany({
        where: whereClause,
        data: { status },
      });
      
      return NextResponse.json({ message: `Updated ${ids.length} leads` });
    } else if (action === 'delete') {
      // Bulk delete
      await prisma.lead.deleteMany({
        where: whereClause,
      });
      
      return NextResponse.json({ message: `Deleted ${ids.length} leads` });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
  }
}
