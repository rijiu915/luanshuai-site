// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as any;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(); // ← 直接不传任何参数！

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}