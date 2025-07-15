/** @format */
import { auth } from '@/lib/auth/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { NextRequest } from 'next/server';
import { createErrorResponse, logAuthError } from '@/lib/auth/error-handler';

const handler = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
  try {
    return await handler.GET(req);
  } catch (error) {
    logAuthError('GET_REQUEST', error, { url: req.url });
    return createErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handler.POST(req);
  } catch (error) {
    logAuthError('POST_REQUEST', error, { url: req.url });
    return createErrorResponse(error);
  }
}
