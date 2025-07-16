import { env } from './env';
// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}
// Log entry interface
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}
// Logger class
class Logger {
  private logLevel: LogLevel;
  private isProduction: boolean;
  constructor() {
    this.logLevel = (env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    this.isProduction = env.NODE_ENV === 'production';
  }
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }
  private formatLogEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, error, ...meta } = entry;
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (Object.keys(meta).length > 0) {
      formatted += ` | Meta: ${JSON.stringify(meta)}`;
    }
    if (context && Object.keys(context).length > 0) {
      formatted += ` | Context: ${JSON.stringify(context)}`;
    }
    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (!this.isProduction && error.stack) {
        formatted += `\nStack: ${error.stack}`;
      }
    }
    return formatted;
  }
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
  }
  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;
    const formatted = this.formatLogEntry(entry);
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
    // In production, you might want to send logs to external service
    if (this.isProduction) {
      this.sendToExternalService(entry);
    }
  }
  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement external logging service integration
    // Examples: Winston, Pino, DataDog, Sentry, etc.
    // For now, we'll just store critical errors
    if (entry.level === LogLevel.ERROR) {
      // Store in database or send to monitoring service
    }
  }
  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
    this.writeLog(entry);
  }
  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context);
    this.writeLog(entry);
  }
  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context);
    this.writeLog(entry);
  }
  error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.writeLog(entry);
  }
  // Specialized logging methods
  security(message: string, context?: Record<string, any>): void {
    this.warn(`[SECURITY] ${message}`, {
      ...context,
      category: 'security',
    });
  }
  auth(message: string, userId?: string, context?: Record<string, any>): void {
    this.info(`[AUTH] ${message}`, {
      ...context,
      userId,
      category: 'authentication',
    });
  }
  database(message: string, context?: Record<string, any>): void {
    this.debug(`[DB] ${message}`, {
      ...context,
      category: 'database',
    });
  }
  api(message: string, context?: Record<string, any>): void {
    this.info(`[API] ${message}`, {
      ...context,
      category: 'api',
    });
  }
  performance(message: string, duration: number, context?: Record<string, any>): void {
    this.info(`[PERF] ${message}`, {
      ...context,
      duration,
      category: 'performance',
    });
  }
}
// Export singleton logger instance
export const logger = new Logger();
// Utility function to log request context
export function withRequestContext(req: any) {
  return {
    requestId: req.headers?.['x-request-id'] || crypto.randomUUID(),
    ip: req.headers?.['x-forwarded-for']?.split(',')[0] || req.ip || 'unknown',
    userAgent: req.headers?.['user-agent'] || 'unknown',
    method: req.method,
    url: req.url,
  };
}
// Performance monitoring utility
export function measurePerformance<T>(
  operation: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const startTime = Date.now();
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then((res) => {
          const duration = Date.now() - startTime;
          logger.performance(`${operation} completed`, duration);
          return res;
        })
        .catch((error) => {
          const duration = Date.now() - startTime;
          logger.error(`${operation} failed`, error, { duration });
          throw error;
        });
    } else {
      const duration = Date.now() - startTime;
      logger.performance(`${operation} completed`, duration);
      return result;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${operation} failed`, error as Error, { duration });
    throw error;
  }
}
// Error reporting utility
export function reportError(error: Error, context?: Record<string, any>): void {
  logger.error('Unhandled error occurred', error, context);
  // In production, send to error reporting service (Sentry, Bugsnag, etc.)
  if (env.NODE_ENV === 'production') {
    // TODO: Integrate with error reporting service
  }
}
// Security event logging
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context?: Record<string, any>
): void {
  logger.security(`Security event: ${event}`, {
    ...context,
    severity,
    timestamp: new Date().toISOString(),
  });
  // For critical security events, you might want to trigger alerts
  if (severity === 'critical') {
    // TODO: Trigger security alert system
  }
}
