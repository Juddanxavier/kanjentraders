import { NextRequest, NextResponse } from 'next/server';
import { processWebhookData } from '@/lib/services/shippoService.server';

/**
 * Shippo webhook endpoint for receiving tracking updates
 * This endpoint should be registered in your Shippo dashboard
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for webhook verification
    const body = await request.text();
    let webhookData;

    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON in webhook body:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Log the incoming webhook for debugging
    console.log('Received Shippo webhook:', {
      timestamp: new Date().toISOString(),
      event: webhookData.event,
      tracking_number: webhookData.data?.tracking_number,
      carrier: webhookData.data?.carrier,
      status: webhookData.data?.tracking_status,
    });

    // Verify webhook signature if configured
    const signature = request.headers.get('X-Shippo-Signature');
    if (process.env.SHIPPO_WEBHOOK_SECRET && signature) {
      const isValid = await verifyWebhookSignature(body, signature, process.env.SHIPPO_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Process different webhook events
    const { event, data } = webhookData;

    switch (event) {
      case 'track_updated':
        await processWebhookData(data);
        break;
      
      case 'track_delivered':
        await processWebhookData(data);
        break;
      
      case 'track_returned':
        await processWebhookData(data);
        break;
      
      default:
        console.log(`Unhandled webhook event: ${event}`);
        break;
    }

    return NextResponse.json({ 
      message: 'Webhook processed successfully',
      event,
      tracking_number: data?.tracking_number 
    });

  } catch (error) {
    console.error('Error processing Shippo webhook:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Handle GET requests for webhook verification
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    // Respond with challenge for webhook verification
    return NextResponse.json({ challenge });
  }

  return NextResponse.json({ 
    message: 'Shippo webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}

/**
 * Verify webhook signature from Shippo
 */
async function verifyWebhookSignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Rate limiting for webhook endpoint
 */
const webhookRateLimit = new Map<string, number>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // Max 100 requests per minute per IP

  const lastRequest = webhookRateLimit.get(ip) || 0;
  
  if (now - lastRequest < windowMs) {
    const requests = (webhookRateLimit.get(`${ip}_count`) || 0) + 1;
    if (requests > maxRequests) {
      return false;
    }
    webhookRateLimit.set(`${ip}_count`, requests);
  } else {
    webhookRateLimit.set(ip, now);
    webhookRateLimit.set(`${ip}_count`, 1);
  }

  return true;
}
