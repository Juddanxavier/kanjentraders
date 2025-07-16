/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { NotificationPubSub } from '@/lib/services/redis-server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

        // Subscribe to user's notification channel
        const subscriber = NotificationPubSub.subscribe(userId, (notification) => {
          controller.enqueue(`data: ${JSON.stringify(notification)}\n\n`);
        });

        // Handle cleanup when client disconnects
        const cleanup = () => {
          NotificationPubSub.unsubscribe(userId);
          try {
            controller.close();
          } catch (error) {
            console.log('Stream already closed');
          }
        };

        // Store cleanup function for later use
        (controller as any).cleanup = cleanup;
      },
      cancel() {
        // Client disconnected, cleanup
        if ((this as any).cleanup) {
          (this as any).cleanup();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error setting up notification stream:', error);
    return NextResponse.json(
      { error: 'Failed to setup notification stream' },
      { status: 500 }
    );
  }
}
