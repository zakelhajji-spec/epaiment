/**
 * Single Lead API Route
 * Handles GET, PUT, DELETE for a specific lead
 * Includes endpoint to convert lead to client
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Valid lead statuses
const VALID_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']

// Valid lead sources
const VALID_SOURCES = ['website', 'referral', 'social', 'direct', 'cold_call', 'trade_show', 'other']

// GET - Get a single lead by ID
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

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true
          }
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          take: 10,
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

// PUT - Update a lead
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

    // Check lead exists and belongs to user
    const existing = await prisma.lead.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

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
      notes,
      assignedTo
    } = body

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (email !== undefined) {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
      // Check for duplicate email
      if (email && email.toLowerCase() !== existing.email) {
        const duplicate = await prisma.lead.findFirst({
          where: {
            userId: session.user.id,
            email: email.toLowerCase(),
            id: { not: id }
          }
        })
        if (duplicate) {
          return NextResponse.json(
            { error: 'A lead with this email already exists' },
            { status: 409 }
          )
        }
      }
      updateData.email = email?.toLowerCase() || null
    }
    if (phone !== undefined) updateData.phone = phone || null
    if (company !== undefined) updateData.company = company || null
    if (source !== undefined) {
      if (source && !VALID_SOURCES.includes(source)) {
        return NextResponse.json(
          { error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.source = source || null
    }
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.status = status

      // Set status-specific timestamps
      if (status === 'contacted' && existing.status !== 'contacted') {
        updateData.contactedAt = new Date()
      }
      if (status === 'qualified' && existing.status !== 'qualified') {
        updateData.qualifiedAt = new Date()
      }
      if (status === 'won' && existing.status !== 'won') {
        updateData.wonAt = new Date()
      }
      if (status === 'lost' && existing.status !== 'lost') {
        updateData.lostAt = new Date()
      }
    }
    if (budget !== undefined) updateData.budget = budget || null
    if (authority !== undefined) updateData.authority = authority || null
    if (need !== undefined) updateData.need = need || null
    if (timeline !== undefined) updateData.timeline = timeline || null
    if (score !== undefined) updateData.score = score
    if (notes !== undefined) updateData.notes = notes || null
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'lead',
        resourceId: id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(lead),
        details: `Updated lead: ${lead.name}`
      }
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a lead
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

    // Check lead exists and belongs to user
    const lead = await prisma.lead.findFirst({
      where: { id, userId: session.user.id },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Check for related tasks
    if (lead._count.tasks > 0) {
      // Update tasks to remove lead reference instead of blocking deletion
      await prisma.task.updateMany({
        where: { leadId: id },
        data: { leadId: null }
      })
    }

    // Delete lead
    await prisma.lead.delete({ where: { id } })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        resource: 'lead',
        resourceId: id,
        oldValues: JSON.stringify(lead),
        details: `Deleted lead: ${lead.name}`
      }
    })

    return NextResponse.json({ success: true, message: 'Lead deleted successfully' })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}

// PATCH - Convert lead to client
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

    // Check if this is a convert to client request
    if (action !== 'convert_to_client') {
      return NextResponse.json(
        { error: 'Invalid action. Supported actions: convert_to_client' },
        { status: 400 }
      )
    }

    // Get the lead
    const lead = await prisma.lead.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Check if already converted
    if (lead.clientId) {
      return NextResponse.json(
        { error: 'Lead has already been converted to a client', clientId: lead.clientId },
        { status: 400 }
      )
    }

    // Check if lead has required info for client
    if (!lead.email) {
      return NextResponse.json(
        { error: 'Lead must have an email address to be converted to a client' },
        { status: 400 }
      )
    }

    // Check for existing client with same email
    const existingClient = await prisma.client.findFirst({
      where: {
        userId: session.user.id,
        email: lead.email.toLowerCase()
      }
    })

    if (existingClient) {
      // Link lead to existing client
      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          clientId: existingClient.id,
          status: 'won',
          wonAt: new Date(),
          convertedAt: new Date()
        }
      })

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'convert',
          resource: 'lead',
          resourceId: id,
          newValues: JSON.stringify(updatedLead),
          details: `Linked lead to existing client: ${existingClient.name}`
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Lead linked to existing client',
        client: existingClient,
        lead: updatedLead
      })
    }

    // Create new client from lead
    const client = await prisma.client.create({
      data: {
        userId: session.user.id,
        name: lead.name,
        email: lead.email.toLowerCase(),
        phone: lead.phone || null,
        notes: lead.notes || `Converted from lead. Source: ${lead.source || 'Unknown'}`
      }
    })

    // Update lead with client reference and won status
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        clientId: client.id,
        status: 'won',
        wonAt: new Date(),
        convertedAt: new Date()
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'convert',
        resource: 'lead',
        resourceId: id,
        newValues: JSON.stringify({ lead: updatedLead, client }),
        details: `Converted lead to client: ${client.name}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Lead converted to client successfully',
      client,
      lead: updatedLead
    }, { status: 201 })
  } catch (error) {
    console.error('Error converting lead to client:', error)
    return NextResponse.json(
      { error: 'Failed to convert lead to client' },
      { status: 500 }
    )
  }
}
