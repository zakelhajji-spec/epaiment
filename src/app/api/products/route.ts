/**
 * Products API Route
 * Handles CRUD operations for products
 * 
 * GET: List products with search, category filter, low stock filter
 * POST: Create new product
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - List all products for the current user with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock')
    const activeOnly = searchParams.get('activeOnly')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: {
      userId: string
      OR?: Array<{ name: { contains: string } } | { sku: { contains: string } } | { description: { contains: string } }>
      category?: string
      active?: boolean
      stockQuantity?: { lte: number }
    } = { userId: session.user.id }

    // Search filter (name, sku, description)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } }
      ]
    }

    // Category filter
    if (category) {
      where.category = category
    }

    // Low stock filter (stock <= minStock)
    if (lowStock === 'true') {
      where.stockQuantity = { lte: prisma.product.fields.minStock }
    }

    // Active only filter
    if (activeOnly === 'true') {
      where.active = true
    }

    // Execute queries in parallel
    const [products, total, categories, lowStockCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [
          { active: 'desc' },
          { name: 'asc' }
        ],
        take: limit,
        skip: offset
      }),
      prisma.product.count({ where }),
      // Get unique categories for the user
      prisma.product.findMany({
        where: { userId: session.user.id },
        select: { category: true },
        distinct: ['category']
      }),
      // Get low stock count
      prisma.product.count({
        where: {
          userId: session.user.id,
          active: true,
          stockQuantity: { lte: prisma.product.fields.minStock }
        }
      })
    ])

    // Extract unique categories (filter out null)
    const uniqueCategories = categories
      .map(p => p.category)
      .filter((c): c is string => c !== null)

    return NextResponse.json({
      products,
      total,
      categories: uniqueCategories,
      lowStockCount
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      sku,
      description,
      unitPrice,
      tvaRate = 20,
      stockQuantity = 0,
      minStock = 0,
      maxStock,
      category,
      active = true
    } = body

    // Validate required fields
    if (!name || unitPrice === undefined) {
      return NextResponse.json(
        { error: 'Name and unit price are required' },
        { status: 400 }
      )
    }

    // Check if product with same SKU exists
    if (sku) {
      const existing = await prisma.product.findFirst({
        where: { userId: session.user.id, sku }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 409 }
        )
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        userId: session.user.id,
        name,
        sku: sku || null,
        description: description || null,
        unitPrice: parseFloat(unitPrice),
        tvaRate: parseFloat(tvaRate),
        stockQuantity: parseFloat(stockQuantity),
        minStock: parseFloat(minStock),
        maxStock: maxStock ? parseFloat(maxStock) : null,
        category: category || null,
        active
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'create',
        resource: 'product',
        resourceId: product.id,
        newValues: JSON.stringify(product)
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
