/**
 * Setup Admin API
 * Creates or updates a user to be admin
 * Should only be called once during initial setup
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Check if any admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'admin' }
    })
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin already exists. Use the admin panel to manage users.' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { email, password, name } = body
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    if (user) {
      // Update existing user to admin
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'superadmin' }
      })
    } else {
      // Create new admin user
      const passwordHash = await hash(password, 12)
      
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || 'Admin',
          passwordHash,
          role: 'superadmin',
          emailVerified: new Date(),
          companyName: 'Epaiement.ma',
          companyCity: 'Casablanca'
        }
      })
      
      // Create subscription for admin
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'enterprise',
          status: 'active',
          price: 0,
          activeGroups: JSON.stringify(['core', 'sales', 'accounting', 'crm', 'stock', 'team', 'integrations', 'ai'])
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin account created/updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
    
  } catch (error) {
    console.error('Setup admin error:', error)
    return NextResponse.json(
      { error: 'Failed to setup admin' },
      { status: 500 }
    )
  }
}

// GET - Check if admin exists
export async function GET() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: { in: ['admin', 'superadmin'] } }
    })
    
    return NextResponse.json({
      hasAdmin: adminCount > 0,
      adminCount
    })
    
  } catch (error) {
    console.error('Check admin error:', error)
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    )
  }
}
