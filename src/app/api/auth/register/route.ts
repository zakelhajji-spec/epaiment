/**
 * User Registration Route
 * Creates new users in the database with rate limiting and validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hash } from 'bcryptjs'
import { rateLimit, sanitizeInput, isValidEmail } from '@/lib/security'

// Password strength validation
function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) errors.push('Au moins 8 caractères')
  if (password.length > 128) errors.push('Maximum 128 caractères')
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule')
  if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule')
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre')
  
  return { valid: errors.length === 0, errors }
}

// POST - Register new user
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: max 5 registrations per IP per 15 minutes
    const forwardedFor = request.headers.get('x-forwarded-for')
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown'
    const rateLimitResult = rateLimit(`register:${clientIp}`, 5, 15 * 60 * 1000)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password, name, companyName, companyIce } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Format de données invalide' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Format email invalide' },
        { status: 400 }
      )
    }

    const passwordCheck = isStrongPassword(password)
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: 'Mot de passe faible', details: passwordCheck.errors },
        { status: 400 }
      )
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Sanitize text inputs
    const safeName = name ? sanitizeInput(String(name)).substring(0, 100) : email.split('@')[0]
    const safeCompanyName = companyName ? sanitizeInput(String(companyName)).substring(0, 200) : null
    const safeCompanyIce = companyIce ? String(companyIce).replace(/[^0-9]/g, '').substring(0, 15) : null

    // Hash password
    const passwordHash = await hash(password, 12)

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        name: safeName,
        companyName: safeCompanyName,
        companyIce: safeCompanyIce,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    
    // Generic error message to avoid leaking internal details
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
