#!/usr/bin/env node

/**
 * Startup script to automatically register webhooks with Shippo
 * This script should be run during application startup or deployment
 */

const { webhookManager } = require('../src/lib/services/webhookManager');
const { config } = require('dotenv');

// Load environment variables
config();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
const WEBHOOK_SECRET = process.env.SHIPPO_WEBHOOK_SECRET;

async function registerWebhooksOnStartup() {
  console.log('🚀 Starting webhook registration...');
  
  try {
    // Check if webhook is already registered
    const status = await webhookManager.getWebhookStatus();
    
    if (status.registered && status.active) {
      console.log('✅ Webhook is already registered and active');
      console.log(`   Webhook ID: ${status.webhookId}`);
      return;
    }
    
    // Auto-register webhook
    const webhook = await webhookManager.autoRegisterWebhook(APP_URL);
    
    console.log('✅ Webhook registered successfully');
    console.log(`   ID: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   Events: ${webhook.events.join(', ')}`);
    console.log(`   Active: ${webhook.active}`);
    
    // Test the webhook
    console.log('\n🔍 Testing webhook connectivity...');
    const testResult = await webhookManager.testWebhook(webhook.id);
    
    if (testResult) {
      console.log('✅ Webhook test passed');
    } else {
      console.log('⚠️  Webhook test failed - please check your endpoint');
    }
    
    // Log webhook security status
    if (WEBHOOK_SECRET) {
      console.log('🔐 Webhook signature verification is enabled');
    } else {
      console.log('⚠️  Webhook signature verification is disabled. Set SHIPPO_WEBHOOK_SECRET for better security');
    }
    
  } catch (error) {
    console.error('❌ Failed to register webhook:', error.message);
    
    // Don't fail the application startup for webhook registration errors
    console.log('⚠️  Application will continue without webhook registration');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  registerWebhooksOnStartup()
    .then(() => {
      console.log('\n🎉 Webhook registration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Webhook registration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { registerWebhooksOnStartup };
