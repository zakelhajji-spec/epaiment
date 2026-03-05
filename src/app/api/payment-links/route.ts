/**
 * Payment Links API Route
 * Handles CRUD operations for payment links
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'
import { isValidEmail } from '@/lib/security'

// Generate a unique reference
function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = randomBytes(4).toString('hex').toUpperCase()
  return `EP-${timestamp}-${random}`
}

// Validate and clamp pagination params
function clampInt(value: string | null, defaultVal: number, min: number, max: number): number {
  const parsed = parseInt(value || String(defaultVal))
  if (isNaN(parsed)) return defaultVal
  return Math.max(min, Math.min(max, parsed))
}

const VALID_STATUSES = ['pending', 'paid', 'expired', 'cancelled']

// GET - List all payment links for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = clampInt(searchParams.get('limit'), 50, 1, 100)
    const offset = clampInt(searchParams.get('offset'), 0, 0, 10000)

    const where: Record<string, unknown> = { userId: session.user.id }
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status
    }

    const [links, total] = await Promise.all([
      prisma.paymentLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.paymentLink.count({ where })
    ])

    return NextResponse.json({ links, total })
  } catch (error) {
    console.error('Error fetching payment links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment links' },
      { status: 500 }
    )
  }
}

// POST - Create a new payment link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      amount,
      description,
      clientName,
      clientEmail,
      clientPhone,
      dueDate,
      gatewayName
    } = body

    // Validate required fields
    if (!amount || !description) {
      return NextResponse.json(
        { error: 'Amount and description are required' },
        { status: 400 }
      )
    }

    // Validate amount
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 999_999_999) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    if (clientEmail && !isValidEmail(clientEmail)) {
      return NextResponse.json(
        { error: 'Invalid client email format' },
        { status: 400 }
      )
    }

    // Validate due date if provided
    if (dueDate) {
      const parsedDate = new Date(dueDate)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid due date format' },
          { status: 400 }
        )
      }
    }

    // Generate unique reference
    const reference = generateReference()

    // Create payment link
    const link = await prisma.paymentLink.create({
      data: {
        userId: session.user.id,
        amount: parsedAmount,
        description: String(description).substring(0, 500),
        clientName: clientName ? String(clientName).substring(0, 200) : null,
        clientEmail: clientEmail ? clientEmail.toLowerCase().trim() : null,
        clientPhone: clientPhone ? String(clientPhone).substring(0, 20) : null,
        reference,
        dueDate: dueDate ? new Date(dueDate) : null,
        gatewayName: gatewayName || null,
        paymentUrl: `${process.env.NEXTAUTH_URL || 'https://epaiement.ma'}/pay/${reference}`
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'payment_link',
        resourceId: link.id,
        newValues: JSON.stringify({ reference: link.reference, amount: link.amount })
      }
    })

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error('Error creating payment link:', error)
    return NextResponse.json(
      { error: 'Failed to create payment link' },
      { status: 500 }
    )
  }
}
