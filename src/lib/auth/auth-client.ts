/** @format */
'use client';
import { createAuthClient } from 'better-auth/react';
import { 
  adminClient, 
  phoneNumberClient
} from 'better-auth/client/plugins';

const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';

// Debug client configuration
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔍 Auth Client Debug:', {
    baseURL,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    cache: 'no-store',
  },
  plugins: [
    adminClient(),
    phoneNumberClient()
  ],
});

// Export the client and hooks
export const { 
  signIn, 
  signUp, 
  signOut, 
  useSession,
  getSession
} = authClient;

// Export admin methods
export const { 
  admin
} = authClient;

// Export phone number methods
export const { 
  phoneNumber
} = authClient;

// Export additional auth utilities
export const { 
  updateUser,
  changePassword,
  forgetPassword,
  resetPassword
} = authClient;
