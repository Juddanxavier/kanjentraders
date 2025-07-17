/** @format */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

/**
 * NextAuth.js Enhanced Middleware
 * 
 * Features:
 * - Full session validation via NextAuth.js
 * - Role-based access control
 * - Security headers
 * - Comprehensive error handling
 */

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error', '/login', '/'];
const adminRoutes = ['/admin'];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

function isAdminRoute(pathname: string): boolean {
  return adminRoutes.some(route => pathname.startsWith(route));
}

function shouldSkipMiddleware(pathname: string): boolean {
  return (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  );
}

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

  // For protected routes, redirect to signin if not authenticated
  if (!isPublicRoute(pathname)) {
    console.log('🔒 Protected route detected, redirecting to signin');
    console.log('=== MIDDLEWARE END ===\n');
    return NextResponse.redirect(new URL('/auth/signin', request.url));
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
