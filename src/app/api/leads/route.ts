/** @format */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/auth-server';
import { LeadStatus } from '@/generated/prisma';
import { CreateLeadData, LeadFilters } from '@/types/lead';
import { getCountryFilter, AuthUser, UserRole } from '@/lib/auth/permissions';
// Helper to validate if user is an admin
const isAdmin = (role: string | null | undefined) => role && ['admin', 'super_admin'].includes(role);
// GET /api/leads - List leads with filtering and sorting
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as LeadStatus;
    const assignedToId = searchParams.get('assignedToId');
    const destination = searchParams.get('destination');
    const origin = searchParams.get('origin');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const weightMin = searchParams.get('weightMin');
    const weightMax = searchParams.get('weightMax');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const user = {
      ...session.user,
      role: session.user.role as UserRole || 'user',
      country: session.user.country || 'India',
    } as AuthUser;
    const countryFilter = getCountryFilter(user);
    const leads = await prisma.lead.findMany({
      where: {
        ...(countryFilter && { country: countryFilter }),
        ...(status && status !== 'ALL' && { status }),
        ...(assignedToId && { assignedToId }),
        ...(destination && { destination: { contains: destination, mode: 'insensitive' } }),
        ...(origin && { origin: { contains: origin, mode: 'insensitive' } }),
        ...(search && { 
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phoneNumber: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
        ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
        ...(weightMin && { weight: { gte: parseFloat(weightMin) } }),
        ...(weightMax && { weight: { lte: parseFloat(weightMax) } }),
      },
      orderBy: { [sortField]: sortOrder },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    
    console.log('Leads API Debug:', { leadsCount: leads.length, countryFilter, status, sortField, sortOrder });
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
// POST /api/leads - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { name, email, phoneNumber, destination, origin, weight, assignedToId } = body as CreateLeadData;
    // Check if lead with email already exists in the admin's accessible scope
    const user = {
      ...session.user,
      role: session.user.role as UserRole || 'user',
      country: session.user.country || 'India',
    } as AuthUser;
    const countryFilter = getCountryFilter(user);
    const existingLead = await prisma.lead.findFirst({
      where: { 
        email,
        ...(countryFilter && { country: countryFilter })
      },
    });
    if (existingLead) {
      return NextResponse.json({ error: 'Lead with this email already exists' }, { status: 400 });
    }
    // Set the country for the new lead based on admin's country
    const leadCountry = countryFilter || user.country;
    const newLead = await prisma.lead.create({
      data: {
        name,
        email,
        phoneNumber,
        destination,
        origin,
        weight,
        assignedToId,
        createdById: session.user.id,
        country: leadCountry,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
