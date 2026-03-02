// Core Module Types

// Invoice Line Item
export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tvaRate: number
  totalHT?: number
  tvaAmount?: number
  totalTTC?: number
}

// Invoice
export interface Invoice {
  id: string
  number: string
  clientId: string
  items: InvoiceLineItem[]
  subtotal: number
  tvaAmount: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  createdAt: string
  dueDate: string
  paidAt?: string
  notes?: string
  terms?: string
  payments?: Payment[]
  amountPaid?: number
  isRecurring?: boolean
  recurringFrequency?: 'monthly' | 'quarterly' | 'annually'
  recurringNextDate?: string
  recurringEndDate?: string
  
  // DGI 2026 fields
  dgi?: {
    qrCode?: string
    digitalSignature?: string
    xmlGenerated?: boolean
    sentToDgi?: boolean
    dgiResponse?: string
  }
}

// Payment
export interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: 'cash' | 'check' | 'bank_transfer' | 'card' | 'online'
  reference?: string
  paidAt: string
  notes?: string
  gatewayId?: string
  gatewayReference?: string
}

// Payment Link
export interface PaymentLink {
  id: string
  amount: number
  description: string
  clientEmail: string
  clientPhone: string
  clientName?: string
  dueDate: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  createdAt: string
  paidAt?: string
  cancelledAt?: string
  reference: string
  shortUrl?: string
  
  // Payment details
  payment?: {
    method: string
    reference: string
    gateway: string
  }
  
  // Reminder tracking
  remindersSent?: number[]
}

// Payment Link with QR
export interface PaymentLinkWithQR extends PaymentLink {
  qrCodeUrl: string
  paymentUrl: string
}

// Invoice Template
export interface InvoiceTemplate {
  id: string
  name: string
  items: Omit<InvoiceLineItem, 'id'>[]
  notes?: string
  terms?: string
  isDefault?: boolean
}

// TVA Rate
export interface TVARate {
  value: number
  label: string
  description: string
}

// Payment Method
export interface PaymentMethod {
  value: string
  label: string
  labelAr: string
}

// Invoice Status
export interface InvoiceStatus {
  value: Invoice['status']
  label: string
  labelAr: string
  color: string
}

// Dashboard Metrics
export interface DashboardMetrics {
  totalRevenue: number
  pendingAmount: number
  totalExpenses: number
  activeClients: number
  pendingInvoices: number
  paidInvoices: number
  overdueInvoices: number
  tvaCollected: number
  tvaDeductible: number
  tvaToPay: number
  recentActivity: ActivityItem[]
}

// Activity Item
export interface ActivityItem {
  id: string
  type: 'invoice_created' | 'invoice_paid' | 'payment_received' | 'client_added' | 'quote_sent'
  description: string
  timestamp: string
  entityId?: string
  entityType?: string
}
