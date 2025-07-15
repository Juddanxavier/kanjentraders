import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/parcels/route';
import { getServerSession } from '@/lib/services/sessionService';
import { type AuthUser } from '@/lib/auth/permissions';

// Mock dependencies
jest.mock('@/lib/services/sessionService');
jest.mock('@/lib/prisma', () => ({
  prisma: {
    parcel: {
      findMany: jest.fn(),
      create: jest.fn()
    }
  }
}));

describe('Parcels API Routes', () => {
  const mockUser: AuthUser = {
    id: '1',
    email: 'user@example.com',
    name: 'Test User',
    role: 'user',
    country: 'IN',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAdmin: AuthUser = {
    ...mockUser,
    id: '2',
    email: 'admin@example.com',
    role: 'admin'
  };

  const mockSuperAdmin: AuthUser = {
    ...mockUser,
    id: '3',
    email: 'superadmin@example.com',
    role: 'super_admin'
  };

  const createMockRequest = (method: string, body?: any) => {
    const request = new (NextRequest as any)(new URL('http://localhost:3000/api/parcels'), {
      method,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: body ? JSON.stringify(body) : undefined
    });
    return request;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/parcels', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const request = createMockRequest('GET');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return filtered parcels for regular users (only their own)', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });
      const request = createMockRequest('GET');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.parcels).toBeDefined();
      // Should only include parcels with userId matching the user
      data.parcels.forEach((parcel: any) => {
        expect(parcel.userId).toBe(mockUser.id);
      });
    });

    it('should return filtered parcels for admin (only their country)', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockAdmin });
      const request = createMockRequest('GET');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.parcels).toBeDefined();
      // Should only include parcels from admin's country
      data.parcels.forEach((parcel: any) => {
        expect(parcel.country).toBe(mockAdmin.country);
      });
    });

    it('should return all parcels for super admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockSuperAdmin });
      const request = createMockRequest('GET');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.parcels).toBeDefined();
      // Super admin should see parcels from all countries
    });

    it('should handle errors gracefully', async () => {
      (getServerSession as jest.Mock).mockRejectedValue(new Error('Database error'));
      const request = createMockRequest('GET');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/parcels', () => {
    const mockParcelData = {
      trackingNumber: 'TEST-001',
      senderName: 'John Doe',
      recipientName: 'Jane Doe',
      content: 'Documents'
    };

    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      const request = createMockRequest('POST', mockParcelData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when regular user tries to create parcel', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });
      const request = createMockRequest('POST', mockParcelData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden');
    });

    it('should allow admin to create parcel in their country', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockAdmin });
      const request = createMockRequest('POST', mockParcelData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.parcel).toBeDefined();
      expect(data.parcel.country).toBe(mockAdmin.country);
      expect(data.parcel.createdBy).toBe(mockAdmin.id);
    });

    it('should allow super admin to create parcel with specified country', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockSuperAdmin });
      const requestData = { ...mockParcelData, country: 'LK' };
      const request = createMockRequest('POST', requestData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.parcel).toBeDefined();
      expect(data.parcel.country).toBe('LK');
    });

    it('should force admin country for regular admin even if country is specified', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockAdmin });
      const requestData = { ...mockParcelData, country: 'LK' };
      const request = createMockRequest('POST', requestData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.parcel.country).toBe(mockAdmin.country); // Should be IN, not LK
    });

    it('should handle errors gracefully', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockAdmin });
      const request = createMockRequest('POST', {});
      
      // Mock JSON parsing error
      jest.spyOn(request, 'json').mockRejectedValue(new Error('Invalid JSON'));

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
