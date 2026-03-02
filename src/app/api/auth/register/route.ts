/**
 * User Registration Route
 * Simplified for deployment
 */

import { NextRequest, NextResponse } from 'next/server'

// In-memory store for demo purposes
// In production, use a real database
const usersStore: Map<string, { email: string; name: string; passwordHash: string }> = new Map()

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

    // Check if user exists
    const existingUser = usersStore.get(email.toLowerCase())

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hash password
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(password, 12)

    // Store user (in memory for demo)
    const userId = `user_${Date.now()}`
    usersStore.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      passwordHash
    })

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
      user: {
        id: userId,
        email: email.toLowerCase(),
        name: name || email.split('@')[0]
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}
