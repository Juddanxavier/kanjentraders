/** @format */

import { createAuthClient } from 'better-auth/react';
import { adminClient, phoneNumberClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [adminClient(), phoneNumberClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
