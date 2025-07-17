/** @format */

/**
 * NEXTAUTH.JS PERMISSIONS SYSTEM
 * 
 * This file defines the role-based access control system for NextAuth.js.
 * It provides utility functions for checking user permissions and roles.
 */

// User roles
export type UserRole = 'user' | 'admin' | 'super_admin';

// User type for auth operations
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  country?: string | null;
  banned?: boolean;
  image?: string | null;
  createdAt?: Date | string;
}

/**
 * Check if a user can manage other users
 */
export function canManageUsers(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Check if a user can manage parcels/shipments
 */
export function canManageParcels(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Check if a user is a super admin
 */
export function isSuperAdmin(user: AuthUser): boolean {
  return user.role === 'super_admin';
}

/**
 * Check if a user is an admin (including super admin)
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Get country filter for data queries
 * Super admins can access all countries, regular admins only their own
 */
export function getCountryFilter(user: AuthUser): string | null {
  if (user.role === 'super_admin') {
    return null; // No filter - access all countries
  }
  
  if (user.role === 'admin') {
    return user.country || null;
  }
  
  return user.country || null;
}

/**
 * Check if a user can access a specific country's data
 */
export function canAccessCountry(user: AuthUser, country: string): boolean {
  if (user.role === 'super_admin') {
    return true; // Super admins can access all countries
  }
  
  return user.country === country;
}

/**
 * Check if a user has a specific role
 */
export function hasRole(user: AuthUser, role: UserRole): boolean {
  if (role === 'super_admin') {
    return user.role === 'super_admin';
  }
  
  if (role === 'admin') {
    return user.role === 'admin' || user.role === 'super_admin';
  }
  
  return true; // All users have 'user' role
}

/**
 * Get user's permission level as a number (higher = more permissions)
 */
export function getPermissionLevel(user: AuthUser): number {
  switch (user.role) {
    case 'super_admin':
      return 3;
    case 'admin':
      return 2;
    case 'user':
    default:
      return 1;
  }
}

/**
 * Check if user A can manage user B
 */
export function canManageUser(userA: AuthUser, userB: AuthUser): boolean {
  const levelA = getPermissionLevel(userA);
  const levelB = getPermissionLevel(userB);
  
  // Can only manage users with lower or equal permission level
  // But super admins can manage anyone
  if (userA.role === 'super_admin') {
    return true;
  }
  
  // Regular admins can manage users but not other admins
  if (userA.role === 'admin' && userB.role !== 'admin' && userB.role !== 'super_admin') {
    return true;
  }
  
  return false;
}

/**
 * Default permissions for new users
 */
export const DEFAULT_USER_ROLE: UserRole = 'user';
