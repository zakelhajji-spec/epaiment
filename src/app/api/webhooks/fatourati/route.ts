/**
 * Fatourati Payment Gateway Webhook Handler
 * 
 * Processes payment callbacks from Fatourati (CDG Group).
 * Validates signatures, updates payment status, and creates audit logs.
 * 
 * @see https://www.fatourati.ma/ - Fatourati API Documentation
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHmac } from 'crypto'

// ============================================
// Types
// ============================================

interface FatouratiCallback {
  // Transaction identifiers
  merchantTransactionId: string   // Our reference (PaymentLink.reference)
  transactionId: string           // Fatourati transaction ID
  
  // Payment details
  amount: number
  currency: string                // MAD
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED'
  
  // Customer info
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  
  // Payment method
  paymentMethod?: string          // CARD, WALLET, etc.
  cardType?: string
  
  // Timestamps
  transactionDate: string
  
  // Additional
  errorMessage?: string
  errorCode?: string
  
  // Signature
  signature: string
}

// ============================================
// Signature Verification
// ============================================

/**
 * Verify Fatourati callback signature
 * 
 * Fatourati uses HMAC-SHA256 for signature verification.
 */
function verifyFatouratiSignature(
  params: Record<string, string | number>,
  signature: string,
  secretKey: string
): boolean {
  try {
    // Sort parameters and concatenate
    const sortedParams = Object.keys(params)
      .filter(key => key !== 'signature' && params[key] !== undefined && params[key] !== '')
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('|')
    
    // Calculate expected signature
    const expectedSignature = createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex')
      .toLowerCase()
    
    return signature.length === expectedSignature.length && 
           signature.toLowerCase() === expectedSignature
  } catch (error) {
    console.error('[Fatourati Webhook] Signature verification error:', error)
    return false
  }
}

// ============================================
// Main Handler
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse callback data
    const contentType = request.headers.get('content-type') || ''
    
    let callbackData: FatouratiCallback
    
    if (contentType.includes('application/json')) {
      callbackData = await request.json()
    } else {
      const formData = await request.formData()
      callbackData = {
        merchantTransactionId: formData.get('merchantTransactionId') as string,
        transactionId: formData.get('transactionId') as string,
        amount: parseFloat(formData.get('amount') as string),
        currency: formData.get('currency') as string || 'MAD',
        status: formData.get('status') as FatouratiCallback['status'],
        transactionDate: formData.get('transactionDate') as string,
        signature: formData.get('signature') as string,
      }
    }
    
    console.log('[Fatourati Webhook] Received callback:', {
      reference: callbackData.merchantTransactionId,
      transactionId: callbackData.transactionId,
      status: callbackData.status,
      amount: callbackData.amount
    })
    
    // Find payment link
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { reference: callbackData.merchantTransactionId },
      include: {
        user: {
          include: {
            paymentGateways: {
              where: { gatewayId: 'fatourati', enabled: true }
            }
          }
        }
      }
    })
    
    if (!paymentLink) {
      console.error('[Fatourati Webhook] Payment link not found:', callbackData.merchantTransactionId)
      return new NextResponse('OK', { status: 200 })
    }
    
    // Verify signature in production
    const gateway = paymentLink.user.paymentGateways?.[0]
    
    if (process.env.NODE_ENV === 'production' && gateway && !gateway.testMode) {
      const config = JSON.parse(gateway.configEnc || '{}')
      const secretKey = config.secretKey || process.env.FATOURATI_SECRET_KEY
      
      if (secretKey && callbackData.signature) {
        const isValid = verifyFatouratiSignature(
          callbackData as unknown as Record<string, string | number>,
          callbackData.signature,
          secretKey
        )
        
        if (!isValid) {
          console.error('[Fatourati Webhook] Invalid signature for:', callbackData.merchantTransactionId)
          
          await prisma.auditLog.create({
            data: {
              userId: paymentLink.userId,
              action: 'webhook_signature_invalid',
              resource: 'payment_link',
              resourceId: paymentLink.id,
              details: JSON.stringify({
                gateway: 'fatourati',
                reference: callbackData.merchantTransactionId
              }),
              status: 'failed'
            }
          })
          
          return new NextResponse('SIGNATURE_MISMATCH', { status: 400 })
        }
      }
    }
    
    // Check if already processed
    if (paymentLink.status === 'paid') {
      console.log('[Fatourati Webhook] Payment already processed:', callbackData.merchantTransactionId)
      return new NextResponse('ALREADY_PROCESSED', { status: 200 })
    }
    
    // Process based on status
    if (callbackData.status === 'SUCCESS') {
      return await processSuccessfulPayment(paymentLink, callbackData)
    } else {
      return await processFailedPayment(paymentLink, callbackData)
    }
    
  } catch (error) {
    console.error('[Fatourati Webhook] Error processing callback:', error)
    return new NextResponse('ERROR', { status: 500 })
  } finally {
    console.log(`[Fatourati Webhook] Processing time: ${Date.now() - startTime}ms`)
  }
}

// ============================================
// Payment Processing Functions
// ============================================

async function processSuccessfulPayment(
  paymentLink: { id: string; userId: string; reference: string; description: string; amount: number },
  callbackData: FatouratiCallback
): Promise<NextResponse> {
  const paidAmount = callbackData.amount
  const gatewayFee = paidAmount * 0.020 // 2.0% Fatourati
  
  // Update payment link
  await prisma.paymentLink.update({
    where: { id: paymentLink.id },
    data: {
      status: 'paid',
      paidAt: new Date(),
      gatewayPaymentId: callbackData.transactionId,
      gatewayFee,
      gatewayName: 'fatourati'
    }
  })
  
  // Update gateway statistics
  await prisma.paymentGateway.updateMany({
    where: { userId: paymentLink.userId, gatewayId: 'fatourati' },
    data: {
      totalPayments: { increment: 1 },
      totalAmount: { increment: paidAmount },
      totalFees: { increment: gatewayFee },
      lastUsedAt: new Date()
    }
  })
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: paymentLink.userId,
      action: 'payment_received',
      resource: 'payment_link',
      resourceId: paymentLink.id,
      details: JSON.stringify({
        amount: paidAmount,
        reference: paymentLink.reference,
        gateway: 'fatourati',
        gatewayTransactionId: callbackData.transactionId,
        gatewayFee,
        paymentMethod: callbackData.paymentMethod
      })
    }
  })
  
  // Create notification
  await prisma.notification.create({
    data: {
      userId: paymentLink.userId,
      type: 'payment_received',
      title: 'Paiement reçu',
      message: `Paiement de ${paidAmount.toFixed(2)} MAD reçu via Fatourati pour ${paymentLink.description}`,
      entityId: paymentLink.id,
      entityType: 'payment_link',
      priority: 'high'
    }
  })
  
  console.log('[Fatourati Webhook] Payment successful:', paymentLink.reference, paidAmount)
  
  return new NextResponse('APPROVED', { status: 200 })
}

async function processFailedPayment(
  paymentLink: { id: string; userId: string; reference: string; description: string },
  callbackData: FatouratiCallback
): Promise<NextResponse> {
  console.log('[Fatourati Webhook] Payment failed:', {
    reference: paymentLink.reference,
    status: callbackData.status,
    errorCode: callbackData.errorCode,
    errorMessage: callbackData.errorMessage
  })
  
  // Create notification
  await prisma.notification.create({
    data: {
      userId: paymentLink.userId,
      type: 'payment_failed',
      title: 'Paiement échoué',
      message: `Tentative de paiement échouée pour ${paymentLink.description}: ${callbackData.errorMessage || callbackData.status}`,
      entityId: paymentLink.id,
      entityType: 'payment_link',
      priority: 'normal'
    }
  })
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: paymentLink.userId,
      action: 'payment_failed',
      resource: 'payment_link',
      resourceId: paymentLink.id,
      details: JSON.stringify({
        gateway: 'fatourati',
        status: callbackData.status,
        errorCode: callbackData.errorCode,
        errorMessage: callbackData.errorMessage
      }),
      status: 'failed'
    }
  })
  
  return new NextResponse('DECLINED', { status: 200 })
}

// ============================================
// GET Handler for Redirect
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('merchantTransactionId') || searchParams.get('ref')
  const status = searchParams.get('status') || 'success'
  
  console.log('[Fatourati Webhook] Redirect received:', { reference, status })
  
  const baseUrl = process.env.NEXTAUTH_URL || 'https://epaiement.ma'
  const redirectUrl = status === 'SUCCESS' || status === 'success'
    ? `${baseUrl}/pay/${reference}?status=success`
    : `${baseUrl}/pay/${reference}?status=failed`
  
  return NextResponse.redirect(redirectUrl)
}
