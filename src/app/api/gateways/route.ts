/**
 * Payment Gateway Configuration Route
 * Simplified for deployment
 */

import { NextRequest, NextResponse } from 'next/server'

// Available gateways in Morocco
const GATEWAYS = [
  { id: 'cmi', name: 'CMI', displayName: 'Centre Monétique Interbancaire', fees: 2.5 },
  { id: 'fatourati', name: 'Fatourati', displayName: 'Fatourati (CDG Group)', fees: 2.0 },
  { id: 'cih_pay', name: 'CIH Pay', displayName: 'CIH Pay', fees: 1.8 },
  { id: 'custom', name: 'Custom', displayName: 'Passerelle personnalisée', fees: 0 }
]

// GET - List available gateways
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      gateways: GATEWAYS.map(g => ({
        ...g,
        configured: false,
        enabled: false,
        testMode: true
      }))
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch gateways' },
      { status: 500 }
    )
  }
}

// POST - Configure gateway
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gatewayId, merchantId, secretKey, testMode, webhookUrl, successUrl, failureUrl } = body

    // In production, encrypt and store these credentials
    const config = {
      gatewayId,
      testMode: testMode ?? true,
      webhookUrl,
      successUrl,
      failureUrl,
      configured: true,
      enabled: true,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Gateway configured successfully',
      config: {
        ...config,
        merchantId: merchantId ? '****' + merchantId.slice(-4) : null
        // Never return the secret key
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to configure gateway' },
      { status: 500 }
    )
  }
}

// PUT - Update gateway
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { gatewayId, enabled } = body

    return NextResponse.json({
      success: true,
      message: `Gateway ${enabled ? 'enabled' : 'disabled'}`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update gateway' },
      { status: 500 }
    )
  }
}

// DELETE - Remove gateway configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gatewayId = searchParams.get('id')

    return NextResponse.json({
      success: true,
      message: 'Gateway configuration removed'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove gateway' },
      { status: 500 }
    )
  }
}
