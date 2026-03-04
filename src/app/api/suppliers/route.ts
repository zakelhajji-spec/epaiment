/**
 * Suppliers API Route
 * Handles CRUD operations for suppliers
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - List all suppliers for the current user with search
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: Record<string, unknown> = { userId: session.user.id }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { ice: { contains: search, mode: 'insensitive' } },
        { ifNumber: { contains: search, mode: 'insensitive' } },
        { rcNumber: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ]
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { expenses: true, quotes: true }
        }
      }
    })

    return NextResponse.json({ suppliers })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
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
      notes
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if supplier with same email exists (if email provided)
    if (email) {
      const existing = await prisma.supplier.findFirst({
        where: { 
          userId: session.user.id, 
          email: email.toLowerCase() 
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A supplier with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Validate RIB format if provided (24 digits)
    if (rib && !/^\d{24}$/.test(rib.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'RIB must be 24 digits' },
        { status: 400 }
      )
    }

    // Create supplier
    const supplier = await prisma.supplier.create({
      data: {
        userId: session.user.id,
        name,
        ice: ice || null,
        ifNumber: ifNumber || null,
        rcNumber: rcNumber || null,
        email: email ? email.toLowerCase() : null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        rib: rib ? rib.replace(/\s/g, '') : null,
        notes: notes || null,
        totalPurchases: 0,
        totalPaid: 0,
        balance: 0
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'supplier',
        resourceId: supplier.id,
        newValues: JSON.stringify(supplier)
      }
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
