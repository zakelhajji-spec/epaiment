/**
 * Tenant Security Utilities
 * Ensures data isolation between tenants in multi-tenant SaaS
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Get the current user's ID (tenant ID)
 * Returns null if not authenticated
 */
export async function getTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id || null
}

/**
 * Require authentication and return tenant ID
 * Throws error if not authenticated
 */
export async function requireTenantId(): Promise<string> {
  const tenantId = await getTenantId()
  if (!tenantId) {
    throw new Error('Unauthorized: Authentication required')
  }
  return tenantId
}

/**
 * Tenant-aware query helper
 * Automatically adds userId filter to queries
 */
export function tenantQuery<T extends Record<string, any>>(
  model: T,
  tenantId: string
): T {
  return new Proxy(model, {
    get(target, prop) {
      const original = target[prop as keyof T]
      if (typeof original === 'function') {
        return (...args: any[]) => {
          // For findMany, add userId filter
          if (prop === 'findMany' || prop === 'count') {
            const [firstArg = {}] = args
            return original({
              ...firstArg,
              where: {
                ...firstArg.where,
                userId: tenantId
              }
            })
          }
          // For findFirst, add userId filter
          if (prop === 'findFirst' || prop === 'findFirstOrThrow') {
            const [firstArg = {}] = args
            return original({
              ...firstArg,
              where: {
                ...firstArg.where,
                userId: tenantId
              }
            })
          }
          // For create, add userId
          if (prop === 'create') {
            const [firstArg = {}] = args
            return original({
              ...firstArg,
              data: {
                ...firstArg.data,
                userId: tenantId
              }
            })
          }
          // For update, ensure userId match
          if (prop === 'update') {
            const [firstArg = {}] = args
            return original({
              ...firstArg,
              where: {
                ...firstArg.where,
                userId: tenantId
              }
            })
          }
          // For delete, ensure userId match
          if (prop === 'delete') {
            const [firstArg = {}] = args
            return original({
              ...firstArg,
              where: {
                ...firstArg.where,
                userId: tenantId
              }
            })
          }
          return original(...args)
        }
      }
      return original
    }
  }) as T
}

/**
 * Verify resource belongs to tenant
 */
export async function verifyTenantAccess(
  resource: string,
  resourceId: string,
  tenantId: string
): Promise<boolean> {
  const models: Record<string, any> = {
    invoice: prisma.invoice,
    client: prisma.client,
    paymentLink: prisma.paymentLink,
    subscription: prisma.subscription,
  }
  
  const model = models[resource]
  if (!model) return false
  
  const record = await model.findFirst({
    where: { id: resourceId },
    select: { userId: true }
  })
  
  return record?.userId === tenantId
}

/**
 * Rate limiting per tenant
 */
const tenantLimits = new Map<string, { count: number; resetAt: number }>()

export function checkTenantRateLimit(
  tenantId: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const limit = tenantLimits.get(tenantId)
  
  if (!limit || now > limit.resetAt) {
    tenantLimits.set(tenantId, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }
  
  if (limit.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: limit.resetAt - now }
  }
  
  limit.count++
  return { allowed: true, remaining: maxRequests - limit.count, resetIn: limit.resetAt - now }
}

export default {
  getTenantId,
  requireTenantId,
  tenantQuery,
  verifyTenantAccess,
  checkTenantRateLimit,
}
