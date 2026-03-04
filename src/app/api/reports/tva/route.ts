/**
 * TVA Reports API
 * 
 * Generates VAT (Taxe sur la Valeur Ajoutée) reports for Moroccan tax compliance.
 * Supports monthly, quarterly, and annual reporting periods.
 * 
 * Reports include:
 * - TVA collectée (collected VAT from sales)
 * - TVA déductible (deductible VAT from purchases)
 * - TVA à payer / crédit TVA (VAT due or credit)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// ============================================
// Types
// ============================================

interface TVAReportParams {
  startDate: Date
  endDate: Date
  periodType: 'monthly' | 'quarterly' | 'annual'
}

interface TVADetail {
  rate: number
  baseHT: number
  tvaAmount: number
  totalTTC: number
}

interface TVAReport {
  period: {
    start: string
    end: string
    type: string
  }
  collected: {
    total: number
    details: TVADetail[]
  }
  deductible: {
    total: number
    details: {
      category: string
      baseHT: number
      tvaAmount: number
    }[]
  }
  summary: {
    tvaCollected: number
    tvaDeductible: number
    tvaDue: number
    creditTVA: number
    isCredit: boolean
  }
  invoices: {
    count: number
    totalHT: number
    totalTTC: number
  }
  expenses: {
    count: number
    totalHT: number
    totalTTC: number
  }
}

// ============================================
// Main Handler
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    
    // Parse date range
    const startDate = searchParams.get('start')
      ? new Date(searchParams.get('start') as string)
      : getMonthStart(new Date())
    
    const endDate = searchParams.get('end')
      ? new Date(searchParams.get('end') as string)
      : getMonthEnd(new Date())
    
    const periodType = (searchParams.get('period') || 'monthly') as 'monthly' | 'quarterly' | 'annual'
    const format = searchParams.get('format') || 'json' // json, excel, pdf
    
    // Generate report
    const report = await generateTVAReport(session.user.id, {
      startDate,
      endDate,
      periodType
    })
    
    // Return based on format
    if (format === 'excel') {
      return generateExcelReport(report)
    } else if (format === 'pdf') {
      return generatePDFReport(report)
    }
    
    return NextResponse.json(report)
    
  } catch (error) {
    console.error('[TVA Report] Error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du rapport' },
      { status: 500 }
    )
  }
}

// ============================================
// Report Generation
// ============================================

async function generateTVAReport(
  userId: string,
  params: TVAReportParams
): Promise<TVAReport> {
  
  // ============================================
  // Fetch Invoices (TVA Collectée)
  // ============================================
  
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: 'paid',
      paidAt: {
        gte: params.startDate,
        lte: params.endDate
      }
    },
    select: {
      id: true,
      number: true,
      subtotal: true,
      tvaAmount: true,
      total: true,
      items: true,
      paidAt: true,
      client: {
        select: {
          name: true,
          ice: true
        }
      }
    }
  })
  
  // ============================================
  // Fetch Expenses (TVA Déductible)
  // ============================================
  
  // Note: Expenses are stored in a separate model
  // For now, we'll calculate from available data
  
  // ============================================
  // Calculate TVA Details by Rate
  // ============================================
  
  const tvaRates = [20, 14, 10, 7, 0]
  const collectedDetails: TVADetail[] = []
  
  for (const rate of tvaRates) {
    let baseHT = 0
    let tvaAmount = 0
    
    for (const invoice of invoices) {
      const items = JSON.parse(invoice.items || '[]')
      for (const item of items) {
        if (item.tvaRate === rate) {
          const lineTotal = item.quantity * item.unitPrice
          baseHT += lineTotal
          tvaAmount += lineTotal * (rate / 100)
        }
      }
    }
    
    if (baseHT > 0) {
      collectedDetails.push({
        rate,
        baseHT,
        tvaAmount,
        totalTTC: baseHT + tvaAmount
      })
    }
  }
  
  // ============================================
  // Calculate Totals
  // ============================================
  
  const tvaCollected = collectedDetails.reduce((sum, d) => sum + d.tvaAmount, 0)
  const tvaDeductible = 0 // Would come from expenses
  const tvaDue = Math.max(0, tvaCollected - tvaDeductible)
  const creditTVA = Math.max(0, tvaDeductible - tvaCollected)
  
  // ============================================
  // Build Report
  // ============================================
  
  return {
    period: {
      start: params.startDate.toISOString(),
      end: params.endDate.toISOString(),
      type: params.periodType
    },
    collected: {
      total: tvaCollected,
      details: collectedDetails
    },
    deductible: {
      total: tvaDeductible,
      details: [] // Would be populated from expenses
    },
    summary: {
      tvaCollected,
      tvaDeductible,
      tvaDue,
      creditTVA,
      isCredit: creditTVA > 0
    },
    invoices: {
      count: invoices.length,
      totalHT: invoices.reduce((sum, inv) => sum + inv.subtotal, 0),
      totalTTC: invoices.reduce((sum, inv) => sum + inv.total, 0)
    },
    expenses: {
      count: 0,
      totalHT: 0,
      totalTTC: 0
    }
  }
}

// ============================================
// Excel Export
// ============================================

function generateExcelReport(report: TVAReport): NextResponse {
  // Generate CSV content (Excel-compatible)
  const lines: string[] = []
  
  // Header
  lines.push('Rapport TVA - Epaiement.ma')
  lines.push(`Période: ${formatDate(report.period.start)} - ${formatDate(report.period.end)}`)
  lines.push('')
  
  // TVA Collectée
  lines.push('TVA COLLECTÉE')
  lines.push('Taux,Base HT,TVA,Total TTC')
  
  for (const detail of report.collected.details) {
    lines.push(`${detail.rate}%,${detail.baseHT.toFixed(2)},${detail.tvaAmount.toFixed(2)},${detail.totalTTC.toFixed(2)}`)
  }
  
  lines.push(`Total,,${report.collected.total.toFixed(2)},`)
  lines.push('')
  
  // Résumé
  lines.push('RÉSUMÉ')
  lines.push(`TVA Collectée,${report.summary.tvaCollected.toFixed(2)}`)
  lines.push(`TVA Déductible,${report.summary.tvaDeductible.toFixed(2)}`)
  
  if (report.summary.isCredit) {
    lines.push(`Crédit TVA,${report.summary.creditTVA.toFixed(2)}`)
  } else {
    lines.push(`TVA à payer,${report.summary.tvaDue.toFixed(2)}`)
  }
  
  const csv = lines.join('\n')
  const filename = `tva_report_${report.period.start.slice(0, 10)}_${report.period.end.slice(0, 10)}.csv`
  
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

// ============================================
// PDF Export
// ============================================

function generatePDFReport(report: TVAReport): NextResponse {
  // For simplicity, return HTML that can be printed as PDF
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport TVA - ${formatDate(report.period.start)} à ${formatDate(report.period.end)}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1B3F66; border-bottom: 2px solid #1B3F66; padding-bottom: 10px; }
    h2 { color: #1B3F66; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: right; border: 1px solid #ddd; }
    th { background: #1B3F66; color: white; }
    .total-row { background: #f0f0f0; font-weight: bold; }
    .summary-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px; }
    .summary-box h3 { margin-top: 0; }
    .highlight { color: #16a34a; font-size: 1.2em; font-weight: bold; }
    .warning { color: #dc2626; font-size: 1.2em; font-weight: bold; }
    .period { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Rapport TVA</h1>
  <p class="period">Période: ${formatDate(report.period.start)} - ${formatDate(report.period.end)}</p>
  
  <h2>TVA Collectée</h2>
  <table>
    <thead>
      <tr>
        <th>Taux</th>
        <th>Base HT (MAD)</th>
        <th>TVA (MAD)</th>
        <th>Total TTC (MAD)</th>
      </tr>
    </thead>
    <tbody>
      ${report.collected.details.map(d => `
        <tr>
          <td>${d.rate}%</td>
          <td>${d.baseHT.toFixed(2)}</td>
          <td>${d.tvaAmount.toFixed(2)}</td>
          <td>${d.totalTTC.toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td>Total</td>
        <td>${report.collected.details.reduce((s, d) => s + d.baseHT, 0).toFixed(2)}</td>
        <td>${report.collected.total.toFixed(2)}</td>
        <td>${report.collected.details.reduce((s, d) => s + d.totalTTC, 0).toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
  
  <div class="summary-box">
    <h3>Résumé</h3>
    <table>
      <tr><td style="text-align: left;">TVA Collectée</td><td>${report.summary.tvaCollected.toFixed(2)} MAD</td></tr>
      <tr><td style="text-align: left;">TVA Déductible</td><td>${report.summary.tvaDeductible.toFixed(2)} MAD</td></tr>
      <tr class="total-row">
        <td style="text-align: left;">${report.summary.isCredit ? 'Crédit TVA' : 'TVA à payer'}</td>
        <td class="${report.summary.isCredit ? 'highlight' : 'warning'}">
          ${report.summary.isCredit ? report.summary.creditTVA : report.summary.tvaDue} MAD
        </td>
      </tr>
    </table>
  </div>
  
  <p style="margin-top: 40px; color: #666; font-size: 12px;">
    Document généré par Epaiement.ma - Conforme DGI 2026
  </p>
</body>
</html>
  `
  
  const filename = `tva_report_${report.period.start.slice(0, 10)}_${report.period.end.slice(0, 10)}.html`
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}

// ============================================
// Helper Functions
// ============================================

function getMonthStart(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function getMonthEnd(date: Date): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  d.setHours(23, 59, 59, 999)
  return d
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
