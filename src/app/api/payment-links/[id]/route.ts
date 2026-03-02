/**
 * Single Payment Link API Route
 * Handles GET, PUT, DELETE for a specific payment link
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get a single payment link by ID
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

    const link = await prisma.paymentLink.findFirst({
      where: { 
        id,
        userId: session.user.id 
      }
    })

    if (!link) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    return NextResponse.json(link)
  } catch (error) {
    console.error('Error fetching payment link:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment link' },
      { status: 500 }
    )
  }
}

// PUT - Update a payment link
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

    // Check link exists and belongs to user
    const existingLink = await prisma.paymentLink.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existingLink) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    // Only allow updates to pending links
    if (existingLink.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only edit pending payment links' },
        { status: 400 }
      )
    }

    const {
      amount,
      description,
      clientName,
      clientEmail,
      clientPhone,
      dueDate
    } = body

    const updateData: any = {}
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (description) updateData.description = description
    if (clientName !== undefined) updateData.clientName = clientName
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

    const link = await prisma.paymentLink.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(link)
  } catch (error) {
    console.error('Error updating payment link:', error)
    return NextResponse.json(
      { error: 'Failed to update payment link' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a payment link
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

    // Check link exists and belongs to user
    const link = await prisma.paymentLink.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!link) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    // Only allow deletion of pending links
    if (link.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only delete pending payment links' },
        { status: 400 }
      )
    }

    await prisma.paymentLink.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment link:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment link' },
      { status: 500 }
    )
  }
}

// PATCH - Update payment link status (cancel, mark as sent)
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
    const { action, channel } = body

    // Check link exists and belongs to user
    const link = await prisma.paymentLink.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!link) {
      return NextResponse.json({ error: 'Payment link not found' }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case 'cancel':
        if (link.status !== 'pending') {
          return NextResponse.json(
            { error: 'Can only cancel pending links' },
            { status: 400 }
          )
        }
        updateData = { status: 'cancelled' }
        break
      
      case 'mark_sent':
        const now = new Date()
        switch (channel) {
          case 'email':
            updateData = { emailSentAt: now }
            break
          case 'sms':
            updateData = { smsSentAt: now }
            break
          case 'whatsapp':
            updateData = { whatsappSentAt: now }
            break
          default:
            return NextResponse.json(
              { error: 'Invalid channel' },
              { status: 400 }
            )
        }
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedLink = await prisma.paymentLink.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(updatedLink)
  } catch (error) {
    console.error('Error updating payment link:', error)
    return NextResponse.json(
      { error: 'Failed to update payment link' },
      { status: 500 }
    )
  }
}
