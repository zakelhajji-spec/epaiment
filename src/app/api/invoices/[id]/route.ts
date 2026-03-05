/**
 * Single Invoice API Route
 * Handles GET, PUT, DELETE for a specific invoice
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get a single invoice by ID
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

    const invoice = await prisma.invoice.findFirst({
      where: { 
        id,
        userId: session.user.id 
      },
      include: {
        client: true,
        payments: {
          orderBy: { paidAt: 'desc' }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    )
  }
}

// PUT - Update an invoice
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

    // Check invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Only allow updates to draft invoices
    if (existingInvoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only edit draft invoices' },
        { status: 400 }
      )
    }

    const {
      clientId,
      items,
      subtotal,
      discountPercent,
      discountAmount,
      tvaAmount,
      total,
      dueDate,
      notes,
      internalNotes,
      paymentTerms,
      isRecurring,
      recurringFrequency
    } = body

    const updateData: Record<string, unknown> = {}
    if (clientId) updateData.clientId = clientId
    if (items) updateData.items = JSON.stringify(items)
    if (subtotal !== undefined) {
      const val = parseFloat(subtotal)
      if (isNaN(val) || val < 0) {
        return NextResponse.json({ error: 'Invalid subtotal' }, { status: 400 })
      }
      updateData.subtotal = val
    }
    if (discountPercent !== undefined) {
      const val = parseFloat(discountPercent)
      if (isNaN(val) || val < 0 || val > 100) {
        return NextResponse.json({ error: 'Discount percent must be between 0 and 100' }, { status: 400 })
      }
      updateData.discountPercent = val
    }
    if (discountAmount !== undefined) {
      const val = parseFloat(discountAmount)
      if (isNaN(val) || val < 0) {
        return NextResponse.json({ error: 'Invalid discount amount' }, { status: 400 })
      }
      updateData.discountAmount = val
    }
    if (tvaAmount !== undefined) {
      const val = parseFloat(tvaAmount)
      if (isNaN(val) || val < 0) {
        return NextResponse.json({ error: 'Invalid TVA amount' }, { status: 400 })
      }
      updateData.tvaAmount = val
    }
    if (total !== undefined) {
      const val = parseFloat(total)
      if (isNaN(val) || val < 0) {
        return NextResponse.json({ error: 'Invalid total' }, { status: 400 })
      }
      updateData.total = val
      updateData.balance = val - existingInvoice.amountPaid
    }
    if (dueDate) {
      const parsed = new Date(dueDate)
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid due date' }, { status: 400 })
      }
      updateData.dueDate = parsed
    }
    if (notes !== undefined) updateData.notes = notes
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms
    if (isRecurring !== undefined) {
      updateData.isRecurring = isRecurring
      updateData.recurringFrequency = isRecurring ? recurringFrequency : null
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { client: true }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'invoice',
        resourceId: id,
        oldValues: JSON.stringify(existingInvoice),
        newValues: JSON.stringify(invoice)
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE - Delete an invoice
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

    // Check invoice exists and belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Only allow deletion of draft invoices
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete draft invoices' },
        { status: 400 }
      )
    }

    await prisma.invoice.delete({ where: { id } })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        resource: 'invoice',
        resourceId: id,
        oldValues: JSON.stringify(invoice)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}

// PATCH - Update invoice status
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
    const { action, paymentAmount, paymentMethod, paymentReference } = body

    // Check invoice exists and belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'send':
        if (invoice.status !== 'draft') {
          return NextResponse.json(
            { error: 'Can only send draft invoices' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'sent',
          sentAt: new Date()
        }
        break
      
      case 'mark_paid': {
        const amount = parseFloat(paymentAmount) || invoice.total
        if (amount <= 0 || amount > invoice.total) {
          return NextResponse.json(
            { error: 'Payment amount must be between 0 and invoice total' },
            { status: 400 }
          )
        }
        updateData = {
          status: 'paid',
          paidAt: new Date(),
          amountPaid: amount,
          balance: 0
        }
        // Create payment record
        await prisma.payment.create({
          data: {
            invoiceId: id,
            amount: amount,
            method: paymentMethod || 'bank_transfer',
            reference: paymentReference
          }
        })
        break
      }
      
      case 'mark_partial': {
        const partialAmount = parseFloat(paymentAmount)
        if (!partialAmount || partialAmount <= 0) {
          return NextResponse.json(
            { error: 'Invalid payment amount' },
            { status: 400 }
          )
        }
        if (partialAmount >= invoice.balance) {
          return NextResponse.json(
            { error: 'Partial payment must be less than remaining balance. Use mark_paid instead.' },
            { status: 400 }
          )
        }
        const newAmountPaid = invoice.amountPaid + partialAmount
        updateData = {
          status: 'partial',
          amountPaid: newAmountPaid,
          balance: invoice.total - newAmountPaid
        }
        // Create payment record
        await prisma.payment.create({
          data: {
            invoiceId: id,
            amount: partialAmount,
            method: paymentMethod || 'bank_transfer',
            reference: paymentReference
          }
        })
        break
      }
      
      case 'cancel':
        if (invoice.status === 'paid') {
          return NextResponse.json(
            { error: 'Cannot cancel a paid invoice' },
            { status: 400 }
          )
        }
        updateData = { status: 'cancelled' }
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Valid actions: send, mark_paid, mark_partial, cancel' },
          { status: 400 }
        )
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { client: true }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: action,
        resource: 'invoice',
        resourceId: id,
        details: JSON.stringify({ action, previousStatus: invoice.status })
      }
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Error updating invoice status:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}
