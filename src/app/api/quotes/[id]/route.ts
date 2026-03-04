/**
 * Single Quote API Route
 * Handles GET, PUT, DELETE for a specific quote
 * Also handles conversion to invoice
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get a single quote by ID
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

    const quote = await prisma.quote.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        client: true,
        supplier: true,
        items: true
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}

// PUT - Update a quote
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

    // Check quote exists and belongs to user
    const existingQuote = await prisma.quote.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existingQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Only allow updates to draft or sent quotes
    if (!['draft', 'sent'].includes(existingQuote.status)) {
      return NextResponse.json(
        { error: 'Can only edit draft or sent quotes' },
        { status: 400 }
      )
    }

    const {
      clientId,
      supplierId,
      items,
      subtotal,
      discountPercent,
      discountAmount,
      tvaAmount,
      total,
      status,
      issueDate,
      validUntil,
      notes,
      internalNotes
    } = body

    // Build update data
    const updateData: {
      clientId?: string | null
      supplierId?: string | null
      itemsJson?: string | null
      subtotal?: number
      discountPercent?: number
      discountAmount?: number
      tvaAmount?: number
      total?: number
      status?: string
      issueDate?: Date
      validUntil?: Date | null
      notes?: string
      internalNotes?: string
    } = {}

    if (clientId !== undefined) updateData.clientId = clientId || null
    if (supplierId !== undefined) updateData.supplierId = supplierId || null
    if (items) updateData.itemsJson = JSON.stringify(items)
    if (subtotal !== undefined) updateData.subtotal = parseFloat(subtotal)
    if (discountPercent !== undefined) updateData.discountPercent = parseFloat(discountPercent)
    if (discountAmount !== undefined) updateData.discountAmount = parseFloat(discountAmount)
    if (tvaAmount !== undefined) updateData.tvaAmount = parseFloat(tvaAmount)
    if (total !== undefined) updateData.total = parseFloat(total)
    if (status !== undefined) updateData.status = status
    if (issueDate !== undefined) updateData.issueDate = new Date(issueDate)
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null
    if (notes !== undefined) updateData.notes = notes
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        supplier: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'quote',
        resourceId: id,
        oldValues: JSON.stringify(existingQuote),
        newValues: JSON.stringify(quote)
      }
    })

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error updating quote:', error)
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a quote
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

    // Check quote exists and belongs to user
    const quote = await prisma.quote.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Only allow deletion of draft quotes
    if (quote.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft quotes' },
        { status: 400 }
      )
    }

    // Delete quote items first (cascade should handle this, but being explicit)
    await prisma.quoteItem.deleteMany({
      where: { quoteId: id }
    })

    // Delete the quote
    await prisma.quote.delete({ where: { id } })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        resource: 'quote',
        resourceId: id,
        oldValues: JSON.stringify(quote)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    )
  }
}

// PATCH - Update quote status or convert to invoice
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
    const { action, status, dueDate } = body

    // Check quote exists and belongs to user
    const quote = await prisma.quote.findFirst({
      where: { id, userId: session.user.id },
      include: {
        client: true,
        supplier: true
      }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Handle convert to invoice action
    if (action === 'convert_to_invoice') {
      // Validate quote can be converted
      if (quote.status === 'converted') {
        return NextResponse.json(
          { error: 'Quote already converted to invoice' },
          { status: 400 }
        )
      }

      if (!quote.clientId) {
        return NextResponse.json(
          { error: 'Quote must have a client to convert to invoice' },
          { status: 400 }
        )
      }

      // Get user for invoice prefix
      const user = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      // Count existing invoices for this user
      const invoiceCount = await prisma.invoice.count({
        where: { userId: session.user.id }
      })

      // Generate invoice number
      const prefix = user?.invoicePrefix || 'FA'
      const year = new Date().getFullYear()
      const invoiceNumber = `${prefix}-${year}-${String(invoiceCount + 1).padStart(4, '0')}`

      // Calculate due date (default to 30 days from now if not provided)
      const invoiceDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      // Create invoice from quote
      const invoice = await prisma.invoice.create({
        data: {
          userId: session.user.id,
          clientId: quote.clientId,
          number: invoiceNumber,
          itemsJson: quote.itemsJson,
          subtotal: quote.subtotal,
          discountPercent: quote.discountPercent,
          discountAmount: quote.discountAmount,
          tvaAmount: quote.tvaAmount,
          total: quote.total,
          balance: quote.total,
          status: 'draft',
          dueDate: invoiceDueDate,
          notes: quote.notes,
          internalNotes: `Converted from quote ${quote.number}`
        },
        include: {
          client: true
        }
      })

      // Update quote status to converted
      const updatedQuote = await prisma.quote.update({
        where: { id },
        data: {
          status: 'converted',
          convertedAt: new Date(),
          invoiceId: invoice.id
        }
      })

      // Create audit logs
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'convert_to_invoice',
          resource: 'quote',
          resourceId: id,
          newValues: JSON.stringify({ quoteId: id, invoiceId: invoice.id })
        }
      })

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'create',
          resource: 'invoice',
          resourceId: invoice.id,
          newValues: JSON.stringify(invoice),
          details: `Created from quote ${quote.number}`
        }
      })

      return NextResponse.json({
        success: true,
        invoice,
        quote: updatedQuote
      })
    }

    // Handle status update actions
    let updateData: {
      status?: string
      sentAt?: Date
      acceptedAt?: Date
      rejectedAt?: Date
    } = {}

    switch (action) {
      case 'send':
        updateData = {
          status: 'sent',
          sentAt: new Date()
        }
        break

      case 'accept':
        updateData = {
          status: 'accepted',
          acceptedAt: new Date()
        }
        break

      case 'reject':
        updateData = {
          status: 'rejected',
          rejectedAt: new Date()
        }
        break

      case 'expire':
        updateData = { status: 'expired' }
        break

      case 'update_status':
        // Direct status update
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for update_status action' },
            { status: 400 }
          )
        }
        const validStatuses = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted']
        if (!validStatuses.includes(status)) {
          return NextResponse.json(
            { error: 'Invalid status value' },
            { status: 400 }
          )
        }
        updateData = { status }
        
        // Set appropriate timestamp based on status
        if (status === 'sent') updateData.sentAt = new Date()
        if (status === 'accepted') updateData.acceptedAt = new Date()
        if (status === 'rejected') updateData.rejectedAt = new Date()
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        supplier: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: action || 'update_status',
        resource: 'quote',
        resourceId: id,
        details: JSON.stringify({ action, previousStatus: quote.status, newStatus: updatedQuote.status })
      }
    })

    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error('Error updating quote status:', error)
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}
