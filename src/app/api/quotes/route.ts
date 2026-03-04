/**
 * Quotes API Route
 * Handles CRUD operations for quotes (devis)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - List all quotes for the current user with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const supplierId = searchParams.get('supplierId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: {
      userId: string
      status?: string
      clientId?: string
      supplierId?: string
    } = { userId: session.user.id }
    
    if (status) where.status = status
    if (clientId) where.clientId = clientId
    if (supplierId) where.supplierId = supplierId

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, email: true, ice: true, phone: true }
          },
          supplier: {
            select: { id: true, name: true, email: true, ice: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.quote.count({ where })
    ])

    return NextResponse.json({ quotes, total })
  } catch (error) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}

// POST - Create a new quote with auto-generated number (DV-YYYY-NNNN)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      clientId,
      supplierId,
      items,
      subtotal,
      discountPercent = 0,
      discountAmount = 0,
      tvaAmount,
      total,
      status = 'draft',
      issueDate,
      validUntil,
      notes,
      internalNotes
    } = body

    // Validate required fields
    if (!subtotal || !total) {
      return NextResponse.json(
        { error: 'Missing required fields: subtotal and total are required' },
        { status: 400 }
      )
    }

    // Validate that at least one of clientId or supplierId is provided
    if (!clientId && !supplierId) {
      return NextResponse.json(
        { error: 'Either clientId or supplierId is required' },
        { status: 400 }
      )
    }

    // Get user for quote prefix
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    // Count existing quotes for this user
    const quoteCount = await prisma.quote.count({
      where: { userId: session.user.id }
    })

    // Generate quote number: DV-YYYY-NNNN format
    const prefix = user?.quotePrefix || 'DV'
    const year = new Date().getFullYear()
    const number = `${prefix}-${year}-${String(quoteCount + 1).padStart(4, '0')}`

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        userId: session.user.id,
        clientId: clientId || null,
        supplierId: supplierId || null,
        number,
        itemsJson: items ? JSON.stringify(items) : null,
        subtotal: parseFloat(subtotal),
        discountPercent: parseFloat(discountPercent),
        discountAmount: parseFloat(discountAmount),
        tvaAmount: parseFloat(tvaAmount || 0),
        total: parseFloat(total),
        status,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        internalNotes
      },
      include: {
        client: true,
        supplier: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'quote',
        resourceId: quote.id,
        newValues: JSON.stringify(quote)
      }
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}
