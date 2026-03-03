// Dashboard Types

export interface Client {
  id: string
  name: string
  ice?: string
  email: string
  phone?: string
  address?: string
  city?: string
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tvaRate: number
}

export interface Invoice {
  id: string
  number: string
  clientId: string
  client?: Client
  items: InvoiceLineItem[]
  subtotal: number
  tvaAmount: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  createdAt: string
  dueDate: string
  notes?: string
}

export interface PaymentLink {
  id: string
  amount: number
  description: string
  clientEmail?: string
  clientPhone?: string
  dueDate?: string
  status: 'pending' | 'paid' | 'expired'
  createdAt: string
  paidAt?: string
  reference: string
}

export type DialogType = 
  | 'new-invoices' | 'new-payment-links' | 'new-clients' 
  | 'edit-invoice' | null

export type Language = 'fr' | 'ar'
