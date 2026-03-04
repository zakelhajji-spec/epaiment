/**
 * Admin Middleware
 * Checks if user has admin privileges
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export interface AdminSession {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin' | 'superadmin'
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })
  
  return user?.role === 'admin' || user?.role === 'superadmin'
}

/**
 * Get admin session or null
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true }
  })
  
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null
  }
  
  return user as AdminSession
}

/**
 * Require admin role - throws if not admin
 */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdminSession()
  if (!admin) {
    throw new Error('Admin access required')
  }
  return admin
}

/**
 * Check if user is superadmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return false
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })
  
  return user?.role === 'superadmin'
}

/**
 * Middleware wrapper for API routes
 */
export function withAdminAuth(
  handler: (req: NextRequest, admin: AdminSession) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const admin = await requireAdmin()
      return handler(req, admin)
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }
  }
}
