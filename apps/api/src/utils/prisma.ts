import { PrismaClient } from '@prisma/client';

// Singleton Prisma Client
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances in development
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prisma = (global as any).prisma;
}

export { prisma };
