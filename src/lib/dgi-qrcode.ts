/**
 * DGI 2026 QR Code Generator for Morocco E-Invoicing Compliance
 * 
 * This module generates QR codes that comply with the Moroccan DGI 2026 
 * e-invoicing regulations. The QR code contains all required invoice data
 * in a standardized format for verification by tax authorities.
 * 
 * @see https://www.tax.gov.ma/ - DGI E-invoicing requirements
 */

import QRCode from 'qrcode'
import { createHash, createSign } from 'crypto'

// ============================================
// Types
// ============================================

export interface DGIQRData {
  // Company identifiers
  companyIce: string           // Identifiant Commun de l'Entreprise (15 digits)
  companyIf: string            // Identifiant Fiscal
  companyRc?: string           // Registre du Commerce
  
  // Invoice details
  invoiceNumber: string        // Numéro de facture séquentiel
  invoiceDate: string          // Date d'émission (ISO format)
  dueDate?: string             // Date d'échéance
  
  // Amounts
  totalHT: number              // Total Hors Taxes
  totalTVA: number             // Total TVA
  totalTTC: number             // Total Toutes Taxes Comprises
  
  // Client info (optional for B2C)
  clientIce?: string           // ICE client (B2B only)
  clientIf?: string            // IF client
  
  // Payment
  paymentMethod?: string       // Mode de paiement
  
  // Signature
  signature?: string           // Signature électronique
}

export interface DGIQRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  type?: 'image/png' | 'image/jpeg' | 'image/svg'
  width?: number
  margin?: number
}

export interface InvoiceForQR {
  number: string
  issueDate: Date | string
  dueDate?: Date | string
  subtotal: number
  tvaAmount: number
  total: number
  client?: {
    ice?: string
    ifNumber?: string
  }
  company: {
    ice: string
    if: string
    rc?: string
  }
}

// ============================================
// Constants
// ============================================

// DGI QR Code version for future compatibility
const DGI_VERSION = '01'

// Field separators
const FIELD_SEPARATOR = '|'
const GROUP_SEPARATOR = '\n'

// ============================================
// Main Functions
// ============================================

/**
 * Generate DGI-compliant QR code string
 * 
 * Format: VERSION|ICE|IF|RC|FACTURE_NUM|DATE|TOTAL_HT|TOTAL_TVA|TOTAL_TTC|CLIENT_ICE|CLIENT_IF|SIGNATURE
 */
export function generateDGIQRString(data: DGIQRData): string {
  const fields = [
    DGI_VERSION,
    data.companyIce || '',
    data.companyIf || '',
    data.companyRc || '',
    data.invoiceNumber || '',
    formatDateForDGI(data.invoiceDate),
    data.totalHT.toFixed(2),
    data.totalTVA.toFixed(2),
    data.totalTTC.toFixed(2),
    data.clientIce || '',
    data.clientIf || '',
    data.paymentMethod || '',
    data.signature || ''
  ]
  
  return fields.join(FIELD_SEPARATOR)
}

/**
 * Generate QR code as Data URL (base64)
 */
export async function generateDGIQRCode(
  data: DGIQRData, 
  options: DGIQRCodeOptions = {}
): Promise<string> {
  const qrString = generateDGIQRString(data)
  
  const defaultOptions = {
    errorCorrectionLevel: 'M' as const,
    type: 'image/png' as const,
    width: 200,
    margin: 2,
    ...options
  }
  
  try {
    return await QRCode.toDataURL(qrString, defaultOptions)
  } catch (error) {
    console.error('[DGI QR] Error generating QR code:', error)
    throw new Error('Failed to generate DGI QR code')
  }
}

/**
 * Generate QR code as Buffer
 */
export async function generateDGIQRCodeBuffer(
  data: DGIQRData,
  options: DGIQRCodeOptions = {}
): Promise<Buffer> {
  const qrString = generateDGIQRString(data)
  
  const defaultOptions = {
    errorCorrectionLevel: 'M' as const,
    type: 'png' as const,
    width: 200,
    margin: 2,
    ...options
  }
  
  try {
    return await QRCode.toBuffer(qrString, defaultOptions)
  } catch (error) {
    console.error('[DGI QR] Error generating QR code buffer:', error)
    throw new Error('Failed to generate DGI QR code buffer')
  }
}

/**
 * Generate invoice hash for integrity verification
 * This creates a SHA-256 hash of the invoice data
 */
export function generateInvoiceHash(data: DGIQRData): string {
  const hashData = [
    data.companyIce,
    data.companyIf,
    data.invoiceNumber,
    formatDateForDGI(data.invoiceDate),
    data.totalHT.toFixed(2),
    data.totalTTC.toFixed(2)
  ].join(FIELD_SEPARATOR)
  
  return createHash('sha256').update(hashData).digest('hex')
}

/**
 * Generate electronic signature for the invoice
 * Requires a private key stored securely
 */
export function generateInvoiceSignature(
  data: DGIQRData, 
  privateKey: string
): string {
  const hash = generateInvoiceHash(data)
  
  try {
    const sign = createSign('RSA-SHA256')
    sign.update(hash)
    sign.end()
    
    const signature = sign.sign(privateKey, 'base64')
    return signature
  } catch (error) {
    console.error('[DGI QR] Error generating signature:', error)
    // Return hash as fallback if no proper key
    return hash.substring(0, 32)
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Format date for DGI (DD/MM/YYYY)
 */
function formatDateForDGI(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  
  return `${day}/${month}/${year}`
}

/**
 * Validate ICE format (15 digits for Morocco)
 */
export function validateICE(ice: string): { valid: boolean; error?: string } {
  if (!ice) {
    return { valid: false, error: 'ICE is required' }
  }
  
  // Moroccan ICE is 15 digits
  const iceRegex = /^\d{15}$/
  if (!iceRegex.test(ice)) {
    return { valid: false, error: 'ICE must be exactly 15 digits' }
  }
  
  return { valid: true }
}

/**
 * Validate IF format (Moroccan Tax ID)
 */
export function validateIF(ifNumber: string): { valid: boolean; error?: string } {
  if (!ifNumber) {
    return { valid: false, error: 'IF is required' }
  }
  
  // Moroccan IF: usually starts with 1 or 4, followed by digits
  const ifRegex = /^[14]\d{6,9}$/
  if (!ifRegex.test(ifNumber)) {
    return { valid: false, error: 'Invalid IF format' }
  }
  
  return { valid: true }
}

/**
 * Parse DGI QR string back to data object
 */
export function parseDGIQRString(qrString: string): DGIQRData | null {
  try {
    const fields = qrString.split(FIELD_SEPARATOR)
    
    if (fields.length < 12) {
      console.error('[DGI QR] Invalid QR string format')
      return null
    }
    
    return {
      companyIce: fields[1],
      companyIf: fields[2],
      companyRc: fields[3],
      invoiceNumber: fields[4],
      invoiceDate: fields[5],
      totalHT: parseFloat(fields[6]),
      totalTVA: parseFloat(fields[7]),
      totalTTC: parseFloat(fields[8]),
      clientIce: fields[9] || undefined,
      clientIf: fields[10] || undefined,
      paymentMethod: fields[11] || undefined,
      signature: fields[12] || undefined
    }
  } catch (error) {
    console.error('[DGI QR] Error parsing QR string:', error)
    return null
  }
}

/**
 * Generate QR data from invoice object
 */
export async function generateQRCodeFromInvoice(
  invoice: InvoiceForQR,
  privateKey?: string
): Promise<string> {
  const qrData: DGIQRData = {
    companyIce: invoice.company.ice,
    companyIf: invoice.company.if,
    companyRc: invoice.company.rc,
    invoiceNumber: invoice.number,
    invoiceDate: typeof invoice.issueDate === 'string' 
      ? invoice.issueDate 
      : invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate 
      ? (typeof invoice.dueDate === 'string' ? invoice.dueDate : invoice.dueDate.toISOString())
      : undefined,
    totalHT: invoice.subtotal,
    totalTVA: invoice.tvaAmount,
    totalTTC: invoice.total,
    clientIce: invoice.client?.ice,
    clientIf: invoice.client?.ifNumber,
    paymentMethod: 'VIREMENT' // Default
  }
  
  // Generate signature if private key provided
  if (privateKey) {
    qrData.signature = generateInvoiceSignature(qrData, privateKey)
  } else {
    // Use hash as pseudo-signature for basic integrity
    qrData.signature = generateInvoiceHash(qrData).substring(0, 32)
  }
  
  return generateDGIQRCode(qrData)
}

// ============================================
// Export Default
// ============================================

const DGIQRCodeService = {
  generateDGIQRCode,
  generateDGIQRCodeBuffer,
  generateDGIQRString,
  generateInvoiceHash,
  generateInvoiceSignature,
  generateQRCodeFromInvoice,
  parseDGIQRString,
  validateICE,
  validateIF
}

export default DGIQRCodeService
