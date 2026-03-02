/**
 * Subscription API Route
 * Handles subscription management with module groups
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { MODULE_GROUPS, GROUP_BUNDLES, calculateGroupsPrice, getModulesForGroups, getGroupLimits } from '@/lib/module-groups.config'

// GET - Get current subscription status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get active groups from subscription
    let activeGroups: string[] = ['core'] // Default: core is always included
    
    if (user.subscription?.activeGroups) {
      try {
        const parsed = JSON.parse(user.subscription.activeGroups)
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeGroups = parsed
        }
      } catch {
        // Keep default
      }
    }

    // Get modules for active groups
    const activeModules = getModulesForGroups(activeGroups)
    const limits = getGroupLimits(activeGroups)
    const totalMonthly = calculateGroupsPrice(activeGroups)

    // Find current bundle match
    const currentBundle = GROUP_BUNDLES.find(b => 
      b.groups.every(g => activeGroups.includes(g)) &&
      b.groups.length === activeGroups.length
    )

    return NextResponse.json({
      plan: user.subscription?.plan || user.subscriptionPlan || 'starter',
      activeGroups,
      activeModules,
      limits,
      totalMonthly,
      currentBundle: currentBundle ? {
        id: currentBundle.id,
        name: currentBundle.name,
        price: currentBundle.price
      } : null,
      subscription: user.subscription ? {
        id: user.subscription.id,
        status: user.subscription.status,
        billingCycle: user.subscription.billingCycle,
        currentPeriodStart: user.subscription.currentPeriodStart,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
      } : null,
      groups: MODULE_GROUPS.map(g => ({
        id: g.id,
        name: g.name,
        price: g.price,
        isActive: activeGroups.includes(g.id)
      }))
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

// POST - Subscribe to a module group or bundle
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, groupId, bundleId, billingCycle = 'monthly' } = body

    // Get current subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let activeGroups: string[] = ['core']
    
    if (user.subscription?.activeGroups) {
      try {
        const parsed = JSON.parse(user.subscription.activeGroups)
        if (Array.isArray(parsed)) {
          activeGroups = parsed
        }
      } catch {
        // Keep default
      }
    }

    // Handle bundle subscription
    if (action === 'subscribe_bundle' && bundleId) {
      const bundle = GROUP_BUNDLES.find(b => b.id === bundleId)
      if (!bundle) {
        return NextResponse.json({ error: 'Invalid bundle' }, { status: 400 })
      }

      activeGroups = [...bundle.groups]
      
      const price = billingCycle === 'annual' 
        ? bundle.annualPrice 
        : bundle.price

      const subscription = await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          plan: bundleId,
          activeGroups: JSON.stringify(activeGroups),
          status: bundle.price === 0 ? 'active' : 'trial',
          price,
          billingCycle,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          trialEnd: bundle.price > 0 ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
        },
        update: {
          plan: bundleId,
          activeGroups: JSON.stringify(activeGroups),
          price,
          billingCycle,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })

      // Update user's subscription plan
      await prisma.user.update({
        where: { id: session.user.id },
        data: { subscriptionPlan: bundleId }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'subscribe_bundle',
          resource: 'subscription',
          resourceId: subscription.id,
          details: JSON.stringify({ bundleId, billingCycle, price, groups: activeGroups })
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Bundle subscribed successfully',
        subscription,
        activeGroups,
        activeModules: getModulesForGroups(activeGroups)
      })
    }

    // Handle group subscription
    if (action === 'subscribe_group' && groupId) {
      const group = MODULE_GROUPS.find(g => g.id === groupId)
      if (!group) {
        return NextResponse.json({ error: 'Invalid group' }, { status: 400 })
      }

      // Check dependencies
      const coreIndex = activeGroups.indexOf('core')
      if (groupId !== 'core' && coreIndex === -1) {
        activeGroups.unshift('core') // Ensure core is always included
      }

      if (!activeGroups.includes(groupId)) {
        activeGroups.push(groupId)
      }

      const price = calculateGroupsPrice(activeGroups)

      const subscription = await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          plan: 'custom',
          activeGroups: JSON.stringify(activeGroups),
          status: price === 0 ? 'active' : 'trial',
          price,
          billingCycle,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          trialEnd: price > 0 ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
        },
        update: {
          activeGroups: JSON.stringify(activeGroups),
          price,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'subscribe_group',
          resource: 'subscription',
          resourceId: subscription.id,
          details: JSON.stringify({ groupId, groups: activeGroups, price })
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Group subscribed successfully',
        subscription,
        activeGroups,
        activeModules: getModulesForGroups(activeGroups)
      })
    }

    // Handle group unsubscription
    if (action === 'unsubscribe_group' && groupId) {
      // Cannot unsubscribe from core
      if (groupId === 'core') {
        return NextResponse.json({ error: 'Cannot unsubscribe from core module' }, { status: 400 })
      }

      activeGroups = activeGroups.filter(g => g !== groupId)
      
      // Remove dependent groups
      const dependentGroups = ['crm', 'stock', 'ai'] // Groups that depend on others
      for (const depGroup of dependentGroups) {
        const deps = {
          crm: ['sales'],
          stock: ['sales'],
          ai: ['crm']
        }
        const required = deps[depGroup as keyof typeof deps] || []
        if (activeGroups.includes(depGroup) && required.some(r => !activeGroups.includes(r))) {
          activeGroups = activeGroups.filter(g => g !== depGroup)
        }
      }

      const price = calculateGroupsPrice(activeGroups)

      const subscription = await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          plan: activeGroups.length === 1 && activeGroups[0] === 'core' ? 'starter' : 'custom',
          activeGroups: JSON.stringify(activeGroups),
          status: 'active',
          price,
          billingCycle,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          activeGroups: JSON.stringify(activeGroups),
          price,
        }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'unsubscribe_group',
          resource: 'subscription',
          resourceId: subscription.id,
          details: JSON.stringify({ groupId, groups: activeGroups, price })
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Group unsubscribed successfully',
        subscription,
        activeGroups,
        activeModules: getModulesForGroups(activeGroups)
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error managing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    )
  }
}

// PUT - Cancel subscription
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason } = body

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
    }

    // Reset to starter (core only)
    const updated = await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        plan: 'starter',
        activeGroups: JSON.stringify(['core']),
        status: 'canceled',
        price: 0,
        canceledAt: new Date(),
      }
    })

    // Update user's plan
    await prisma.user.update({
      where: { id: session.user.id },
      data: { subscriptionPlan: 'starter' }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled. You are now on the free Starter plan.',
      subscription: updated
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
