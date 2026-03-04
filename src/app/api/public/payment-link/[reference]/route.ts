/**
 * Public Payment Link API Route
 * Returns payment link data without authentication (for customers)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get payment link by reference (public access)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params

    const link = await prisma.paymentLink.findUnique({
      where: { reference },
      include: {
        user: {
          select: {
            companyName: true,
            companyPhone: true,
            companyEmail: true,
            companyAddress: true,
            companyCity: true
          }
        }
      }
    })

    if (!link) {
      return NextResponse.json(
        { error: 'Payment link not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (link.dueDate && new Date(link.dueDate) < new Date() && link.status === 'pending') {
      // Auto-expire the link
      await prisma.paymentLink.update({
        where: { id: link.id },
        data: { status: 'expired' }
      })
      link.status = 'expired'
    }

    // Return public data only
    return NextResponse.json({
      id: link.id,
      reference: link.reference,
      amount: link.amount,
      description: link.description,
      clientName: link.clientName,
      clientEmail: link.clientEmail,
      clientPhone: link.clientPhone,
      status: link.status,
      dueDate: link.dueDate,
      paymentUrl: link.paymentUrl,
      createdAt: link.createdAt,
      user: link.user
    })
  } catch (error) {
    console.error('Error fetching public payment link:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment link' },
      { status: 500 }
    )
  }
}
