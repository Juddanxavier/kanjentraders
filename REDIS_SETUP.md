# Redis Integration Setup Guide

## Overview
This project now includes comprehensive Redis integration for caching, session management, real-time notifications, rate limiting, and security monitoring.

## Features Implemented

### 1. **Enhanced Redis Service** (`src/lib/services/redis-enhanced.ts`)
- **Connection Management**: Singleton pattern with connection pooling
- **Caching Operations**: Generic get/set/del with TTL support
- **Session Management**: User session caching and invalidation
- **Rate Limiting**: Distributed rate limiting with Redis
- **Pub/Sub**: Real-time messaging for notifications
- **Security**: Event logging and suspicious activity detection
- **Health Monitoring**: Connection health checks and performance metrics

### 2. **Enhanced Stores with Redis Integration**

#### Lead Store (`src/store/lead-store.ts`)
- **Caching**: Leads and stats cached with user-specific keys
- **Cache Invalidation**: Automatic cache clearing on CRUD operations
- **Performance**: Faster data retrieval with Redis cache-first strategy

#### Analytics Store (`src/lib/store/analytics-store.ts`)
- **Metrics Caching**: User metrics cached for 30 minutes
- **Country-specific Data**: Separate caches for different countries
- **Fallback Support**: Graceful degradation to mock data

#### Auth Store (`src/lib/store/auth-store.ts`)
- **User Data Caching**: User information cached in Redis
- **Security Logging**: Login/logout events tracked
- **Session Management**: Enhanced session handling with Redis

#### Notification Store (`src/lib/store/notification-store.ts`)
- **Real-time Updates**: Server-sent events for live notifications
- **Notification Caching**: Recent notifications cached
- **Connection Status**: Track real-time connection state

### 3. **Enhanced Rate Limiting** (`src/lib/rate-limit.ts`)
- **Redis-first**: Uses Redis for distributed rate limiting
- **Fallback**: In-memory fallback when Redis unavailable
- **Multiple Limits**: Different limits for auth, API, and sensitive operations

### 4. **Redis Middleware** (`src/lib/services/redis-middleware.ts`)
- **Background Tasks**: Automatic cleanup and health monitoring
- **API Middleware**: Rate limiting and usage tracking
- **Performance Monitoring**: Operation timing and success rates
- **Security Monitoring**: Failed login detection and alerting
- **Bulk Operations**: Efficient cache invalidation

## Environment Configuration

Add to your `.env.local`:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
# For production with authentication:
# REDIS_URL=redis://username:password@host:port

# Optional Redis Configuration
REDIS_MAX_CONNECTIONS=100
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
```

## Redis Key Patterns

### User Data
- `user:{userId}` - User profile cache
- `session:{sessionId}` - Session data
- `prefs:{userId}:{key}` - User preferences

### Application Data
- `leads:{userId}:{filterHash}` - Cached leads data
- `lead_stats:{userId}` - Lead statistics
- `analytics:{type}:{country}` - Analytics data
- `notifications:recent:{userId}` - Recent notifications

### System Data
- `rate_limit:{identifier}:{window}` - Rate limiting counters
- `api_usage:{userId}:{operation}:{timestamp}` - API usage logs
- `security:{userId}:{timestamp}` - Security events
- `perf:{operation}:{bucket}` - Performance metrics

## Performance Improvements

### 1. **Caching Strategy**
- **Cache-first**: Always check Redis before database
- **TTL Management**: Appropriate expiration times for different data types
- **Cache Invalidation**: Smart invalidation on data changes

### 2. **Connection Optimization**
- **Connection Pooling**: Reuse connections for better performance
- **Lazy Loading**: Connect only when needed
- **Health Monitoring**: Automatic connection health checks

### 3. **Real-time Features**
- **Server-sent Events**: Live notification updates
- **Pub/Sub**: Real-time data synchronization
- **WebSocket Alternative**: SSE for better browser compatibility

## Security Features

### 1. **Rate Limiting**
- **Distributed**: Works across multiple server instances
- **Granular**: Different limits for different operations
- **Flexible**: Configurable windows and limits

### 2. **Security Monitoring**
- **Event Logging**: All security events tracked
- **Pattern Detection**: Automatic suspicious activity detection
- **Audit Trail**: Complete user activity logs

### 3. **Session Security**
- **Secure Storage**: Sessions stored in Redis with encryption
- **Expiration**: Automatic session cleanup
- **Multi-device**: Support for multiple concurrent sessions

## Monitoring and Maintenance

### 1. **Health Checks**
- **Connection Status**: Regular Redis connectivity checks
- **Performance Metrics**: Latency and throughput monitoring
- **Error Tracking**: Comprehensive error logging

### 2. **Cleanup Tasks**
- **Automatic Cleanup**: Expired keys removed automatically
- **Background Jobs**: Regular maintenance tasks
- **Memory Management**: Efficient memory usage

### 3. **Analytics**
- **Usage Tracking**: API usage and performance metrics
- **User Activity**: Detailed user behavior analytics
- **System Performance**: Redis and application performance data

## Usage Examples

### Basic Caching
```typescript
import { redisService } from '@/lib/services/redis-enhanced';

// Cache data
await redisService.set('key', data, 3600); // 1 hour TTL

// Retrieve data
const cachedData = await redisService.get('key');
```

### User Preferences
```typescript
// Save user preference
await redisService.setUserPreference(userId, 'theme', 'dark');

// Get user preference
const theme = await redisService.getUserPreference(userId, 'theme');
```

### Rate Limiting
```typescript
import { ratelimit } from '@/lib/rate-limit';

const result = await ratelimit.limit(`user:${userId}`);
if (!result.success) {
  // Rate limit exceeded
  return { error: 'Too many requests' };
}
```

### Security Event Logging
```typescript
await redisService.logSecurityEvent(userId, 'login_attempt', {
  ip: request.ip,
  userAgent: request.headers['user-agent'],
  success: false,
});
```

## Best Practices

### 1. **Key Naming**
- Use consistent naming patterns
- Include TTL in key names when appropriate
- Use hierarchical structure with colons

### 2. **Error Handling**
- Always provide fallbacks for Redis failures
- Log errors but don't crash the application
- Use graceful degradation

### 3. **Performance**
- Use appropriate TTL values
- Batch operations when possible
- Monitor memory usage

### 4. **Security**
- Encrypt sensitive data before storing
- Use secure connection in production
- Regular security audits

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check Redis server status
   - Verify connection string
   - Check firewall settings

2. **Performance Issues**
   - Monitor Redis memory usage
   - Check key expiration settings
   - Optimize query patterns

3. **Security Concerns**
   - Enable Redis authentication
   - Use TLS in production
   - Regular security updates

### Monitoring Commands

```bash
# Check Redis status
redis-cli ping

# Monitor commands
redis-cli monitor

# Check memory usage
redis-cli info memory

# List all keys (use carefully in production)
redis-cli keys "*"
```

## Deployment Notes

### Development
- Redis runs on localhost:6379
- No authentication required
- Debug logging enabled

### Production
- Use managed Redis service (AWS ElastiCache, Google Cloud Memorystore)
- Enable authentication and TLS
- Set up monitoring and alerts
- Regular backups

## Future Enhancements

1. **Redis Cluster**: For high availability
2. **Advanced Analytics**: More detailed usage analytics
3. **Machine Learning**: Predictive caching
4. **Advanced Security**: Anomaly detection
5. **Multi-tenant**: Tenant isolation

## Support

For issues or questions:
1. Check Redis logs
2. Review error messages
3. Consult Redis documentation
4. Contact development team

---

This Redis integration provides a solid foundation for scalable, secure, and performant caching throughout the application.
