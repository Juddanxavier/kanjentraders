/** @format */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/services/sessionService';
import { isAdmin } from '@/lib/auth/permissions';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

/**
 * Server Component wrapper for protected routes
 * Uses Better-Auth's session management
 */
export async function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  redirectTo = '/signin'
}: ProtectedRouteProps) {
  // Get session using Better-Auth
  const sessionData = await getServerSession();
  
  // No session = redirect to signin
  if (!sessionData) {
    redirect(`${redirectTo}?error=unauthenticated`);
  }
  
  // Check if session is still valid
  if (!sessionData.isValid) {
    redirect(`${redirectTo}?error=session_expired`);
  }
  
  // Check if user is banned
  if (sessionData.user.banned) {
    redirect(`${redirectTo}?error=account_banned`);
  }
  
  // Check admin requirement
  if (requireAdmin && !isAdmin(sessionData.user)) {
    redirect('/dashboard?error=unauthorized');
  }
  
  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Example usage in a page.tsx:
 * 
 * export default async function AdminPage() {
 *   return (
 *     <ProtectedRoute requireAdmin>
 *       <AdminDashboard />
 *     </ProtectedRoute>
 *   );
 * }
 */
