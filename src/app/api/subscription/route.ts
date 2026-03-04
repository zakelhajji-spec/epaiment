/**
 * Subscription API Route
 * Handles subscription management with new pricing plans
 * Plans: Starter (Free), Basic (49 MAD), Pro (99 MAD), Business (199 MAD)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PRICING_PLANS, getPlanLimits, getPlanModules } from '@/lib/pricing-plans.config'
import { MODULE_GROUPS, GROUP_BUNDLES, calculateGroupsPrice, getModulesForGroups, getGroupLimits } from '@/lib/module-groups.config'

// Plan to Module Groups mapping
const PLAN_TO_GROUPS: Record<string, string[]> = {
  starter: ['core'],
  basic: ['core', 'sales', 'accounting'],
  pro: ['core', 'sales', 'accounting', 'crm', 'integrations'],
  business: ['core', 'sales', 'accounting', 'crm', 'stock', 'team', 'integrations', 'ai'],
}

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

    // Get active plan
    const currentPlanId = user.subscription?.plan || user.subscriptionPlan || 'starter'
    const plan = PRICING_PLANS.find(p => p.id === currentPlanId) || PRICING_PLANS[0]

    // Get active groups from subscription or plan mapping
    let activeGroups: string[] = PLAN_TO_GROUPS[currentPlanId] || ['core']
    
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

    // Get modules and limits
    const activeModules = getPlanModules(currentPlanId)
    const planLimits = getPlanLimits(currentPlanId)
    const groupLimits = getGroupLimits(activeGroups)

    return NextResponse.json({
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        annualPrice: plan.annualPrice,
        color: plan.color,
        limits: planLimits,
        modules: plan.modules,
      },
      activeGroups,
      activeModules,
      limits: { ...groupLimits, ...planLimits },
      subscription: user.subscription ? {
        id: user.subscription.id,
        status: user.subscription.status,
        billingCycle: user.subscription.billingCycle,
        currentPeriodStart: user.subscription.currentPeriodStart,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        price: user.subscription.price,
      } : null,
      // Available plans for upgrade
      availablePlans: PRICING_PLANS.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        annualPrice: p.annualPrice,
        popular: p.popular,
        recommended: p.recommended,
      })),
      // Module groups (for reference)
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

// POST - Subscribe to a plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, billingCycle = 'monthly' } = body

    // Validate plan
    const plan = PRICING_PLANS.find(p => p.id === planId)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Get current subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate price
    const price = billingCycle === 'annual' ? plan.annualPrice : plan.price

    // Get module groups for this plan
    const activeGroups = PLAN_TO_GROUPS[planId] || ['core']

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        plan: planId,
        activeGroups: JSON.stringify(activeGroups),
        status: plan.price === 0 ? 'active' : 'trial',
        price,
        billingCycle,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
        trialEnd: plan.price > 0 ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
      },
      update: {
        plan: planId,
        activeGroups: JSON.stringify(activeGroups),
        price,
        billingCycle,
        status: plan.price === 0 ? 'active' : (user.subscription?.status === 'active' ? 'active' : 'trial'),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
      }
    })

    // Update user's subscription plan
    await prisma.user.update({
      where: { id: session.user.id },
      data: { subscriptionPlan: planId }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'subscribe_plan',
        resource: 'subscription',
        resourceId: subscription.id,
        details: JSON.stringify({ 
          planId, 
          billingCycle, 
          price, 
          groups: activeGroups,
          planName: plan.name 
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${plan.name.fr} plan`,
      subscription: {
        id: subscription.id,
        plan: planId,
        status: subscription.status,
        price,
        billingCycle,
      },
      activeGroups,
      activeModules: getPlanModules(planId),
      limits: getPlanLimits(planId),
    })
  } catch (error) {
    console.error('Error managing subscription:', error)
    return NextResponse.json(
      { error: 'Failed to manage subscription' },
      { status: 500 }
    )
  }
}

// PUT - Cancel or downgrade subscription
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { reason, downgrade = true } = body

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
    }

    if (downgrade) {
      // Reset to starter (free plan)
      const updated = await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          plan: 'starter',
          activeGroups: JSON.stringify(['core']),
          status: 'active',
          price: 0,
          canceledAt: new Date(),
        }
      })

      // Update user's plan
      await prisma.user.update({
        where: { id: session.user.id },
        data: { subscriptionPlan: 'starter' }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'cancel_subscription',
          resource: 'subscription',
          resourceId: subscription.id,
          details: JSON.stringify({ reason, previousPlan: subscription.plan })
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Subscription canceled. You are now on the free Starter plan.',
        subscription: updated
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

// DELETE - Completely remove subscription (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    await prisma.subscription.deleteMany({
      where: { userId: targetUserId }
    })

    await prisma.user.update({
      where: { id: targetUserId },
      data: { subscriptionPlan: 'starter' }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}
