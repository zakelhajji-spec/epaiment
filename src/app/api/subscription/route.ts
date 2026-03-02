/**
 * Subscription API Route
 * Handles subscription management and plan activation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Plan configurations
const PLANS = {
  starter: {
    name: 'Starter',
    price: 0,
    modules: ['dashboard', 'invoices', 'clients', 'payment-links'],
    limits: {
      invoices: 10,
      clients: 50,
      paymentLinks: 20
    }
  },
  basic: {
    name: 'Basic',
    price: 199,
    modules: ['dashboard', 'invoices', 'clients', 'payment-links', 'quotes', 'expenses'],
    limits: {
      invoices: 100,
      clients: 200,
      paymentLinks: 100
    }
  },
  pro: {
    name: 'Pro',
    price: 499,
    modules: ['dashboard', 'invoices', 'clients', 'payment-links', 'quotes', 'expenses', 'reports', 'crm', 'api'],
    limits: {
      invoices: 1000,
      clients: 1000,
      paymentLinks: 500
    }
  },
  business: {
    name: 'Business',
    price: 999,
    modules: ['dashboard', 'invoices', 'clients', 'payment-links', 'quotes', 'expenses', 'reports', 'crm', 'api', 'stock', 'team'],
    limits: {
      invoices: -1, // unlimited
      clients: -1,
      paymentLinks: -1
    }
  }
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

    const currentPlan = PLANS[user.subscriptionPlan as keyof typeof PLANS] || PLANS.starter

    return NextResponse.json({
      plan: user.subscriptionPlan,
      planDetails: currentPlan,
      subscription: user.subscription,
      modules: currentPlan.modules
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

// POST - Activate a new plan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, interval = 'monthly' } = body

    // Validate plan
    const plan = PLANS[planId as keyof typeof PLANS]
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate price
    const price = interval === 'annual' ? plan.price * 10 : plan.price // 2 months free for annual

    // For free plan, activate immediately
    if (plan.price === 0) {
      // Update or create subscription
      const subscription = await prisma.subscription.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          plan: planId,
          status: 'active',
          price: 0,
          interval
        },
        update: {
          plan: planId,
          status: 'active',
          interval
        }
      })

      // Update user's plan
      await prisma.user.update({
        where: { id: session.user.id },
        data: { subscriptionPlan: planId }
      })

      return NextResponse.json({
        success: true,
        message: 'Plan activated successfully',
        subscription,
        planDetails: plan
      })
    }

    // For paid plans, we would integrate with payment gateway
    // For now, create a pending subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        plan: planId,
        status: 'trial', // Trial status until payment confirmed
        price,
        interval,
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
      },
      update: {
        plan: planId,
        price,
        interval
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'subscribe',
        resource: 'subscription',
        resourceId: subscription.id,
        details: JSON.stringify({ planId, interval, price })
      }
    })

    // TODO: Return payment gateway checkout URL
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: 'Subscription initiated. Payment gateway integration required.',
      subscription,
      planDetails: plan,
      checkoutUrl: null // Would be payment gateway URL
    })
  } catch (error) {
    console.error('Error activating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to activate subscription' },
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

    // Cancel at period end
    const updated = await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        cancelReason: reason
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
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
