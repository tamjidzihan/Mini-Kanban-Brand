import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const ENV = {
  PORT: process.env.PORT || '',
  TRUST_PROXY_HOPS: process.env.TRUST_PROXY_HOPS || '0',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || '',
};
