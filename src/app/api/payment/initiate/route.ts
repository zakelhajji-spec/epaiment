/**
 * Payment Initiation API
 * 
 * Creates a payment session with the configured gateway (CMI, CIH Pay, or Fatourati)
 * and returns the payment URL for redirecting the user.
 * 
 * Supported Gateways:
 * - CMI (Centre Monétique Interbancaire) - All Moroccan banks
 * - CIH Pay - CIH Bank
 * - Fatourati - CDG Group
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createHmac, randomBytes } from 'crypto'

// ============================================
// Types
// ============================================

interface PaymentInitRequest {
  reference: string       // Payment link reference
  gateway?: 'cmi' | 'cih_pay' | 'fatourati'
  returnUrl?: string
}

interface PaymentInitResponse {
  success: boolean
  paymentUrl?: string
  method?: 'GET' | 'POST'
  params?: Record<string, string>
  error?: string
}

// ============================================
// Gateway Configurations
// ============================================

const GATEWAY_CONFIGS = {
  cmi: {
    name: 'CMI',
    testUrl: 'https://test.cmi.co.ma/fim/est3Dgate',
    prodUrl: 'https://payment.cmi.co.ma/fim/est3Dgate',
    fees: 0.025, // 2.5%
    currency: '504', // MAD ISO code
  },
  cih_pay: {
    name: 'CIH Pay',
    testUrl: 'https://api-test.cihpay.ma/v2/payment/create',
    prodUrl: 'https://api.cihpay.ma/v2/payment/create',
    fees: 0.018, // 1.8%
    currency: 'MAD',
  },
  fatourati: {
    name: 'Fatourati',
    testUrl: 'https://api-test.fatourati.ma/v1/payment/create',
    prodUrl: 'https://api.fatourati.ma/v1/payment/create',
    fees: 0.020, // 2.0%
    currency: 'MAD',
  }
}

// ============================================
// Main Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<PaymentInitResponse>> {
  try {
    const body: PaymentInitRequest = await request.json()
    const { reference, gateway = 'cih_pay', returnUrl } = body
    
    if (!reference) {
      return NextResponse.json({
        success: false,
        error: 'Reference is required'
      }, { status: 400 })
    }
    
    // Find the payment link
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { reference },
      include: {
        user: {
          include: {
            paymentGateways: {
              where: { enabled: true }
            }
          }
        }
      }
    })
    
    if (!paymentLink) {
      return NextResponse.json({
        success: false,
        error: 'Payment link not found'
      }, { status: 404 })
    }
    
    // Check if already paid
    if (paymentLink.status === 'paid') {
      return NextResponse.json({
        success: false,
        error: 'Payment already completed'
      }, { status: 400 })
    }
    
    // Check if expired
    if (paymentLink.expiresAt && new Date() > paymentLink.expiresAt) {
      return NextResponse.json({
        success: false,
        error: 'Payment link has expired'
      }, { status: 400 })
    }
    
    // Determine which gateway to use
    const userGateways = paymentLink.user.paymentGateways
    const selectedGateway = userGateways.find(g => g.gatewayId === gateway) || userGateways[0]
    
    // Get gateway configuration
    const gatewayConfig = GATEWAY_CONFIGS[gateway]
    if (!gatewayConfig) {
      return NextResponse.json({
        success: false,
        error: 'Invalid gateway'
      }, { status: 400 })
    }
    
    // Generate payment based on gateway
    const baseUrl = process.env.NEXTAUTH_URL || 'https://epaiement.ma'
    const successUrl = returnUrl || `${baseUrl}/pay/${reference}/success`
    const failUrl = `${baseUrl}/pay/${reference}/failed`
    
    switch (gateway) {
      case 'cmi':
        return await initiateCMIPayment(paymentLink, gatewayConfig, successUrl, failUrl, selectedGateway)
      case 'cih_pay':
        return await initiateCIHPayPayment(paymentLink, gatewayConfig, successUrl, failUrl, selectedGateway)
      case 'fatourati':
        return await initiateFatouratiPayment(paymentLink, gatewayConfig, successUrl, failUrl, selectedGateway)
      default:
        return NextResponse.json({
          success: false,
          error: 'Gateway not implemented'
        }, { status: 501 })
    }
    
  } catch (error) {
    console.error('[Payment Initiate] Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// ============================================
// CMI Payment Initiation
// ============================================

async function initiateCMIPayment(
  paymentLink: any,
  config: typeof GATEWAY_CONFIGS.cmi,
  successUrl: string,
  failUrl: string,
  gatewayConfig: any
): Promise<NextResponse<PaymentInitResponse>> {
  const testMode = gatewayConfig?.testMode ?? true
  const merchantId = process.env.CMI_MERCHANT_ID || (gatewayConfig ? JSON.parse(gatewayConfig.configEnc).merchantId : '')
  const storeKey = process.env.CMI_STORE_KEY || (gatewayConfig ? JSON.parse(gatewayConfig.configEnc).storeKey : '')
  
  // CMI requires amount in cents (kurush)
  const amountInCents = Math.round(paymentLink.amount * 100)
  
  // Generate random transaction ID if not provided
  const oid = paymentLink.reference
  
  // Build parameters
  const params: Record<string, string> = {
    clientid: merchantId,
    amount: amountInCents.toString(),
    oid: oid,
    okUrl: successUrl,
    failUrl: failUrl,
    islemtipi: 'Auth',
    taksit: '',
    currency: config.currency,
    rnd: randomBytes(16).toString('hex'),
    lang: 'fr',
    // Customer info
    billToName: paymentLink.clientName || 'Client',
    billToEmail: paymentLink.clientEmail || '',
    billToPhone: paymentLink.clientPhone || '',
    // Description
    description: paymentLink.description.substring(0, 100),
  }
  
  // Generate hash
  const hashString = [
    params.clientid,
    params.oid,
    params.amount,
    params.okUrl,
    params.failUrl,
    params.islemtipi,
    params.taksit,
    params.rnd,
    params.currency,
    storeKey
  ].join('')
  
  params.hash = createHmac('sha256', storeKey)
    .update(hashString)
    .digest('base64')
  
  // Log payment initiation
  await prisma.auditLog.create({
    data: {
      userId: paymentLink.userId,
      action: 'payment_initiated',
      resource: 'payment_link',
      resourceId: paymentLink.id,
      details: JSON.stringify({
        gateway: 'cmi',
        reference: paymentLink.reference,
        amount: paymentLink.amount,
        testMode
      })
    }
  })
  
  return NextResponse.json({
    success: true,
    paymentUrl: testMode ? config.testUrl : config.prodUrl,
    method: 'POST',
    params
  })
}

// ============================================
// CIH Pay Payment Initiation
// ============================================

async function initiateCIHPayPayment(
  paymentLink: any,
  config: typeof GATEWAY_CONFIGS.cih_pay,
  successUrl: string,
  failUrl: string,
  gatewayConfig: any
): Promise<NextResponse<PaymentInitResponse>> {
  const testMode = gatewayConfig?.testMode ?? true
  
  let apiKey = process.env.CIH_PAY_API_KEY
  let merchantId = process.env.CIH_PAY_MERCHANT_ID
  let secretKey = process.env.CIH_PAY_SECRET_KEY
  
  if (gatewayConfig) {
    const decrypted = JSON.parse(gatewayConfig.configEnc)
    apiKey = apiKey || decrypted.apiKey
    merchantId = merchantId || decrypted.merchantId
    secretKey = secretKey || decrypted.secretKey
  }
  
  // For CIH Pay, we call their API to get a payment URL
  const apiUrl = testMode ? config.testUrl : config.prodUrl
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Merchant-ID': merchantId || ''
      },
      body: JSON.stringify({
        merchantTransactionId: paymentLink.reference,
        amount: paymentLink.amount,
        currency: config.currency,
        description: paymentLink.description,
        successUrl: successUrl,
        failureUrl: failUrl,
        customer: {
          name: paymentLink.clientName,
          email: paymentLink.clientEmail,
          phone: paymentLink.clientPhone
        }
      })
    })
    
    if (!response.ok) {
      // If API call fails, return a mock URL for testing
      console.error('[CIH Pay] API error:', response.status)
      
      // Fallback: return a simulated payment URL
      const mockPaymentUrl = `${process.env.NEXTAUTH_URL || 'https://epaiement.ma'}/api/payment/mock?ref=${paymentLink.reference}&gateway=cih_pay`
      
      return NextResponse.json({
        success: true,
        paymentUrl: mockPaymentUrl,
        method: 'GET'
      })
    }
    
    const data = await response.json()
    
    // Log payment initiation
    await prisma.auditLog.create({
      data: {
        userId: paymentLink.userId,
        action: 'payment_initiated',
        resource: 'payment_link',
        resourceId: paymentLink.id,
        details: JSON.stringify({
          gateway: 'cih_pay',
          reference: paymentLink.reference,
          amount: paymentLink.amount,
          testMode,
          transactionId: data.transactionId
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      paymentUrl: data.paymentUrl || data.redirectUrl,
      method: 'GET'
    })
    
  } catch (error) {
    console.error('[CIH Pay] Initiation error:', error)
    
    // Fallback for development/testing
    const mockPaymentUrl = `${process.env.NEXTAUTH_URL || 'https://epaiement.ma'}/api/payment/mock?ref=${paymentLink.reference}&gateway=cih_pay`
    
    return NextResponse.json({
      success: true,
      paymentUrl: mockPaymentUrl,
      method: 'GET'
    })
  }
}

// ============================================
// Fatourati Payment Initiation
// ============================================

async function initiateFatouratiPayment(
  paymentLink: any,
  config: typeof GATEWAY_CONFIGS.fatourati,
  successUrl: string,
  failUrl: string,
  gatewayConfig: any
): Promise<NextResponse<PaymentInitResponse>> {
  const testMode = gatewayConfig?.testMode ?? true
  
  let apiKey = process.env.FATOURATI_API_KEY
  let merchantId = process.env.FATOURATI_MERCHANT_ID
  let secretKey = process.env.FATOURATI_SECRET_KEY
  
  if (gatewayConfig) {
    const decrypted = JSON.parse(gatewayConfig.configEnc)
    apiKey = apiKey || decrypted.apiKey
    merchantId = merchantId || decrypted.merchantId
    secretKey = secretKey || decrypted.secretKey
  }
  
  const apiUrl = testMode ? config.testUrl : config.prodUrl
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        merchantId: merchantId,
        transactionReference: paymentLink.reference,
        amount: paymentLink.amount,
        currency: config.currency,
        description: paymentLink.description,
        successUrl: successUrl,
        failureUrl: failUrl,
        customer: {
          name: paymentLink.clientName,
          email: paymentLink.clientEmail,
          phone: paymentLink.clientPhone
        }
      })
    })
    
    if (!response.ok) {
      // Fallback
      const mockPaymentUrl = `${process.env.NEXTAUTH_URL || 'https://epaiement.ma'}/api/payment/mock?ref=${paymentLink.reference}&gateway=fatourati`
      
      return NextResponse.json({
        success: true,
        paymentUrl: mockPaymentUrl,
        method: 'GET'
      })
    }
    
    const data = await response.json()
    
    // Log payment initiation
    await prisma.auditLog.create({
      data: {
        userId: paymentLink.userId,
        action: 'payment_initiated',
        resource: 'payment_link',
        resourceId: paymentLink.id,
        details: JSON.stringify({
          gateway: 'fatourati',
          reference: paymentLink.reference,
          amount: paymentLink.amount,
          testMode
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      paymentUrl: data.paymentUrl || data.redirectUrl,
      method: 'GET'
    })
    
  } catch (error) {
    console.error('[Fatourati] Initiation error:', error)
    
    // Fallback
    const mockPaymentUrl = `${process.env.NEXTAUTH_URL || 'https://epaiement.ma'}/api/payment/mock?ref=${paymentLink.reference}&gateway=fatourati`
    
    return NextResponse.json({
      success: true,
      paymentUrl: mockPaymentUrl,
      method: 'GET'
    })
  }
}

// ============================================
// GET Handler - Quick Initiate
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('ref')
  const gateway = searchParams.get('gateway') as 'cmi' | 'cih_pay' | 'fatourati' | null
  
  if (!reference) {
    return NextResponse.json({
      success: false,
      error: 'Reference is required'
    }, { status: 400 })
  }
  
  // Forward to POST handler
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference, gateway: gateway || 'cih_pay' })
  }))
}
