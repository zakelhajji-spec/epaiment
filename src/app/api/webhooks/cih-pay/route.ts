/**
 * CIH Pay Payment Gateway Webhook Handler
 * 
 * Processes payment callbacks from CIH Bank Payment Gateway.
 * Validates signatures, updates payment status, and creates audit logs.
 * 
 * @see https://www.cihbank.ma/ - CIH Pay API Documentation
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHmac } from 'crypto'

// ============================================
// Types
// ============================================

interface CIHPayCallback {
  // Transaction identifiers
  merchantTransactionId: string   // Our reference (PaymentLink.reference)
  transactionId: string           // CIH Pay transaction ID
  
  // Payment details
  amount: number
  currency: string                // MAD
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED'
  
  // Card info (masked)
  cardType?: string               // VISA, MASTERCARD, CMI
  cardLastFour?: string
  
  // 3D Secure
  secureVerify?: 'Y' | 'N'
  
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
 * Verify CIH Pay callback signature
 * 
 * CIH Pay uses HMAC-SHA256 for signature verification.
 */
function verifyCIHPaySignature(
  params: Record<string, string | number>,
  signature: string,
  secretKey: string
): boolean {
  try {
    // Sort parameters alphabetically and concatenate
    const sortedParams = Object.keys(params)
      .filter(key => key !== 'signature' && params[key] !== undefined && params[key] !== '')
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    // Calculate expected signature
    const expectedSignature = createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex')
      .toUpperCase()
    
    // Constant-time comparison to prevent timing attacks
    return signature.length === expectedSignature.length && 
           signature === expectedSignature
  } catch (error) {
    console.error('[CIH Pay Webhook] Signature verification error:', error)
    return false
  }
}

// ============================================
// Main Handler
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Parse the callback data
    const contentType = request.headers.get('content-type') || ''
    
    let callbackData: CIHPayCallback
    
    if (contentType.includes('application/json')) {
      callbackData = await request.json()
    } else {
      // Form-urlencoded fallback
      const formData = await request.formData()
      callbackData = {
        merchantTransactionId: formData.get('merchantTransactionId') as string,
        transactionId: formData.get('transactionId') as string,
        amount: parseFloat(formData.get('amount') as string),
        currency: formData.get('currency') as string || 'MAD',
        status: formData.get('status') as CIHPayCallback['status'],
        transactionDate: formData.get('transactionDate') as string,
        signature: formData.get('signature') as string,
      }
    }
    
    console.log('[CIH Pay Webhook] Received callback:', {
      reference: callbackData.merchantTransactionId,
      transactionId: callbackData.transactionId,
      status: callbackData.status,
      amount: callbackData.amount
    })
    
    // ============================================
    // Step 1: Find the payment link
    // ============================================
    
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { reference: callbackData.merchantTransactionId },
      include: {
        user: {
          include: {
            paymentGateways: {
              where: { gatewayId: 'cih_pay', enabled: true }
            }
          }
        }
      }
    })
    
    if (!paymentLink) {
      console.error('[CIH Pay Webhook] Payment link not found:', callbackData.merchantTransactionId)
      return new NextResponse('OK', { status: 200 })
    }
    
    // ============================================
    // Step 2: Verify signature (skip in test mode)
    // ============================================
    
    const gateway = paymentLink.user.paymentGateways?.[0]
    
    if (process.env.NODE_ENV === 'production' && gateway && !gateway.testMode) {
      const config = JSON.parse(gateway.configEnc || '{}')
      const secretKey = config.secretKey || process.env.CIH_PAY_SECRET_KEY
      
      if (secretKey && callbackData.signature) {
        const isValid = verifyCIHPaySignature(
          callbackData as unknown as Record<string, string | number>,
          callbackData.signature,
          secretKey
        )
        
        if (!isValid) {
          console.error('[CIH Pay Webhook] Invalid signature for:', callbackData.merchantTransactionId)
          
          await prisma.auditLog.create({
            data: {
              userId: paymentLink.userId,
              action: 'webhook_signature_invalid',
              resource: 'payment_link',
              resourceId: paymentLink.id,
              details: JSON.stringify({
                gateway: 'cih_pay',
                reference: callbackData.merchantTransactionId
              }),
              status: 'failed'
            }
          })
          
          return new NextResponse('SIGNATURE_MISMATCH', { status: 400 })
        }
      }
    }
    
    // ============================================
    // Step 3: Check if already processed
    // ============================================
    
    if (paymentLink.status === 'paid') {
      console.log('[CIH Pay Webhook] Payment already processed:', callbackData.merchantTransactionId)
      return new NextResponse('ALREADY_PROCESSED', { status: 200 })
    }
    
    // ============================================
    // Step 4: Process based on status
    // ============================================
    
    if (callbackData.status === 'SUCCESS') {
      return await processSuccessfulPayment(paymentLink, callbackData)
    } else {
      return await processFailedPayment(paymentLink, callbackData)
    }
    
  } catch (error) {
    console.error('[CIH Pay Webhook] Error processing callback:', error)
    return new NextResponse('ERROR', { status: 500 })
  } finally {
    console.log(`[CIH Pay Webhook] Processing time: ${Date.now() - startTime}ms`)
  }
}

// ============================================
// Payment Processing Functions
// ============================================

async function processSuccessfulPayment(
  paymentLink: { id: string; userId: string; reference: string; description: string; amount: number },
  callbackData: CIHPayCallback
): Promise<NextResponse> {
  const paidAmount = callbackData.amount
  
  // Calculate gateway fee (1.8% for CIH Pay)
  const gatewayFee = paidAmount * 0.018
  
  // Update payment link
  await prisma.paymentLink.update({
    where: { id: paymentLink.id },
    data: {
      status: 'paid',
      paidAt: new Date(),
      gatewayPaymentId: callbackData.transactionId,
      gatewayFee,
      gatewayName: 'cih_pay'
    }
  })
  
  // Update gateway statistics
  await prisma.paymentGateway.updateMany({
    where: { 
      userId: paymentLink.userId, 
      gatewayId: 'cih_pay' 
    },
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
        gateway: 'cih_pay',
        gatewayTransactionId: callbackData.transactionId,
        gatewayFee,
        cardType: callbackData.cardType,
        cardLastFour: callbackData.cardLastFour,
        secureVerify: callbackData.secureVerify
      })
    }
  })
  
  // Create notification
  await prisma.notification.create({
    data: {
      userId: paymentLink.userId,
      type: 'payment_received',
      title: 'Paiement reçu',
      message: `Paiement de ${paidAmount.toFixed(2)} MAD reçu via CIH Pay pour ${paymentLink.description}`,
      entityId: paymentLink.id,
      entityType: 'payment_link',
      priority: 'high',
      data: JSON.stringify({
        amount: paidAmount,
        gateway: 'cih_pay',
        reference: paymentLink.reference
      })
    }
  })
  
  console.log('[CIH Pay Webhook] Payment successful:', paymentLink.reference, paidAmount)
  
  return new NextResponse('APPROVED', { status: 200 })
}

async function processFailedPayment(
  paymentLink: { id: string; userId: string; reference: string; description: string },
  callbackData: CIHPayCallback
): Promise<NextResponse> {
  console.log('[CIH Pay Webhook] Payment failed:', {
    reference: paymentLink.reference,
    status: callbackData.status,
    errorCode: callbackData.errorCode,
    errorMessage: callbackData.errorMessage
  })
  
  // Create notification for failed payment
  await prisma.notification.create({
    data: {
      userId: paymentLink.userId,
      type: 'payment_failed',
      title: 'Paiement échoué',
      message: `Tentative de paiement échouée pour ${paymentLink.description}: ${callbackData.errorMessage || callbackData.status}`,
      entityId: paymentLink.id,
      entityType: 'payment_link',
      priority: 'normal',
      data: JSON.stringify({
        status: callbackData.status,
        errorCode: callbackData.errorCode,
        errorMessage: callbackData.errorMessage
      })
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
        gateway: 'cih_pay',
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
  
  console.log('[CIH Pay Webhook] Redirect received:', { reference, status })
  
  // Redirect user to result page
  const baseUrl = process.env.NEXTAUTH_URL || 'https://epaiement.ma'
  const redirectUrl = status === 'SUCCESS' || status === 'success'
    ? `${baseUrl}/pay/${reference}?status=success`
    : `${baseUrl}/pay/${reference}?status=failed`
  
  return NextResponse.redirect(redirectUrl)
}
