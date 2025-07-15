import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authGuard } from '@/lib/auth/route-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await authGuard(request);
    
    const settings = await prisma.notificationSettings.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        enabled: true,
        toastEnabled: true,
        centerEnabled: true,
        soundEnabled: true,
        emailEnabled: true,
        authEnabled: true,
        systemEnabled: true,
        userEnabled: true,
        shipmentEnabled: true,
        adminEnabled: true,
        leadEnabled: true,
        groupSimilar: true,
        maxToasts: true,
        defaultDuration: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = await prisma.notificationSettings.create({
        data: {
          userId: user.id,
        },
        select: {
          id: true,
          enabled: true,
          toastEnabled: true,
          centerEnabled: true,
          soundEnabled: true,
          emailEnabled: true,
          authEnabled: true,
          systemEnabled: true,
          userEnabled: true,
          shipmentEnabled: true,
          adminEnabled: true,
          leadEnabled: true,
          groupSimilar: true,
          maxToasts: true,
          defaultDuration: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      return NextResponse.json({ settings: defaultSettings });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authGuard(request);
    const body = await request.json();
    
    const {
      enabled,
      toastEnabled,
      centerEnabled,
      soundEnabled,
      emailEnabled,
      authEnabled,
      systemEnabled,
      userEnabled,
      shipmentEnabled,
      adminEnabled,
      leadEnabled,
      groupSimilar,
      maxToasts,
      defaultDuration,
    } = body;
    
    const updateData: any = {};
    
    // Only update provided fields
    if (enabled !== undefined) updateData.enabled = enabled;
    if (toastEnabled !== undefined) updateData.toastEnabled = toastEnabled;
    if (centerEnabled !== undefined) updateData.centerEnabled = centerEnabled;
    if (soundEnabled !== undefined) updateData.soundEnabled = soundEnabled;
    if (emailEnabled !== undefined) updateData.emailEnabled = emailEnabled;
    if (authEnabled !== undefined) updateData.authEnabled = authEnabled;
    if (systemEnabled !== undefined) updateData.systemEnabled = systemEnabled;
    if (userEnabled !== undefined) updateData.userEnabled = userEnabled;
    if (shipmentEnabled !== undefined) updateData.shipmentEnabled = shipmentEnabled;
    if (adminEnabled !== undefined) updateData.adminEnabled = adminEnabled;
    if (leadEnabled !== undefined) updateData.leadEnabled = leadEnabled;
    if (groupSimilar !== undefined) updateData.groupSimilar = groupSimilar;
    if (maxToasts !== undefined) updateData.maxToasts = maxToasts;
    if (defaultDuration !== undefined) updateData.defaultDuration = defaultDuration;
    
    const settings = await prisma.notificationSettings.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        ...updateData,
      },
      select: {
        id: true,
        enabled: true,
        toastEnabled: true,
        centerEnabled: true,
        soundEnabled: true,
        emailEnabled: true,
        authEnabled: true,
        systemEnabled: true,
        userEnabled: true,
        shipmentEnabled: true,
        adminEnabled: true,
        leadEnabled: true,
        groupSimilar: true,
        maxToasts: true,
        defaultDuration: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
