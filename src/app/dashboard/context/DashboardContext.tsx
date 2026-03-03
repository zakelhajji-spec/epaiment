'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Language } from '@/lib/modules/types'

// Types
interface Client {
  id: string
  name: string
  ice?: string
  email: string
  phone?: string
  address?: string
  city?: string
}

interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  tvaRate: number
}

interface Invoice {
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

interface PaymentLink {
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

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9)

// Context type
interface DashboardContextType {
  // Language
  language: Language
  setLanguage: (lang: Language) => void
  t: (fr: string, ar: string) => string
  
  // Navigation
  currentPage: string
  setCurrentPage: (page: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  // Dialogs
  dialogOpen: string | null
  setDialogOpen: (dialog: string | null) => void
  selectedItem: any
  setSelectedItem: (item: any) => void
  
  // Clients
  newClient: { name: string; ice: string; email: string; phone: string; address: string; city: string }
  setNewClient: (client: any) => void
  
  // Invoices
  newInvoice: {
    clientId: string
    items: InvoiceLineItem[]
    dueDate: string
    notes: string
  }
  setNewInvoice: (invoice: any) => void
  
  // Payment Links
  newPaymentLink: { amount: number; description: string; clientEmail: string; clientPhone: string; dueDate: string }
  setNewPaymentLink: (link: any) => void
  
  // Settings
  settingsFormData: any
  setSettingsFormData: (data: any) => void
  
  // Module groups
  activeGroups: string[]
  setActiveGroups: (groups: string[]) => void
  userModules: string[]
  setUserModules: (modules: string[]) => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  // Language
  const [language, setLanguage] = useState<Language>('fr')
  
  // Navigation
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Module groups
  const [activeGroups, setActiveGroups] = useState<string[]>(['core'])
  const [userModules, setUserModules] = useState<string[]>(['dashboard', 'invoices', 'payment-links', 'clients'])
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  
  // Form states
  const [newClient, setNewClient] = useState({ name: '', ice: '', email: '', phone: '', address: '', city: '' })
  const [newPaymentLink, setNewPaymentLink] = useState({ amount: 0, description: '', clientEmail: '', clientPhone: '', dueDate: '' })
  const [newInvoice, setNewInvoice] = useState({
    clientId: '', 
    items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }] as InvoiceLineItem[],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  })
  
  // Settings
  const [settingsFormData, setSettingsFormData] = useState({
    name: '',
    ice: '',
    if: '',
    rc: '',
    patente: '',
    cnss: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    autoEntrepreneur: false,
    defaultTvaRate: 20,
    invoicePrefix: 'FA',
  })
  
  // Translation helper
  const t = useCallback((fr: string, ar: string) => language === 'ar' ? ar : fr, [language])
  
  const value: DashboardContextType = {
    language,
    setLanguage,
    t,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    dialogOpen,
    setDialogOpen,
    selectedItem,
    setSelectedItem,
    newClient,
    setNewClient,
    newInvoice,
    setNewInvoice,
    newPaymentLink,
    setNewPaymentLink,
    settingsFormData,
    setSettingsFormData,
    activeGroups,
    setActiveGroups,
    userModules,
    setUserModules,
  }
  
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider')
  }
  return context
}

export type { Client, Invoice, InvoiceLineItem, PaymentLink }
export { generateId }
