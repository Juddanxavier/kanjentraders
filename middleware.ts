/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from './src/lib/auth/auth';
import {
  isPublicRoute,
  isAdminRoute,
  isUserProtectedRoute,
  isProtectedRoute,
  shouldSkipMiddleware,
  getSigninRedirectUrl,
  isAdmin,
  isBannedUser,
  logSecurityEvent,
  logAuthEvent,
  SECURITY_HEADERS,
} from './src/lib/auth/route-utils';

/**
 * Enhanced Better-Auth Middleware
 * 
 * Features:
 * - Full session validation via better-auth
 * - Role-based access control
 * - Security headers
 * - Audit logging
 * - Banned user protection
 * - Comprehensive error handling
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  console.log('\n=== MIDDLEWARE START ===');
  console.log('🔍 Processing:', pathname);

  // Apply security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip checks for API/static files
  if (shouldSkipMiddleware(pathname)) {
    console.log('⏭️  Skipping API/static route');
    console.log('=== MIDDLEWARE END ===\n');
    return response;
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    console.log('🌐 Public route allowed');
    console.log('=== MIDDLEWARE END ===\n');
    return response;
  }

  // For all protected routes, we need a session.
  if (isProtectedRoute(pathname)) {
    try {
      console.log('🔐 Checking session...');
      const session = await auth.api.getSession({ headers: request.headers });

      // If no valid session, redirect to signin
      if (!session?.user) {
        console.log('❌ No valid session found');
        const redirectUrl = getSigninRedirectUrl(pathname);
        console.log('↪️  Redirecting to:', redirectUrl);
        console.log('=== MIDDLEWARE END ===\n');
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
      
      // --- Authorization Checks ---
      const isBanned = session.user.banned;
      const isAdmin = session.user.role === 'admin' || session.user.role === 'super_admin';
      const userRole = session.user.role || 'user';

      console.log('👤 User Info:', {
        userId: session.user.id,
        email: session.user.email,
        role: userRole,
        isAdmin: isAdmin,
        isBanned: isBanned
      });

      // Block banned users
      if (isBanned) {
        console.log('🚫 User is banned');
        console.log('=== MIDDLEWARE END ===\n');
        return NextResponse.redirect(new URL('/signin?error=account_banned', request.url));
      }

      // Redirect /admin to /admin/dashboard for consistency
      if (pathname === '/admin') {
        console.log('↪️  Redirecting /admin to /admin/dashboard');
        console.log('=== MIDDLEWARE END ===\n');
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }

      // ADMIN ROUTE: Requires admin role
      if (isAdminRoute(pathname)) {
        console.log('🔒 Admin route detected');
        if (!isAdmin) {
          console.log('❌ User is not admin, redirecting to unauthorized');
          console.log('=== MIDDLEWARE END ===\n');
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
        console.log('✅ Admin access granted');
      }

      // USER ROUTE: Any valid user (including admins) can access.
      if (isUserProtectedRoute(pathname)) {
        console.log('👥 User route detected, access granted');
      }

      // All checks passed, allow access
      console.log('✅ All checks passed, allowing access');
      console.log('=== MIDDLEWARE END ===\n');
      return response;

    } catch (error: any) {
      console.error('❌ Middleware session error:', error);
      console.error('Error details:', {
        message: error?.message,
        name: error?.name
      });
      console.log('=== MIDDLEWARE END (ERROR) ===\n');
      
      // If it's a signin or signup page, allow access even with error
      if (pathname === '/signin' || pathname === '/signup') {
        return response;
      }
      
      return NextResponse.redirect(new URL('/signin?error=session_error', request.url));
    }
  }

  // Default: allow access
  console.log('✅ Default access granted');
  console.log('=== MIDDLEWARE END ===\n');
  return response;
}

// Apply middleware to all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
