/** @format */

/**
 * Performance monitoring utility for tracking app performance
 * Helps identify memory leaks and performance bottlenecks
 */

interface PerformanceMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
  };
  timing: {
    navigationStart: number;
    loadEventEnd: number;
    domContentLoadedEventEnd: number;
  };
  cacheHits: number;
  cacheMisses: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private startTime = Date.now();

  /**
   * Record cache hit
   */
  recordCacheHit() {
    this.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss() {
    this.cacheMisses++;
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    const now = Date.now();
    
    // Browser-only metrics
    const memory = (performance as any).memory ? {
      used: (performance as any).memory.usedJSHeapSize,
      total: (performance as any).memory.totalJSHeapSize,
      heapUsed: (performance as any).memory.usedJSHeapSize,
      heapTotal: (performance as any).memory.totalJSHeapSize,
    } : {
      used: 0,
      total: 0,
      heapUsed: 0,
      heapTotal: 0,
    };

    const timing = performance.timing ? {
      navigationStart: performance.timing.navigationStart,
      loadEventEnd: performance.timing.loadEventEnd,
      domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd,
    } : {
      navigationStart: this.startTime,
      loadEventEnd: now,
      domContentLoadedEventEnd: now,
    };

    return {
      timestamp: now,
      memory,
      timing,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
    };
  }

  /**
   * Log performance metrics
   */
  logMetrics() {
    const metrics = this.getCurrentMetrics();
    this.metrics.push(metrics);

    console.group('📊 Performance Metrics');
    console.log(`🕐 Timestamp: ${new Date(metrics.timestamp).toISOString()}`);
    
    if (metrics.memory.used > 0) {
      console.log(`💾 Memory Used: ${(metrics.memory.used / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📈 Heap Used: ${(metrics.memory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📊 Heap Total: ${(metrics.memory.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    }
    
    console.log(`🎯 Cache Hit Rate: ${this.getCacheHitRate().toFixed(2)}%`);
    console.log(`✅ Cache Hits: ${metrics.cacheHits}`);
    console.log(`❌ Cache Misses: ${metrics.cacheMisses}`);
    console.groupEnd();

    // Alert if memory usage is high
    if (metrics.memory.used > 50 * 1024 * 1024) { // 50MB
      console.warn('⚠️  High memory usage detected!');
    }

    // Keep only last 100 metrics to prevent memory leak
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get cache hit rate as percentage
   */
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const current = this.getCurrentMetrics();
    const cacheHitRate = this.getCacheHitRate();
    
    return {
      uptime: current.timestamp - this.startTime,
      memoryUsage: current.memory.used,
      cacheHitRate,
      totalRequests: this.cacheHits + this.cacheMisses,
      status: this.getHealthStatus(),
    };
  }

  /**
   * Get application health status
   */
  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const metrics = this.getCurrentMetrics();
    const cacheHitRate = this.getCacheHitRate();
    const memoryUsageMB = metrics.memory.used / 1024 / 1024;

    if (memoryUsageMB > 100 || cacheHitRate < 30) {
      return 'critical';
    } else if (memoryUsageMB > 50 || cacheHitRate < 60) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  /**
   * Start periodic monitoring
   */
  startMonitoring(intervalMs: number = 30000) {
    setInterval(() => {
      this.logMetrics();
    }, intervalMs);
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  performanceMonitor.startMonitoring(60000); // Every minute in development
}

/**
 * HOC for monitoring component performance
 */
export function withPerformanceMonitoring<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: T) {
    React.useEffect(() => {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        console.log(`⏱️  ${componentName} render time: ${(endTime - startTime).toFixed(2)}ms`);
      };
    }, []);

    return React.createElement(Component, props);
  };
}

// Export types
export type { PerformanceMetrics };
