/**
 * Single Supplier API Route
 * Handles GET, PUT, DELETE for a specific supplier
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get a single supplier by ID
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

    const supplier = await prisma.supplier.findFirst({
      where: { 
        id,
        userId: session.user.id 
      },
      include: {
        expenses: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { expenses: true, quotes: true }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

// PUT - Update a supplier
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

    // Check supplier exists and belongs to user
    const existing = await prisma.supplier.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const {
      name,
      ice,
      ifNumber,
      rcNumber,
      email,
      phone,
      address,
      city,
      bankName,
      bankAccount,
      rib,
      notes,
      totalPurchases,
      totalPaid,
      balance
    } = body

    // Check for email conflict if email is being changed
    if (email && email.toLowerCase() !== existing.email) {
      const emailConflict = await prisma.supplier.findFirst({
        where: { 
          userId: session.user.id, 
          email: email.toLowerCase(),
          id: { not: id }
        }
      })

      if (emailConflict) {
        return NextResponse.json(
          { error: 'A supplier with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Validate RIB format if provided (24 digits)
    if (rib !== undefined && rib !== null && rib !== '') {
      const cleanRib = rib.replace(/\s/g, '')
      if (!/^\d{24}$/.test(cleanRib)) {
        return NextResponse.json(
          { error: 'RIB must be 24 digits' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (ice !== undefined) updateData.ice = ice
    if (ifNumber !== undefined) updateData.ifNumber = ifNumber
    if (rcNumber !== undefined) updateData.rcNumber = rcNumber
    if (email !== undefined) updateData.email = email ? email.toLowerCase() : null
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (bankName !== undefined) updateData.bankName = bankName
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount
    if (rib !== undefined) updateData.rib = rib ? rib.replace(/\s/g, '') : null
    if (notes !== undefined) updateData.notes = notes
    if (totalPurchases !== undefined) updateData.totalPurchases = totalPurchases
    if (totalPaid !== undefined) updateData.totalPaid = totalPaid
    if (balance !== undefined) updateData.balance = balance

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'supplier',
        resourceId: id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(supplier)
      }
    })

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a supplier
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

    // Check supplier exists and belongs to user
    const supplier = await prisma.supplier.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Check for related expenses
    const expenseCount = await prisma.expense.count({
      where: { supplierId: id }
    })

    if (expenseCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with existing expenses. Consider archiving instead.' },
        { status: 400 }
      )
    }

    // Check for related quotes
    const quoteCount = await prisma.quote.count({
      where: { supplierId: id }
    })

    if (quoteCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with existing quotes. Consider archiving instead.' },
        { status: 400 }
      )
    }

    await prisma.supplier.delete({ where: { id } })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        resource: 'supplier',
        resourceId: id,
        oldValues: JSON.stringify(supplier)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}
