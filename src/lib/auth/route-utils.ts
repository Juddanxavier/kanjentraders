/** @format */

/**
 * Secure route utilities for Better Auth middleware
 * This file contains all route matching and security logic
 */

// Session cookie name - must match your auth config
export const SESSION_COOKIE_NAME = 'kajen-traders-session';

// Route definitions - ADD NEW ROUTES HERE
export const ROUTE_CONFIG = {
  // Public routes - no authentication required
  public: [
    '/',
    '/signin',
    '/signup',
    '/about',
    '/contact',
    '/help',
    '/privacy',
    '/terms'
  ],

  // User protected routes - authenticated users only
  userProtected: [
    '/dashboard',
    '/profile',
    '/settings',
    '/orders',
    '/track',
    '/notifications',
    '/billing'
  ],

  // Admin only routes - admin role required
  adminOnly: [
    '/admin'
  ],

  // API routes that should be excluded from middleware
  apiExcluded: [
    '/api/auth',
    '/api/public'
  ]
} as const;

/**
 * Check if route is public (no auth required)
 */
export function isPublicRoute(pathname: string): boolean {
  const isPublic = ROUTE_CONFIG.public.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/')
  );
  console.log('🌐 Route check - Public:', { pathname, isPublic, publicRoutes: ROUTE_CONFIG.public });
  return isPublic;
}

/**
 * Check if route requires user authentication
 */
export function isUserProtectedRoute(pathname: string): boolean {
  const isUserProtected = ROUTE_CONFIG.userProtected.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/')
  );
  console.log('👤 Route check - User Protected:', { pathname, isUserProtected, userRoutes: ROUTE_CONFIG.userProtected });
  return isUserProtected;
}

/**
 * Check if route requires admin authentication
 */
export function isAdminRoute(pathname: string): boolean {
  const isAdmin = ROUTE_CONFIG.adminOnly.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/')
  );
  console.log('🔒 Route check - Admin:', { pathname, isAdmin, adminRoutes: ROUTE_CONFIG.adminOnly });
  return isAdmin;
}

/**
 * Check if route should be excluded from middleware
 */
export function isApiExcludedRoute(pathname: string): boolean {
  const isExcluded = ROUTE_CONFIG.apiExcluded.some(route => 
    pathname.startsWith(route)
  );
  console.log('⚡ Route check - API Excluded:', { pathname, isExcluded, excludedRoutes: ROUTE_CONFIG.apiExcluded });
  return isExcluded;
}

/**
 * Get the appropriate signin redirect URL based on the attempted route
 */
export function getSigninRedirectUrl(pathname: string): string {
  if (isAdminRoute(pathname)) {
    return `/signin?callbackUrl=${encodeURIComponent(pathname)}&type=admin`;
  }
  
  if (isUserProtectedRoute(pathname)) {
    return `/signin?callbackUrl=${encodeURIComponent(pathname)}&type=user`;
  }
  
  return '/signin';
}

/**
 * Check if user has valid session cookie (fast check)
 */
export function hasValidSessionCookie(cookies: any): boolean {
  const sessionCookie = cookies.get(SESSION_COOKIE_NAME);
  
  console.log('🍪 Cookie validation:', {
    cookieName: SESSION_COOKIE_NAME,
    cookieExists: !!sessionCookie,
    cookieValue: sessionCookie ? '***' + sessionCookie.value.slice(-4) : 'none',
    cookieLength: sessionCookie?.value?.length || 0,
  });
  
  // Check if cookie exists and is not empty
  if (!sessionCookie || !sessionCookie.value) {
    console.log('❌ No session cookie found');
    return false;
  }
  
  // Basic validation - cookie should be a reasonable length
  if (sessionCookie.value.length < 10) {
    console.log('❌ Session cookie too short:', sessionCookie.value.length);
    return false;
  }
  
  console.log('✅ Valid session cookie found');
  return true;
}

/**
 * Route matcher for Next.js middleware config
 */
export const MIDDLEWARE_MATCHER = [
  /*
   * Match all request paths except:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public files (public folder)
   */
  '/((?!_next/static|_next/image|favicon.ico|public/).*)',
];

/**
 * Security headers for enhanced protection
 */
export const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
} as const;
