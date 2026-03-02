/**
 * Admin Users API
 * List, search, and manage users
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'

// GET - List all users with pagination and search
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const plan = searchParams.get('plan') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { companyIce: { contains: search } }
      ]
    }
    
    if (status) {
      where.accountStatus = status
    }
    
    if (plan) {
      where.subscriptionPlan = plan
    }
    
    // Get users with counts
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          accountStatus: true,
          companyName: true,
          companyIce: true,
          companyCity: true,
          subscriptionPlan: true,
          createdAt: true,
          lastLogin: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              price: true,
              billingCycle: true,
              activeGroups: true
            }
          },
          _count: {
            select: {
              invoices: true,
              clients: true,
              paymentLinks: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// PATCH - Update user (suspend, activate, change plan, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    
    const body = await request.json()
    const { userId, action, data } = body
    
    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Prevent modifying superadmin unless you're superadmin
    if (user.role === 'superadmin' && admin.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Cannot modify superadmin account' },
        { status: 403 }
      )
    }
    
    let result
    
    switch (action) {
      case 'suspend':
        result = await prisma.user.update({
          where: { id: userId },
          data: { accountStatus: 'suspended' }
        })
        break
        
      case 'activate':
        result = await prisma.user.update({
          where: { id: userId },
          data: { accountStatus: 'active' }
        })
        break
        
      case 'change_plan':
        if (!data?.plan) {
          return NextResponse.json(
            { error: 'Plan is required for change_plan action' },
            { status: 400 }
          )
        }
        
        // Update user plan and subscription
        result = await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { subscriptionPlan: data.plan }
          }),
          prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              plan: data.plan,
              status: 'active',
              price: data.price || 0
            },
            update: {
              plan: data.plan,
              price: data.price || 0
            }
          })
        ])
        break
        
      case 'update_subscription':
        result = await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan: data?.plan || user.subscriptionPlan,
            status: data?.status || 'active',
            price: data?.price || 0,
            billingCycle: data?.billingCycle || 'monthly',
            activeGroups: JSON.stringify(data?.activeGroups || ['core'])
          },
          update: {
            plan: data?.plan,
            status: data?.status,
            price: data?.price,
            billingCycle: data?.billingCycle,
            activeGroups: data?.activeGroups ? JSON.stringify(data.activeGroups) : undefined
          }
        })
        break
        
      case 'grant_modules':
        const currentGroups = user.subscription?.activeGroups 
          ? JSON.parse(user.subscription.activeGroups) 
          : ['core']
        const newGroups = [...new Set([...currentGroups, ...(data?.groups || [])])]
        
        result = await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan: 'custom',
            status: 'active',
            activeGroups: JSON.stringify(newGroups)
          },
          update: {
            activeGroups: JSON.stringify(newGroups)
          }
        })
        break
        
      case 'revoke_modules':
        const existingGroups = user.subscription?.activeGroups 
          ? JSON.parse(user.subscription.activeGroups) 
          : ['core']
        const remainingGroups = existingGroups.filter(
          (g: string) => !(data?.groups || []).includes(g)
        )
        
        result = await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan: 'starter',
            status: 'active',
            activeGroups: JSON.stringify(['core'])
          },
          update: {
            activeGroups: JSON.stringify(remainingGroups.length > 0 ? remainingGroups : ['core'])
          }
        })
        break
        
      case 'delete':
        // Soft delete - mark as deleted
        result = await prisma.user.update({
          where: { id: userId },
          data: { accountStatus: 'deleted' }
        })
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
    
    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: `admin_${action}`,
        resource: 'user',
        resourceId: userId,
        details: JSON.stringify({ action, data, targetEmail: user.email })
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `User ${action} successful`,
      result
    })
    
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Hard delete user (superadmin only)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    
    if (admin.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Only superadmin can delete users' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }
    
    // Prevent self-deletion
    if (userId === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }
    
    // Get user info before deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    if (user.role === 'superadmin') {
      return NextResponse.json(
        { error: 'Cannot delete superadmin account' },
        { status: 403 }
      )
    }
    
    // Delete user (cascade will delete related data)
    await prisma.user.delete({
      where: { id: userId }
    })
    
    // Log action
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: 'admin_hard_delete',
        resource: 'user',
        resourceId: userId,
        details: JSON.stringify({ deletedEmail: user.email })
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'User permanently deleted'
    })
    
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
