/**
 * PDF Generator for Epaiement
 * Generates professional invoices, quotes, and credit notes
 */

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  tvaRate: number
  total?: number
  tvaAmount?: number
}

interface InvoiceData {
  number: string
  status: string
  createdAt: string
  dueDate: string
  subtotal: number
  tvaAmount: number
  total: number
  amountPaid?: number
  balance?: number
  notes?: string
  items: InvoiceItem[]
  client?: {
    name: string
    email?: string
    phone?: string
    address?: string
    city?: string
    ice?: string
  }
  company?: {
    name?: string
    ice?: string
    ifNumber?: string
    rcNumber?: string
    address?: string
    city?: string
    phone?: string
    email?: string
    bankName?: string
    bankAccount?: string
    bankRib?: string
  }
}

interface QuoteData extends InvoiceData {
  validUntil: string
}

interface CreditNoteData extends InvoiceData {
  reason: string
  reasonDescription?: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2
  }).format(amount)
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('fr-MA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

// Colors
const PRIMARY_COLOR: [number, number, number] = [27, 63, 102] // #1B3F66
const SECONDARY_COLOR: [number, number, number] = [107, 114, 128] // gray-500
const ACCENT_COLOR: [number, number, number] = [16, 185, 129] // emerald-500

export function generateInvoicePDF(invoice: InvoiceData, type: 'invoice' | 'quote' | 'credit_note' = 'invoice'): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  
  let yPos = 20
  
  // Header Background
  doc.setFillColor(...PRIMARY_COLOR)
  doc.rect(0, 0, pageWidth, 50, 'F')
  
  // Company Logo/Name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  const companyName = invoice.company?.name || 'Epaiement.ma'
  doc.text(companyName, margin, 30)
  
  // Document Type
  doc.setFontSize(12)
  const docType = type === 'invoice' ? 'FACTURE' : type === 'quote' ? 'DEVIS' : 'AVOIR'
  doc.text(docType, pageWidth - margin, 30, { align: 'right' })
  
  // Document Number
  doc.setFontSize(10)
  doc.text(invoice.number, pageWidth - margin, 40, { align: 'right' })
  
  yPos = 60
  
  // Company Info
  doc.setTextColor(...PRIMARY_COLOR)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  if (invoice.company) {
    const companyInfo: string[] = []
    if (invoice.company.ice) companyInfo.push(`ICE: ${invoice.company.ice}`)
    if (invoice.company.ifNumber) companyInfo.push(`IF: ${invoice.company.ifNumber}`)
    if (invoice.company.rcNumber) companyInfo.push(`RC: ${invoice.company.rcNumber}`)
    if (invoice.company.address) {
      let addr = invoice.company.address
      if (invoice.company.city) addr += `, ${invoice.company.city}`
      companyInfo.push(addr)
    }
    if (invoice.company.phone) companyInfo.push(`Tél: ${invoice.company.phone}`)
    if (invoice.company.email) companyInfo.push(invoice.company.email)
    
    doc.text(companyInfo, margin, yPos, { maxWidth: 80 })
    yPos += companyInfo.length * 4 + 5
  }
  
  // Client Info Box
  yPos = 60
  const clientBoxX = pageWidth - 90
  doc.setFillColor(249, 250, 251) // gray-50
  doc.roundedRect(clientBoxX - 10, yPos - 5, 90, 45, 3, 3, 'F')
  
  doc.setTextColor(...PRIMARY_COLOR)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENT', clientBoxX, yPos + 3)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  yPos += 8
  
  if (invoice.client) {
    doc.text(invoice.client.name, clientBoxX, yPos)
    yPos += 5
    if (invoice.client.ice) {
      doc.text(`ICE: ${invoice.client.ice}`, clientBoxX, yPos)
      yPos += 4
    }
    if (invoice.client.address) {
      doc.text(invoice.client.address, clientBoxX, yPos)
      yPos += 4
    }
    if (invoice.client.city) {
      doc.text(invoice.client.city, clientBoxX, yPos)
      yPos += 4
    }
    if (invoice.client.phone) {
      doc.text(`Tél: ${invoice.client.phone}`, clientBoxX, yPos)
    }
  }
  
  yPos = 120
  
  // Document Details
  doc.setFillColor(249, 250, 251)
  doc.rect(margin, yPos, pageWidth - 2 * margin, 15, 'F')
  
  doc.setFontSize(9)
  doc.setTextColor(...SECONDARY_COLOR)
  
  const detailsX = margin + 5
  doc.text(`Date d'émission: ${formatDate(invoice.createdAt)}`, detailsX, yPos + 10)
  
  if (type === 'quote') {
    doc.text(`Valide jusqu'au: ${formatDate((invoice as QuoteData).validUntil)}`, pageWidth / 2, yPos + 10)
  } else {
    doc.text(`Date d'échéance: ${formatDate(invoice.dueDate)}`, pageWidth / 2, yPos + 10)
  }
  
  doc.text(`Statut: ${invoice.status.toUpperCase()}`, pageWidth - margin - 5, yPos + 10, { align: 'right' })
  
  yPos += 25
  
  // Items Table
  const tableData = invoice.items.map((item, index) => {
    const lineTotal = item.quantity * item.unitPrice
    const lineTva = lineTotal * (item.tvaRate / 100)
    return [
      (index + 1).toString(),
      item.description,
      item.quantity.toString(),
      formatCurrency(item.unitPrice),
      `${item.tvaRate}%`,
      formatCurrency(lineTotal + lineTva)
    ]
  })
  
  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Description', 'Qté', 'Prix Unit.', 'TVA', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: PRIMARY_COLOR,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  })
  
  yPos = (doc as any).lastAutoTable.finalY + 10
  
  // Totals
  const totalsX = pageWidth - margin - 70
  
  doc.setFontSize(9)
  doc.setTextColor(...SECONDARY_COLOR)
  
  doc.text('Sous-total:', totalsX, yPos)
  doc.text(formatCurrency(invoice.subtotal), pageWidth - margin, yPos, { align: 'right' })
  yPos += 6
  
  doc.text('TVA:', totalsX, yPos)
  doc.text(formatCurrency(invoice.tvaAmount), pageWidth - margin, yPos, { align: 'right' })
  yPos += 6
  
  // Total
  doc.setFillColor(...PRIMARY_COLOR)
  doc.rect(totalsX - 5, yPos - 2, pageWidth - margin - totalsX + 5, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', totalsX, yPos + 5)
  doc.text(formatCurrency(invoice.total), pageWidth - margin, yPos + 5, { align: 'right' })
  
  yPos += 20
  
  // Amount Paid / Balance (for invoices)
  if (type === 'invoice' && invoice.amountPaid && invoice.amountPaid > 0) {
    doc.setTextColor(...ACCENT_COLOR)
    doc.text('Montant payé:', totalsX, yPos)
    doc.text(formatCurrency(invoice.amountPaid), pageWidth - margin, yPos, { align: 'right' })
    yPos += 6
    
    doc.setTextColor(...PRIMARY_COLOR)
    doc.text('Reste à payer:', totalsX, yPos)
    doc.text(formatCurrency(invoice.balance || 0), pageWidth - margin, yPos, { align: 'right' })
    yPos += 15
  }
  
  // Notes
  if (invoice.notes) {
    doc.setFontSize(9)
    doc.setTextColor(...SECONDARY_COLOR)
    doc.setFont('helvetica', 'italic')
    doc.text('Notes:', margin, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.notes, margin, yPos, { maxWidth: pageWidth - 2 * margin })
  }
  
  // Bank Details
  if (invoice.company?.bankName && invoice.company?.bankRib) {
    yPos = doc.internal.pageSize.getHeight() - 40
    
    doc.setFillColor(249, 250, 251)
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 30, 'F')
    
    doc.setFontSize(8)
    doc.setTextColor(...SECONDARY_COLOR)
    doc.text('Coordonnées bancaires:', margin + 5, yPos + 2)
    yPos += 7
    doc.text(`Banque: ${invoice.company.bankName}`, margin + 5, yPos)
    if (invoice.company.bankRib) {
      doc.text(`RIB: ${invoice.company.bankRib}`, margin + 5, yPos + 7)
    }
  }
  
  // Footer
  yPos = doc.internal.pageSize.getHeight() - 10
  doc.setFontSize(8)
  doc.setTextColor(...SECONDARY_COLOR)
  doc.text(
    'Document généré par Epaiement.ma - Conforme DGI 2026',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  
  return doc
}

export function downloadInvoicePDF(invoice: InvoiceData, type: 'invoice' | 'quote' | 'credit_note' = 'invoice') {
  const doc = generateInvoicePDF(invoice, type)
  doc.save(`${invoice.number}.pdf`)
}

export function previewInvoicePDF(invoice: InvoiceData, type: 'invoice' | 'quote' | 'credit_note' = 'invoice') {
  const doc = generateInvoicePDF(invoice, type)
  const pdfBlob = doc.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)
  window.open(pdfUrl, '_blank')
}

export default generateInvoicePDF
