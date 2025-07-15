/** @format */

import type { Session } from 'better-auth/types';

export type UserRole = 'user' | 'admin' | 'super_admin';

type SessionUser = Session['user'];

export interface AuthUser extends SessionUser {
  role: UserRole;
  country: string;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user is at least an admin (admin or super_admin)
 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin';
}

/**
 * Check if user can access data from a specific country
 */
export function canAccessCountry(user: AuthUser | null, country: string): boolean {
  if (!user) return false;
  
  // Super admin can access all countries
  if (user.role === 'super_admin') return true;
  
  // Admin and regular users can only access their own country
  return user.country === country;
}

/**
 * Get the country filter for database queries
 * Returns null for super_admin (no filter), otherwise returns user's country
 */
export function getCountryFilter(user: AuthUser | null): string | null {
  if (!user) return null;
  
  // Super admin sees all countries
  if (user.role === 'super_admin') return null;
  
  // Everyone else sees only their country
  return user.country;
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(user: AuthUser | null, targetUserCountry?: string): boolean {
  if (!user) return false;
  
  // Super admin can manage all users
  if (user.role === 'super_admin') return true;
  
  // Admin can manage users in their country only
  if (user.role === 'admin') {
    return !targetUserCountry || user.country === targetUserCountry;
  }
  
  // Regular users cannot manage other users
  return false;
}

/**
 * Check if user can create/edit parcels
 */
export function canManageParcels(user: AuthUser | null): boolean {
  if (!user) return false;
  
  // Only admins (including super admin) can manage parcels
  return isAdmin(user);
}

/**
 * Check if user can view a specific parcel
 */
export function canViewParcel(user: AuthUser | null, parcel: { userId?: string; country: string }): boolean {
  if (!user) return false;
  
  // Super admin can view all parcels
  if (user.role === 'super_admin') return true;
  
  // Admin can view all parcels in their country
  if (user.role === 'admin' && user.country === parcel.country) return true;
  
  // Regular users can only view their own parcels
  if (user.role === 'user' && parcel.userId === user.id) return true;
  
  return false;
}

/**
 * Get filter for parcel queries based on user role
 */
export function getParcelFilter(user: AuthUser | null): { userId?: string; country?: string } | null {
  if (!user) return null;
  
  // Super admin sees all parcels
  if (user.role === 'super_admin') return {};
  
  // Admin sees all parcels in their country
  if (user.role === 'admin') return { country: user.country };
  
  // Regular users see only their own parcels
  return { userId: user.id };
}

/**
 * Example usage in API routes or server components:
 * 
 * const session = await auth.api.getSession({ headers });
 * const user = session?.user as AuthUser;
 * 
 * // Check permissions
 * if (!canManageParcels(user)) {
 *   return new Response('Unauthorized', { status: 401 });
 * }
 * 
 * // Get country filter for queries
 * const countryFilter = getCountryFilter(user);
 * const parcels = await prisma.parcel.findMany({
 *   where: countryFilter ? { country: countryFilter } : undefined
 * });
 */
