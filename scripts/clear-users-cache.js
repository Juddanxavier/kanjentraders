/** @format */
const Redis = require('ioredis');
require('dotenv').config({ path: '.env.local' });

async function clearUsersCache() {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  try {
    console.log('Connected to Redis');
    
    // Clear all users cache keys
    const keys = await client.keys('users:*');
    console.log('Found cache keys:', keys);
    
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Cleared ${keys.length} cache keys`);
    } else {
      console.log('No cache keys to clear');
    }
    
    await client.quit();
    console.log('Cache cleared successfully');
  } catch (error) {
    console.error('Error clearing cache:', error);
    process.exit(1);
  }
}

clearUsersCache();
