import { NextRequest, NextResponse } from 'next/server';
import { processWebhookData } from '@/lib/services/shippoService.server';
import { webhookManager } from '@/lib/services/webhookManager';

/**
 * Shippo webhook endpoint for receiving tracking updates
 * This endpoint is automatically registered with Shippo via the webhook manager
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limiting check
  if (!checkRateLimit(clientIP)) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

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

    // Validate required fields
    if (!webhookData.event || !webhookData.data) {
      console.error('Missing required fields in webhook data');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { event, data } = webhookData;
    const { tracking_number, carrier, tracking_status } = data;

    // Enhanced logging
    console.log('Received Shippo webhook:', {
      timestamp: new Date().toISOString(),
      event,
      tracking_number,
      carrier,
      status: tracking_status,
      ip: clientIP,
      processing_time_start: startTime
    });

    // Verify webhook signature if configured
    const signature = request.headers.get('X-Shippo-Signature');
    if (process.env.SHIPPO_WEBHOOK_SECRET && signature) {
      const isValid = await verifyWebhookSignature(body, signature, process.env.SHIPPO_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('Invalid webhook signature');
        
        // Record failed event
        await webhookManager.recordWebhookEvent({
          type: event,
          tracking_number: tracking_number || 'unknown',
          carrier: carrier || 'unknown',
          status: tracking_status || 'unknown',
          timestamp: new Date(),
          success: false,
          error: 'Invalid webhook signature'
        });
        
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Process different webhook events
    let processingResult;
    try {
      switch (event) {
        case 'track_updated':
        case 'track_delivered':
        case 'track_returned':
        case 'track_exception':
        case 'track_failure':
          processingResult = await processWebhookData(data);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
          break;
      }

      // Record successful event
      await webhookManager.recordWebhookEvent({
        type: event,
        tracking_number: tracking_number || 'unknown',
        carrier: carrier || 'unknown',
        status: tracking_status || 'unknown',
        timestamp: new Date(),
        success: true
      });

      const processingTime = Date.now() - startTime;
      console.log(`Webhook processed successfully in ${processingTime}ms:`, {
        event,
        tracking_number,
        processing_time: processingTime
      });

      return NextResponse.json({ 
        message: 'Webhook processed successfully',
        event,
        tracking_number,
        processing_time: processingTime,
        result: processingResult ? 'updated' : 'no_changes'
      });

    } catch (processingError) {
      // Record failed event
      await webhookManager.recordWebhookEvent({
        type: event,
        tracking_number: tracking_number || 'unknown',
        carrier: carrier || 'unknown',
        status: tracking_status || 'unknown',
        timestamp: new Date(),
        success: false,
        error: processingError instanceof Error ? processingError.message : 'Processing failed'
      });

      throw processingError;
    }
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Error processing Shippo webhook:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time: processingTime,
      ip: clientIP
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      processing_time: processingTime
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
    const crypto = await import('crypto');
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
