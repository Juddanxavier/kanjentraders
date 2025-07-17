import { redis } from '@/lib/services/redis-server';

// Initialize Shippo client - SERVER SIDE ONLY
let shippoClient: any = null;

async function getShippoClient() {
  if (!shippoClient) {
    const shippo = await import('shippo');
    shippoClient = shippo.default(process.env.SHIPPO_API_KEY!);
  }
  return shippoClient;
}

interface WebhookRegistration {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface WebhookConfig {
  url: string;
  events: string[];
  active?: boolean;
}

export class WebhookManager {
  private static instance: WebhookManager;
  private webhookCacheKey = 'shippo:webhooks';
  private webhookStatusKey = 'shippo:webhook_status';

  static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager();
    }
    return WebhookManager.instance;
  }

  /**
   * Register a new webhook with Shippo
   */
  async registerWebhook(config: WebhookConfig): Promise<WebhookRegistration> {
    try {
      const client = await getShippoClient();
      
      // Check if webhook already exists
      const existingWebhooks = await this.listWebhooks();
      const existingWebhook = existingWebhooks.find(w => w.url === config.url);
      
      if (existingWebhook) {
        console.log('Webhook already exists:', existingWebhook.id);
        return existingWebhook;
      }

      const webhook = await client.webhooks.create({
        url: config.url,
        events: config.events,
        active: config.active !== false,
      });

      console.log('Webhook registered successfully:', webhook.id);
      
      // Cache the webhook data
      await this.cacheWebhookData(webhook);
      
      return webhook;
    } catch (error) {
      console.error('Error registering webhook:', error);
      throw new Error(`Failed to register webhook: ${error}`);
    }
  }

  /**
   * List all registered webhooks
   */
  async listWebhooks(): Promise<WebhookRegistration[]> {
    try {
      // Try to get from cache first
      const cached = await redis.get(this.webhookCacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const client = await getShippoClient();
      const webhooks = await client.webhooks.list();
      
      // Cache the results
      await redis.setex(this.webhookCacheKey, 3600, JSON.stringify(webhooks.results || []));
      
      return webhooks.results || [];
    } catch (error) {
      console.error('Error listing webhooks:', error);
      throw new Error(`Failed to list webhooks: ${error}`);
    }
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(webhookId: string): Promise<WebhookRegistration | null> {
    try {
      const client = await getShippoClient();
      const webhook = await client.webhooks.get(webhookId);
      return webhook;
    } catch (error) {
      console.error('Error getting webhook:', error);
      return null;
    }
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(webhookId: string, config: Partial<WebhookConfig>): Promise<WebhookRegistration> {
    try {
      const client = await getShippoClient();
      const webhook = await client.webhooks.update(webhookId, config);
      
      // Invalidate cache
      await redis.del(this.webhookCacheKey);
      
      return webhook;
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw new Error(`Failed to update webhook: ${error}`);
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      const client = await getShippoClient();
      await client.webhooks.delete(webhookId);
      
      // Invalidate cache
      await redis.del(this.webhookCacheKey);
      
      return true;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      return false;
    }
  }

  /**
   * Test webhook connectivity
   */
  async testWebhook(webhookId: string): Promise<boolean> {
    try {
      const client = await getShippoClient();
      const result = await client.webhooks.test(webhookId);
      return result.success === true;
    } catch (error) {
      console.error('Error testing webhook:', error);
      return false;
    }
  }

  /**
   * Auto-register webhook with default configuration
   */
  async autoRegisterWebhook(baseUrl: string): Promise<WebhookRegistration> {
    const webhookUrl = `${baseUrl}/api/webhooks/shippo`;
    const defaultEvents = [
      'track_updated',
      'track_delivered',
      'track_returned',
      'track_exception',
      'track_failure'
    ];

    return await this.registerWebhook({
      url: webhookUrl,
      events: defaultEvents,
      active: true
    });
  }

  /**
   * Get webhook status and health
   */
  async getWebhookStatus(): Promise<{
    registered: boolean;
    active: boolean;
    lastSuccess?: string;
    lastError?: string;
    webhookId?: string;
  }> {
    try {
      const cached = await redis.get(this.webhookStatusKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const webhooks = await this.listWebhooks();
      const activeWebhook = webhooks.find(w => w.active);

      const status = {
        registered: webhooks.length > 0,
        active: !!activeWebhook,
        webhookId: activeWebhook?.id,
      };

      // Cache status for 5 minutes
      await redis.setex(this.webhookStatusKey, 300, JSON.stringify(status));
      
      return status;
    } catch (error) {
      console.error('Error getting webhook status:', error);
      return {
        registered: false,
        active: false,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cache webhook data with Redis
   */
  private async cacheWebhookData(webhook: WebhookRegistration): Promise<void> {
    try {
      const webhooks = await this.listWebhooks();
      const updatedWebhooks = [...webhooks.filter(w => w.id !== webhook.id), webhook];
      await redis.setex(this.webhookCacheKey, 3600, JSON.stringify(updatedWebhooks));
    } catch (error) {
      console.error('Error caching webhook data:', error);
    }
  }

  /**
   * Record webhook event for monitoring
   */
  async recordWebhookEvent(event: {
    type: string;
    tracking_number: string;
    carrier: string;
    status: string;
    timestamp: Date;
    success: boolean;
    error?: string;
  }): Promise<void> {
    try {
      const eventKey = `webhook:events:${event.tracking_number}`;
      const eventData = {
        ...event,
        timestamp: event.timestamp.toISOString()
      };

      // Store individual event
      await redis.lpush(eventKey, JSON.stringify(eventData));
      await redis.expire(eventKey, 86400 * 7); // Keep for 7 days

      // Update webhook status
      const statusKey = this.webhookStatusKey;
      const currentStatus = await redis.get(statusKey);
      let status = currentStatus ? JSON.parse(currentStatus) : {};

      if (event.success) {
        status.lastSuccess = event.timestamp.toISOString();
      } else {
        status.lastError = event.error || 'Unknown error';
      }

      await redis.setex(statusKey, 300, JSON.stringify(status));
    } catch (error) {
      console.error('Error recording webhook event:', error);
    }
  }

  /**
   * Get webhook events for a tracking number
   */
  async getWebhookEvents(trackingNumber: string): Promise<any[]> {
    try {
      const eventKey = `webhook:events:${trackingNumber}`;
      const events = await redis.lrange(eventKey, 0, -1);
      return events.map(event => JSON.parse(event));
    } catch (error) {
      console.error('Error getting webhook events:', error);
      return [];
    }
  }
}

// Export singleton instance
export const webhookManager = WebhookManager.getInstance();
