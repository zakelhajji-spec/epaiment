/**
 * API Data Hook for Epaiement
 * Provides data fetching and CRUD operations via API
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { invoiceApi, paymentLinkApi, settingsApi, subscriptionApi } from '@/lib/api/client'

// Types
export interface Client {
  id: string
  name: string
  ice: string | null
  email: string
  phone: string | null
  address: string | null
  city: string | null
  createdAt: string
}

export interface Invoice {
  id: string
  number: string
  clientId: string
  client?: Client
  items: any[]
  subtotal: number
  tvaAmount: number
  total: number
  status: string
  createdAt: string
  dueDate: string
  paidAt?: string
  notes?: string
  amountPaid: number
  balance: number
}

export interface PaymentLink {
  id: string
  amount: number
  description: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  reference: string
  status: string
  dueDate?: string
  paidAt?: string
  createdAt: string
  paymentUrl?: string
}

export interface Settings {
  id: string
  email: string
  name?: string
  language: string
  companyName?: string
  companyIce?: string
  companyIf?: string
  companyRc?: string
  companyAddress?: string
  companyCity?: string
  companyPhone?: string
  defaultTvaRate: number
  invoicePrefix: string
  autoEntrepreneur: boolean
}

export interface Subscription {
  plan: string
  planDetails: {
    name: string
    price: number
    modules: string[]
    limits: Record<string, number>
  }
  modules: string[]
}

// Hook return type
interface UseApiDataReturn {
  // Data
  invoices: Invoice[]
  paymentLinks: PaymentLink[]
  settings: Settings | null
  subscription: Subscription | null
  clients: Client[]
  
  // Loading states
  isLoading: boolean
  isInvoicesLoading: boolean
  isPaymentLinksLoading: boolean
  isSettingsLoading: boolean
  
  // Error states
  error: string | null
  
  // Actions
  fetchInvoices: () => Promise<void>
  fetchPaymentLinks: () => Promise<void>
  fetchSettings: () => Promise<void>
  fetchAll: () => Promise<void>
  
  // Invoice actions
  createInvoice: (data: unknown) => Promise<{ success: boolean; invoice?: Invoice; error?: string }>
  updateInvoice: (id: string, data: unknown) => Promise<{ success: boolean; invoice?: Invoice; error?: string }>
  deleteInvoice: (id: string) => Promise<{ success: boolean; error?: string }>
  sendInvoice: (id: string) => Promise<{ success: boolean; error?: string }>
  markInvoicePaid: (id: string, amount?: number, method?: string) => Promise<{ success: boolean; error?: string }>
  
  // Payment link actions
  createPaymentLink: (data: unknown) => Promise<{ success: boolean; link?: PaymentLink; error?: string }>
  updatePaymentLink: (id: string, data: unknown) => Promise<{ success: boolean; link?: PaymentLink; error?: string }>
  deletePaymentLink: (id: string) => Promise<{ success: boolean; error?: string }>
  
  // Settings actions
  updateSettings: (data: unknown) => Promise<{ success: boolean; settings?: Settings; error?: string }>
  
  // Subscription actions
  activatePlan: (planId: string, interval?: string) => Promise<{ success: boolean; subscription?: Subscription; error?: string }>
}

export function useApiData(): UseApiDataReturn {
  const { status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const hasLoadedRef = useRef(false)
  
  // Data states
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false)
  const [isPaymentLinksLoading, setIsPaymentLinksLoading] = useState(false)
  const [isSettingsLoading, setIsSettingsLoading] = useState(false)
  
  // Error state
  const [error, setError] = useState<string | null>(null)
  
  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    if (!isAuthenticated) return
    setIsInvoicesLoading(true)
    try {
      const result = await invoiceApi.list()
      if (result.data) {
        setInvoices(result.data.invoices)
        // Extract unique clients from invoices
        const uniqueClients = new Map()
        result.data.invoices.forEach((inv: Invoice) => {
          if (inv.client && !uniqueClients.has(inv.client.id)) {
            uniqueClients.set(inv.client.id, inv.client)
          }
        })
        setClients(Array.from(uniqueClients.values()))
      } else {
        setError(result.error || 'Failed to fetch invoices')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setIsInvoicesLoading(false)
    }
  }, [isAuthenticated])
  
  // Fetch payment links
  const fetchPaymentLinks = useCallback(async () => {
    if (!isAuthenticated) return
    setIsPaymentLinksLoading(true)
    try {
      const result = await paymentLinkApi.list()
      if (result.data) {
        setPaymentLinks(result.data.links)
      } else {
        setError(result.error || 'Failed to fetch payment links')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setIsPaymentLinksLoading(false)
    }
  }, [isAuthenticated])
  
  // Fetch settings
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return
    setIsSettingsLoading(true)
    try {
      const result = await settingsApi.get()
      if (result.data) {
        setSettings(result.data)
      } else {
        setError(result.error || 'Failed to fetch settings')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setIsSettingsLoading(false)
    }
  }, [isAuthenticated])
  
  // Fetch subscription
  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const result = await subscriptionApi.get()
      if (result.data) {
        setSubscription(result.data)
      }
    } catch (err) {
      // Silently fail for subscription
    }
  }, [isAuthenticated])
  
  // Fetch all data
  const fetchAll = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      await Promise.all([fetchInvoices(), fetchPaymentLinks(), fetchSettings(), fetchSubscription()])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, fetchInvoices, fetchPaymentLinks, fetchSettings, fetchSubscription])
  
  // Load data when authenticated - using a ref to prevent multiple calls
  useEffect(() => {
    if (isAuthenticated && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      // Start loading but don't wait in the effect
      const loadData = async () => {
        setIsLoading(true)
        try {
          await Promise.all([
            fetchInvoices(),
            fetchPaymentLinks(), 
            fetchSettings(),
            fetchSubscription()
          ])
        } finally {
          setIsLoading(false)
        }
      }
      loadData()
    }
  }, [isAuthenticated]) // Intentionally exclude fetch functions to prevent loops
  
  // Invoice actions
  const createInvoice = useCallback(async (data: unknown) => {
    const result = await invoiceApi.create(data)
    if (result.data) {
      setInvoices(prev => [result.data as Invoice, ...prev])
      return { success: true, invoice: result.data as Invoice }
    }
    return { success: false, error: result.error }
  }, [])
  
  const updateInvoice = useCallback(async (id: string, data: unknown) => {
    const result = await invoiceApi.update(id, data)
    if (result.data) {
      setInvoices(prev => prev.map(inv => inv.id === id ? result.data as Invoice : inv))
      return { success: true, invoice: result.data as Invoice }
    }
    return { success: false, error: result.error }
  }, [])
  
  const deleteInvoice = useCallback(async (id: string) => {
    const result = await invoiceApi.delete(id)
    if (result.data?.success) {
      setInvoices(prev => prev.filter(inv => inv.id !== id))
      return { success: true }
    }
    return { success: false, error: result.error }
  }, [])
  
  const sendInvoice = useCallback(async (id: string) => {
    const result = await invoiceApi.updateStatus(id, 'send')
    if (result.data) {
      setInvoices(prev => prev.map(inv => inv.id === id ? result.data as Invoice : inv))
      return { success: true }
    }
    return { success: false, error: result.error }
  }, [])
  
  const markInvoicePaid = useCallback(async (id: string, amount?: number, method?: string) => {
    const result = await invoiceApi.updateStatus(id, 'mark_paid', { paymentAmount: amount, paymentMethod: method })
    if (result.data) {
      setInvoices(prev => prev.map(inv => inv.id === id ? result.data as Invoice : inv))
      return { success: true }
    }
    return { success: false, error: result.error }
  }, [])
  
  // Payment link actions
  const createPaymentLink = useCallback(async (data: unknown) => {
    const result = await paymentLinkApi.create(data)
    if (result.data) {
      setPaymentLinks(prev => [result.data as PaymentLink, ...prev])
      return { success: true, link: result.data as PaymentLink }
    }
    return { success: false, error: result.error }
  }, [])
  
  const updatePaymentLink = useCallback(async (id: string, data: unknown) => {
    const result = await paymentLinkApi.update(id, data)
    if (result.data) {
      setPaymentLinks(prev => prev.map(link => link.id === id ? result.data as PaymentLink : link))
      return { success: true, link: result.data as PaymentLink }
    }
    return { success: false, error: result.error }
  }, [])
  
  const deletePaymentLink = useCallback(async (id: string) => {
    const result = await paymentLinkApi.delete(id)
    if (result.data?.success) {
      setPaymentLinks(prev => prev.filter(link => link.id !== id))
      return { success: true }
    }
    return { success: false, error: result.error }
  }, [])
  
  // Settings actions
  const updateSettings = useCallback(async (data: unknown) => {
    const result = await settingsApi.update(data)
    if (result.data) {
      setSettings(result.data as Settings)
      return { success: true, settings: result.data as Settings }
    }
    return { success: false, error: result.error }
  }, [])
  
  // Subscription actions
  const activatePlan = useCallback(async (planId: string, interval?: string) => {
    const result = await subscriptionApi.activate(planId, interval)
    if (result.data) {
      setSubscription(result.data as Subscription)
      return { success: true, subscription: result.data as Subscription }
    }
    return { success: false, error: result.error }
  }, [])
  
  return {
    invoices,
    paymentLinks,
    settings,
    subscription,
    clients,
    isLoading,
    isInvoicesLoading,
    isPaymentLinksLoading,
    isSettingsLoading,
    error,
    fetchInvoices,
    fetchPaymentLinks,
    fetchSettings,
    fetchAll,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    markInvoicePaid,
    createPaymentLink,
    updatePaymentLink,
    deletePaymentLink,
    updateSettings,
    activatePlan,
  }
}

export default useApiData
