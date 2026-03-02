/**
 * Reports API Route
 * Generates financial reports for the user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get report data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    switch (type) {
      case 'overview':
        return await getOverviewReport(session.user.id, dateFilter)
      case 'tva':
        return await getTvaReport(session.user.id, dateFilter)
      case 'revenue':
        return await getRevenueReport(session.user.id, dateFilter)
      case 'clients':
        return await getClientReport(session.user.id, dateFilter)
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

// Overview Report
async function getOverviewReport(userId: string, dateFilter: any) {
  const invoiceFilter: any = { userId }
  const expenseFilter: any = { userId }
  
  if (Object.keys(dateFilter).length > 0) {
    invoiceFilter.createdAt = dateFilter
    expenseFilter.date = dateFilter
  }

  const [
    invoices,
    expenses,
    clients,
    paymentLinks
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: invoiceFilter,
      select: { total: true, status: true, tvaAmount: true, amountPaid: true }
    }),
    prisma.expense.findMany({
      where: expenseFilter,
      select: { amount: true, tvaAmount: true, tvaDeductible: true }
    }),
    prisma.client.count({ where: { userId } }),
    prisma.paymentLink.findMany({
      where: { userId, status: 'pending' },
      select: { amount: true }
    })
  ])

  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0)

  const pendingAmount = invoices
    .filter(i => ['sent', 'partial', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + (i.total - (i.amountPaid || 0)), 0) +
    paymentLinks.reduce((sum, l) => sum + l.amount, 0)

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const tvaCollected = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.tvaAmount, 0)

  const tvaDeductible = expenses
    .filter(e => e.tvaDeductible)
    .reduce((sum, e) => sum + e.tvaAmount, 0)

  const invoiceStats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => ['sent', 'partial'].includes(i.status)).length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    draft: invoices.filter(i => i.status === 'draft').length
  }

  return NextResponse.json({
    type: 'overview',
    totalRevenue,
    pendingAmount,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses,
    tvaCollected,
    tvaDeductible,
    tvaToPay: Math.max(0, tvaCollected - tvaDeductible),
    totalClients: clients,
    invoiceStats,
    period: dateFilter.gte ? {
      start: dateFilter.gte,
      end: dateFilter.lte || new Date()
    } : null
  })
}

// TVA Report
async function getTvaReport(userId: string, dateFilter: any) {
  const invoiceFilter: any = { userId, status: 'paid' }
  const expenseFilter: any = { userId, tvaDeductible: true }
  
  if (Object.keys(dateFilter).length > 0) {
    invoiceFilter.createdAt = dateFilter
    expenseFilter.date = dateFilter
  }

  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: invoiceFilter,
      select: { 
        number: true, 
        total: true, 
        tvaAmount: true, 
        createdAt: true,
        client: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.expense.findMany({
      where: expenseFilter,
      select: { 
        description: true, 
        amount: true, 
        tvaAmount: true, 
        tvaRate: true,
        date: true,
        category: true
      },
      orderBy: { date: 'desc' }
    })
  ])

  const tvaCollected = invoices.reduce((sum, i) => sum + i.tvaAmount, 0)
  const tvaDeductible = expenses.reduce((sum, e) => sum + e.tvaAmount, 0)

  return NextResponse.json({
    type: 'tva',
    tvaCollected,
    tvaDeductible,
    tvaToPay: Math.max(0, tvaCollected - tvaDeductible),
    collectedDetails: invoices,
    deductibleDetails: expenses,
    period: dateFilter.gte ? {
      start: dateFilter.gte,
      end: dateFilter.lte || new Date()
    } : null
  })
}

// Revenue Report
async function getRevenueReport(userId: string, dateFilter: any) {
  const invoiceFilter: any = { userId, status: 'paid' }
  
  if (Object.keys(dateFilter).length > 0) {
    invoiceFilter.paidAt = dateFilter
  }

  const invoices = await prisma.invoice.findMany({
    where: invoiceFilter,
    select: { 
      number: true, 
      total: true, 
      subtotal: true,
      tvaAmount: true, 
      paidAt: true,
      client: { select: { name: true } }
    },
    orderBy: { paidAt: 'desc' }
  })

  const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0)
  const totalSubtotal = invoices.reduce((sum, i) => sum + i.subtotal, 0)
  const totalTva = invoices.reduce((sum, i) => sum + i.tvaAmount, 0)

  // Group by month
  const monthlyData: Record<string, { revenue: number; count: number }> = {}
  invoices.forEach(invoice => {
    if (invoice.paidAt) {
      const month = invoice.paidAt.toISOString().substring(0, 7)
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, count: 0 }
      }
      monthlyData[month].revenue += invoice.total
      monthlyData[month].count++
    }
  })

  return NextResponse.json({
    type: 'revenue',
    totalRevenue,
    totalSubtotal,
    totalTva,
    invoiceCount: invoices.length,
    averageInvoice: invoices.length > 0 ? totalRevenue / invoices.length : 0,
    monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data
    })),
    invoices,
    period: dateFilter.gte ? {
      start: dateFilter.gte,
      end: dateFilter.lte || new Date()
    } : null
  })
}

// Client Report
async function getClientReport(userId: string, dateFilter: any) {
  const invoiceFilter: any = { userId }
  if (Object.keys(dateFilter).length > 0) {
    invoiceFilter.createdAt = dateFilter
  }

  const clients = await prisma.client.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: { invoices: true }
      },
      invoices: {
        where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
        select: {
          total: true,
          status: true,
          amountPaid: true
        }
      }
    }
  })

  const clientStats = clients.map(client => {
    const totalInvoiced = client.invoices.reduce((sum, i) => sum + i.total, 0)
    const totalPaid = client.invoices.reduce((sum, i) => sum + (i.amountPaid || 0), 0)
    const balance = totalInvoiced - totalPaid
    
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      invoiceCount: client._count.invoices,
      totalInvoiced,
      totalPaid,
      balance
    }
  }).sort((a, b) => b.totalInvoiced - a.totalInvoiced)

  return NextResponse.json({
    type: 'clients',
    totalClients: clients.length,
    totalOutstanding: clientStats.reduce((sum, c) => sum + c.balance, 0),
    topClients: clientStats.slice(0, 10),
    allClients: clientStats,
    period: dateFilter.gte ? {
      start: dateFilter.gte,
      end: dateFilter.lte || new Date()
    } : null
  })
}
