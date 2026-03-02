/**
 * Database connection for Epaiement.ma
 * Demo mode - uses localStorage, no database required
 */

// Mock database for demo mode - supports all Prisma-like operations
const createMockMethod = (defaultResult: unknown = null) => async (_args?: unknown) => defaultResult

const mockDb = {
  user: {
    findUnique: createMockMethod(null),
    findFirst: createMockMethod(null),
    findMany: createMockMethod([]),
    create: async ({ data }: { data: Record<string, unknown> }) => ({ 
      id: 'demo_' + Date.now(), 
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    update: async (_args: unknown) => ({ id: 'demo_user' }),
    delete: createMockMethod({ id: 'demo_user' }),
    upsert: async ({ create }: { create: Record<string, unknown> }) => ({
      id: 'demo_user',
      ...create,
    }),
    count: createMockMethod(0),
  },
  account: {
    findUnique: createMockMethod(null),
    create: createMockMethod({ id: 'demo_account' }),
    delete: createMockMethod({ id: 'demo_account' }),
  },
  session: {
    findUnique: createMockMethod(null),
    create: createMockMethod({ id: 'demo_session' }),
    delete: createMockMethod({ id: 'demo_session' }),
    deleteMany: createMockMethod({ count: 0 }),
  },
  verificationToken: {
    findUnique: createMockMethod(null),
    create: createMockMethod({}),
    delete: createMockMethod({}),
  },
  client: {
    findUnique: createMockMethod(null),
    findMany: createMockMethod([]),
    create: createMockMethod({}),
    update: createMockMethod({}),
    delete: createMockMethod({}),
    count: createMockMethod(0),
  },
  invoice: {
    findUnique: createMockMethod(null),
    findMany: createMockMethod([]),
    create: createMockMethod({}),
    update: createMockMethod({}),
    delete: createMockMethod({}),
    count: createMockMethod(0),
  },
  paymentLink: {
    findUnique: createMockMethod(null),
    findMany: createMockMethod([]),
    create: createMockMethod({}),
    update: createMockMethod({}),
    delete: createMockMethod({}),
    count: createMockMethod(0),
  },
  $connect: async () => {},
  $disconnect: async () => {},
  $transaction: async (fn: unknown) => {
    if (typeof fn === 'function') return fn(mockDb)
    return Promise.resolve(fn)
  },
}

// Export db - always returns mock for demo mode
export const db = mockDb

export const prisma = null
