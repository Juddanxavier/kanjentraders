import { getDataFilter } from '@/lib/services/dataFilter';
import { type AuthUser } from '@/lib/auth/permissions';

describe('DataFilter Service', () => {
  const mockUser: AuthUser = {
    id: 'user1',
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
    id: 'admin1',
    email: 'admin@example.com',
    role: 'admin'
  };

  const mockSuperAdmin: AuthUser = {
    ...mockUser,
    id: 'superadmin1',
    email: 'superadmin@example.com',
    role: 'super_admin'
  };

  describe('getDataFilter', () => {
    it('should return empty object for null user', () => {
      expect(getDataFilter(null)).toEqual({});
    });

    it('should return empty object for super_admin (no filters)', () => {
      expect(getDataFilter(mockSuperAdmin)).toEqual({});
    });

    it('should return country filter for admin', () => {
      expect(getDataFilter(mockAdmin)).toEqual({ country: 'IN' });
    });

    it('should return userId filter for regular user', () => {
      expect(getDataFilter(mockUser)).toEqual({ userId: 'user1' });
    });

    it('should handle different countries correctly', () => {
      const adminLK = { ...mockAdmin, country: 'LK' };
      expect(getDataFilter(adminLK)).toEqual({ country: 'LK' });
    });
  });
});
