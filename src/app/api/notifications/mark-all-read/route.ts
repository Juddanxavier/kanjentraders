/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/auth-server';
import { NotificationService } from '@/lib/services/notificationService';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await NotificationService.markAllAsRead(session.user.id);
    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
