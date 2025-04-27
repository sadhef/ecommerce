// reset-redis.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: 'https://settled-weevil-17731.upstash.io',
  token: 'AUVDAAIjcDFjZWI0YzhjYmEzYWM0YWE0YjJiOWM1YWNmNDdmNTI4ZHAxMA'
});

// Clear the problematic key
async function resetRedisCache() {
  try {
    await redis.del("featured_products");
    console.log("Successfully deleted featured_products from Redis");
  } catch (error) {
    console.error("Error clearing Redis cache:", error);
  }
}

resetRedisCache();