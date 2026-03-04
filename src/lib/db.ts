/**
 * Database connection for Epaiement.ma
 * Supports PostgreSQL on Vercel, SQLite for local dev
 */

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Export db as prisma for compatibility
export const db = prisma

// Helper to get database status
export function getDatabaseStatus() {
  const databaseUrl = process.env.DATABASE_URL
  return {
    configured: !!databaseUrl,
    type: databaseUrl?.startsWith('postgres') ? 'PostgreSQL' : 
          databaseUrl?.startsWith('mysql') ? 'MySQL' :
          databaseUrl?.startsWith('file:') ? 'SQLite' : 'Unknown',
    url: databaseUrl ? '(set)' : '(not set)'
  }
}

export default prisma
