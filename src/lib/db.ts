/**
 * Database connection for Epaiement.ma
 * Supports SQLite locally, PostgreSQL on Vercel
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

// Check if database is configured
const databaseUrl = process.env.DATABASE_URL
const isDatabaseConfigured = databaseUrl && !databaseUrl.includes('file:./dev.db')

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Export db as prisma for compatibility
export const db = prisma

// Helper to check if we're in demo mode (no real database)
export function isDemoMode(): boolean {
  return !isDatabaseConfigured
}

// Helper to get database status
export function getDatabaseStatus() {
  return {
    configured: isDatabaseConfigured,
    type: databaseUrl?.startsWith('postgres') ? 'PostgreSQL' : 
          databaseUrl?.startsWith('mysql') ? 'MySQL' :
          databaseUrl?.startsWith('file:') ? 'SQLite' : 'Unknown',
    url: databaseUrl ? '(set)' : '(not set)'
  }
}

export default prisma
