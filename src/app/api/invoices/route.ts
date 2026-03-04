/**
 * Invoices API Route
 * Handles CRUD operations for invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - List all invoices for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { userId: session.user.id }
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, email: true, ice: true }
          },
          payments: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.invoice.count({ where })
    ])

    return NextResponse.json({ invoices, total })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      clientId,
      items,
      subtotal,
      discountPercent = 0,
      discountAmount = 0,
      tvaAmount,
      total,
      dueDate,
      notes,
      internalNotes,
      paymentTerms,
      isRecurring = false,
      recurringFrequency
    } = body

    // Validate required fields
    if (!clientId || !items || !subtotal || !total || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate invoice number
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    const invoiceCount = await prisma.invoice.count({
      where: { userId: session.user.id }
    })
    const prefix = user?.invoicePrefix || 'FA'
    const year = new Date().getFullYear()
    const number = `${prefix}-${year}-${String(invoiceCount + 1).padStart(4, '0')}`

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        userId: session.user.id,
        clientId,
        number,
        items: JSON.stringify(items),
        subtotal: parseFloat(subtotal),
        discountPercent: parseFloat(discountPercent),
        discountAmount: parseFloat(discountAmount),
        tvaAmount: parseFloat(tvaAmount || 0),
        total: parseFloat(total),
        balance: parseFloat(total),
        dueDate: new Date(dueDate),
        notes,
        internalNotes,
        paymentTerms,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : null
      },
      include: {
        client: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'invoice',
        resourceId: invoice.id,
        newValues: JSON.stringify(invoice)
      }
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
