/**
 * Permissions API
 * 
 * Returns the current user's permissions and role information.
 * Used for frontend authorization checks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Role hierarchy for permission derivation
const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  owner: ['*'], // All permissions
  admin: [
    'dashboard:view',
    'invoices:read', 'invoices:write', 'invoices:delete', 'invoices:send',
    'payment_links:read', 'payment_links:write', 'payment_links:delete',
    'clients:read', 'clients:write', 'clients:delete',
    'suppliers:read', 'suppliers:write',
    'quotes:read', 'quotes:write', 'quotes:convert',
    'expenses:read', 'expenses:write', 'expenses:delete',
    'credit_notes:read', 'credit_notes:write',
    'reports:view', 'reports:export', 'reports:tva',
    'products:read', 'products:write', 'products:delete',
    'inventory:read', 'inventory:write',
    'team:view', 'team:invite',
    'settings:view', 'settings:write',
    'integrations:view',
    'audit:view',
  ],
  accountant: [
    'dashboard:view',
    'invoices:read', 'invoices:write', 'invoices:send',
    'payment_links:read', 'payment_links:write',
    'clients:read', 'clients:write',
    'suppliers:read', 'suppliers:write',
    'quotes:read', 'quotes:write',
    'expenses:read', 'expenses:write',
    'credit_notes:read', 'credit_notes:write',
    'reports:view', 'reports:export', 'reports:tva',
    'settings:view',
  ],
  sales: [
    'dashboard:view',
    'invoices:read', 'invoices:write', 'invoices:send',
    'payment_links:read', 'payment_links:write',
    'clients:read', 'clients:write',
    'quotes:read', 'quotes:write', 'quotes:convert',
    'products:read',
  ],
  viewer: [
    'dashboard:view',
    'invoices:read',
    'payment_links:read',
    'clients:read',
    'suppliers:read',
    'quotes:read',
    'reports:view',
  ],
}

function getRolePermissions(role: string): string[] {
  return ROLE_PERMISSIONS_MAP[role] || ROLE_PERMISSIONS_MAP.viewer
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    
    // Get user with team membership
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyName: true,
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }
    
    // Get permissions based on role
    const permissions = getRolePermissions(user.role)
    
    // Available roles
    const roles = [
      { id: 'owner', name: 'Propriétaire', description: 'Accès complet' },
      { id: 'admin', name: 'Administrateur', description: 'Gestion complète' },
      { id: 'accountant', name: 'Comptable', description: 'Opérations financières' },
      { id: 'sales', name: 'Commercial', description: 'Ventes et clients' },
      { id: 'viewer', name: 'Lecteur', description: 'Consultation uniquement' },
    ]
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyName: user.companyName,
      },
      permissions,
      roles,
      isAdmin: ['owner', 'admin'].includes(user.role),
      isOwner: user.role === 'owner',
    })
    
  } catch (error) {
    console.error('[Permissions API] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des permissions' },
      { status: 500 }
    )
  }
}

// Check specific permission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    
    const body = await request.json()
    const { permission, permissions } = body
    
    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }
    
    const userPermissions = getRolePermissions(user.role)
    
    // Check single permission
    if (permission) {
      const hasPermission = userPermissions.includes(permission)
      return NextResponse.json({
        success: true,
        hasPermission,
        permission
      })
    }
    
    // Check multiple permissions
    if (permissions && Array.isArray(permissions)) {
      const results: Record<string, boolean> = {}
      for (const p of permissions) {
        results[p] = userPermissions.includes(p)
      }
      return NextResponse.json({
        success: true,
        permissions: results
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Aucune permission spécifiée'
    }, { status: 400 })
    
  } catch (error) {
    console.error('[Permissions API] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification des permissions' },
      { status: 500 }
    )
  }
}
