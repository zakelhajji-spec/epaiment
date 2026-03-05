/**
 * CMI Payment Gateway Webhook Handler
 * Processes payment callbacks from CMI
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHmac, timingSafeEqual } from 'crypto'

// CMI merchant configuration
const CMI_STORE_KEY = process.env.CMI_STORE_KEY || ''

// Tolerance for amount comparison (in MAD) to handle rounding differences
const AMOUNT_TOLERANCE_MAD = 0.01

// Verify CMI signature using timing-safe comparison
function verifyCMISignature(params: Record<string, string>, signature: string): boolean {
  try {
    if (!CMI_STORE_KEY) {
      console.error('[CMI Webhook] CMI_STORE_KEY is not configured')
      return false
    }

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

    // Use timing-safe comparison to prevent timing attacks
    const sigBuf = Buffer.from(signature, 'utf8')
    const expectedBuf = Buffer.from(expectedSignature, 'utf8')
    if (sigBuf.length !== expectedBuf.length) return false
    return timingSafeEqual(sigBuf, expectedBuf)
  } catch (error) {
    console.error('[CMI Webhook] Error verifying signature:', error)
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

    // Extract key fields
    const {
      HASH,
      oid,           // Order ID (our reference)
      amount,
      Response,
      ProcReturnCode,
      mdStatus,
      mdErrorMsg,
    } = params

    // Validate required fields
    if (!oid || !amount || !Response) {
      console.error('[CMI Webhook] Missing required fields')
      return new NextResponse('INVALID_REQUEST', { status: 400 })
    }

    // Always verify signature (reject if no HASH provided)
    if (!HASH) {
      console.error('[CMI Webhook] Missing signature hash')
      return new NextResponse('SIGNATURE_MISSING', { status: 400 })
    }

    if (!verifyCMISignature(params, HASH)) {
      console.error('[CMI Webhook] Invalid signature')
      return new NextResponse('SIGNATURE_MISMATCH', { status: 400 })
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

    // Idempotency check: skip if already processed
    if (paymentLink.status === 'paid') {
      console.log('[CMI Webhook] Payment already processed, skipping:', oid)
      return new NextResponse('APPROVED')
    }

    if (isSuccess) {
      // Validate amount
      const paidAmount = parseFloat(amount) / 100 // CMI sends amount in cents
      if (isNaN(paidAmount) || paidAmount <= 0) {
        console.error('[CMI Webhook] Invalid payment amount:', amount)
        return new NextResponse('INVALID_AMOUNT', { status: 400 })
      }

      // Verify amount matches expected payment link amount (allow small rounding difference)
      if (Math.abs(paidAmount - paymentLink.amount) > AMOUNT_TOLERANCE_MAD) {
        console.error('[CMI Webhook] Amount mismatch:', paidAmount, 'vs expected', paymentLink.amount)
        await prisma.auditLog.create({
          data: {
            userId: paymentLink.userId,
            action: 'payment_amount_mismatch',
            resource: 'payment_link',
            resourceId: paymentLink.id,
            details: JSON.stringify({
              receivedAmount: paidAmount,
              expectedAmount: paymentLink.amount,
              reference: oid,
            }),
            status: 'failure'
          }
        })
        return new NextResponse('AMOUNT_MISMATCH', { status: 400 })
      }

      const gatewayPaymentId = params.transId || params.xid || null
      
      await prisma.paymentLink.update({
        where: { id: paymentLink.id },
        data: {
          status: 'paid',
          paidAt: new Date(),
          gatewayPaymentId,
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
            gatewayPaymentId,
          })
        }
      })

      console.log('[CMI Webhook] Payment successful:', oid, paidAmount)
      
      return new NextResponse('APPROVED')
    } else {
      // Payment failed
      console.log('[CMI Webhook] Payment failed:', oid, Response, mdErrorMsg)
      
      // Log the failure for auditing
      await prisma.auditLog.create({
        data: {
          userId: paymentLink.userId,
          action: 'payment_failed',
          resource: 'payment_link',
          resourceId: paymentLink.id,
          details: JSON.stringify({
            reference: oid,
            response: Response,
            errorMessage: mdErrorMsg,
          }),
          status: 'failure'
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

  // Validate oid is alphanumeric/dash only to prevent open redirect
  if (!oid || !/^[A-Za-z0-9\-]+$/.test(oid)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const baseUrl = process.env.NEXTAUTH_URL || new URL('/', request.url).origin
  const redirectUrl = status === 'success' 
    ? `${baseUrl}/pay/${encodeURIComponent(oid)}?status=success`
    : `${baseUrl}/pay/${encodeURIComponent(oid)}?status=failed`

  return NextResponse.redirect(redirectUrl)
}
