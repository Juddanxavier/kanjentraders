/** @format */
import { APIError } from 'better-auth/api';
import { NextResponse } from 'next/server';
export type AuthErrorCode = 
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'DATABASE_ERROR'
  | 'INVALID_TOKEN'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR';
interface ErrorDetails {
  code: AuthErrorCode;
  message: string;
  statusCode: number;
  details?: any;
}
/**
 * Maps better-auth errors to user-friendly messages
 */
export function mapAuthError(error: any): ErrorDetails {
  // If it's already an APIError, extract its properties
  if (error instanceof APIError) {
    return {
      code: error.body?.code || 'INTERNAL_SERVER_ERROR',
      message: error.body?.message || 'An unexpected error occurred',
      statusCode: error.statusCode || 500,
      details: error.body,
    };
  }
  // Handle specific error messages
  const errorMessage = error?.message?.toLowerCase() || '';
  if (errorMessage.includes('invalid') && errorMessage.includes('password')) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      statusCode: 401,
    };
  }
  if (errorMessage.includes('user') && errorMessage.includes('not found')) {
    return {
      code: 'USER_NOT_FOUND',
      message: 'No account found with this email',
      statusCode: 404,
    };
  }
  if (errorMessage.includes('session') || errorMessage.includes('expired')) {
    return {
      code: 'SESSION_EXPIRED',
      message: 'Your session has expired. Please sign in again',
      statusCode: 401,
    };
  }
  if (errorMessage.includes('database') || errorMessage.includes('prisma')) {
    return {
      code: 'DATABASE_ERROR',
      message: 'Unable to connect to the database. Please try again later',
      statusCode: 503,
    };
  }
  if (errorMessage.includes('unauthorized')) {
    return {
      code: 'UNAUTHORIZED',
      message: 'You are not authorized to perform this action',
      statusCode: 401,
    };
  }
  if (errorMessage.includes('forbidden')) {
    return {
      code: 'FORBIDDEN',
      message: 'Access to this resource is forbidden',
      statusCode: 403,
    };
  }
  if (errorMessage.includes('rate limit')) {
    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later',
      statusCode: 429,
    };
  }
  // Default error
  return {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later',
    statusCode: 500,
    details: error,
  };
}
/**
 * Creates a NextResponse with proper error formatting
 */
export function createErrorResponse(error: any): NextResponse {
  const errorDetails = mapAuthError(error);
  return NextResponse.json(
    {
      error: {
        code: errorDetails.code,
        message: errorDetails.message,
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails.details }),
      },
    },
    { status: errorDetails.statusCode }
  );
}
/**
 * Logs authentication errors with context
 */
export function logAuthError(context: string, error: any, additionalInfo?: any) {
  const errorDetails = mapAuthError(error);
  console.error(`[Auth Error - ${context}]`, {
    ...errorDetails,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    ...additionalInfo,
  });
}
/**
 * Helper to handle auth errors in try-catch blocks
 */
export async function handleAuthAction<T>(
  action: () => Promise<T>,
  context: string
): Promise<{ data?: T; error?: ErrorDetails }> {
  try {
    const data = await action();
    return { data };
  } catch (error) {
    logAuthError(context, error);
    return { error: mapAuthError(error) };
  }
}
