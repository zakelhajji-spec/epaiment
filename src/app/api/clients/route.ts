/**
 * Clients API Route
 * Handles CRUD operations for clients
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - List all clients for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = { userId: session.user.id }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { ice: { contains: search } }
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { invoices: true }
        }
      }
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

// POST - Create a new client
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

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if client with same email exists
    const existing = await prisma.client.findFirst({
      where: { userId: session.user.id, email: email.toLowerCase() }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 409 }
      )
    }

    // Create client
    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        name,
        ice: ice || null,
        email: email.toLowerCase(),
        phone: phone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        country: country || 'Maroc',
        ifNumber: ifNumber || null,
        rcNumber: rcNumber || null,
        notes: notes || null
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'client',
        resourceId: client.id,
        newValues: JSON.stringify(client)
      }
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
