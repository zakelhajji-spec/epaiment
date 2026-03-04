/**
 * Expenses API Route
 * Handles expense tracking with TVA deductibility
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - List expenses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const supplierId = searchParams.get('supplierId')

    const where: any = { userId: session.user.id }

    if (category) where.category = category
    if (supplierId) where.supplierId = supplierId
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        supplier: {
          select: { id: true, name: true, ice: true }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate totals
    const totals = expenses.reduce((acc: any, exp: any) => {
      acc.totalAmount += exp.amount
      acc.totalTva += exp.tvaAmount
      if (exp.tvaDeductible) acc.deductibleTva += exp.tvaAmount
      return acc
    }, { totalAmount: 0, totalTva: 0, deductibleTva: 0 })

    return NextResponse.json({
      expenses,
      totals,
      count: expenses.length
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

// POST - Create expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      description,
      amount,
      category,
      date,
      tvaRate = 0,
      tvaAmount = 0,
      tvaDeductible = true,
      supplierId,
      paymentMethod,
      paymentReference,
      paidAt,
      receiptUrl,
      notes
    } = body

    if (!description || !amount || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        userId: session.user.id,
        description,
        amount: parseFloat(amount),
        category,
        date: date ? new Date(date) : new Date(),
        tvaRate: parseFloat(tvaRate),
        tvaAmount: parseFloat(tvaAmount),
        tvaDeductible,
        supplierId,
        paymentMethod,
        paymentReference,
        paidAt: paidAt ? new Date(paidAt) : null,
        receiptUrl,
        notes
      },
      include: {
        supplier: { select: { id: true, name: true } }
      }
    })

    // Update supplier stats if applicable
    if (supplierId) {
      await prisma.supplier.update({
        where: { id: supplierId },
        data: {
          totalPurchases: { increment: expense.amount },
          balance: { increment: expense.amount }
        }
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'expense',
        resourceId: expense.id,
        details: JSON.stringify({ description, amount, category })
      }
    })

    return NextResponse.json({ success: true, expense })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
