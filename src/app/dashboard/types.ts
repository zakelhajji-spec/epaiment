// Dashboard Types

// Core Types
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

// CRM Types
export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  source: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  assignedTo: string
  status: 'pending' | 'completed'
  createdAt: string
}

// Sales Types
export interface Supplier {
  id: string
  name: string
  email: string
  phone: string
  ice: string
  address: string
  city: string
  createdAt: string
}

export interface Quote {
  id: string
  number: string
  clientId: string
  client?: Client
  items: InvoiceLineItem[]
  subtotal: number
  tvaAmount: number
  total: number
  status: 'pending' | 'accepted' | 'rejected'
  validUntil: string
  notes: string
  createdAt: string
}

// Accounting Types
export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  tvaRate: number
  supplier: string
  createdAt: string
}

export interface CreditNote {
  id: string
  number: string
  invoiceId: string
  reason: string
  amount: number
  status: 'pending' | 'applied'
  createdAt: string
}

// Stock Types
export interface Product {
  id: string
  name: string
  sku: string
  description: string
  price: number
  tvaRate: number
  category: string
  stock: number
  createdAt: string
}

// Team Types
export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'accountant' | 'reader'
  status: 'active' | 'pending'
  createdAt: string
}

// Integration Types
export interface ApiKey {
  id: string
  name: string
  key: string
  permissions: 'read' | 'write'
  createdAt: string
}

export interface Gateway {
  id: string
  name: string
  provider: string
  status: 'active' | 'inactive' | 'pending'
  config: Record<string, string>
}

// Audit Types
export interface AuditLog {
  id: string
  action: string
  user: string
  resource: string
  timestamp: string
  ip: string
}

// Form Types
export interface NewInvoiceForm {
  clientId: string
  items: InvoiceLineItem[]
  dueDate: string
  notes: string
}

export interface NewClientForm {
  name: string
  ice: string
  email: string
  phone: string
  address: string
  city: string
}

export interface NewInvoiceForm {
  clientId: string
  items: InvoiceLineItem[]
  dueDate: string
  notes: string
}

export interface NewPaymentLinkForm {
  amount: number
  description: string
  clientEmail: string
  clientPhone: string
  dueDate: string
}

export interface NewLeadForm {
  name: string
  email: string
  phone: string
  company: string
  status: 'new'
  source: string
}

export interface NewTaskForm {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  assignedTo: string
}

export interface NewSupplierForm {
  name: string
  email: string
  phone: string
  ice: string
  address: string
  city: string
}

export interface NewQuoteForm {
  clientId: string
  items: InvoiceLineItem[]
  validUntil: string
  notes: string
}

export interface NewExpenseForm {
  description: string
  amount: number
  category: string
  date: string
  tvaRate: number
  supplier: string
}

export interface NewCreditNoteForm {
  invoiceId: string
  reason: string
  amount: number
}

export interface NewProductForm {
  name: string
  sku: string
  description: string
  price: number
  tvaRate: number
  category: string
  stock: number
}

export interface NewTeamMemberForm {
  name: string
  email: string
  role: 'admin' | 'accountant' | 'reader'
}

export interface NewApiKeyForm {
  name: string
  permissions: 'read' | 'write'
}

// Dialog Types
export type DialogType = 
  | 'new-invoices' | 'new-payment-links' | 'new-clients' 
  | 'edit-invoice' | 'new-leads' | 'new-tasks' 
  | 'new-suppliers' | 'new-quotes' | 'new-expenses' 
  | 'new-credit-notes' | 'new-products' | 'new-team' 
  | 'new-api-keys' | null

// Language Type
export type Language = 'fr' | 'ar'

// Metrics Type
export interface DashboardMetrics {
  totalRevenue: number
  pendingAmount: number
  totalExpenses: number
  activeClients: number
  tvaCollected: number
  tvaDeductible: number
}

// Settings Type
export interface SettingsFormData {
  name: string
  ice: string
  if: string
  rc: string
  patente: string
  cnss: string
  address: string
  city: string
  phone: string
  email: string
  autoEntrepreneur: boolean
  defaultTvaRate: number
  invoicePrefix: string
}
