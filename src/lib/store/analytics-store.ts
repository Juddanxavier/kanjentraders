/** @format */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { logger } from '@/lib/logger';

// Redis operations are handled server-side only
// No Redis imports in client stores
interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  bannedUsers: number;
  pendingVerification: number;
  percentageActive: number;
}
interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}
interface UsersByCountry {
  country: string;
  users: number;
  percentage: number;
}
interface UsersByRole {
  role: string;
  users: number;
  percentage: number;
}
interface AnalyticsState {
  userMetrics: UserMetrics;
  userGrowthData: UserGrowthData[];
  usersByCountry: UsersByCountry[];
  usersByRole: UsersByRole[];
  isLoading: boolean;
  error: string | null;
  currentCountryFilter: string | null;
  fetchUserMetrics: (country?: string) => Promise<void>;
  fetchUserGrowthData: (country?: string) => Promise<void>;
  fetchUsersByCountry: (country?: string) => Promise<void>;
  fetchUsersByRole: (country?: string) => Promise<void>;
  fetchAllAnalytics: (country?: string) => Promise<void>;
  setCountryFilter: (country: string | null) => void;
}
// Generate country-specific mock data
const generateMockUserMetrics = (country?: string): UserMetrics => {
  const data: Record<string, UserMetrics> = {
    'India': { totalUsers: 1456, activeUsers: 892, newUsers: 134, bannedUsers: 8, pendingVerification: 23, percentageActive: 61.3 },
    'Sri Lanka': { totalUsers: 1245, activeUsers: 798, newUsers: 89, bannedUsers: 5, pendingVerification: 18, percentageActive: 64.1 },
    'all': { totalUsers: 2953, activeUsers: 1876, newUsers: 234, bannedUsers: 12, pendingVerification: 45, percentageActive: 63.5 }
  };
  return data[country || 'all'] || data['all'];
};
const generateMockUserGrowthData = (country?: string): UserGrowthData[] => {
  const data: UserGrowthData[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      newUsers: Math.floor(Math.random() * 50) + 10,
      totalUsers: 1000 + (29 - i) * 20 + Math.floor(Math.random() * 100)
    });
  }
  return data;
};
const generateMockUsersByCountry = (filterCountry?: string): UsersByCountry[] => {
  const allCountries = [
    { country: 'India', users: 1456, percentage: 49.3 },
    { country: 'Sri Lanka', users: 1245, percentage: 42.2 },
    { country: 'United States', users: 156, percentage: 5.3 },
    { country: 'United Kingdom', users: 68, percentage: 2.3 },
    { country: 'Australia', users: 28, percentage: 0.9 }
  ];
  if (filterCountry) {
    const filtered = allCountries.filter(c => c.country === filterCountry);
    if (filtered.length > 0) {
      return [{ ...filtered[0], percentage: 100 }];
    }
  }
  return allCountries;
};
const generateMockUsersByRole = (country?: string): UsersByRole[] => {
  const baseData = [
    { role: 'User', users: 2456, percentage: 83.2 },
    { role: 'Admin', users: 432, percentage: 14.6 },
    { role: 'Super Admin', users: 65, percentage: 2.2 }
  ];
  if (country === 'India') {
    return [
      { role: 'User', users: 1212, percentage: 83.2 },
      { role: 'Admin', users: 213, percentage: 14.6 },
      { role: 'Super Admin', users: 31, percentage: 2.2 }
    ];
  } else if (country === 'Sri Lanka') {
    return [
      { role: 'User', users: 1035, percentage: 83.2 },
      { role: 'Admin', users: 182, percentage: 14.6 },
      { role: 'Super Admin', users: 28, percentage: 2.2 }
    ];
  }
  return baseData;
};
export const useAnalyticsStore = create<AnalyticsState>()(
  devtools((set, get) => ({
    userMetrics: {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      bannedUsers: 0,
      pendingVerification: 0,
      percentageActive: 0,
    },
    userGrowthData: [],
    usersByCountry: [],
    usersByRole: [],
    isLoading: false,
    error: null,
    currentCountryFilter: null,
    fetchUserMetrics: async (country) => {
      set({ isLoading: true, error: null });
      try {
        // Try to fetch from API, fallback to mock data
        // Redis caching is handled server-side
        try {
          const url = country 
            ? `/api/analytics/user-metrics?country=${country}`
            : '/api/analytics/user-metrics';
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            const userMetrics = {
              totalUsers: data.totalUsers,
              activeUsers: data.activeUsers,
              newUsers: data.newUsers,
              bannedUsers: data.bannedUsers || 0,
              pendingVerification: data.pendingVerification || 0,
              percentageActive: (data.activeUsers / data.totalUsers) * 100,
            };
            
            set({
              userMetrics,
              isLoading: false,
            });
            logger.info('Fetched user metrics successfully');
            return;
          }
        } catch (apiError) {
          logger.warn('API not available, using mock data');
        }
        
        // Fallback to mock data
        const mockData = generateMockUserMetrics(country);
        
        set({
          userMetrics: mockData,
          isLoading: false,
        });
        logger.info('Using mock data for user metrics');
      } catch (error) {
        logger.error('Error fetching user metrics:', error);
        set({ 
          isLoading: false,
          error: 'Failed to fetch user metrics'
        });
      }
    },
    fetchUserGrowthData: async (country) => {
      try {
        const url = country 
          ? `/api/analytics/user-growth?country=${country}`
          : '/api/analytics/user-growth';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          set({ userGrowthData: data });
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        set({ userGrowthData: generateMockUserGrowthData(country) });
      }
    },
    fetchUsersByCountry: async (country) => {
      try {
        const url = country 
          ? `/api/analytics/users-by-country?country=${country}`
          : '/api/analytics/users-by-country';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          set({ usersByCountry: data });
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        set({ usersByCountry: generateMockUsersByCountry(country) });
      }
    },
    fetchUsersByRole: async (country) => {
      try {
        const url = country 
          ? `/api/analytics/users-by-role?country=${country}`
          : '/api/analytics/users-by-role';
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          set({ usersByRole: data });
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        set({ usersByRole: generateMockUsersByRole(country) });
      }
    },
    fetchAllAnalytics: async (country) => {
      const { fetchUserMetrics, fetchUserGrowthData, fetchUsersByCountry, fetchUsersByRole } = get();
      await Promise.all([
        fetchUserMetrics(country),
        fetchUserGrowthData(country),
        fetchUsersByCountry(country),
        fetchUsersByRole(country)
      ]);
    },
    setCountryFilter: (country) => {
      set({ currentCountryFilter: country });
    },
  }))
);
