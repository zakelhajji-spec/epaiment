/**
 * Credit Notes API Route
 * Handles CRUD operations for credit notes (Avoirs)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - List all credit notes for the current user
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

    const where: Record<string, unknown> = { userId: session.user.id }
    if (status) where.status = status
    if (clientId) where.clientId = clientId

    const [creditNotes, total] = await Promise.all([
      prisma.creditNote.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, email: true, ice: true }
          },
          items: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.creditNote.count({ where })
    ])

    return NextResponse.json({ creditNotes, total })
  } catch (error) {
    console.error('Error fetching credit notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit notes' },
      { status: 500 }
    )
  }
}

// POST - Create a new credit note
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
      tvaAmount,
      total,
      status = 'draft',
      reason,
      reasonNotes,
      invoiceId,
      issueDate,
      notes
    } = body

    // Validate required fields
    if (!clientId || subtotal === undefined || total === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, subtotal, total' },
        { status: 400 }
      )
    }

    // Validate reason
    const validReasons = ['refund', 'discount', 'correction', 'other']
    if (!reason || !validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason. Must be one of: refund, discount, correction, other' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['draft', 'issued', 'applied']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: draft, issued, applied' },
        { status: 400 }
      )
    }

    // Verify client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId: session.user.id }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // If invoiceId is provided, verify it exists and belongs to user
    if (invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, userId: session.user.id }
      })

      if (!invoice) {
        return NextResponse.json(
          { error: 'Invoice not found' },
          { status: 404 }
        )
      }
    }

    // Generate credit note number (AV-YYYY-NNNN format)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    const year = new Date().getFullYear()
    
    // Count credit notes for this year to get the next number
    const creditNoteCount = await prisma.creditNote.count({
      where: {
        userId: session.user.id,
        number: {
          startsWith: `${user?.creditNotePrefix || 'AV'}-${year}`
        }
      }
    })
    
    const prefix = user?.creditNotePrefix || 'AV'
    const number = `${prefix}-${year}-${String(creditNoteCount + 1).padStart(4, '0')}`

    // Create credit note
    const creditNote = await prisma.creditNote.create({
      data: {
        userId: session.user.id,
        clientId,
        number,
        itemsJson: items ? JSON.stringify(items) : null,
        subtotal: parseFloat(String(subtotal)),
        tvaAmount: parseFloat(String(tvaAmount || 0)),
        total: parseFloat(String(total)),
        status,
        reason,
        reasonNotes,
        invoiceId,
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        issuedAt: status === 'issued' ? new Date() : null,
        appliedAt: status === 'applied' ? new Date() : null,
        notes
      },
      include: {
        client: true,
        items: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'credit_note',
        resourceId: creditNote.id,
        newValues: JSON.stringify(creditNote)
      }
    })

    return NextResponse.json(creditNote, { status: 201 })
  } catch (error) {
    console.error('Error creating credit note:', error)
    return NextResponse.json(
      { error: 'Failed to create credit note' },
      { status: 500 }
    )
  }
}
