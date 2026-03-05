/**
 * Invoices API Route
 * Handles CRUD operations for invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sanitizeInput } from '@/lib/security'

// Validate and clamp pagination params
function clampInt(value: string | null, defaultVal: number, min: number, max: number): number {
  const parsed = parseInt(value || String(defaultVal))
  if (isNaN(parsed)) return defaultVal
  return Math.max(min, Math.min(max, parsed))
}

// Validate a positive number from user input
function parsePositiveFloat(value: unknown): number | null {
  const num = parseFloat(String(value))
  if (isNaN(num) || num < 0 || num > 999_999_999) return null
  return num
}

const VALID_STATUSES = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled']

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
    const limit = clampInt(searchParams.get('limit'), 50, 1, 100)
    const offset = clampInt(searchParams.get('offset'), 0, 0, 10000)

    const where: Record<string, unknown> = { userId: session.user.id }
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status
    }
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
    if (!clientId || !items || subtotal === undefined || total === undefined || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, items, subtotal, total, dueDate' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    const parsedSubtotal = parsePositiveFloat(subtotal)
    const parsedTotal = parsePositiveFloat(total)
    const parsedDiscount = parsePositiveFloat(discountPercent)
    const parsedDiscountAmt = parsePositiveFloat(discountAmount)
    const parsedTva = parsePositiveFloat(tvaAmount || 0)

    if (parsedSubtotal === null || parsedTotal === null) {
      return NextResponse.json(
        { error: 'Invalid subtotal or total amount' },
        { status: 400 }
      )
    }

    if (parsedDiscount === null || parsedDiscountAmt === null || parsedTva === null) {
      return NextResponse.json(
        { error: 'Invalid discount or TVA values' },
        { status: 400 }
      )
    }

    // Validate due date
    const parsedDueDate = new Date(dueDate)
    if (isNaN(parsedDueDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid due date format' },
        { status: 400 }
      )
    }

    // Validate items is an array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items must be a non-empty array' },
        { status: 400 }
      )
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: session.user.id }
    })
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
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
        subtotal: parsedSubtotal,
        discountPercent: parsedDiscount,
        discountAmount: parsedDiscountAmt,
        tvaAmount: parsedTva,
        total: parsedTotal,
        balance: parsedTotal,
        dueDate: parsedDueDate,
        notes: notes ? sanitizeInput(String(notes)).substring(0, 2000) : null,
        internalNotes: internalNotes ? sanitizeInput(String(internalNotes)).substring(0, 2000) : null,
        paymentTerms: paymentTerms ? String(paymentTerms).substring(0, 500) : null,
        isRecurring: Boolean(isRecurring),
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
        newValues: JSON.stringify({ number: invoice.number, total: invoice.total })
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
