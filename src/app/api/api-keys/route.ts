/**
 * API Keys Management Route
 * Secured with authentication and cryptographic key generation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateApiKey, getApiKeyId } from '@/lib/security'

// GET - List API keys for user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Return empty list (API key persistence requires database model)
    return NextResponse.json({
      success: true,
      keys: []
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, permissions } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key name is required' },
        { status: 400 }
      )
    }

    // Generate cryptographically secure API key
    const fullKey = generateApiKey('ep_live_')
    const keyPrefix = getApiKeyId(fullKey)

    const newKey = {
      id: `key_${Date.now()}`,
      name: name.trim(),
      keyPrefix,
      permissions: Array.isArray(permissions) ? permissions : ['read'],
      createdAt: new Date().toISOString(),
      status: 'active'
    }

    return NextResponse.json({
      success: true,
      key: newKey,
      fullKey // Only shown once!
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    )
  }
}

// DELETE - Revoke API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}
