import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Database health check function
async function checkDatabaseHealth() {
  try {
    // Dynamic import to avoid build-time issues
    const { prisma } = await import('@/lib/db');
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Get pool stats (simplified)
function getPoolStats() {
  return {
    active: 'unknown',
    idle: 'unknown',
    waiting: 'unknown',
  };
}
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    // Check database connectivity
    const isDatabaseHealthy = await checkDatabaseHealth();
    const dbLatency = Date.now() - startTime;
    // Get database pool statistics
    const poolStats = getPoolStats();
    // Calculate uptime (simplified - in production, you might want to store app start time)
    const uptime = process.uptime();
    const healthStatus = {
      status: isDatabaseHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: env.NODE_ENV,
      uptime: Math.floor(uptime),
      database: {
        connected: isDatabaseHealthy,
        latency: dbLatency,
        pool: poolStats,
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        limit: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
    };
    return NextResponse.json(healthStatus, {
      status: isDatabaseHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        details: env.NODE_ENV === 'development' ? String(error) : 'Internal error',
      },
      { status: 503 }
    );
  }
}
// Simplified health check for load balancers
export async function HEAD(request: NextRequest) {
  try {
    const isDatabaseHealthy = await checkDatabaseHealth();
    return new NextResponse(null, {
      status: isDatabaseHealthy ? 200 : 503,
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
