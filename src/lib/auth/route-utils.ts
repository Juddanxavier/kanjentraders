/** @format */

// Route definitions
export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signin',
  '/signup', 
  '/about',
  '/contact',
  '/help',
  '/privacy',
  '/terms',
  '/unauthorized'
] as const;

export const ADMIN_ROUTES = [
  '/admin'
] as const;

export const USER_PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/orders',
  '/track',
  '/billing',
  '/notifications'
] as const;

export const API_EXCLUDED_ROUTES = [
  '/api/auth',
  '/api/health',
  '/api/public'
] as const;

// Security headers
export const SECURITY_HEADERS = {
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
} as const;

// Route checking functions
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/')
  );
}

export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/')
  );
}

export function isUserProtectedRoute(pathname: string): boolean {
  return USER_PROTECTED_ROUTES.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/')
  );
}

export function isApiExcludedRoute(pathname: string): boolean {
  return API_EXCLUDED_ROUTES.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/')
  );
}

export function isProtectedRoute(pathname: string): boolean {
  return isUserProtectedRoute(pathname) || isAdminRoute(pathname);
}

// URL generation functions
export function getSigninRedirectUrl(pathname: string): string {
  const url = new URL('/signin', 'http://localhost:3000');
  url.searchParams.set('callbackUrl', pathname);
  return url.toString().replace('http://localhost:3000', '');
}

export function getUnauthorizedRedirectUrl(reason?: string): string {
  const url = new URL('/unauthorized', 'http://localhost:3000');
  if (reason) {
    url.searchParams.set('reason', reason);
  }
  return url.toString().replace('http://localhost:3000', '');
}

// Session validation functions
export function hasValidSessionCookie(cookies: any): boolean {
  const sessionCookie = cookies.get('better-auth.session_token');
  return !!sessionCookie?.value;
}

// User role checking functions
export function isAdmin(user: any): boolean {
  return user?.role === 'admin' || user?.role === 'super_admin';
}

export function isSuperAdmin(user: any): boolean {
  return user?.role === 'super_admin';
}

export function isBannedUser(user: any): boolean {
  return user?.banned === true;
}

// Logging functions
export function logSecurityEvent(event: string, details: any) {
  console.log(`🔐 [Security] ${event}:`, {
    ...details,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}

export function logAuthEvent(event: string, details: any) {
  console.log(`🔑 [Auth] ${event}:`, {
    ...details,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}

// Error handling
export function createAuthError(message: string, code?: string) {
  return {
    message,
    code: code || 'AUTH_ERROR',
    timestamp: new Date().toISOString(),
  };
}

// Middleware utilities
export function shouldSkipMiddleware(pathname: string): boolean {
  return (
    isApiExcludedRoute(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  );
}

// Types for better TypeScript support
export type PublicRoute = typeof PUBLIC_ROUTES[number];
export type AdminRoute = typeof ADMIN_ROUTES[number];
export type UserProtectedRoute = typeof USER_PROTECTED_ROUTES[number];
export type ApiExcludedRoute = typeof API_EXCLUDED_ROUTES[number];

export interface RouteConfig {
  publicRoutes: readonly string[];
  adminRoutes: readonly string[];
  userProtectedRoutes: readonly string[];
  apiExcludedRoutes: readonly string[];
}

export const routeConfig: RouteConfig = {
  publicRoutes: PUBLIC_ROUTES,
  adminRoutes: ADMIN_ROUTES,
  userProtectedRoutes: USER_PROTECTED_ROUTES,
  apiExcludedRoutes: API_EXCLUDED_ROUTES,
};
