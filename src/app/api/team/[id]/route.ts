/**
 * Single Team Member API Route
 * Handles GET, PUT, DELETE for a specific team member
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

// GET - Get a single team member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const member = await prisma.teamMember.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Parse permissions
    let permissions: string[] = []
    try {
      permissions = JSON.parse(member.permissions)
    } catch {
      permissions = []
    }

    return NextResponse.json({
      ...member,
      permissions
    })
  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    )
  }
}

// PUT - Update a team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check member exists and belongs to user
    const existing = await prisma.teamMember.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    const { name, role, permissions, status } = body

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'accountant', 'viewer']
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Must be one of: admin, accountant, viewer' },
          { status: 400 }
        )
      }
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'active', 'inactive']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: pending, active, inactive' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: {
      name?: string
      role?: string
      permissions?: string
      status?: string
      joinedAt?: Date
      lastActiveAt?: Date
    } = {}

    if (name !== undefined) updateData.name = name
    if (role !== undefined) {
      updateData.role = role
      // If role changed and no custom permissions, use default for new role
      if (permissions === undefined) {
        updateData.permissions = JSON.stringify(ROLE_PERMISSIONS[role] || [])
      }
    }
    if (permissions !== undefined) {
      updateData.permissions = JSON.stringify(permissions)
    }
    if (status !== undefined) {
      updateData.status = status
      // If activating a pending member, set joinedAt
      if (status === 'active' && existing.status === 'pending') {
        updateData.joinedAt = new Date()
      }
      // If setting to inactive, update lastActiveAt
      if (status === 'inactive') {
        updateData.lastActiveAt = new Date()
      }
    }

    const member = await prisma.teamMember.update({
      where: { id },
      data: updateData
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'team_member',
        resourceId: id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(member)
      }
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check member exists and belongs to user
    const member = await prisma.teamMember.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    // Delete member
    await prisma.teamMember.delete({ where: { id } })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        resource: 'team_member',
        resourceId: id,
        oldValues: JSON.stringify(member)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    )
  }
}
