/** @format */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { phoneNumber } from 'better-auth/plugins/phone-number';
import { prisma } from '../prisma';

// Check environment variables
const authSecret = process.env.BETTER_AUTH_SECRET || 'dev-secret-please-change';
const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

export const auth = betterAuth({
  appName: 'Kajen Traders',
  baseURL,
  secret: authSecret,
  trustedOrigins: [baseURL, 'http://localhost:3000', 'http://localhost:3001'],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  onError: async (error, request) => {
    console.error('🚨 Better Auth Error:', {
      code: error.code,
      message: error.message,
      status: error.status,
      timestamp: new Date().toISOString(),
      url: request?.url,
      method: request?.method,
    });
    
    // Log specific error types
    if (error.code === 'DATABASE_ERROR') {
      console.error('Database connection issue:', error.cause);
    }
    
    if (error.code === 'INVALID_PASSWORD' || error.code === 'USER_NOT_FOUND') {
      console.log('Authentication attempt failed:', error.message);
    }
    
    if (error.code === 'SESSION_ERROR') {
      console.error('Session error:', error.message);
    }
  },
  emailAndPassword: {
    enabled: true,
  },
  providers: {
    emailAndPassword: {
      enabled: true,
      requiredEmailVerfication: false,
      minPasswordLength: 6,
      maxPasswordLength: 128,
      autoSignIn: false,
    },
  },
  user: {
    additionalFields: {
      avatar: {
        type: 'string',
        required: false,
      },
      country: {
        type: 'string',
        required: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },
  plugins: [
    admin(),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // Twilio configuration
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
          console.error('Twilio credentials not configured');
          throw new Error('SMS service not configured');
        }

        try {
          // In development, just log the OTP
          if (process.env.NODE_ENV === 'development') {
            console.log(`📱 DEV MODE - OTP for ${phoneNumber}: ${code}`);
            return;
          }

          // In production, send via Twilio
          const twilio = require('twilio')(accountSid, authToken);
          await twilio.messages.create({
            body: `Your Kajen Traders verification code is: ${code}. Valid for 5 minutes.`,
            from: fromNumber,
            to: phoneNumber
          });
        } catch (error) {
          console.error('Failed to send OTP:', error);
          throw new Error('Failed to send verification code');
        }
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      disableSignUp: false, // Allow new users to sign up with phone
      disableSession: false, // Ensure session creation is enabled
    }),
    nextCookies()
  ],
});
