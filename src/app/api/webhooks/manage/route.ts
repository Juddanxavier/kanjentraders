import { NextRequest, NextResponse } from 'next/server';
import { webhookManager } from '@/lib/services/webhookManager';

/**
 * GET /api/webhooks/manage - List all webhooks and their status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await webhookManager.getWebhookStatus();
        return NextResponse.json(status);

      case 'list':
        const webhooks = await webhookManager.listWebhooks();
        return NextResponse.json({ webhooks });

      case 'events':
        const trackingNumber = searchParams.get('tracking_number');
        if (!trackingNumber) {
          return NextResponse.json({ error: 'tracking_number is required' }, { status: 400 });
        }
        const events = await webhookManager.getWebhookEvents(trackingNumber);
        return NextResponse.json({ events });

      default:
        // Default action - get status and list
        const [webhookStatus, webhookList] = await Promise.all([
          webhookManager.getWebhookStatus(),
          webhookManager.listWebhooks()
        ]);
        
        return NextResponse.json({
          status: webhookStatus,
          webhooks: webhookList,
          total: webhookList.length
        });
    }
  } catch (error) {
    console.error('Error in webhook management GET:', error);
    return NextResponse.json({
      error: 'Failed to fetch webhook data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/webhooks/manage - Register a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...config } = body;

    switch (action) {
      case 'register':
        if (!config.url || !config.events) {
          return NextResponse.json({
            error: 'Missing required fields',
            required: ['url', 'events']
          }, { status: 400 });
        }

        const webhook = await webhookManager.registerWebhook(config);
        return NextResponse.json({
          message: 'Webhook registered successfully',
          webhook
        });

      case 'auto_register':
        if (!config.base_url) {
          return NextResponse.json({
            error: 'base_url is required for auto registration'
          }, { status: 400 });
        }

        const autoWebhook = await webhookManager.autoRegisterWebhook(config.base_url);
        return NextResponse.json({
          message: 'Webhook auto-registered successfully',
          webhook: autoWebhook
        });

      case 'test':
        if (!config.webhook_id) {
          return NextResponse.json({
            error: 'webhook_id is required for testing'
          }, { status: 400 });
        }

        const testResult = await webhookManager.testWebhook(config.webhook_id);
        return NextResponse.json({
          message: 'Webhook test completed',
          success: testResult
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          available_actions: ['register', 'auto_register', 'test']
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in webhook management POST:', error);
    return NextResponse.json({
      error: 'Failed to process webhook action',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/webhooks/manage - Update webhook configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhook_id, ...config } = body;

    if (!webhook_id) {
      return NextResponse.json({
        error: 'webhook_id is required'
      }, { status: 400 });
    }

    const updatedWebhook = await webhookManager.updateWebhook(webhook_id, config);
    return NextResponse.json({
      message: 'Webhook updated successfully',
      webhook: updatedWebhook
    });
  } catch (error) {
    console.error('Error in webhook management PUT:', error);
    return NextResponse.json({
      error: 'Failed to update webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/webhooks/manage - Delete a webhook
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get('webhook_id');

    if (!webhookId) {
      return NextResponse.json({
        error: 'webhook_id is required'
      }, { status: 400 });
    }

    const success = await webhookManager.deleteWebhook(webhookId);
    
    if (success) {
      return NextResponse.json({
        message: 'Webhook deleted successfully'
      });
    } else {
      return NextResponse.json({
        error: 'Failed to delete webhook'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in webhook management DELETE:', error);
    return NextResponse.json({
      error: 'Failed to delete webhook',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
