/**
 * Leads API Route
 * Handles CRUD operations for CRM leads/prospects
 * 
 * GET: List leads with filtering by status, source
 * POST: Create new lead
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Valid lead statuses
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']

// Valid lead sources
const VALID_SOURCES = ['website', 'referral', 'social', 'direct', 'cold_call', 'trade_show', 'other']

// GET - List all leads for the current user with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: Record<string, unknown> = { userId: session.user.id }

    // Filter by status
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status
    }

    // Filter by source
    if (source && VALID_SOURCES.includes(source)) {
      where.source = source
    }

    // Search in name, email, company
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    }

    // Get leads with counts
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: [
          { score: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: { tasks: true }
          }
        }
      }),
      prisma.lead.count({ where })
    ])

    // Get status counts for statistics
    const statusCounts = await prisma.lead.groupBy({
      by: ['status'],
      where: { userId: session.user.id },
      _count: { id: true }
    })

    const statistics = {
      total,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      leads,
      total,
      statistics,
      filters: { status, source, search }
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

// POST - Create a new lead
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      company,
      source,
      status,
      budget,
      authority,
      need,
      timeline,
      score,
      notes
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate status
    const leadStatus = status || 'new'
    if (!VALID_STATUSES.includes(leadStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate source if provided
    if (source && !VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check for duplicate email (if provided)
    if (email) {
      const existing = await prisma.lead.findFirst({
        where: {
          userId: session.user.id,
          email: email.toLowerCase()
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A lead with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Calculate lead score if not provided
    let leadScore = score || 0
    if (!score) {
      // Auto-score based on BANT qualification
      if (budget) leadScore += 25
      if (authority) leadScore += 25
      if (need) leadScore += 25
      if (timeline) leadScore += 25
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        userId: session.user.id,
        name,
        email: email?.toLowerCase() || null,
        phone: phone || null,
        company: company || null,
        source: source || null,
        status: leadStatus,
        budget: budget || null,
        authority: authority || null,
        need: need || null,
        timeline: timeline || null,
        score: leadScore,
        notes: notes || null
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'lead',
        resourceId: lead.id,
        newValues: JSON.stringify(lead),
        details: `Created lead: ${lead.name}`
      }
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
