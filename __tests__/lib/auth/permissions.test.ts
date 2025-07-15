import {
  hasRole,
  isAdmin,
  isSuperAdmin,
  canAccessCountry,
  getCountryFilter,
  canManageUsers,
  canManageParcels,
  canViewParcel,
  getParcelFilter,
  type AuthUser
} from '@/lib/auth/permissions';

describe('Permission Functions', () => {
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

  describe('hasRole', () => {
    it('should return true when user has the specified role', () => {
      expect(hasRole(mockUser, 'user')).toBe(true);
      expect(hasRole(mockAdmin, 'admin')).toBe(true);
      expect(hasRole(mockSuperAdmin, 'super_admin')).toBe(true);
    });

    it('should return false when user does not have the specified role', () => {
      expect(hasRole(mockUser, 'admin')).toBe(false);
      expect(hasRole(mockAdmin, 'super_admin')).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(hasRole(null, 'user')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin and super_admin', () => {
      expect(isAdmin(mockAdmin)).toBe(true);
      expect(isAdmin(mockSuperAdmin)).toBe(true);
    });

    it('should return false for regular user', () => {
      expect(isAdmin(mockUser)).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('isSuperAdmin', () => {
    it('should return true only for super_admin', () => {
      expect(isSuperAdmin(mockSuperAdmin)).toBe(true);
    });

    it('should return false for admin and regular user', () => {
      expect(isSuperAdmin(mockAdmin)).toBe(false);
      expect(isSuperAdmin(mockUser)).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(isSuperAdmin(null)).toBe(false);
    });
  });

  describe('canAccessCountry', () => {
    it('should allow super_admin to access any country', () => {
      expect(canAccessCountry(mockSuperAdmin, 'IN')).toBe(true);
      expect(canAccessCountry(mockSuperAdmin, 'LK')).toBe(true);
      expect(canAccessCountry(mockSuperAdmin, 'US')).toBe(true);
    });

    it('should allow admin and user to access only their country', () => {
      expect(canAccessCountry(mockAdmin, 'IN')).toBe(true);
      expect(canAccessCountry(mockAdmin, 'LK')).toBe(false);
      
      expect(canAccessCountry(mockUser, 'IN')).toBe(true);
      expect(canAccessCountry(mockUser, 'LK')).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(canAccessCountry(null, 'IN')).toBe(false);
    });
  });

  describe('getCountryFilter', () => {
    it('should return null for super_admin', () => {
      expect(getCountryFilter(mockSuperAdmin)).toBeNull();
    });

    it('should return user country for admin and regular user', () => {
      expect(getCountryFilter(mockAdmin)).toBe('IN');
      expect(getCountryFilter(mockUser)).toBe('IN');
    });

    it('should return null when user is null', () => {
      expect(getCountryFilter(null)).toBeNull();
    });
  });

  describe('canManageUsers', () => {
    it('should allow super_admin to manage all users', () => {
      expect(canManageUsers(mockSuperAdmin)).toBe(true);
      expect(canManageUsers(mockSuperAdmin, 'IN')).toBe(true);
      expect(canManageUsers(mockSuperAdmin, 'LK')).toBe(true);
    });

    it('should allow admin to manage users in their country only', () => {
      expect(canManageUsers(mockAdmin)).toBe(true);
      expect(canManageUsers(mockAdmin, 'IN')).toBe(true);
      expect(canManageUsers(mockAdmin, 'LK')).toBe(false);
    });

    it('should not allow regular users to manage users', () => {
      expect(canManageUsers(mockUser)).toBe(false);
      expect(canManageUsers(mockUser, 'IN')).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(canManageUsers(null)).toBe(false);
    });
  });

  describe('canManageParcels', () => {
    it('should allow admin and super_admin to manage parcels', () => {
      expect(canManageParcels(mockAdmin)).toBe(true);
      expect(canManageParcels(mockSuperAdmin)).toBe(true);
    });

    it('should not allow regular users to manage parcels', () => {
      expect(canManageParcels(mockUser)).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(canManageParcels(null)).toBe(false);
    });
  });

  describe('canViewParcel', () => {
    const mockParcel = {
      userId: '1',
      country: 'IN'
    };

    it('should allow super_admin to view any parcel', () => {
      expect(canViewParcel(mockSuperAdmin, mockParcel)).toBe(true);
      expect(canViewParcel(mockSuperAdmin, { ...mockParcel, country: 'LK' })).toBe(true);
    });

    it('should allow admin to view parcels in their country', () => {
      expect(canViewParcel(mockAdmin, mockParcel)).toBe(true);
      expect(canViewParcel(mockAdmin, { ...mockParcel, country: 'LK' })).toBe(false);
    });

    it('should allow users to view only their own parcels', () => {
      expect(canViewParcel(mockUser, mockParcel)).toBe(true);
      expect(canViewParcel(mockUser, { ...mockParcel, userId: '999' })).toBe(false);
    });

    it('should return false when user is null', () => {
      expect(canViewParcel(null, mockParcel)).toBe(false);
    });
  });

  describe('getParcelFilter', () => {
    it('should return empty object for super_admin', () => {
      expect(getParcelFilter(mockSuperAdmin)).toEqual({});
    });

    it('should return country filter for admin', () => {
      expect(getParcelFilter(mockAdmin)).toEqual({ country: 'IN' });
    });

    it('should return userId filter for regular user', () => {
      expect(getParcelFilter(mockUser)).toEqual({ userId: '1' });
    });

    it('should return null when user is null', () => {
      expect(getParcelFilter(null)).toBeNull();
    });
  });
});
