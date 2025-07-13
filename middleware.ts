/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from './src/lib/auth/auth';
import {
  isPublicRoute,
  isUserProtectedRoute,
  isAdminRoute,
  isApiExcludedRoute,
  getSigninRedirectUrl,
  hasValidSessionCookie,
  SECURITY_HEADERS,
} from './src/lib/auth/route-utils';

/**
 * FINAL, CONSISTENT, AND SECURE MIDDLEWARE
 * 
 * This middleware provides a centralized and consistent security model.
 * 
 * Security Strategy:
 * 1. Exclude API/static routes & allow public routes.
 * 2. For all other routes, perform a full session check.
 * 3. Based on the session, check permissions for the requested route.
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
  if (isApiExcludedRoute(pathname) || pathname.startsWith('/_next')) {
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
    const isAdmin = session.user.role === 'admin';
    const userRole = session.user.role || 'no role';

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

    // ADMIN ROUTE: Requires 'admin' role
    if (isAdminRoute(pathname)) {
      console.log('🔒 Admin route detected');
      if (!isAdmin) {
        console.log('❌ User is not admin, redirecting to dashboard');
        // User is not an admin, redirect to their dashboard
        const dashboardUrl = new URL('/dashboard', request.url);
        dashboardUrl.searchParams.set('error', 'unauthorized');
        console.log('↪️  Redirecting to:', dashboardUrl.toString());
        console.log('=== MIDDLEWARE END ===\n');
        return NextResponse.redirect(dashboardUrl);
      }
      console.log('✅ Admin access granted');
    }

    // USER ROUTE: Any valid user (including admins) can access.
    // No extra check is needed here since we've already verified the session.
    if (isUserProtectedRoute(pathname)) {
        console.log('👥 User route detected, access granted');
    }

    // All checks passed, allow access
    console.log('✅ All checks passed, allowing access');
    console.log('=== MIDDLEWARE END ===\n');
    return response;

  } catch (error) {
    console.error('❌ Middleware session error:', error);
    console.log('=== MIDDLEWARE END (ERROR) ===\n');
    return NextResponse.redirect(new URL('/signin?error=session_error', request.url));
  }
}

// Apply middleware to all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
