/** @format */

import { redisService } from './redis-enhanced';
import { prisma } from '../prisma';

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
  searchQuery?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class PaginationService {
  private static getCacheKey(
    table: string,
    options: PaginationOptions
  ): string {
    const { page, limit, sortBy, sortOrder, filters, searchQuery } = options;
    const filterKey = filters ? JSON.stringify(filters) : '';
    const searchKey = searchQuery || '';
    const sortKey = sortBy && sortOrder ? `${sortBy}_${sortOrder}` : '';
    
    return `pagination:${table}:${page}:${limit}:${sortKey}:${filterKey}:${searchKey}`;
  }

  private static getTotalCountCacheKey(
    table: string,
    filters?: Record<string, any>,
    searchQuery?: string
  ): string {
    const filterKey = filters ? JSON.stringify(filters) : '';
    const searchKey = searchQuery || '';
    return `pagination:count:${table}:${filterKey}:${searchKey}`;
  }

  /**
   * Generic pagination method with Redis caching
   */
  static async paginate<T>(
    table: string,
    options: PaginationOptions,
    queryBuilder: (options: PaginationOptions) => Promise<T[]>,
    countBuilder: (filters?: Record<string, any>, searchQuery?: string) => Promise<number>,
    cacheTTL: number = 300 // 5 minutes default
  ): Promise<PaginationResult<T>> {
    const { page, limit, filters, searchQuery } = options;
    
    // Generate cache keys
    const cacheKey = this.getCacheKey(table, options);
    const countCacheKey = this.getTotalCountCacheKey(table, filters, searchQuery);
    
    try {
      // Try to get cached data
      const cachedData = await redisService.get(cacheKey);
      const cachedCount = await redisService.get(countCacheKey);
      
      if (cachedData && cachedCount) {
        const data = JSON.parse(cachedData);
        const totalItems = parseInt(cachedCount);
        
        return {
          data,
          pagination: this.buildPaginationMetadata(page, limit, totalItems),
        };
      }
      
      // If not cached, fetch from database
      const [data, totalItems] = await Promise.all([
        queryBuilder(options),
        countBuilder(filters, searchQuery),
      ]);
      
      // Cache the results
      await Promise.all([
        redisService.set(cacheKey, JSON.stringify(data), cacheTTL),
        redisService.set(countCacheKey, totalItems.toString(), cacheTTL),
      ]);
      
      return {
        data,
        pagination: this.buildPaginationMetadata(page, limit, totalItems),
      };
    } catch (error) {
      console.error('Pagination service error:', error);
      
      // Fallback to direct database query
      const [data, totalItems] = await Promise.all([
        queryBuilder(options),
        countBuilder(filters, searchQuery),
      ]);
      
      return {
        data,
        pagination: this.buildPaginationMetadata(page, limit, totalItems),
      };
    }
  }

  /**
   * Invalidate cache for a specific table
   */
  static async invalidateCache(table: string): Promise<void> {
    try {
      const pattern = `pagination:${table}:*`;
      // Redis service handles pattern-based invalidation
      await redisService.invalidatePattern(pattern);
      
      // Also invalidate count cache
      const countPattern = `pagination:count:${table}:*`;
      await redisService.invalidatePattern(countPattern);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Build pagination metadata
   */
  private static buildPaginationMetadata(
    page: number,
    limit: number,
    totalItems: number
  ) {
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  /**
   * Leads pagination
   */
  static async paginateLeads(
    options: PaginationOptions
  ): Promise<PaginationResult<any>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', filters, searchQuery } = options;
    
    const queryBuilder = async (opts: PaginationOptions) => {
      const where: any = {};
      
      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          where.status = filters.status;
        }
        if (filters.origin && filters.origin !== 'all') {
          where.origin = filters.origin;
        }
        if (filters.destination && filters.destination !== 'all') {
          where.destination = filters.destination;
        }
      }
      
      // Apply search
      if (searchQuery) {
        where.OR = [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { phoneNumber: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
      
      return prisma.lead.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          shipment: {
            select: { id: true, whiteLabelTrackingId: true, status: true },
          },
        },
      });
    };
    
    const countBuilder = async (filters?: Record<string, any>, searchQuery?: string) => {
      const where: any = {};
      
      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          where.status = filters.status;
        }
        if (filters.origin && filters.origin !== 'all') {
          where.origin = filters.origin;
        }
        if (filters.destination && filters.destination !== 'all') {
          where.destination = filters.destination;
        }
      }
      
      // Apply search
      if (searchQuery) {
        where.OR = [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { phoneNumber: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
      
      return prisma.lead.count({ where });
    };
    
    return this.paginate('leads', options, queryBuilder, countBuilder, 180); // 3 minutes cache
  }

  /**
   * Users pagination
   */
  static async paginateUsers(
    options: PaginationOptions
  ): Promise<PaginationResult<any>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', filters, searchQuery } = options;
    
    const queryBuilder = async (opts: PaginationOptions) => {
      const where: any = {};
      
      // Apply filters
      if (filters) {
        if (filters.role && filters.role !== 'all') {
          where.role = filters.role;
        }
        if (filters.banned !== undefined) {
          where.banned = filters.banned;
        }
      }
      
      // Apply search
      if (searchQuery) {
        where.OR = [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
      
      return prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          banned: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              assignedLeads: true,
              createdLeads: true,
            },
          },
        },
      });
    };
    
    const countBuilder = async (filters?: Record<string, any>, searchQuery?: string) => {
      const where: any = {};
      
      // Apply filters
      if (filters) {
        if (filters.role && filters.role !== 'all') {
          where.role = filters.role;
        }
        if (filters.banned !== undefined) {
          where.banned = filters.banned;
        }
      }
      
      // Apply search
      if (searchQuery) {
        where.OR = [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
      
      return prisma.user.count({ where });
    };
    
    return this.paginate('users', options, queryBuilder, countBuilder, 300); // 5 minutes cache
  }

  /**
   * Shipments pagination
   */
  static async paginateShipments(
    options: PaginationOptions
  ): Promise<PaginationResult<any>> {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc', filters, searchQuery } = options;
    
    const queryBuilder = async (opts: PaginationOptions) => {
      const where: any = {};
      
      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          where.status = filters.status;
        }
        if (filters.carrier && filters.carrier !== 'all') {
          where.carrier = filters.carrier;
        }
      }
      
      // Apply search
      if (searchQuery) {
        where.OR = [
          { whiteLabelTrackingId: { contains: searchQuery, mode: 'insensitive' } },
          { trackingNumber: { contains: searchQuery, mode: 'insensitive' } },
          { carrier: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
      
      return prisma.shipment.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          lead: {
            select: { id: true, name: true, email: true, destination: true, origin: true },
          },
        },
      });
    };
    
    const countBuilder = async (filters?: Record<string, any>, searchQuery?: string) => {
      const where: any = {};
      
      // Apply filters
      if (filters) {
        if (filters.status && filters.status !== 'all') {
          where.status = filters.status;
        }
        if (filters.carrier && filters.carrier !== 'all') {
          where.carrier = filters.carrier;
        }
      }
      
      // Apply search
      if (searchQuery) {
        where.OR = [
          { whiteLabelTrackingId: { contains: searchQuery, mode: 'insensitive' } },
          { trackingNumber: { contains: searchQuery, mode: 'insensitive' } },
          { carrier: { contains: searchQuery, mode: 'insensitive' } },
        ];
      }
      
      return prisma.shipment.count({ where });
    };
    
    return this.paginate('shipments', options, queryBuilder, countBuilder, 60); // 1 minute cache
  }
}
