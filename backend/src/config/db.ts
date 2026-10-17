import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/index.js';
import { ENV } from './env.js';
import { parseDatabaseUrl } from './parseDatabaseUrl.js';

const adapter = new PrismaMariaDb({
  ...parseDatabaseUrl(ENV.DATABASE_URL),
  connectionLimit: 10,
});

export const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};