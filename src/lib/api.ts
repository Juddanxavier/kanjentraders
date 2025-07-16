import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { env } from './env';
// API configuration
const API_URL = env.NEXT_PUBLIC_API_URL;
// Create axios instance with enhanced security
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  // Validate status codes
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});
// Request interceptor for security headers and logging
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add CSRF token if available
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers = {
        ...config.headers,
        'X-CSRF-Token': csrfToken,
      };
    }
    // Add request ID for tracking
    const requestId = crypto.randomUUID();
    config.headers = {
      ...config.headers,
      'X-Request-ID': requestId,
    };
    // Log request in development
    if (env.NODE_ENV === 'development' && env.LOG_LEVEL === 'debug') {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        requestId,
        timestamp: new Date().toISOString(),
      });
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);
// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (env.NODE_ENV === 'development' && env.LOG_LEVEL === 'debug') {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        requestId: response.config.headers?.['X-Request-ID'],
        timestamp: new Date().toISOString(),
      });
    }
    return response;
  },
  (error: AxiosError) => {
    // Enhanced error logging
    const errorInfo = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      requestId: error.config?.headers?.['X-Request-ID'],
      message: error.message,
      timestamp: new Date().toISOString(),
    };
    console.error('API Error:', errorInfo);
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/signin')) {
        window.location.href = '/signin?error=session_expired';
      }
    }
    if (error.response?.status === 403) {
      // Forbidden - show appropriate message
      console.warn('Access forbidden:', error.response.data);
    }
    if (error.response?.status === 429) {
      // Rate limited
      console.warn('Rate limited. Please try again later.');
    }
    return Promise.reject(error);
  }
);
// CSRF token management
function getCsrfToken(): string | null {
  if (typeof window !== 'undefined') {
    // Try to get CSRF token from meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    // Try to get from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf-token') {
        return decodeURIComponent(value);
      }
    }
  }
  return null;
}
// Enhanced API utilities
export const createSecureRequest = (config: AxiosRequestConfig) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Requested-With': 'XMLHttpRequest',
    },
  };
};
// Auth API functions with enhanced security
export const authApi = {
  signUp: (data: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    role?: string;
  }) => api.post('/auth/signup', data, createSecureRequest({})),
  signIn: (data: { email: string; password: string }) =>
    api.post('/auth/signin', data, createSecureRequest({})),
  signOut: () => api.post('/auth/signout', {}, createSecureRequest({})),
  getMe: () => api.get('/auth/me', createSecureRequest({})),
  updateProfile: (data: {
    name?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    role?: string;
    image?: string;
  }) => api.put('/auth/update-profile', data, createSecureRequest({})),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data, createSecureRequest({})),
  getSessions: () => api.get('/auth/sessions', createSecureRequest({})),
  revokeSession: (sessionId: string) =>
    api.post('/auth/revoke-session', { sessionId }, createSecureRequest({})),
  requestPasswordReset: (email: string) =>
    api.post('/auth/password-reset', { email }, createSecureRequest({})),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/password-reset/confirm', data, createSecureRequest({})),
  verifyEmail: (token: string) =>
    api.post('/auth/verify-email', { token }, createSecureRequest({})),
  resendVerificationEmail: () =>
    api.post('/auth/verify-email/resend', {}, createSecureRequest({})),
};
// Health check API
export const healthApi = {
  check: () => api.get('/health', createSecureRequest({})),
  database: () => api.get('/health/database', createSecureRequest({})),
};
// Error handling utilities
export const handleApiError = (error: AxiosError) => {
  if (error.response?.data) {
    const errorData = error.response.data as any;
    return {
      message: errorData.message || 'An error occurred',
      status: error.response.status,
      code: errorData.code,
      details: errorData.details,
    };
  }
  return {
    message: error.message || 'Network error',
    status: 0,
    code: 'NETWORK_ERROR',
  };
};
// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  role: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface Session {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  userId: string;
}
export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  session?: Session;
}
export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  uptime?: number;
  database?: {
    connected: boolean;
    latency?: number;
  };
}
