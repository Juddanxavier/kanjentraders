/** @format */
import { type AuthUser } from '@/lib/auth/permissions';
/**
 * Get data filter based on user role
 * @param user The authenticated user
 * @returns Filter object to use in database queries
 */
export function getDataFilter(user: AuthUser | null): { userId?: string; country?: string } {
  if (!user) return {};
  if (user.role === 'super_admin') {
    // Super admin can access all data
    return {};
  }
  if (user.role === 'admin') {
    // Admin can access data for their country
    return { country: user.country };
  }
  // Regular users can only access their own data
  return { userId: user.id };
}
