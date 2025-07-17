/** @format */
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/auth-server';

/**
 * ADMIN LAYOUT - Renders the admin panel with proper session validation
 * 
 * Security is handled by middleware + additional server-side checks
 * This layout validates permissions and renders the admin UI
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Additional server-side security check
const session = await getSession();
  
  // Double-check admin access (middleware should have already handled this)
  if (!session?.user) {
    redirect('/signin?error=session_required');
  }
  
  const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
  if (!isAdmin) {
    redirect('/unauthorized');
  }
  
  // Log admin access for security audit
  console.log('🔐 Admin Access:', {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role,
    timestamp: new Date().toISOString(),
  });
  
  return (
    <>
      {children}
    </>
  );
}

/**
 * SECURITY FEATURES:
 * 
 * 1. Full database session validation
 * 2. Admin role verification
 * 3. Account ban status check (handled by middleware)
 * 4. Secure error handling
 * 5. Audit logging
 * 6. Graceful fallback redirects
 * 
 * INTEGRATION:
 * - Works with shadcn dashboard template
 * - Preserves existing dashboard UI
 * - Maintains security standards
 * - Provides clean admin interface
 */
