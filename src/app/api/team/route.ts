/**
 * Team API Route
 * Handles CRUD operations for team members
 * 
 * GET: List team members
 * POST: Invite new team member
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateSecureToken } from '@/lib/security'

// Valid roles and their default permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'invoices:read', 'invoices:write', 'invoices:delete',
    'clients:read', 'clients:write', 'clients:delete',
    'products:read', 'products:write', 'products:delete',
    'reports:read',
    'settings:read', 'settings:write',
    'team:read', 'team:write'
  ],
  accountant: [
    'invoices:read', 'invoices:write',
    'clients:read', 'clients:write',
    'products:read',
    'reports:read',
    'expenses:read', 'expenses:write'
  ],
  viewer: [
    'invoices:read',
    'clients:read',
    'products:read',
    'reports:read'
  ]
}

// GET - List all team members for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = searchParams.get('role')

    // Build where clause
    const where: {
      userId: string
      status?: string
      role?: string
    } = { userId: session.user.id }

    if (status) where.status = status
    if (role) where.role = role

    const [members, stats] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        orderBy: [
          { status: 'asc' }, // pending first, then active
          { createdAt: 'desc' }
        ]
      }),
      // Get statistics
      prisma.teamMember.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: true
      })
    ])

    // Format stats
    const statusStats = {
      pending: 0,
      active: 0,
      inactive: 0
    }
    stats.forEach(s => {
      statusStats[s.status as keyof typeof statusStats] = s._count
    })

    return NextResponse.json({
      members,
      stats: statusStats
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

// POST - Invite a new team member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, name, role = 'viewer', permissions } = body

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['admin', 'accountant', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: admin, accountant, viewer' },
        { status: 400 }
      )
    }

    // Check if member with same email already exists
    const existing = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        email: email.toLowerCase()
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A team member with this email already exists' },
        { status: 409 }
      )
    }

    // Use provided permissions or default for the role
    const memberPermissions = permissions || ROLE_PERMISSIONS[role] || []

    // Create team member with pending status
    const member = await prisma.teamMember.create({
      data: {
        userId: session.user.id,
        email: email.toLowerCase(),
        name,
        role,
        permissions: JSON.stringify(memberPermissions),
        status: 'pending',
        invitedBy: session.user.id,
        invitedAt: new Date()
      }
    })

    // Generate invitation token (for email invitation flow)
    const inviteToken = generateSecureToken()

    // In production, send email invitation here
    // For now, we just create the member record
    console.log(`[TEAM INVITE] Invitation token for ${email}: ${inviteToken}`)

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'team_member',
        resourceId: member.id,
        newValues: JSON.stringify({
          email: member.email,
          name: member.name,
          role: member.role,
          invitedBy: session.user.id
        })
      }
    })

    return NextResponse.json({
      ...member,
      inviteToken // Include token in response for testing
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    )
  }
}
