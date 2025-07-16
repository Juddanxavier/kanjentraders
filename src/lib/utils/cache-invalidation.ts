/** @format */

import { PaginationService } from '@/lib/services/pagination-service';

export class CacheInvalidator {
  /**
   * Invalidate cache when leads data changes
   */
  static async invalidateLeadsCache(): Promise<void> {
    await PaginationService.invalidateCache('leads');
  }

  /**
   * Invalidate cache when users data changes
   */
  static async invalidateUsersCache(): Promise<void> {
    await PaginationService.invalidateCache('users');
  }

  /**
   * Invalidate cache when shipments data changes
   */
  static async invalidateShipmentsCache(): Promise<void> {
    await PaginationService.invalidateCache('shipments');
  }

  /**
   * Invalidate all pagination caches
   */
  static async invalidateAllCaches(): Promise<void> {
    await Promise.all([
      PaginationService.invalidateCache('leads'),
      PaginationService.invalidateCache('users'),
      PaginationService.invalidateCache('shipments'),
    ]);
  }
}

// Helper function to use in API routes for automatic cache invalidation
export function withCacheInvalidation(
  handler: (req: any, res: any) => Promise<any>,
  tables: ('leads' | 'users' | 'shipments')[]
) {
  return async (req: any, res: any) => {
    try {
      const result = await handler(req, res);
      
      // Invalidate caches for specified tables after successful operations
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
        await Promise.all(
          tables.map(table => PaginationService.invalidateCache(table))
        );
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };
}
