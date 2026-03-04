/**
 * Invoice Utility Functions
 * Helper functions for handling invoice data
 */

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tvaRate: number
}

/**
 * Parse invoice items from JSON string or return as-is if already an array
 */
export function parseInvoiceItems(items: string | InvoiceLineItem[] | null | undefined): InvoiceLineItem[] {
  if (!items) return []
  
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      console.error('Failed to parse invoice items:', items)
      return []
    }
  }
  
  return Array.isArray(items) ? items : []
}

/**
 * Calculate subtotal from line items
 */
export function calculateSubtotal(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
}

/**
 * Calculate TVA amount from line items
 */
export function calculateTvaAmount(items: InvoiceLineItem[]): number {
  return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.tvaRate / 100), 0)
}

/**
 * Calculate total from line items
 */
export function calculateTotal(items: InvoiceLineItem[]): number {
  return calculateSubtotal(items) + calculateTvaAmount(items)
}

/**
 * Generate a unique ID for invoice items
 */
export function generateItemId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Create a new empty invoice line item
 */
export function createEmptyItem(tvaRate: number = 20): InvoiceLineItem {
  return {
    id: generateItemId(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    tvaRate
  }
}
