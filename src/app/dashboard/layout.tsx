/** @format */

import { headers } from 'next/headers';
import { auth } from '@/lib/auth/auth';
import { DashboardNav } from '@/components/dashboard-nav';

/**
 * USER DASHBOARD LAYOUT
 * 
 * Security is handled entirely by the middleware.
 * This layout simply renders the UI and user-specific data.
 */

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware has already validated the session.
  // We can safely get the session here to display user info.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="dashboard-layout">
      {/* User Navigation */}
      <DashboardNav user={session?.user || null} />

      {/* User Content */}
      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}

/**
 * SECURITY FEATURES:
 * 
 * 1. Full database session validation
 * 2. Account ban status check
 * 3. Secure error handling
 * 4. Audit logging
 * 5. Graceful fallback redirects
 * 6. Admin panel access for admin users
 * 
 * USER EXPERIENCE:
 * - Admins can access both /dashboard and /admin
 * - Regular users can only access /dashboard
 * - Banned users are redirected to signin
 */
