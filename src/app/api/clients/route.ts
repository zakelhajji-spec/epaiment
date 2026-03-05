/**
 * Clients API Route
 * Handles CRUD operations for clients
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isValidEmail, sanitizeInput } from '@/lib/security'

// Validate and clamp pagination params
function clampInt(value: string | null, defaultVal: number, min: number, max: number): number {
  const parsed = parseInt(value || String(defaultVal))
  if (isNaN(parsed)) return defaultVal
  return Math.max(min, Math.min(max, parsed))
}

// GET - List all clients for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = clampInt(searchParams.get('limit'), 100, 1, 200)

    const where: Record<string, unknown> = { userId: session.user.id }
    if (search && search.length <= 100) {
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

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate ICE format if provided (15 digits for Moroccan businesses)
    if (ice && !/^\d{1,15}$/.test(ice)) {
      return NextResponse.json(
        { error: 'ICE must be a numeric value (up to 15 digits)' },
        { status: 400 }
      )
    }

    // Check if client with same email exists
    const existing = await prisma.client.findFirst({
      where: { userId: session.user.id, email: email.toLowerCase().trim() }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 409 }
      )
    }

    // Create client with sanitized inputs
    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        name: sanitizeInput(String(name)).substring(0, 200),
        ice: ice ? String(ice).replace(/[^0-9]/g, '').substring(0, 15) : null,
        email: email.toLowerCase().trim(),
        phone: phone ? String(phone).substring(0, 20) : null,
        address: address ? sanitizeInput(String(address)).substring(0, 500) : null,
        city: city ? sanitizeInput(String(city)).substring(0, 100) : null,
        postalCode: postalCode ? String(postalCode).substring(0, 10) : null,
        country: country ? sanitizeInput(String(country)).substring(0, 100) : 'Maroc',
        ifNumber: ifNumber ? String(ifNumber).substring(0, 20) : null,
        rcNumber: rcNumber ? String(rcNumber).substring(0, 20) : null,
        notes: notes ? sanitizeInput(String(notes)).substring(0, 2000) : null
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'client',
        resourceId: client.id,
        newValues: JSON.stringify({ name: client.name, email: client.email })
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
