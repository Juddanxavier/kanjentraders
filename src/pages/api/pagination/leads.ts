/** @format */

import { NextApiRequest, NextApiResponse } from 'next';
import { PaginationService } from '@/lib/services/pagination-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      searchQuery,
      ...filters
    } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
      searchQuery: searchQuery as string,
      filters: {
        status: filters.status,
        origin: filters.origin,
        destination: filters.destination,
      },
    };

    const result = await PaginationService.paginateLeads(options);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Leads pagination error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}
