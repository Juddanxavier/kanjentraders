#!/usr/bin/env node

const { Command } = require('commander');
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');

const program = new Command();

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const WEBHOOK_ENDPOINT = `${API_BASE_URL}/api/webhooks/manage`;

program
  .name('webhook-manager')
  .description('CLI tool for managing Shippo webhooks')
  .version('1.0.0');

// Register webhook command
program
  .command('register')
  .description('Register a new webhook with Shippo')
  .option('-u, --url <url>', 'Webhook URL')
  .option('-e, --events <events>', 'Comma-separated list of events', 'track_updated,track_delivered,track_returned')
  .option('-a, --auto', 'Auto-register with default settings')
  .action(async (options) => {
    const spinner = ora('Registering webhook...').start();
    
    try {
      let payload;
      
      if (options.auto) {
        payload = {
          action: 'auto_register',
          base_url: API_BASE_URL
        };
      } else {
        if (!options.url) {
          spinner.fail('URL is required for manual registration');
          return;
        }
        
        payload = {
          action: 'register',
          url: options.url,
          events: options.events.split(',').map(e => e.trim()),
          active: true
        };
      }
      
      const response = await axios.post(WEBHOOK_ENDPOINT, payload);
      
      spinner.succeed('Webhook registered successfully');
      console.log(chalk.green('\n✓ Webhook Details:'));
      console.log(`  ID: ${response.data.webhook.id}`);
      console.log(`  URL: ${response.data.webhook.url}`);
      console.log(`  Events: ${response.data.webhook.events.join(', ')}`);
      console.log(`  Active: ${response.data.webhook.active}`);
      
    } catch (error) {
      spinner.fail('Failed to register webhook');
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
    }
  });

// List webhooks command
program
  .command('list')
  .description('List all registered webhooks')
  .action(async () => {
    const spinner = ora('Fetching webhooks...').start();
    
    try {
      const response = await axios.get(`${WEBHOOK_ENDPOINT}?action=list`);
      const webhooks = response.data.webhooks;
      
      spinner.succeed(`Found ${webhooks.length} webhook(s)`);
      
      if (webhooks.length === 0) {
        console.log(chalk.yellow('\nNo webhooks registered'));
        return;
      }
      
      console.log(chalk.blue('\n📋 Registered Webhooks:'));
      webhooks.forEach((webhook, index) => {
        console.log(`\n${index + 1}. ${webhook.id}`);
        console.log(`   URL: ${webhook.url}`);
        console.log(`   Events: ${webhook.events.join(', ')}`);
        console.log(`   Active: ${webhook.active ? chalk.green('✓') : chalk.red('✗')}`);
        console.log(`   Created: ${new Date(webhook.created_at).toLocaleString()}`);
      });
      
    } catch (error) {
      spinner.fail('Failed to fetch webhooks');
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
    }
  });

// Status command
program
  .command('status')
  .description('Check webhook status and health')
  .action(async () => {
    const spinner = ora('Checking webhook status...').start();
    
    try {
      const response = await axios.get(`${WEBHOOK_ENDPOINT}?action=status`);
      const status = response.data;
      
      spinner.succeed('Webhook status retrieved');
      
      console.log(chalk.blue('\n📊 Webhook Status:'));
      console.log(`  Registered: ${status.registered ? chalk.green('✓') : chalk.red('✗')}`);
      console.log(`  Active: ${status.active ? chalk.green('✓') : chalk.red('✗')}`);
      
      if (status.webhookId) {
        console.log(`  Webhook ID: ${status.webhookId}`);
      }
      
      if (status.lastSuccess) {
        console.log(`  Last Success: ${new Date(status.lastSuccess).toLocaleString()}`);
      }
      
      if (status.lastError) {
        console.log(`  Last Error: ${chalk.red(status.lastError)}`);
      }
      
    } catch (error) {
      spinner.fail('Failed to check webhook status');
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
    }
  });

// Test webhook command
program
  .command('test <webhook_id>')
  .description('Test webhook connectivity')
  .action(async (webhookId) => {
    const spinner = ora('Testing webhook...').start();
    
    try {
      const response = await axios.post(WEBHOOK_ENDPOINT, {
        action: 'test',
        webhook_id: webhookId
      });
      
      if (response.data.success) {
        spinner.succeed('Webhook test passed');
        console.log(chalk.green('\n✓ Webhook is reachable and responding correctly'));
      } else {
        spinner.fail('Webhook test failed');
        console.log(chalk.red('\n✗ Webhook is not responding correctly'));
      }
      
    } catch (error) {
      spinner.fail('Failed to test webhook');
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
    }
  });

// Events command
program
  .command('events <tracking_number>')
  .description('Get webhook events for a tracking number')
  .action(async (trackingNumber) => {
    const spinner = ora('Fetching webhook events...').start();
    
    try {
      const response = await axios.get(`${WEBHOOK_ENDPOINT}?action=events&tracking_number=${trackingNumber}`);
      const events = response.data.events;
      
      spinner.succeed(`Found ${events.length} event(s)`);
      
      if (events.length === 0) {
        console.log(chalk.yellow('\nNo webhook events found for this tracking number'));
        return;
      }
      
      console.log(chalk.blue(`\n📦 Webhook Events for ${trackingNumber}:`));
      events.forEach((event, index) => {
        const statusColor = event.success ? chalk.green : chalk.red;
        const statusIcon = event.success ? '✓' : '✗';
        
        console.log(`\n${index + 1}. ${statusColor(statusIcon)} ${event.type}`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Carrier: ${event.carrier}`);
        console.log(`   Timestamp: ${new Date(event.timestamp).toLocaleString()}`);
        
        if (event.error) {
          console.log(`   Error: ${chalk.red(event.error)}`);
        }
      });
      
    } catch (error) {
      spinner.fail('Failed to fetch webhook events');
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
    }
  });

// Delete webhook command
program
  .command('delete <webhook_id>')
  .description('Delete a webhook')
  .action(async (webhookId) => {
    const spinner = ora('Deleting webhook...').start();
    
    try {
      await axios.delete(`${WEBHOOK_ENDPOINT}?webhook_id=${webhookId}`);
      
      spinner.succeed('Webhook deleted successfully');
      console.log(chalk.green(`\n✓ Webhook ${webhookId} has been deleted`));
      
    } catch (error) {
      spinner.fail('Failed to delete webhook');
      console.error(chalk.red('Error:'), error.response?.data?.message || error.message);
    }
  });

// Monitor command
program
  .command('monitor')
  .description('Monitor webhook activity in real-time')
  .option('-i, --interval <seconds>', 'Polling interval in seconds', '30')
  .action(async (options) => {
    const interval = parseInt(options.interval) * 1000;
    
    console.log(chalk.blue('🔍 Starting webhook monitoring...'));
    console.log(chalk.gray(`Polling every ${options.interval} seconds. Press Ctrl+C to stop.\n`));
    
    const monitor = async () => {
      try {
        const response = await axios.get(WEBHOOK_ENDPOINT);
        const { status, webhooks } = response.data;
        
        console.clear();
        console.log(chalk.blue('📊 Webhook Monitor - ' + new Date().toLocaleString()));
        console.log(chalk.gray('━'.repeat(60)));
        
        console.log(`Status: ${status.registered ? chalk.green('✓ Registered') : chalk.red('✗ Not Registered')}`);
        console.log(`Active: ${status.active ? chalk.green('✓ Active') : chalk.red('✗ Inactive')}`);
        console.log(`Total Webhooks: ${webhooks.length}`);
        
        if (status.lastSuccess) {
          console.log(`Last Success: ${chalk.green(new Date(status.lastSuccess).toLocaleString())}`);
        }
        
        if (status.lastError) {
          console.log(`Last Error: ${chalk.red(status.lastError)}`);
        }
        
        if (webhooks.length > 0) {
          console.log('\nWebhooks:');
          webhooks.forEach((webhook, index) => {
            const statusIcon = webhook.active ? chalk.green('✓') : chalk.red('✗');
            console.log(`  ${index + 1}. ${statusIcon} ${webhook.id.substring(0, 8)}...`);
          });
        }
        
      } catch (error) {
        console.error(chalk.red('Monitor error:'), error.response?.data?.message || error.message);
      }
    };
    
    // Initial run
    await monitor();
    
    // Set up interval
    const intervalId = setInterval(monitor, interval);
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(intervalId);
      console.log(chalk.yellow('\n\nMonitoring stopped'));
      process.exit(0);
    });
  });

program.parse();
