import { PrismaClient } from '@prisma/client';
import { ENV } from './env.js';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: ENV.DATABASE_URL,
    },
  },
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};