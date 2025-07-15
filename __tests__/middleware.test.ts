import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '@/middleware';
import { getServerSession } from '@/lib/services/sessionService';
import { type AuthUser } from '@/lib/auth/permissions';

// Mock dependencies
jest.mock('@/lib/services/sessionService');

describe('Middleware', () => {
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
    role: 'admin'
  };

  const mockSuperAdmin: AuthUser = {
    ...mockUser,
    id: '3',
    role: 'super_admin'
  };

  const createMockRequest = (pathname: string) => {
    return new (NextRequest as any)(new URL(`http://localhost:3000${pathname}`));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Public routes', () => {
    it('should allow access to public routes without authentication', async () => {
      const request = createMockRequest('/');
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await middleware(request);

      expect(response).toEqual(NextResponse.next());
    });

    it('should allow access to signin page without authentication', async () => {
      const request = createMockRequest('/signin');
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await middleware(request);

      expect(response).toEqual(NextResponse.next());
    });
  });

  describe('Dashboard route protection', () => {
    it('should redirect unauthenticated users to signin', async () => {
      const request = createMockRequest('/dashboard');
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await middleware(request);

      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/signin?callbackUrl=%2Fdashboard');
    });

    it('should allow authenticated users to access dashboard', async () => {
      const request = createMockRequest('/dashboard');
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });

      const response = await middleware(request);

      expect(response).toEqual(NextResponse.next());
    });
  });

  describe('Admin route protection', () => {
    it('should redirect unauthenticated users to signin', async () => {
      const request = createMockRequest('/admin');
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await middleware(request);

      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/signin?callbackUrl=%2Fadmin');
    });

    it('should redirect regular users to unauthorized page', async () => {
      const request = createMockRequest('/admin');
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });

      const response = await middleware(request);

      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/unauthorized');
    });

    it('should allow admin users to access admin routes', async () => {
      const request = createMockRequest('/admin');
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockAdmin });

      const response = await middleware(request);

      expect(response).toEqual(NextResponse.next());
    });

    it('should allow super admin users to access admin routes', async () => {
      const request = createMockRequest('/admin');
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockSuperAdmin });

      const response = await middleware(request);

      expect(response).toEqual(NextResponse.next());
    });

    it('should protect nested admin routes', async () => {
      const request = createMockRequest('/admin/users');
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });

      const response = await middleware(request);

      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/unauthorized');
    });
  });

  describe('Profile route protection', () => {
    it('should redirect unauthenticated users to signin', async () => {
      const request = createMockRequest('/profile');
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const response = await middleware(request);

      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/signin?callbackUrl=%2Fprofile');
    });

    it('should allow authenticated users to access profile', async () => {
      const request = createMockRequest('/profile');
      (getServerSession as jest.Mock).mockResolvedValue({ user: mockUser });

      const response = await middleware(request);

      expect(response).toEqual(NextResponse.next());
    });
  });

  describe('Error handling', () => {
    it('should redirect to signin on error for protected routes', async () => {
      const request = createMockRequest('/dashboard');
      (getServerSession as jest.Mock).mockRejectedValue(new Error('Auth error'));

      const response = await middleware(request);

      expect(response?.status).toBe(307);
      expect(response?.headers.get('location')).toContain('/signin');
    });

    it('should allow access to public routes even on error', async () => {
      const request = createMockRequest('/');
      (getServerSession as jest.Mock).mockRejectedValue(new Error('Auth error'));

      const response = await middleware(request);

      expect(response).toEqual(NextResponse.next());
    });
  });
});
