/**
 * Single Task API Route
 * Handles GET, PUT, DELETE for a specific task
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Valid task statuses
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']

// Valid task priorities
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent']

// GET - Get a single task by ID
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

    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: session.user.id
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Parse JSON fields
    const responseTask = {
      ...task,
      clientIds: task.clientIds ? JSON.parse(task.clientIds) : [],
      invoiceIds: task.invoiceIds ? JSON.parse(task.invoiceIds) : []
    }

    return NextResponse.json(responseTask)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PUT - Update a task
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

    // Check task exists and belongs to user
    const existing = await prisma.task.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const {
      leadId,
      title,
      description,
      status,
      priority,
      dueDate,
      clientIds,
      invoiceIds
    } = body

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (leadId !== undefined) {
      // Validate lead exists if provided
      if (leadId) {
        const lead = await prisma.lead.findFirst({
          where: { id: leadId, userId: session.user.id }
        })
        if (!lead) {
          return NextResponse.json(
            { error: 'Lead not found' },
            { status: 404 }
          )
        }
      }
      updateData.leadId = leadId || null
    }

    if (title !== undefined) {
      if (!title) {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        )
      }
      updateData.title = title
    }

    if (description !== undefined) {
      updateData.description = description || null
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.status = status

      // Set completedAt if task is being marked as completed
      if (status === 'completed' && existing.status !== 'completed') {
        updateData.completedAt = new Date()
      } else if (status !== 'completed') {
        updateData.completedAt = null
      }
    }

    if (priority !== undefined) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.priority = priority
    }

    if (dueDate !== undefined) {
      if (dueDate === null) {
        updateData.dueDate = null
      } else {
        const parsedDueDate = new Date(dueDate)
        if (isNaN(parsedDueDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid due date format' },
            { status: 400 }
          )
        }
        updateData.dueDate = parsedDueDate
      }
    }

    if (clientIds !== undefined) {
      updateData.clientIds = clientIds ? JSON.stringify(clientIds) : null
    }

    if (invoiceIds !== undefined) {
      updateData.invoiceIds = invoiceIds ? JSON.stringify(invoiceIds) : null
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'task',
        resourceId: id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(task),
        details: `Updated task: ${task.title}`
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a task
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

    // Check task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Delete task
    await prisma.task.delete({ where: { id } })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        resource: 'task',
        resourceId: id,
        oldValues: JSON.stringify(task),
        details: `Deleted task: ${task.title}`
      }
    })

    return NextResponse.json({ success: true, message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

// PATCH - Quick status update (for checkbox toggle, etc.)
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

    // Check task exists
    const existing = await prisma.task.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'complete':
        updateData = {
          status: 'completed',
          completedAt: new Date()
        }
        break

      case 'uncomplete':
        updateData = {
          status: 'in_progress',
          completedAt: null
        }
        break

      case 'start':
        updateData = {
          status: 'in_progress'
        }
        break

      case 'cancel':
        updateData = {
          status: 'cancelled'
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: complete, uncomplete, start, cancel' },
          { status: 400 }
        )
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'task',
        resourceId: id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(task),
        details: `Quick action: ${action} on task: ${task.title}`
      }
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
