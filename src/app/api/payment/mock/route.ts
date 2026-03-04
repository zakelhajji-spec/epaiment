/**
 * Mock Payment API for Testing
 * 
 * Simulates payment gateway behavior for development/testing.
 * In production, users are redirected to actual CMI/CIH Pay pages.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('ref')
  const gateway = searchParams.get('gateway') || 'cih_pay'
  const action = searchParams.get('action') // 'pay' or 'cancel'
  
  if (!reference) {
    return new NextResponse('Reference required', { status: 400 })
  }
  
  // Find payment link
  const paymentLink = await prisma.paymentLink.findUnique({
    where: { reference },
    include: {
      user: {
        select: {
          companyName: true,
          companyIce: true,
          email: true
        }
      }
    }
  })
  
  if (!paymentLink) {
    return new NextResponse('Payment link not found', { status: 404 })
  }
  
  // If action is pay, simulate successful payment
  if (action === 'pay') {
    // Update payment link
    await prisma.paymentLink.update({
      where: { reference },
      data: {
        status: 'paid',
        paidAt: new Date(),
        gatewayPaymentId: `MOCK-${Date.now()}`,
        gatewayFee: paymentLink.amount * 0.018,
        gatewayName: gateway
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
          amount: paymentLink.amount,
          reference,
          gateway,
          mode: 'mock'
        })
      }
    })
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: paymentLink.userId,
        type: 'payment_received',
        title: 'Paiement reçu (Test)',
        message: `Paiement de ${paymentLink.amount.toFixed(2)} MAD simulé via ${gateway.toUpperCase()}`,
        entityId: paymentLink.id,
        entityType: 'payment_link',
        priority: 'high'
      }
    })
    
    // Redirect to success page
    const baseUrl = process.env.NEXTAUTH_URL || 'https://epaiement.ma'
    return NextResponse.redirect(`${baseUrl}/pay/${reference}?status=success`)
  }
  
  // If action is cancel, redirect to failed
  if (action === 'cancel') {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://epaiement.ma'
    return NextResponse.redirect(`${baseUrl}/pay/${reference}?status=cancelled`)
  }
  
  // Show mock payment page
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paiement Test - ${gateway.toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1B3F66 0%, #0D1F33 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 400px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: ${gateway === 'cmi' ? '#1E3A8A' : gateway === 'cih_pay' ? '#DC2626' : '#059669'};
      color: white;
      padding: 24px;
      text-align: center;
    }
    .header h1 { font-size: 24px; margin-bottom: 8px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .content { padding: 24px; }
    .amount {
      text-align: center;
      padding: 16px;
      background: #f3f4f6;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .amount .value { font-size: 36px; font-weight: bold; color: #1B3F66; }
    .amount .label { color: #6b7280; font-size: 14px; }
    .details { margin-bottom: 24px; }
    .details div {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .details .label { color: #6b7280; }
    .actions { display: flex; gap: 12px; }
    .btn {
      flex: 1;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      font-size: 14px;
    }
    .btn-primary {
      background: #16a34a;
      color: white;
      border: none;
    }
    .btn-secondary {
      background: white;
      color: #6b7280;
      border: 1px solid #d1d5db;
    }
    .test-notice {
      margin-top: 24px;
      padding: 12px;
      background: #fef3c7;
      border-radius: 8px;
      font-size: 12px;
      color: #92400e;
      text-align: center;
    }
    .reference {
      font-family: monospace;
      background: #f3f4f6;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${gateway === 'cmi' ? 'CMI' : gateway === 'cih_pay' ? 'CIH Pay' : 'Fatourati'}</h1>
      <p>Paiement Sécurisé</p>
    </div>
    <div class="content">
      <div class="amount">
        <div class="value">${paymentLink.amount.toFixed(2)} MAD</div>
        <div class="label">${paymentLink.description}</div>
      </div>
      
      <div class="details">
        <div>
          <span class="label">Commerçant</span>
          <span>${paymentLink.user.companyName || 'Epaiement.ma'}</span>
        </div>
        <div>
          <span class="label">Référence</span>
          <span class="reference">${reference}</span>
        </div>
        <div>
          <span class="label">Client</span>
          <span>${paymentLink.clientName || 'N/A'}</span>
        </div>
      </div>
      
      <div class="actions">
        <a href="?ref=${reference}&gateway=${gateway}&action=cancel" class="btn btn-secondary">
          Annuler
        </a>
        <a href="?ref=${reference}&gateway=${gateway}&action=pay" class="btn btn-primary">
          Payer
        </a>
      </div>
      
      <div class="test-notice">
        ⚠️ Mode Test - Aucun paiement réel ne sera effectué
      </div>
    </div>
  </div>
</body>
</html>
  `
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  })
}
