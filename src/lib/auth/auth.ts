/** @format */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { admin } from 'better-auth/plugins';
import { prisma } from '../prisma';

export const auth = betterAuth({
  appName: 'Kajen Traders',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  secret:
    process.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production-32chars',
  trustedOrigins: ['http://localhost:3000'],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
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
    },
  },
  session: {
    enabled: true,
    expiresIn: 60 * 60 * 24 * 7, // 30 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
    disableSessionRefresh: true,
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      cookieName: 'kajen-traders-session',
      defaultCookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    },
  },
  plugins: [admin(), nextCookies()],
});
