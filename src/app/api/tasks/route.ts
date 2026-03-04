/**
 * Tasks API Route
 * Handles CRUD operations for task management
 * 
 * GET: List tasks with filtering by status, priority
 * POST: Create new task
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Valid task statuses
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']

// Valid task priorities
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent']

// GET - List all tasks for the current user with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const leadId = searchParams.get('leadId')
    const overdue = searchParams.get('overdue')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: Record<string, unknown> = { userId: session.user.id }

    // Filter by status
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status
    }

    // Filter by priority
    if (priority && VALID_PRIORITIES.includes(priority)) {
      where.priority = priority
    }

    // Filter by lead
    if (leadId) {
      where.leadId = leadId
    }

    // Filter overdue tasks
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() }
      where.status = { notIn: ['completed', 'cancelled'] }
    }

    // Search in title and description
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get tasks with counts
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: [
          { priority: 'desc' }, // urgent > high > medium > low (alphabetically desc)
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              company: true,
              status: true
            }
          }
        }
      }),
      prisma.task.count({ where })
    ])

    // Get status counts for statistics
    const statusCounts = await prisma.task.groupBy({
      by: ['status'],
      where: { userId: session.user.id },
      _count: { id: true }
    })

    // Get priority counts
    const priorityCounts = await prisma.task.groupBy({
      by: ['priority'],
      where: { userId: session.user.id },
      _count: { id: true }
    })

    // Count overdue tasks
    const overdueCount = await prisma.task.count({
      where: {
        userId: session.user.id,
        dueDate: { lt: new Date() },
        status: { notIn: ['completed', 'cancelled'] }
      }
    })

    const statistics = {
      total,
      overdue: overdueCount,
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id
        return acc
      }, {} as Record<string, number>),
      byPriority: priorityCounts.reduce((acc, item) => {
        acc[item.priority] = item._count.id
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      tasks,
      total,
      statistics,
      filters: { status, priority, leadId, overdue, search }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
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

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Validate status
    const taskStatus = status || 'pending'
    if (!VALID_STATUSES.includes(taskStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate priority
    const taskPriority = priority || 'medium'
    if (!VALID_PRIORITIES.includes(taskPriority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` },
        { status: 400 }
      )
    }

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

    // Parse and validate due date
    let parsedDueDate: Date | null = null
    if (dueDate) {
      parsedDueDate = new Date(dueDate)
      if (isNaN(parsedDueDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid due date format' },
          { status: 400 }
        )
      }
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        leadId: leadId || null,
        title,
        description: description || null,
        status: taskStatus,
        priority: taskPriority,
        dueDate: parsedDueDate,
        clientIds: clientIds ? JSON.stringify(clientIds) : null,
        invoiceIds: invoiceIds ? JSON.stringify(invoiceIds) : null,
        completedAt: taskStatus === 'completed' ? new Date() : null
      },
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
        action: 'create',
        resource: 'task',
        resourceId: task.id,
        newValues: JSON.stringify(task),
        details: `Created task: ${task.title}`
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
