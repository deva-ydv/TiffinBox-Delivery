import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

prisma
  .$connect()
  .then(() => logger.info('✅ Database connected'))
  .catch((err) => {
    logger.error('❌ Database connection failed', err);
    process.exit(1);
  });
