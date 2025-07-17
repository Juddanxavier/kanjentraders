/** @format */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/auth-server';
import { LeadStatus } from '@/generated/prisma';
import { getCountryFilter, AuthUser, UserRole } from '@/lib/auth/permissions';
// Helper to validate if user is an admin
const isAdmin = (role: string | null | undefined) => role && ['admin', 'super_admin'].includes(role);
// GET /api/leads/stats - Get lead statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const user = {
      ...session.user,
      role: session.user.role as UserRole || 'user',
      country: session.user.country || 'India',
    } as AuthUser;
    const countryFilter = getCountryFilter(user);
    const [total, newCount, contacted, shipped, failed] = await Promise.all([
      prisma.lead.count({ where: { ...(countryFilter && { country: countryFilter }) } }),
      prisma.lead.count({ where: { status: LeadStatus.NEW, ...(countryFilter && { country: countryFilter }) } }),
      prisma.lead.count({ where: { status: LeadStatus.CONTACTED, ...(countryFilter && { country: countryFilter }) } }),
      prisma.lead.count({ where: { status: LeadStatus.SHIPPED, ...(countryFilter && { country: countryFilter }) } }),
      prisma.lead.count({ where: { status: LeadStatus.FAILED, ...(countryFilter && { country: countryFilter }) } }),
    ]);
    const conversionRate = total > 0 ? Number(((shipped / total) * 100).toFixed(2)) : 0;
    return NextResponse.json({
      total,
      new: newCount,
      contacted,
      shipped,
      failed,
      conversionRate,
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    return NextResponse.json({ error: 'Failed to fetch lead stats' }, { status: 500 });
  }
}
