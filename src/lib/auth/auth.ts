/** @format */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { phoneNumber } from 'better-auth/plugins/phone-number';
import { prisma } from '../db';
import Redis from 'ioredis';

// Environment validation
const authSecret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

// Redis configuration (optional)
let redis: Redis | null = null;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
  
  // Test connection
  redis.ping().catch(() => {
    console.warn('⚠️ Redis connection failed, session store will fallback to database');
    redis = null;
  });
} catch (error) {
  console.warn('⚠️ Redis not available, session store will fallback to database');
  redis = null;
}

// Debug environment loading
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Auth Environment Debug:', {
    hasSecret: !!authSecret,
    secretLength: authSecret?.length || 0,
    baseURL,
    nodeEnv: process.env.NODE_ENV,
  });
}

if (!authSecret) {
  console.error('❌ BETTER_AUTH_SECRET is missing from environment variables');
  throw new Error('BETTER_AUTH_SECRET is required. Please check your .env.local file.');
}

if (authSecret.length < 32) {
  console.error('❌ BETTER_AUTH_SECRET is too short:', authSecret.length);
  throw new Error('BETTER_AUTH_SECRET must be at least 32 characters long');
}

// Main auth configuration
export const auth = betterAuth({
  appName: 'Kajen Traders',
  baseURL,
  secret: authSecret,
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://localhost:3001',
  ],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
    // Use Redis for session storage if available, otherwise fallback to database
    ...(redis && {
      store: {
        get: async (key: string) => {
          try {
            const value = await redis!.get(`session:${key}`);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.error('Redis get error:', error);
            return null;
          }
        },
        set: async (key: string, value: any, ttl?: number) => {
          try {
            const serialized = JSON.stringify(value);
            if (ttl) {
              await redis!.setex(`session:${key}`, ttl, serialized);
            } else {
              await redis!.set(`session:${key}`, serialized);
            }
          } catch (error) {
            console.error('Redis set error:', error);
          }
        },
        delete: async (key: string) => {
          try {
            await redis!.del(`session:${key}`);
          } catch (error) {
            console.error('Redis delete error:', error);
          }
        },
      },
    }),
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
    disableCSRFCheck: false,
  },
  onError: async (error, request) => {
    console.error('🚨 Better Auth Error:', {
      code: error.code,
      message: error.message,
      status: error.status,
      timestamp: new Date().toISOString(),
      url: request?.url,
      method: request?.method,
    });
  },
  plugins: [
    nextCookies(),
    admin({
      defaultRole: 'user',
      roleField: 'role',
    }),
    phoneNumber({
      otpLength: 6,
      expiresIn: 60 * 5, // 5 minutes
      async sendOTP({ phoneNumber, code }) {
        // SMS implementation would go here
        console.log(`📱 SMS OTP for ${phoneNumber}: ${code}`);
        
        // In production, you would use Twilio or similar service:
        // const twilio = require('twilio');
        // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        // await client.messages.create({
        //   body: `Your verification code is: ${code}`,
        //   from: process.env.TWILIO_PHONE_NUMBER,
        //   to: phoneNumber,
        // });
      },
    }),
  ],
});

// Export types for better TypeScript support
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
