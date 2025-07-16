import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";

const handler = toNextJsHandler(auth);

// Handle all HTTP methods that better-auth might use
export async function GET(request: NextRequest) {
  return handler.GET(request);
}

export async function POST(request: NextRequest) {
  return handler.POST(request);
}

export async function PUT(request: NextRequest) {
  return handler.PUT?.(request) || new Response('Method not allowed', { status: 405 });
}

export async function DELETE(request: NextRequest) {
  return handler.DELETE?.(request) || new Response('Method not allowed', { status: 405 });
}

export async function PATCH(request: NextRequest) {
  return handler.PATCH?.(request) || new Response('Method not allowed', { status: 405 });
}

export async function OPTIONS(request: NextRequest) {
  return handler.OPTIONS?.(request) || new Response('Method not allowed', { status: 405 });
}
