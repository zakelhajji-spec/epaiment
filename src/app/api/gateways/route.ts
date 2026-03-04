/**
 * Payment Gateway Configuration API
 * 
 * Manages payment gateway configurations with encrypted storage.
 * Supports CMI, CIH Pay, Fatourati, and custom gateways.
 * 
 * All sensitive credentials are encrypted before storage using AES-256-GCM.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/security'

// ============================================
// Gateway Definitions
// ============================================

export const GATEWAY_DEFINITIONS = [
  {
    id: 'cmi',
    name: 'CMI',
    displayName: 'Centre Monétique Interbancaire',
    fees: 2.5,
    color: '#1E3A8A',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { key: 'storeKey', label: 'Store Key', type: 'password', required: true },
      { key: 'terminalId', label: 'Terminal ID', type: 'text', required: false },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: false }
    ]
  },
  {
    id: 'cih_pay',
    name: 'CIH Pay',
    displayName: 'CIH Bank Payment Gateway',
    fees: 1.8,
    color: '#DC2626',
    fields: [
      { key: 'merchantId', label: 'ID Marchand', type: 'text', required: true },
      { key: 'apiKey', label: 'Clé API', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true }
    ]
  },
  {
    id: 'fatourati',
    name: 'Fatourati',
    displayName: 'Fatourati (CDG Group)',
    fees: 2.0,
    color: '#059669',
    fields: [
      { key: 'merchantId', label: 'Identifiant Marchand', type: 'text', required: true },
      { key: 'apiKey', label: 'Clé API', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true }
    ]
  },
  {
    id: 'custom',
    name: 'Personnalisé',
    displayName: 'Passerelle personnalisée',
    fees: 0,
    color: '#6B7280',
    fields: [
      { key: 'gatewayName', label: 'Nom', type: 'text', required: true },
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'apiEndpoint', label: 'API Endpoint', type: 'url', required: true }
    ]
  }
]

// ============================================
// GET - List Gateways
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // If not authenticated, return basic gateway info
    if (!session?.user?.id) {
      return NextResponse.json({
        success: true,
        gateways: GATEWAY_DEFINITIONS.map(g => ({
          ...g,
          configured: false,
          enabled: false,
          testMode: true
        }))
      })
    }
    
    // Fetch user's gateway configurations
    const userGateways = await prisma.paymentGateway.findMany({
      where: { userId: session.user.id }
    })
    
    // Merge definitions with user configurations
    const gateways = GATEWAY_DEFINITIONS.map(def => {
      const userConfig = userGateways.find(ug => ug.gatewayId === def.id)
      
      return {
        ...def,
        configured: !!userConfig,
        enabled: userConfig?.enabled ?? false,
        testMode: userConfig?.testMode ?? true,
        totalPayments: userConfig?.totalPayments ?? 0,
        totalAmount: userConfig?.totalAmount ?? 0,
        lastUsedAt: userConfig?.lastUsedAt?.toISOString() ?? null
      }
    })
    
    return NextResponse.json({
      success: true,
      gateways
    })
    
  } catch (error) {
    console.error('[Gateways API] Error fetching gateways:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des passerelles' },
      { status: 500 }
    )
  }
}

// ============================================
// POST - Configure Gateway
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    
    const body = await request.json()
    const { gatewayId, config, testMode = true, webhookSecret } = body
    
    // Validate gateway
    const gatewayDef = GATEWAY_DEFINITIONS.find(g => g.id === gatewayId)
    if (!gatewayDef) {
      return NextResponse.json(
        { error: 'Passerelle invalide' },
        { status: 400 }
      )
    }
    
    // Validate required fields
    const missingFields = gatewayDef.fields
      .filter(f => f.required && !config[f.key])
      .map(f => f.label)
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Champs requis manquants: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Encrypt config
    const configEnc = encrypt(JSON.stringify(config))
    
    // Upsert gateway configuration
    const gateway = await prisma.paymentGateway.upsert({
      where: {
        userId_gatewayId: {
          userId: session.user.id,
          gatewayId
        }
      },
      create: {
        userId: session.user.id,
        gatewayId,
        configEnc,
        webhookSecret,
        testMode,
        enabled: true
      },
      update: {
        configEnc,
        webhookSecret,
        testMode,
        enabled: true
      }
    })
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'gateway_configured',
        resource: 'payment_gateway',
        resourceId: gateway.id,
        details: JSON.stringify({
          gatewayId,
          testMode
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Passerelle configurée avec succès',
      gateway: {
        id: gateway.id,
        gatewayId,
        configured: true,
        enabled: gateway.enabled,
        testMode: gateway.testMode
      }
    })
    
  } catch (error) {
    console.error('[Gateways API] Error configuring gateway:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la configuration' },
      { status: 500 }
    )
  }
}

// ============================================
// PUT - Update Gateway Status
// ============================================

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    
    const body = await request.json()
    const { gatewayId, enabled, testMode } = body
    
    // Update gateway
    const gateway = await prisma.paymentGateway.updateMany({
      where: {
        userId: session.user.id,
        gatewayId
      },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(testMode !== undefined && { testMode })
      }
    })
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: enabled ? 'gateway_enabled' : 'gateway_disabled',
        resource: 'payment_gateway',
        details: JSON.stringify({ gatewayId, enabled, testMode })
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Passerelle ${enabled ? 'activée' : 'désactivée'}`,
      updated: gateway.count
    })
    
  } catch (error) {
    console.error('[Gateways API] Error updating gateway:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

// ============================================
// DELETE - Remove Gateway
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const gatewayId = searchParams.get('gatewayId')
    
    if (!gatewayId) {
      return NextResponse.json(
        { error: 'ID passerelle requis' },
        { status: 400 }
      )
    }
    
    // Delete gateway
    const deleted = await prisma.paymentGateway.deleteMany({
      where: {
        userId: session.user.id,
        gatewayId
      }
    })
    
    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'gateway_removed',
        resource: 'payment_gateway',
        details: JSON.stringify({ gatewayId })
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Configuration supprimée',
      deleted: deleted.count
    })
    
  } catch (error) {
    console.error('[Gateways API] Error deleting gateway:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    )
  }
}

// ============================================
// Helper - Get Decrypted Config
// ============================================

export async function getGatewayConfig(
  userId: string,
  gatewayId: string
): Promise<Record<string, string> | null> {
  try {
    const gateway = await prisma.paymentGateway.findUnique({
      where: {
        userId_gatewayId: { userId, gatewayId }
      }
    })
    
    if (!gateway) return null
    
    return JSON.parse(decrypt(gateway.configEnc))
  } catch (error) {
    console.error('[Gateways API] Error getting config:', error)
    return null
  }
}
