/**
 * Single Product API Route
 * Handles GET, PUT, DELETE for a specific product
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get a single product by ID
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

    const product = await prisma.product.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product is low stock
    const isLowStock = product.stockQuantity <= product.minStock

    return NextResponse.json({
      ...product,
      isLowStock
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT - Update a product
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

    // Check product exists and belongs to user
    const existing = await prisma.product.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const {
      name,
      sku,
      description,
      unitPrice,
      tvaRate,
      stockQuantity,
      minStock,
      maxStock,
      category,
      active
    } = body

    // If SKU is being changed, check for duplicates
    if (sku && sku !== existing.sku) {
      const duplicateSku = await prisma.product.findFirst({
        where: { userId: session.user.id, sku }
      })

      if (duplicateSku) {
        return NextResponse.json(
          { error: 'A product with this SKU already exists' },
          { status: 409 }
        )
      }
    }

    // Build update data
    const updateData: {
      name?: string
      sku?: string | null
      description?: string | null
      unitPrice?: number
      tvaRate?: number
      stockQuantity?: number
      minStock?: number
      maxStock?: number | null
      category?: string | null
      active?: boolean
    } = {}

    if (name !== undefined) updateData.name = name
    if (sku !== undefined) updateData.sku = sku || null
    if (description !== undefined) updateData.description = description || null
    if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice)
    if (tvaRate !== undefined) updateData.tvaRate = parseFloat(tvaRate)
    if (stockQuantity !== undefined) updateData.stockQuantity = parseFloat(stockQuantity)
    if (minStock !== undefined) updateData.minStock = parseFloat(minStock)
    if (maxStock !== undefined) updateData.maxStock = maxStock ? parseFloat(maxStock) : null
    if (category !== undefined) updateData.category = category || null
    if (active !== undefined) updateData.active = active

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update',
        resource: 'product',
        resourceId: id,
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(product)
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a product
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

    // Check product exists and belongs to user
    const product = await prisma.product.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete product
    await prisma.product.delete({ where: { id } })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'delete',
        resource: 'product',
        resourceId: id,
        oldValues: JSON.stringify(product)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
