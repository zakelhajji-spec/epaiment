/**
 * Admin Dashboard Stats API
 * Returns platform-wide statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-middleware'

export async function GET(request: NextRequest) {
  try {
    await requireAdmin()
    
    // Get date ranges
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Parallel queries for all stats
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      totalInvoices,
      invoicesThisMonth,
      totalRevenue,
      revenueThisMonth,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalPaymentLinks,
      paidPaymentLinks,
      pendingPaymentLinks,
      subscriptionBreakdown,
      recentUsers,
      topUsers
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users (logged in last 30 days)
      prisma.user.count({
        where: { 
          lastLogin: { gte: thirtyDaysAgo },
          accountStatus: 'active'
        }
      }),
      
      // New users this month
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      
      // New users this week
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      }),
      
      // Total invoices
      prisma.invoice.count(),
      
      // Invoices this month
      prisma.invoice.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      
      // Total revenue (from paid invoices)
      prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { total: true }
      }),
      
      // Revenue this month
      prisma.invoice.aggregate({
        where: { 
          status: 'paid',
          paidAt: { gte: thirtyDaysAgo }
        },
        _sum: { total: true }
      }),
      
      // Paid invoices count
      prisma.invoice.count({ where: { status: 'paid' } }),
      
      // Pending invoices
      prisma.invoice.count({ where: { status: 'sent' } }),
      
      // Overdue invoices
      prisma.invoice.count({
        where: {
          status: 'sent',
          dueDate: { lt: now }
        }
      }),
      
      // Total payment links
      prisma.paymentLink.count(),
      
      // Paid payment links
      prisma.paymentLink.count({ where: { status: 'paid' } }),
      
      // Pending payment links
      prisma.paymentLink.count({ where: { status: 'pending' } }),
      
      // Subscription breakdown
      prisma.user.groupBy({
        by: ['subscriptionPlan'],
        _count: { id: true }
      }),
      
      // Recent users (last 10)
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          createdAt: true,
          subscriptionPlan: true,
          accountStatus: true,
          _count: {
            select: { invoices: true, clients: true }
          }
        }
      }),
      
      // Top users by invoice count
      prisma.user.findMany({
        take: 10,
        orderBy: { invoices: { _count: 'desc' } },
        select: {
          id: true,
          email: true,
          name: true,
          companyName: true,
          subscriptionPlan: true,
          _count: {
            select: { invoices: true, clients: true, paymentLinks: true }
          }
        }
      })
    ])
    
    // Calculate MRR (Monthly Recurring Revenue)
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'active' },
      select: { price: true, billingCycle: true }
    })
    
    const mrr = subscriptions.reduce((sum, sub) => {
      const monthly = sub.billingCycle === 'annual' ? sub.price / 12 : sub.price
      return sum + monthly
    }, 0)
    
    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        newThisWeek: newUsersThisWeek,
        growthRate: totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : 0
      },
      invoices: {
        total: totalInvoices,
        thisMonth: invoicesThisMonth,
        paid: paidInvoices,
        pending: pendingInvoices,
        overdue: overdueInvoices
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
        thisMonth: revenueThisMonth._sum.total || 0,
        mrr: mrr
      },
      paymentLinks: {
        total: totalPaymentLinks,
        paid: paidPaymentLinks,
        pending: pendingPaymentLinks,
        conversionRate: totalPaymentLinks > 0 
          ? ((paidPaymentLinks / totalPaymentLinks) * 100).toFixed(1) 
          : 0
      },
      subscriptions: subscriptionBreakdown.map(s => ({
        plan: s.subscriptionPlan,
        count: s._count.id
      })),
      recentUsers,
      topUsers
    })
    
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
