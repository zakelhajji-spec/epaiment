/**
 * Single Credit Note API Route
 * Handles GET, PUT, DELETE for a specific credit note
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get a single credit note by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const creditNote = await prisma.creditNote.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        client: true,
        items: true
      }
    })

    if (!creditNote) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    }

    return NextResponse.json(creditNote)
  } catch (error) {
    console.error('Error fetching credit note:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credit note' },
      { status: 500 }
    )
  }
}

// PUT - Update a credit note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check credit note exists and belongs to user
    const existingCreditNote = await prisma.creditNote.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existingCreditNote) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    }

    // Only allow updates to draft credit notes
    if (existingCreditNote.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only edit draft credit notes' },
        { status: 400 }
      )
    }

    const {
      clientId,
      items,
      subtotal,
      tvaAmount,
      total,
      status,
      reason,
      reasonNotes,
      invoiceId,
      issueDate,
      notes
    } = body

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (clientId) {
      // Verify client exists and belongs to user
      const client = await prisma.client.findFirst({
        where: { id: clientId, userId: session.user.id }
      })
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      updateData.clientId = clientId
    }

    if (items !== undefined) {
      updateData.itemsJson = items ? JSON.stringify(items) : null
    }

    if (subtotal !== undefined) {
      updateData.subtotal = parseFloat(String(subtotal))
    }

    if (tvaAmount !== undefined) {
      updateData.tvaAmount = parseFloat(String(tvaAmount))
    }

    if (total !== undefined) {
      updateData.total = parseFloat(String(total))
    }

    if (status !== undefined) {
      const validStatuses = ['draft', 'issued', 'applied']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: draft, issued, applied' },
          { status: 400 }
        )
      }
      updateData.status = status

      // Set timestamps based on status
      if (status === 'issued' && !existingCreditNote.issuedAt) {
        updateData.issuedAt = new Date()
      }
      if (status === 'applied' && !existingCreditNote.appliedAt) {
        updateData.appliedAt = new Date()
      }
    }

    if (reason !== undefined) {
      const validReasons = ['refund', 'discount', 'correction', 'other']
      if (!validReasons.includes(reason)) {
        return NextResponse.json(
          { error: 'Invalid reason. Must be one of: refund, discount, correction, other' },
          { status: 400 }
        )
      }
      updateData.reason = reason
    }

    if (reasonNotes !== undefined) {
      updateData.reasonNotes = reasonNotes
    }

    if (invoiceId !== undefined) {
      if (invoiceId) {
        // Verify invoice exists and belongs to user
        const invoice = await prisma.invoice.findFirst({
          where: { id: invoiceId, userId: session.user.id }
        })
        if (!invoice) {
          return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }
      }
      updateData.invoiceId = invoiceId
    }

    if (issueDate !== undefined) {
      updateData.issueDate = new Date(issueDate)
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    const creditNote = await prisma.creditNote.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        items: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'credit_note',
        resourceId: id,
        oldValues: JSON.stringify(existingCreditNote),
        newValues: JSON.stringify(creditNote)
      }
    })

    return NextResponse.json(creditNote)
  } catch (error) {
    console.error('Error updating credit note:', error)
    return NextResponse.json(
      { error: 'Failed to update credit note' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a credit note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check credit note exists and belongs to user
    const creditNote = await prisma.creditNote.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!creditNote) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    }

    // Only allow deletion of draft credit notes
    if (creditNote.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft credit notes' },
        { status: 400 }
      )
    }

    // Delete related items first
    await prisma.creditNoteItem.deleteMany({
      where: { creditNoteId: id }
    })

    // Delete the credit note
    await prisma.creditNote.delete({ where: { id } })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        resource: 'credit_note',
        resourceId: id,
        oldValues: JSON.stringify(creditNote)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting credit note:', error)
    return NextResponse.json(
      { error: 'Failed to delete credit note' },
      { status: 500 }
    )
  }
}

// PATCH - Update credit note status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body

    // Check credit note exists and belongs to user
    const creditNote = await prisma.creditNote.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!creditNote) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'issue':
        if (creditNote.status !== 'draft') {
          return NextResponse.json(
            { error: 'Can only issue draft credit notes' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'issued',
          issuedAt: new Date()
        }
        break

      case 'apply':
        if (creditNote.status !== 'issued') {
          return NextResponse.json(
            { error: 'Can only apply issued credit notes' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'applied',
          appliedAt: new Date()
        }
        break

      case 'revert_to_draft':
        if (creditNote.status === 'applied') {
          return NextResponse.json(
            { error: 'Cannot revert applied credit notes' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'draft',
          issuedAt: null
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be one of: issue, apply, revert_to_draft' },
          { status: 400 }
        )
    }

    const updatedCreditNote = await prisma.creditNote.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        items: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: action,
        resource: 'credit_note',
        resourceId: id,
        details: JSON.stringify({ action, previousStatus: creditNote.status })
      }
    })

    return NextResponse.json(updatedCreditNote)
  } catch (error) {
    console.error('Error updating credit note status:', error)
    return NextResponse.json(
      { error: 'Failed to update credit note' },
      { status: 500 }
    )
  }
}
