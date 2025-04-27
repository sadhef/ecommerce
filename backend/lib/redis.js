import { Redis } from '@upstash/redis';
import dotenv from "dotenv";

dotenv.config();

// Create Redis client with explicit token value
export const redis = new Redis({
  url: 'https://settled-weevil-17731.upstash.io',
  token: 'AUVDAAIjcDFjZWI0YzhjYmEzYWM0YWE0YjJiOWM1YWNmNDdmNTI4ZHAxMA'
});