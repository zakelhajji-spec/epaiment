/**
 * User Registration Route
 * Creates new users in the database
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hash } from 'bcryptjs'

// Email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Password strength validation
function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) errors.push('Au moins 8 caractères')
  if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule')
  if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule')
  if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre')
  
  return { valid: errors.length === 0, errors }
}

// POST - Register new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, companyName, companyIce } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
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
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name: name || email.split('@')[0],
        companyName: companyName || null,
        companyIce: companyIce || null,
      }
    })

    // Create default company for the user
    if (companyName) {
      await prisma.company.create({
        data: {
          ownerId: user.id,
          name: companyName,
          ice: companyIce || null,
        }
      })
    }

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
    
    // Check if it's a Prisma error
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error stack:', error.stack)
    }
    
    // Check for common database connection issues
    if (errorMessage.includes('connect') || errorMessage.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Erreur de connexion à la base de données. Veuillez réessayer plus tard.' },
        { status: 503 }
      )
    }
    
    // Check for Prisma specific errors
    if (errorMessage.includes('Prisma') || errorMessage.includes('prisma')) {
      return NextResponse.json(
        { error: 'Erreur de base de données. Vérifiez la configuration.' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription: ' + errorMessage },
      { status: 500 }
    )
  }
}
