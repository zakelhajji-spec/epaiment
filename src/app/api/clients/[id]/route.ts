/**
 * Single Client API Route
 * Handles GET, PUT, DELETE for a specific client
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get a single client by ID
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

    const client = await prisma.client.findFirst({
      where: { 
        id,
        userId: session.user.id 
      },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { invoices: true, quotes: true }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error fetching client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

// PUT - Update a client
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

    // Check client exists and belongs to user
    const existing = await prisma.client.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const {
      name,
      ice,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      ifNumber,
      rcNumber,
      notes
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (ice !== undefined) updateData.ice = ice
    if (email !== undefined) updateData.email = email.toLowerCase()
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (postalCode !== undefined) updateData.postalCode = postalCode
    if (country !== undefined) updateData.country = country
    if (ifNumber !== undefined) updateData.ifNumber = ifNumber
    if (rcNumber !== undefined) updateData.rcNumber = rcNumber
    if (notes !== undefined) updateData.notes = notes

    const client = await prisma.client.update({
      where: { id },
      data: updateData
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'client',
        resourceId: id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(client)
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a client
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

    // Check client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check for related invoices
    const invoiceCount = await prisma.invoice.count({
      where: { clientId: id }
    })

    if (invoiceCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete client with existing invoices' },
        { status: 400 }
      )
    }

    await prisma.client.delete({ where: { id } })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        resource: 'client',
        resourceId: id,
        oldValues: JSON.stringify(client)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
