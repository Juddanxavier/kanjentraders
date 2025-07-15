import {
  getServerSession,
  getClientSession,
  getUserRole,
  isAuthenticated,
  getRoleBasedRedirectPath
} from '@/lib/services/sessionService';
import { auth } from '@/lib/auth/auth';
import { authClient } from '@/lib/auth/auth-client';
import { type AuthUser } from '@/lib/auth/permissions';

// Mock the auth modules with proper structure
jest.mock('@/lib/auth/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('@/lib/auth/auth-client', () => ({
  authClient: {
    getSession: jest.fn(),
  },
}));

describe('SessionService', () => {
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

  const mockSession = {
    user: mockUser,
    session: {
      id: 'session1',
      expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
      token: 'mock-token'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getServerSession', () => {
    it('should return session data when user is authenticated', async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await getServerSession();
      
      expect(result).toEqual({
        user: mockUser,
        session: mockSession
      });
    });

    it('should return null when no session exists', async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      
      const result = await getServerSession();
      
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (auth.api.getSession as jest.Mock).mockRejectedValue(new Error('Auth error'));
      
      const result = await getServerSession();
      
      expect(result).toBeNull();
    });

    it('should use provided headers', async () => {
      const customHeaders = new Headers({ 'X-Custom': 'header' });
      (auth.api.getSession as jest.Mock).mockResolvedValue(mockSession);
      
      await getServerSession(customHeaders);
      
      expect(auth.api.getSession).toHaveBeenCalledWith({
        headers: customHeaders
      });
    });
  });

  describe('getClientSession', () => {
    it('should return session data when user is authenticated', async () => {
      (authClient.getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await getClientSession();
      
      expect(result).toEqual({
        user: mockUser,
        session: mockSession
      });
    });

    it('should return null when no session exists', async () => {
      (authClient.getSession as jest.Mock).mockResolvedValue(null);
      
      const result = await getClientSession();
      
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (authClient.getSession as jest.Mock).mockRejectedValue(new Error('Auth error'));
      
      const result = await getClientSession();
      
      expect(result).toBeNull();
    });
  });

  describe('getUserRole', () => {
    it('should return user role from server session', async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const role = await getUserRole(false);
      
      expect(role).toBe('user');
    });

    it('should return user role from client session', async () => {
      (authClient.getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const role = await getUserRole(true);
      
      expect(role).toBe('user');
    });

    it('should return null when no session exists', async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      
      const role = await getUserRole(false);
      
      expect(role).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated (server)', async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await isAuthenticated(false);
      
      expect(result).toBe(true);
    });

    it('should return true when user is authenticated (client)', async () => {
      (authClient.getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const result = await isAuthenticated(true);
      
      expect(result).toBe(true);
    });

    it('should return false when no session exists', async () => {
      (auth.api.getSession as jest.Mock).mockResolvedValue(null);
      
      const result = await isAuthenticated(false);
      
      expect(result).toBe(false);
    });
  });

  describe('getRoleBasedRedirectPath', () => {
    it('should return /admin for admin role', () => {
      expect(getRoleBasedRedirectPath('admin')).toBe('/admin');
    });

    it('should return /admin for super_admin role', () => {
      expect(getRoleBasedRedirectPath('super_admin')).toBe('/admin');
    });

    it('should return /dashboard for user role', () => {
      expect(getRoleBasedRedirectPath('user')).toBe('/dashboard');
    });

    it('should return /signin for null role', () => {
      expect(getRoleBasedRedirectPath(null)).toBe('/signin');
    });
  });
});
