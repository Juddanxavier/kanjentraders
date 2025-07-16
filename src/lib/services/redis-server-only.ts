/** @format */
import 'server-only';

// This module can only be imported on the server side
import { redisService } from './redis-enhanced';

// Re-export the Redis service with server-only constraint
export { redisService };
