/**
 * CMI Payment Gateway Webhook Handler
 * Processes payment callbacks from CMI
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHmac } from 'crypto'

// CMI merchant configuration (should be in environment variables)
const CMI_MERCHANT_ID = process.env.CMI_MERCHANT_ID || ''
const CMI_SECRET_KEY = process.env.CMI_SECRET_KEY || ''
const CMI_STORE_KEY = process.env.CMI_STORE_KEY || ''

// Verify CMI signature
function verifyCMISignature(params: Record<string, string>, signature: string): boolean {
  try {
    // Sort parameters and create signature string
    const sortedParams = Object.keys(params)
      .filter(key => key !== 'HASH' && params[key])
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join(':')
    
    // Generate HMAC signature
    const expectedSignature = createHmac('sha256', CMI_STORE_KEY)
      .update(sortedParams)
      .digest('hex')
      .toUpperCase()
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying CMI signature:', error)
    return false
  }
}

// POST - Handle CMI callback
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const params: Record<string, string> = {}
    
    // Extract all form parameters
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    console.log('[CMI Webhook] Received callback:', params)

    // Extract key fields
    const {
      HASH,
      oid,           // Order ID (our reference)
      amount,
      currency,
      Response,
      ProcReturnCode,
      mdStatus,
      mdErrorMsg,
      clientIp
    } = params

    // Verify signature (skip in test mode)
    if (process.env.NODE_ENV === 'production' && HASH) {
      if (!verifyCMISignature(params, HASH)) {
        console.error('[CMI Webhook] Invalid signature')
        return new NextResponse('SIGNATURE_MISMATCH', { status: 400 })
      }
    }

    // Check if payment was successful
    // mdStatus: '1' = 3D Secure success, '2' = Cardholder not participating
    // Response: 'Approved' = success
    // ProcReturnCode: '00' = success
    const isSuccess = Response === 'Approved' && 
                      (mdStatus === '1' || mdStatus === '2') && 
                      ProcReturnCode === '00'

    // Find the payment link by reference
    const paymentLink = await prisma.paymentLink.findUnique({
      where: { reference: oid }
    })

    if (!paymentLink) {
      console.error('[CMI Webhook] Payment link not found:', oid)
      return new NextResponse('OK') // Return OK to prevent retries
    }

    if (isSuccess) {
      // Payment successful
      const paidAmount = parseFloat(amount) / 100 // CMI sends amount in cents
      
      await prisma.paymentLink.update({
        where: { id: paymentLink.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          gatewayPaymentId: params.transId || params.xid,
          gatewayFee: paidAmount * 0.025 // Approximate fee (2.5%)
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
            reference: oid,
            gateway: 'cmi',
            gatewayResponse: params
          })
        }
      })

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: paymentLink.userId,
          type: 'payment_received',
          title: 'Paiement reçu',
          message: `Paiement de ${paidAmount} MAD reçu via CMI`,
          entityId: paymentLink.id,
          entityType: 'payment_link',
          priority: 'high'
        }
      })

      console.log('[CMI Webhook] Payment successful:', oid, paidAmount)
      
      // Return success page URL for redirect
      return new NextResponse('APPROVED')
    } else {
      // Payment failed
      console.log('[CMI Webhook] Payment failed:', oid, Response, mdErrorMsg)
      
      // Create notification for failed payment
      await prisma.notification.create({
        data: {
          userId: paymentLink.userId,
          type: 'payment_failed',
          title: 'Paiement échoué',
          message: `Tentative de paiement échouée pour ${paymentLink.description}`,
          entityId: paymentLink.id,
          entityType: 'payment_link',
          priority: 'normal'
        }
      })
      
      return new NextResponse('DECLINED')
    }
  } catch (error) {
    console.error('[CMI Webhook] Error processing callback:', error)
    return new NextResponse('ERROR', { status: 500 })
  }
}

// GET - For callback redirect (user returns to site)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const oid = searchParams.get('oid')
  const status = searchParams.get('status') || 'success'

  // Redirect to payment result page
  const redirectUrl = status === 'success' 
    ? `${process.env.NEXTAUTH_URL}/pay/${oid}?status=success`
    : `${process.env.NEXTAUTH_URL}/pay/${oid}?status=failed`

  return NextResponse.redirect(redirectUrl)
}
