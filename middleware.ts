/** @format */

import { NextRequest, NextResponse } from 'next/server';
import {
  isPublicRoute,
  isUserProtectedRoute,
  isAdminRoute,
  isApiExcludedRoute,
  getSigninRedirectUrl,
  SECURITY_HEADERS,
  SESSION_COOKIE_NAME,
} from './src/lib/auth/route-utils';

/**
 * Cookie-based middleware without database calls
 * 
 * This middleware uses a fast cookie check for initial routing decisions.
 * Full session validation happens in page layouts.
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Apply security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip checks for API/static files
  if (isApiExcludedRoute(pathname) || pathname.startsWith('/_next')) {
    return response;
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  // For protected routes, check if session cookie exists
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie) {
    // Check if it's an admin route that needs special handling
    if (isAdminRoute(pathname)) {
      const signinUrl = new URL('/signin', request.url);
      signinUrl.searchParams.set('error', 'unauthorized');
      signinUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signinUrl);
    }
    
    // Regular protected route
    const redirectUrl = getSigninRedirectUrl(pathname);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Cookie exists, allow access
  // Full session validation and role checking will happen in the page layout
  return response;
}

// Apply middleware to all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
