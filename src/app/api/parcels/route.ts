import { NextRequest, NextResponse } from 'next/server';
import { canManageParcels } from '@/lib/auth/permissions';
import { getDataFilter } from '@/lib/services/dataFilter';
import { getServerSession } from '@/lib/services/sessionService';
import { prisma } from '@/lib/prisma';
// Example: GET /api/parcels - Get all parcels (filtered by country)
export async function GET(request: NextRequest) {
  try {
    // Get session using session service
    const sessionData = await getServerSession(request.headers);
    if (!sessionData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = sessionData;
    // Get data filter based on user role
    const dataFilter = getDataFilter(user);
    // Example query - you'll need to create the Parcel model in Prisma
    // const parcels = await prisma.parcel.findMany({
    //   where: dataFilter,
    //   orderBy: { createdAt: 'desc' }
    // });
    // For now, return example data
    const mockParcels = [
      {
        id: '1',
        trackingNumber: 'IN-2024-001',
        country: 'IN',
        status: 'in_transit',
        userId: 'user123', // Example user ID
        createdAt: new Date()
      },
      {
        id: '2',
        trackingNumber: 'LK-2024-001',
        country: 'LK',
        status: 'delivered',
        userId: 'user456', // Different user
        createdAt: new Date()
      },
      {
        id: '3',
        trackingNumber: 'IN-2024-002',
        country: 'IN',
        status: 'pending',
        userId: user.id, // Current user's parcel
        createdAt: new Date()
      }
    ];
    // Apply filter based on user role
    const parcels = mockParcels.filter(parcel => {
      // If no filter (super admin), return all
      if (Object.keys(dataFilter).length === 0) return true;
      // Check userId filter (for regular users)
      if (dataFilter.userId && parcel.userId !== dataFilter.userId) {
        return false;
      }
      // Check country filter (for admins)
      if (dataFilter.country && parcel.country !== dataFilter.country) {
        return false;
      }
      return true;
    });
    return NextResponse.json({ parcels });
  } catch (error) {
    console.error('Error fetching parcels:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// Example: POST /api/parcels - Create a new parcel (admin only)
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
    // For super admin, country can be specified
    // For regular admin, force their own country
    const parcelCountry = user.role === 'super_admin' ? 
      (body.country || user.country) : 
      user.country;
    // Example: Create parcel
    // const parcel = await prisma.parcel.create({
    //   data: {
    //     ...body,
    //     country: parcelCountry,
    //     createdBy: user.id
    //   }
    // });
    // For now, return example response
    const parcel = {
      id: '3',
      ...body,
      country: parcelCountry,
      createdBy: user.id,
      createdAt: new Date()
    };
    return NextResponse.json({ parcel });
  } catch (error) {
    console.error('Error creating parcel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
