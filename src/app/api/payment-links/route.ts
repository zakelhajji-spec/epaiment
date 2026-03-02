/**
 * Payment Links API Route
 * Handles CRUD operations for payment links
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

// Generate a unique reference
function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = randomBytes(4).toString('hex').toUpperCase()
  return `EP-${timestamp}-${random}`
}

// GET - List all payment links for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { userId: session.user.id }
    if (status) where.status = status

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

    // Generate unique reference
    const reference = generateReference()

    // Create payment link
    const link = await prisma.paymentLink.create({
      data: {
        userId: session.user.id,
        amount: parseFloat(amount),
        description,
        clientName,
        clientEmail,
        clientPhone,
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
        newValues: JSON.stringify(link)
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
