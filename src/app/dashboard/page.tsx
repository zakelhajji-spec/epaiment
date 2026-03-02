'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  FileText, Users, TrendingUp, TrendingDown, Clock, Wallet,
  Plus, Search, Eye, Edit, Trash2, Send, Download, Copy,
  CheckCircle, XCircle, Link2, CreditCard, Sparkles, Printer,
  UserPlus, CheckSquare, Package, Warehouse, Truck, FileCheck,
  ArrowLeftRight, Receipt, BarChart3, UserCog, Key, Server,
  FileSearch, Brain, AlertCircle, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import { ToastContainer, showToast } from '@/components/shared/Toast'
import { ModuleGroupPricing } from '@/components/pricing/ModuleGroupPricing'
import { CompanyForm } from '@/components/shared/CompanyForm'
import type { CompanyFormData } from '@/components/shared/CompanyForm'
import type { Language } from '@/lib/modules/types'
import { useClients, useInvoices, usePaymentLinks, useSettings, useReports } from '@/hooks/useApiData'
import { invoiceApi, paymentLinkApi, clientApi, settingsApi, subscriptionApi } from '@/lib/api/client'
import { downloadInvoicePDF, previewInvoicePDF } from '@/lib/pdf-generator'
import { MODULE_GROUPS, getModulesForGroups } from '@/lib/module-groups.config'
import { parseInvoiceItems } from '@/lib/invoice-utils'
import { AILeadQualifierDashboard } from '@/modules/ai-lead-qualifier'

// ==================== TYPES ====================
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

// ==================== CONSTANTS ====================
const TVA_RATES = [
  { value: 20, label: '20% - Normal' },
  { value: 14, label: '14% - Services' },
  { value: 10, label: '10% - Hôtels' },
  { value: 7, label: '7% - Eau/Élec.' },
  { value: 0, label: '0% - Exonéré' },
]

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount)

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString('fr-MA')
  } catch {
    return date
  }
}

const generateId = () => Math.random().toString(36).substring(2, 9)

// ==================== MAIN COMPONENT ====================
export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Language and navigation
  const [language, setLanguage] = useState<Language>('fr')
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Active module groups - loaded from subscription
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
  
  // ==================== NEW MODULE STATES ====================
  // CRM states
  const [leads, setLeads] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', company: '', status: 'new', source: '' })
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' })
  
  // Sales states
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any[]>([])
  const [newSupplier, setNewSupplier] = useState({ name: '', email: '', phone: '', ice: '', address: '', city: '' })
  const [newQuote, setNewQuote] = useState({ clientId: '', items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }] as InvoiceLineItem[], validUntil: '', notes: '' })
  
  // Accounting states
  const [expenses, setExpenses] = useState<any[]>([])
  const [creditNotes, setCreditNotes] = useState<any[]>([])
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: '', date: '', tvaRate: 0, supplier: '' })
  const [newCreditNote, setNewCreditNote] = useState({ invoiceId: '', reason: '', amount: 0 })
  
  // Stock states
  const [products, setProducts] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', description: '', price: 0, tvaRate: 20, category: '', stock: 0 })
  
  // Team states
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [newTeamMember, setNewTeamMember] = useState({ name: '', email: '', role: 'accountant' })
  
  // Integrations states
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [gateways, setGateways] = useState<any[]>([])
  const [newApiKey, setNewApiKey] = useState({ name: '', permissions: 'read' })
  
  // Audit states
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  
  // AI states
  const [aiConversations, setAiConversations] = useState<any[]>([])
  
  // Settings form state - initialized with defaults so the form always renders
  const [settingsFormData, setSettingsFormData] = useState<Partial<CompanyFormData>>({
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

  // Fetch data from API
  const { data: clientsData, isLoading: clientsLoading, refetch: refetchClients } = useClients(searchQuery)
  const { data: invoicesData, isLoading: invoicesLoading, refetch: refetchInvoices } = useInvoices()
  const { data: paymentLinksData, isLoading: paymentLinksLoading, refetch: refetchPaymentLinks } = usePaymentLinks()
  const { data: settingsData, refetch: refetchSettings } = useSettings()
  const { data: reportsData } = useReports('overview')

  // Derived data
  const clients = clientsData?.clients || []
  const invoices = invoicesData?.invoices || []
  const paymentLinks = paymentLinksData?.links || []

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Load subscription and settings
  useEffect(() => {
    const loadData = async () => {
      if (status !== 'authenticated') return
      
      // Load subscription
      try {
        const subResult = await subscriptionApi.get()
        if (subResult.data?.activeGroups) {
          setActiveGroups(subResult.data.activeGroups)
          const modules = getModulesForGroups(subResult.data.activeGroups)
          setUserModules(modules)
        }
      } catch (e) {
        console.error('Failed to load subscription:', e)
      }
    }
    loadData()
  }, [status])

  // Prepare settings form data when settings load
  useEffect(() => {
    if (settingsData) {
      setSettingsFormData({
        name: settingsData.companyName || '',
        ice: settingsData.companyIce || '',
        if: settingsData.companyIf || '',
        rc: settingsData.companyRc || '',
        patente: settingsData.companyPatente || '',
        cnss: settingsData.companyCnss || '',
        address: settingsData.companyAddress || '',
        city: settingsData.companyCity || '',
        phone: settingsData.companyPhone || '',
        email: settingsData.email || '',
        autoEntrepreneur: settingsData.autoEntrepreneur || false,
        defaultTvaRate: settingsData.defaultTvaRate || 20,
        invoicePrefix: settingsData.invoicePrefix || 'FA',
      })
    }
  }, [settingsData])

  // Translation helper
  const t = useCallback((fr: string, ar: string) => language === 'ar' ? ar : fr, [language])

  // Metrics
  const metrics = {
    totalRevenue: invoices.filter((i: Invoice) => i.status === 'paid').reduce((s: number, i: Invoice) => s + i.total, 0),
    pendingAmount: invoices.filter((i: Invoice) => i.status === 'sent').reduce((s: number, i: Invoice) => s + i.total, 0) + 
                   paymentLinks.filter((l: PaymentLink) => l.status === 'pending').reduce((s: number, l: PaymentLink) => s + l.amount, 0),
    totalExpenses: reportsData?.totalExpenses || 0,
    activeClients: clients.length,
    tvaCollected: invoices.filter((i: Invoice) => i.status === 'paid').reduce((s: number, i: Invoice) => s + i.tvaAmount, 0),
    tvaDeductible: reportsData?.tvaDeductible || 0,
  }

  // ==================== HANDLERS ====================
  
  // Client handlers
  const handleCreateClient = async () => {
    if (!newClient.name || !newClient.email) {
      showToast(t('Le nom et l\'email sont requis', 'الاسم والبريد الإلكتروني مطلوبان'), 'error')
      return
    }

    const result = await clientApi.create(newClient)
    if (result.data) {
      showToast(t('Client créé!', 'تم إنشاء العميل!'))
      setNewClient({ name: '', ice: '', email: '', phone: '', address: '', city: '' })
      setDialogOpen(null)
      refetchClients()
    } else {
      showToast(result.error || t('Erreur lors de la création', 'خطأ في الإنشاء'), 'error')
    }
  }

  // Invoice handlers
  const handleCreateInvoice = async () => {
    if (!newInvoice.clientId || newInvoice.items.length === 0) {
      showToast(t('Veuillez sélectionner un client et ajouter des articles', 'يرجى اختيار عميل وإضافة عناصر'), 'error')
      return
    }

    const subtotal = newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
    const tvaAmount = newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.tvaRate / 100), 0)
    const total = subtotal + tvaAmount

    const result = await invoiceApi.create({
      clientId: newInvoice.clientId,
      items: newInvoice.items,
      subtotal,
      tvaAmount,
      total,
      dueDate: newInvoice.dueDate,
      notes: newInvoice.notes
    })

    if (result.data) {
      showToast(t('Facture créée!', 'تم إنشاء الفاتورة!'))
      setNewInvoice({
        clientId: '',
        items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      })
      setDialogOpen(null)
      refetchInvoices()
    } else {
      showToast(result.error || t('Erreur lors de la création', 'خطأ في الإنشاء'), 'error')
    }
  }

  const handleInvoiceAction = async (invoiceId: string, action: 'send' | 'mark_paid' | 'delete') => {
    let result
    if (action === 'delete') {
      result = await invoiceApi.delete(invoiceId)
    } else {
      result = await invoiceApi.updateStatus(invoiceId, action)
    }
    if (result.data) {
      showToast(t('Action effectuée!', 'تم تنفيذ الإجراء!'))
      refetchInvoices()
    } else {
      showToast(result.error || t('Erreur', 'خطأ'), 'error')
    }
  }

  // Handle edit invoice
  const handleEditInvoice = async () => {
    if (!selectedItem) return
    
    const subtotal = newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
    const tvaAmount = newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.tvaRate / 100), 0)
    const total = subtotal + tvaAmount

    const result = await invoiceApi.update(selectedItem.id, {
      clientId: newInvoice.clientId,
      items: newInvoice.items,
      subtotal,
      tvaAmount,
      total,
      dueDate: newInvoice.dueDate,
      notes: newInvoice.notes
    })

    if (result.data) {
      showToast(t('Facture modifiée!', 'تم تعديل الفاتورة!'))
      setDialogOpen(null)
      setSelectedItem(null)
      refetchInvoices()
    } else {
      showToast(result.error || t('Erreur lors de la modification', 'خطأ في التعديل'), 'error')
    }
  }

  // Handle download PDF
  const handleDownloadInvoice = (invoice: Invoice) => {
    const client = clients.find((c: Client) => c.id === invoice.clientId)
    const parsedItems = parseInvoiceItems(invoice.items)
    
    downloadInvoicePDF({
      number: invoice.number,
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      tvaAmount: invoice.tvaAmount,
      total: invoice.total,
      items: parsedItems,
      notes: invoice.notes,
      client: client ? {
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        ice: client.ice,
      } : undefined,
      company: {
        name: settingsData?.companyName,
        ice: settingsData?.companyIce,
        ifNumber: settingsData?.companyIf,
        rcNumber: settingsData?.companyRc,
        address: settingsData?.companyAddress,
        city: settingsData?.companyCity,
        phone: settingsData?.companyPhone,
        email: session?.user?.email,
        bankName: settingsData?.company?.bankName,
        bankRib: settingsData?.company?.bankRib,
      }
    }, 'invoice')
    
    showToast(t('PDF téléchargé!', 'تم تحميل PDF!'))
  }

  // Handle preview PDF
  const handlePreviewInvoice = (invoice: Invoice) => {
    const client = clients.find((c: Client) => c.id === invoice.clientId)
    const parsedItems = parseInvoiceItems(invoice.items)
    
    previewInvoicePDF({
      number: invoice.number,
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      tvaAmount: invoice.tvaAmount,
      total: invoice.total,
      items: parsedItems,
      notes: invoice.notes,
      client: client ? {
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        ice: client.ice,
      } : undefined,
      company: {
        name: settingsData?.companyName,
        ice: settingsData?.companyIce,
        ifNumber: settingsData?.companyIf,
        rcNumber: settingsData?.companyRc,
        address: settingsData?.companyAddress,
        city: settingsData?.companyCity,
        phone: settingsData?.companyPhone,
        email: session?.user?.email,
      }
    }, 'invoice')
  }

  // Open edit invoice dialog
  const openEditInvoiceDialog = (invoice: Invoice) => {
    const parsedItems = parseInvoiceItems(invoice.items)
    setSelectedItem(invoice)
    setNewInvoice({
      clientId: invoice.clientId,
      items: parsedItems.length > 0 ? parsedItems : [{ id: Math.random().toString(36).substring(2, 9), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }],
      dueDate: invoice.dueDate?.split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: invoice.notes || ''
    })
    setDialogOpen('edit-invoice')
  }

  // Payment link handlers
  const handleCreatePaymentLink = async () => {
    if (!newPaymentLink.amount || !newPaymentLink.description) {
      showToast(t('Le montant et la description sont requis', 'المبلغ والوصف مطلوبان'), 'error')
      return
    }

    const result = await paymentLinkApi.create(newPaymentLink)
    if (result.data) {
      showToast(t('Lien créé!', 'تم إنشاء الرابط!'))
      setNewPaymentLink({ amount: 0, description: '', clientEmail: '', clientPhone: '', dueDate: '' })
      setDialogOpen(null)
      refetchPaymentLinks()
    } else {
      showToast(result.error || t('Erreur lors de la création', 'خطأ في الإنشاء'), 'error')
    }
  }

  const handlePaymentLinkAction = async (linkId: string, action: 'copy' | 'whatsapp' | 'delete') => {
    const link = paymentLinks.find((l: PaymentLink) => l.id === linkId)
    if (!link) return

    if (action === 'copy') {
      navigator.clipboard.writeText(`https://epaiement.ma/pay/${link.reference}`)
      showToast(t('Lien copié!', 'تم نسخ الرابط!'))
    } else if (action === 'whatsapp') {
      const text = t(
        `Bonjour, voici votre lien de paiement: https://epaiement.ma/pay/${link.reference} - Montant: ${formatCurrency(link.amount)}`,
        `مرحباً، هذا رابط الدفع الخاص بك: https://epaiement.ma/pay/${link.reference} - المبلغ: ${formatCurrency(link.amount)}`
      )
      window.open(`https://wa.me/${link.clientPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank')
    } else if (action === 'delete') {
      const result = await paymentLinkApi.delete(linkId)
      if (result.data) {
        showToast(t('Lien supprimé', 'تم حذف الرابط'))
        refetchPaymentLinks()
      }
    }
  }

  // Handle settings save
  const handleSaveSettings = async (data: CompanyFormData) => {
    const result = await settingsApi.update({
      companyName: data.name,
      companyIce: data.ice,
      companyIf: data.if,
      companyRc: data.rc,
      companyPatente: data.patente,
      companyCnss: data.cnss,
      companyAddress: data.address,
      companyCity: data.city,
      companyPhone: data.phone,
      autoEntrepreneur: data.autoEntrepreneur,
      defaultTvaRate: data.defaultTvaRate,
      invoicePrefix: data.invoicePrefix,
    })
    
    if (result.data) {
      showToast(t('Paramètres enregistrés!', 'تم حفظ الإعدادات!'))
      refetchSettings()
    } else {
      showToast(result.error || t('Erreur', 'خطأ'), 'error')
    }
  }

  // Handle module group subscription
  const handleSubscribeGroup = async (groupId: string) => {
    const previousGroups = activeGroups
    const newGroups = [...activeGroups, groupId]
    
    // Update locally first for immediate feedback
    setActiveGroups(newGroups)
    const modules = getModulesForGroups(newGroups)
    setUserModules(modules)
    
    // Persist to backend
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe_group', groupId })
      })
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        // Rollback on error
        setActiveGroups(previousGroups)
        setUserModules(getModulesForGroups(previousGroups))
        showToast(result.error || t('Erreur lors de l\'activation', 'خطأ في التفعيل'), 'error')
        return
      }
      
      showToast(t('Groupe activé!', 'تم تفعيل المجموعة!'))
    } catch (e) {
      // Rollback on error
      setActiveGroups(previousGroups)
      setUserModules(getModulesForGroups(previousGroups))
      console.error('Failed to save subscription:', e)
      showToast(t('Erreur de connexion', 'خطأ في الاتصال'), 'error')
    }
  }

  const handleUnsubscribeGroup = async (groupId: string) => {
    if (groupId === 'core') return
    
    const previousGroups = activeGroups
    const newGroups = activeGroups.filter(g => g !== groupId)
    setActiveGroups(newGroups)
    const modules = getModulesForGroups(newGroups)
    setUserModules(modules)
    
    // Persist to backend
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsubscribe_group', groupId })
      })
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        // Rollback on error
        setActiveGroups(previousGroups)
        setUserModules(getModulesForGroups(previousGroups))
        showToast(result.error || t('Erreur lors de la désactivation', 'خطأ في التعطيل'), 'error')
        return
      }
      
      showToast(t('Groupe désactivé', 'تم تعطيل المجموعة'))
    } catch (e) {
      // Rollback on error
      setActiveGroups(previousGroups)
      setUserModules(getModulesForGroups(previousGroups))
      console.error('Failed to save subscription:', e)
      showToast(t('Erreur de connexion', 'خطأ في الاتصال'), 'error')
    }
  }

  const handleSubscribeBundle = async (bundleId: string) => {
    const bundles = [
      { id: 'starter', groups: ['core'] },
      { id: 'business', groups: ['core', 'sales', 'accounting'] },
      { id: 'professional', groups: ['core', 'sales', 'accounting', 'crm', 'integrations'] },
      { id: 'enterprise', groups: ['core', 'sales', 'accounting', 'crm', 'stock', 'team', 'integrations', 'ai'] },
    ]
    const bundle = bundles.find(b => b.id === bundleId)
    if (!bundle) return
    
    const previousGroups = activeGroups
    setActiveGroups(bundle.groups)
    const modules = getModulesForGroups(bundle.groups)
    setUserModules(modules)
    
    // Persist to backend
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe_bundle', bundleId })
      })
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        // Rollback on error
        setActiveGroups(previousGroups)
        setUserModules(getModulesForGroups(previousGroups))
        showToast(result.error || t('Erreur lors de l\'activation', 'خطأ في التفعيل'), 'error')
        return
      }
      
      showToast(t('Forfait activé!', 'تم تفعيل الباقة!'))
    } catch (e) {
      // Rollback on error
      setActiveGroups(previousGroups)
      setUserModules(getModulesForGroups(previousGroups))
      console.error('Failed to save subscription:', e)
      showToast(t('Erreur de connexion', 'خطأ في الاتصال'), 'error')
    }
  }

  // Logout handler
  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse">
            E
          </div>
          <p className="text-gray-500">{t('Chargement...', 'جاري التحميل...')}</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <ToastContainer language={language} />
      
      {/* Sidebar */}
      <Sidebar
        userModules={userModules}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={handleLogout}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen lg:min-h-screen">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <Header
            user={{ 
              id: session?.user?.id || '', 
              name: session?.user?.name || 'Utilisateur', 
              email: session?.user?.email || '',
              company: settingsData?.companyName 
            }}
            language={language}
            onLanguageChange={setLanguage}
            onLogout={handleLogout}
          />
        </div>
        
        {/* Main content with proper mobile padding */}
        <div className="flex-1 p-4 lg:p-6 pt-20 lg:pt-6 pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentPage === 'dashboard' && t('Tableau de bord', 'لوحة التحكم')}
                  {currentPage === 'invoices' && t('Factures', 'الفواتير')}
                  {currentPage === 'payment-links' && t('Liens de paiement', 'روابط الدفع')}
                  {currentPage === 'clients' && t('Clients', 'العملاء')}
                  {currentPage === 'modules' && t('Modules', 'الوحدات')}
                  {currentPage === 'settings' && t('Paramètres', 'الإعدادات')}
                  {/* CRM */}
                  {currentPage === 'leads' && t('Prospects', 'العملاء المحتملين')}
                  {currentPage === 'tasks' && t('Tâches', 'المهام')}
                  {/* Sales */}
                  {currentPage === 'suppliers' && t('Fournisseurs', 'الموردين')}
                  {currentPage === 'quotes' && t('Devis', 'العروض')}
                  {/* Accounting */}
                  {currentPage === 'expenses' && t('Dépenses', 'المصروفات')}
                  {currentPage === 'credit-notes' && t('Avoirs', 'إشعارات دائنة')}
                  {currentPage === 'reports' && t('Rapports', 'التقارير')}
                  {/* Stock */}
                  {currentPage === 'products' && t('Produits', 'المنتجات')}
                  {currentPage === 'inventory' && t('Inventaire', 'المخزون')}
                  {/* Team */}
                  {currentPage === 'team' && t('Équipe', 'الفريق')}
                  {/* Integrations */}
                  {currentPage === 'api-keys' && t('Clés API', 'مفاتيح API')}
                  {currentPage === 'gateways' && t('Passerelles de paiement', 'بوابات الدفع')}
                  {/* Audit */}
                  {currentPage === 'audit' && t('Audit', 'التدقيق')}
                  {/* AI */}
                  {currentPage === 'ai-lead-qualifier' && t('AI Lead Qualifier', 'مؤهل العملاء AI')}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  {new Date().toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder={t('Rechercher...', 'بحث...')} 
                    className="pl-9" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                  />
                </div>
                {['invoices', 'clients', 'payment-links', 'leads', 'tasks', 'suppliers', 'quotes', 'expenses', 'credit-notes', 'products', 'team', 'api-keys'].includes(currentPage) && (
                  <Button onClick={() => setDialogOpen(`new-${currentPage}`)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /><span className="hidden sm:inline">{t('Nouveau', 'جديد')}</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* ==================== DASHBOARD ==================== */}
            {currentPage === 'dashboard' && (
              <div className="space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{t('Revenus', 'الإيرادات')}</p>
                          <p className="text-xl font-bold text-emerald-600">{formatCurrency(metrics.totalRevenue)}</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{t('En attente', 'معلقة')}</p>
                          <p className="text-xl font-bold text-amber-600">{formatCurrency(metrics.pendingAmount)}</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{t('Dépenses', 'المصاريف')}</p>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</p>
                        </div>
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{t('Clients', 'العملاء')}</p>
                          <p className="text-xl font-bold text-blue-600">{metrics.activeClients}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('Actions rapides', 'إجراءات سريعة')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {[
                        { label: t('Créer une facture', 'إنشاء فاتورة'), icon: FileText, action: () => setDialogOpen('new-invoices') },
                        { label: t('Créer un lien', 'إنشاء رابط'), icon: Link2, action: () => setDialogOpen('new-payment-links') },
                        { label: t('Ajouter un client', 'إضافة عميل'), icon: Users, action: () => setDialogOpen('new-clients') },
                        { label: t('Modules', 'الوحدات'), icon: Sparkles, action: () => setCurrentPage('modules') },
                      ].map((action, i) => (
                        <button 
                          key={i} 
                          onClick={action.action} 
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                        >
                          <action.icon className="w-8 h-8 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* TVA Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('Résumé TVA', 'ملخص ضريبة القيمة المضافة')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('TVA Collectée', 'ضريبة القيمة المضافة المحصلة')}</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(metrics.tvaCollected)}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('TVA Déductible', 'ضريبة القيمة المضافة القابلة للخصم')}</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.tvaDeductible)}</p>
                      </div>
                      <div className={`p-4 rounded-lg ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                        <p className="text-sm text-gray-500">{t('TVA à payer', 'ضريبة القيمة المضافة المستحقة')}</p>
                        <p className={`text-xl font-bold ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(metrics.tvaCollected - metrics.tvaDeductible))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== INVOICES ==================== */}
            {currentPage === 'invoices' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {invoicesLoading ? (
                        <div className="text-center py-16">
                          <p className="text-gray-500">{t('Chargement...', 'جاري التحميل...')}</p>
                        </div>
                      ) : invoices.length === 0 ? (
                        <div className="text-center py-16">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucune facture', 'لا توجد فواتير')}</p>
                          <Button onClick={() => setDialogOpen('new-invoices')} className="bg-blue-600">
                            {t('Créer une facture', 'إنشاء فاتورة')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {invoices.map((invoice: Invoice) => (
                            <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{invoice.number}</p>
                                  <p className="text-sm text-gray-500">
                                    {invoice.client?.name || t('Client inconnu', 'عميل غير معروف')} • {formatDate(invoice.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                                  <Badge variant={
                                    invoice.status === 'paid' ? 'default' : 
                                    invoice.status === 'overdue' ? 'destructive' : 
                                    invoice.status === 'sent' ? 'secondary' : 'outline'
                                  }>
                                    {invoice.status === 'paid' ? t('Payée', 'مدفوعة') : 
                                     invoice.status === 'overdue' ? t('En retard', 'متأخرة') : 
                                     invoice.status === 'sent' ? t('Envoyée', 'مرسلة') : t('Brouillon', 'مسودة')}
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  {/* View/Preview PDF */}
                                  <Button variant="ghost" size="icon" onClick={() => handlePreviewInvoice(invoice)} title={t('Aperçu PDF', 'معاينة PDF')}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {/* Download PDF */}
                                  <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice)} title={t('Télécharger PDF', 'تحميل PDF')}>
                                    <Download className="w-4 h-4" />
                                  </Button>
                                  {/* Edit - only for drafts */}
                                  {invoice.status === 'draft' && (
                                    <Button variant="ghost" size="icon" onClick={() => openEditInvoiceDialog(invoice)} title={t('Modifier', 'تعديل')}>
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {/* Send - only for drafts */}
                                  {invoice.status === 'draft' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleInvoiceAction(invoice.id, 'send')} title={t('Envoyer', 'إرسال')}>
                                      <Send className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {/* Mark paid - only for sent */}
                                  {invoice.status === 'sent' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleInvoiceAction(invoice.id, 'mark_paid')} title={t('Marquer payée', 'تحديد كمدفوعة')}>
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {/* Delete - only for drafts */}
                                  {invoice.status === 'draft' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleInvoiceAction(invoice.id, 'delete')} title={t('Supprimer', 'حذف')}>
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== PAYMENT LINKS ==================== */}
            {currentPage === 'payment-links' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {paymentLinksLoading ? (
                        <div className="text-center py-16">
                          <p className="text-gray-500">{t('Chargement...', 'جاري التحميل...')}</p>
                        </div>
                      ) : paymentLinks.length === 0 ? (
                        <div className="text-center py-16">
                          <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucun lien de paiement', 'لا توجد روابط دفع')}</p>
                          <Button onClick={() => setDialogOpen('new-payment-links')} className="bg-purple-600">
                            {t('Créer un lien', 'إنشاء رابط')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {paymentLinks.map((link: PaymentLink) => (
                            <div key={link.id} className="p-4 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Link2 className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{link.description}</p>
                                    <p className="text-sm text-gray-500">{link.reference} • {formatDate(link.createdAt)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(link.amount)}</p>
                                    <Badge variant={link.status === 'paid' ? 'default' : link.status === 'expired' ? 'destructive' : 'secondary'}>
                                      {link.status === 'paid' ? t('Payée', 'مدفوعة') : link.status === 'expired' ? t('Expiré', 'منتهي') : t('En attente', 'قيد الانتظار')}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handlePaymentLinkAction(link.id, 'copy')}>
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handlePaymentLinkAction(link.id, 'whatsapp')}>
                                      <Send className="w-4 h-4 text-green-600" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== CLIENTS ==================== */}
            {currentPage === 'clients' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {clientsLoading ? (
                        <div className="text-center py-16">
                          <p className="text-gray-500">{t('Chargement...', 'جاري التحميل...')}</p>
                        </div>
                      ) : clients.length === 0 ? (
                        <div className="text-center py-16">
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucun client', 'لا يوجد عملاء')}</p>
                          <Button onClick={() => setDialogOpen('new-clients')} className="bg-blue-600">
                            {t('Ajouter un client', 'إضافة عميل')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {clients.map((client: Client) => (
                            <div key={client.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {client.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{client.name}</p>
                                  <p className="text-sm text-gray-500">{client.email} {client.ice && `• ICE: ${client.ice}`}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== MODULES ==================== */}
            {currentPage === 'modules' && (
              <ModuleGroupPricing
                language={language}
                subscribedGroups={activeGroups}
                onSubscribeGroup={handleSubscribeGroup}
                onUnsubscribeGroup={handleUnsubscribeGroup}
                onSubscribeBundle={handleSubscribeBundle}
              />
            )}

            {/* ==================== SETTINGS ==================== */}
            {currentPage === 'settings' && (
              <CompanyForm
                initialData={settingsFormData}
                language={language}
                onSave={handleSaveSettings}
              />
            )}

            {/* ==================== LEADS (CRM) ==================== */}
            {currentPage === 'leads' && (
              <div className="space-y-4">
                {/* Pipeline Kanban View */}
                <div className="grid grid-cols-5 gap-4">
                  {['new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
                    <Card key={status} className="bg-gray-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          {status === 'new' && t('Nouveau', 'جديد')}
                          {status === 'contacted' && t('Contacté', 'تم التواصل')}
                          {status === 'qualified' && t('Qualifié', 'مؤهل')}
                          {status === 'converted' && t('Converti', 'محول')}
                          {status === 'lost' && t('Perdu', 'مفقود')}
                          <Badge variant="secondary" className="ml-2">
                            {leads.filter(l => l.status === status).length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                        {leads.filter(l => l.status === status).map((lead) => (
                          <div key={lead.id} className="bg-white p-3 rounded-lg border shadow-sm">
                            <p className="font-medium text-sm">{lead.name}</p>
                            <p className="text-xs text-gray-500">{lead.company}</p>
                            <p className="text-xs text-gray-400 mt-1">{lead.email}</p>
                          </div>
                        ))}
                        {leads.filter(l => l.status === status).length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-4">{t('Aucun prospect', 'لا يوجد عملاء محتملين')}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {leads.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-16">
                      <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">{t('Aucun prospect enregistré', 'لا يوجد عملاء محتملين مسجلين')}</p>
                      <Button onClick={() => setDialogOpen('new-leads')} className="bg-violet-600">
                        {t('Ajouter un prospect', 'إضافة عميل محتمل')}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ==================== TASKS (CRM) ==================== */}
            {currentPage === 'tasks' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {tasks.length === 0 ? (
                        <div className="text-center py-16">
                          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucune tâche', 'لا توجد مهام')}</p>
                          <Button onClick={() => setDialogOpen('new-tasks')} className="bg-violet-600">
                            {t('Ajouter une tâche', 'إضافة مهمة')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${
                                  task.priority === 'high' ? 'bg-red-500' : 
                                  task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                                }`} />
                                <div>
                                  <p className="font-medium">{task.title}</p>
                                  <p className="text-sm text-gray-500">{task.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-500">{task.dueDate ? formatDate(task.dueDate) : ''}</p>
                                <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                                  {task.status === 'completed' ? t('Terminé', 'مكتمل') : t('En cours', 'قيد التنفيذ')}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== SUPPLIERS (Sales) ==================== */}
            {currentPage === 'suppliers' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {suppliers.length === 0 ? (
                        <div className="text-center py-16">
                          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucun fournisseur', 'لا يوجد موردين')}</p>
                          <Button onClick={() => setDialogOpen('new-suppliers')} className="bg-emerald-600">
                            {t('Ajouter un fournisseur', 'إضافة مورد')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {suppliers.map((supplier) => (
                            <div key={supplier.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                  <Truck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{supplier.name}</p>
                                  <p className="text-sm text-gray-500">{supplier.email} {supplier.ice && `• ICE: ${supplier.ice}`}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== QUOTES (Sales) ==================== */}
            {currentPage === 'quotes' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {quotes.length === 0 ? (
                        <div className="text-center py-16">
                          <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucun devis', 'لا توجد عروض')}</p>
                          <Button onClick={() => setDialogOpen('new-quotes')} className="bg-emerald-600">
                            {t('Créer un devis', 'إنشاء عرض')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {quotes.map((quote) => (
                            <div key={quote.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                  <FileCheck className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{quote.number}</p>
                                  <p className="text-sm text-gray-500">{quote.client?.name || t('Client inconnu', 'عميل غير معروف')} • {formatDate(quote.createdAt)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(quote.total)}</p>
                                  <Badge variant={quote.status === 'accepted' ? 'default' : quote.status === 'rejected' ? 'destructive' : 'secondary'}>
                                    {quote.status === 'accepted' ? t('Accepté', 'مقبول') : quote.status === 'rejected' ? t('Refusé', 'مرفوض') : t('En attente', 'قيد الانتظار')}
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" title={t('Convertir en facture', 'تحويل لفاتورة')}><FileText className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== EXPENSES (Accounting) ==================== */}
            {currentPage === 'expenses' && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">{t('Total Dépenses', 'إجمالي المصروفات')}</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">{t('TVA Déductible', 'الضريبة القابلة للخصم')}</p>
                      <p className="text-2xl font-bold text-amber-600">{formatCurrency(expenses.reduce((s, e) => s + (e.amount * e.tvaRate / 100), 0))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-500">{t('Ce mois', 'هذا الشهر')}</p>
                      <p className="text-2xl font-bold text-gray-600">{formatCurrency(expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((s, e) => s + e.amount, 0))}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-420px)]">
                      {expenses.length === 0 ? (
                        <div className="text-center py-16">
                          <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucune dépense', 'لا توجد مصروفات')}</p>
                          <Button onClick={() => setDialogOpen('new-expenses')} className="bg-amber-600">
                            {t('Ajouter une dépense', 'إضافة مصروف')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {expenses.map((expense) => (
                            <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                  <Receipt className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{expense.description}</p>
                                  <p className="text-sm text-gray-500">{expense.category} • {expense.supplier} • {formatDate(expense.date)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                                  {expense.tvaRate > 0 && <p className="text-xs text-gray-500">TVA {expense.tvaRate}%</p>}
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== CREDIT NOTES (Accounting) ==================== */}
            {currentPage === 'credit-notes' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {creditNotes.length === 0 ? (
                        <div className="text-center py-16">
                          <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucun avoir', 'لا توجد إشعارات دائنة')}</p>
                          <Button onClick={() => setDialogOpen('new-credit-notes')} className="bg-amber-600">
                            {t('Créer un avoir', 'إنشاء إشعار دائن')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {creditNotes.map((cn) => (
                            <div key={cn.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                  <ArrowLeftRight className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{cn.number}</p>
                                  <p className="text-sm text-gray-500">{t('Facture', 'فاتورة')}: {cn.invoiceId} • {cn.reason}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(cn.amount)}</p>
                                  <Badge variant={cn.status === 'applied' ? 'default' : 'secondary'}>
                                    {cn.status === 'applied' ? t('Appliqué', 'تم التطبيق') : t('En attente', 'قيد الانتظار')}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== REPORTS (Accounting) ==================== */}
            {currentPage === 'reports' && (
              <div className="space-y-4">
                {/* Report Types */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="cursor-pointer hover:border-amber-300 transition-colors">
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="w-10 h-10 text-amber-600 mx-auto mb-3" />
                      <p className="font-medium">{t('Rapport TVA', 'تقرير الضريبة')}</p>
                      <p className="text-sm text-gray-500">{t('Déclaration mensuelle', 'الإقرار الشهري')}</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-amber-300 transition-colors">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                      <p className="font-medium">{t('Rapport Revenus', 'تقرير الإيرادات')}</p>
                      <p className="text-sm text-gray-500">{t('Par période', 'حسب الفترة')}</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-amber-300 transition-colors">
                    <CardContent className="p-6 text-center">
                      <Wallet className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                      <p className="font-medium">{t('Flux de Trésorerie', 'التدفقات النقدية')}</p>
                      <p className="text-sm text-gray-500">{t('Entrées/Sorties', 'المدخلات/المخرجات')}</p>
                    </CardContent>
                  </Card>
                  <Card className="cursor-pointer hover:border-amber-300 transition-colors">
                    <CardContent className="p-6 text-center">
                      <FileText className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                      <p className="font-medium">{t('Grand Livre', 'دفتر الأستاذ')}</p>
                      <p className="text-sm text-gray-500">{t('Toutes les écritures', 'جميع القيود')}</p>
                    </CardContent>
                  </Card>
                </div>
                {/* TVA Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Résumé TVA', 'ملخص الضريبة')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('TVA Collectée', 'الضريبة المحصلة')}</p>
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.tvaCollected)}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('TVA Déductible', 'الضريبة القابلة للخصم')}</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.tvaDeductible)}</p>
                      </div>
                      <div className={`p-4 rounded-lg ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                        <p className="text-sm text-gray-500">{t('TVA à payer', 'الضريبة المستحقة')}</p>
                        <p className={`text-2xl font-bold ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(Math.abs(metrics.tvaCollected - metrics.tvaDeductible))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== PRODUCTS (Stock) ==================== */}
            {currentPage === 'products' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {products.length === 0 ? (
                        <div className="text-center py-16">
                          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucun produit', 'لا توجد منتجات')}</p>
                          <Button onClick={() => setDialogOpen('new-products')} className="bg-red-600">
                            {t('Ajouter un produit', 'إضافة منتج')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {products.map((product) => (
                            <div key={product.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <Package className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{product.name}</p>
                                  <p className="text-sm text-gray-500">SKU: {product.sku} • {product.category}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(product.price)}</p>
                                  <p className="text-xs text-gray-500">{t('Stock', 'المخزون')}: {product.stock}</p>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== INVENTORY (Stock) ==================== */}
            {currentPage === 'inventory' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t('Gestion des Stocks', 'إدارة المخزون')}</h3>
                    <p className="text-gray-500 mb-4">{t('Fonctionnalité en cours de développement', 'الميزة قيد التطوير')}</p>
                    <Badge variant="secondary">{t('Bientôt disponible', 'قريباً')}</Badge>
                  </CardContent>
                </Card>
                {/* Stock Alerts Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      {t('Alertes Stock', 'تنبيهات المخزون')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {products.filter(p => p.stock < 10).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                          <span className="font-medium">{product.name}</span>
                          <Badge variant="destructive">{t('Stock bas', 'مخزون منخفض')}: {product.stock}</Badge>
                        </div>
                      ))}
                      {products.filter(p => p.stock < 10).length === 0 && (
                        <p className="text-gray-500 text-center py-4">{t('Aucune alerte', 'لا توجد تنبيهات')}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== TEAM (Team) ==================== */}
            {currentPage === 'team' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {teamMembers.length === 0 ? (
                        <div className="text-center py-16">
                          <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucun membre', 'لا يوجد أعضاء')}</p>
                          <Button onClick={() => setDialogOpen('new-team')} className="bg-cyan-600">
                            {t('Inviter un membre', 'دعوة عضو')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {teamMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-cyan-600">
                                    {member.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-sm text-gray-500">{member.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                                  {member.role === 'admin' ? t('Admin', 'مدير') : member.role === 'accountant' ? t('Comptable', 'محاسب') : t('Lecteur', 'قارئ')}
                                </Badge>
                                <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                                  {member.status === 'active' ? t('Actif', 'نشط') : t('En attente', 'قيد الانتظار')}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== API KEYS (Integrations) ==================== */}
            {currentPage === 'api-keys' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {apiKeys.length === 0 ? (
                        <div className="text-center py-16">
                          <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{t('Aucune clé API', 'لا توجد مفاتيح API')}</p>
                          <Button onClick={() => setDialogOpen('new-api-keys')} className="bg-pink-600">
                            {t('Générer une clé', 'إنشاء مفتاح')}
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {apiKeys.map((key) => (
                            <div key={key.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                  <Key className="w-5 h-5 text-pink-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{key.name}</p>
                                  <p className="text-sm text-gray-500 font-mono">{key.key?.substring(0, 20)}...</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant={key.permissions === 'write' ? 'default' : 'secondary'}>
                                  {key.permissions === 'write' ? t('Lecture/Écriture', 'قراءة/كتابة') : t('Lecture seule', 'قراءة فقط')}
                                </Badge>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(key.key)}>
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== GATEWAYS (Integrations) ==================== */}
            {currentPage === 'gateways' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CMI */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="w-5 h-5" />
                        CMI
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-500">{t('Centre Monétique Interbancaire', 'المركز النقدي البيني')}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t('Non configuré', 'غير مكون')}</Badge>
                      </div>
                      <Button variant="outline" className="w-full">{t('Configurer', 'إعداد')}</Button>
                    </CardContent>
                  </Card>
                  {/* Fatourati */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="w-5 h-5" />
                        Fatourati
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-500">{t('CDG Group - Paiement en ligne', 'مجموعة صندوق الإيداع والتدبير')}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t('Non configuré', 'غير مكون')}</Badge>
                      </div>
                      <Button variant="outline" className="w-full">{t('Configurer', 'إعداد')}</Button>
                    </CardContent>
                  </Card>
                  {/* CIH Pay */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="w-5 h-5" />
                        CIH Pay
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-500">{t('CIH Bank - Paiement mobile', 'البنك المغربي للتجارة الخارجية')}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t('Non configuré', 'غير مكون')}</Badge>
                      </div>
                      <Button variant="outline" className="w-full">{t('Configurer', 'إعداد')}</Button>
                    </CardContent>
                  </Card>
                </div>
                {/* Webhooks */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Webhooks', 'الخطاطات')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">{t('URLs de callback pour les événements de paiement', 'عناوين URL للاستدعاء لأحداث الدفع')}</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">https://api.epaiement.ma/webhooks/payment</span>
                        <Badge variant="secondary">{t('Actif', 'نشط')}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== AUDIT ==================== */}
            {currentPage === 'audit' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {auditLogs.length === 0 ? (
                        <div className="text-center py-16">
                          <FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-2">{t('Journal d\'audit vide', 'سجل التدقيق فارغ')}</p>
                          <p className="text-sm text-gray-400">{t('Les actions seront enregistrées automatiquement', 'سيتم تسجيل الإجراءات تلقائياً')}</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {auditLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <FileSearch className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                  <p className="font-medium">{log.action}</p>
                                  <p className="text-sm text-gray-500">{log.user} • {log.resource}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                                <p className="text-xs text-gray-400">{log.ip}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ==================== AI LEAD QUALIFIER ==================== */}
            {currentPage === 'ai-lead-qualifier' && (
              <AILeadQualifierDashboard language={language} />
            )}
          </div>
        </div>
      </main>

      {/* ==================== DIALOGS ==================== */}
      
      {/* New Client Dialog */}
      <Dialog open={dialogOpen === 'new-clients'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Ajouter un client', 'إضافة عميل')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Nom *', 'الاسم *')}</Label>
              <Input value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Email *', 'البريد الإلكتروني *')}</Label>
              <Input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('ICE', 'ICE')}</Label>
                <Input value={newClient.ice} onChange={e => setNewClient({...newClient, ice: e.target.value})} maxLength={15} />
              </div>
              <div className="space-y-2">
                <Label>{t('Téléphone', 'الهاتف')}</Label>
                <Input value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('Adresse', 'العنوان')}</Label>
              <Input value={newClient.address} onChange={e => setNewClient({...newClient, address: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Ville', 'المدينة')}</Label>
              <Input value={newClient.city} onChange={e => setNewClient({...newClient, city: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={handleCreateClient} className="bg-blue-600">{t('Créer', 'إنشاء')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Invoice Dialog */}
      <Dialog open={dialogOpen === 'new-invoices'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('Créer une facture', 'إنشاء فاتورة')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Client', 'العميل')}</Label>
              <Select value={newInvoice.clientId} onValueChange={v => setNewInvoice({...newInvoice, clientId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Sélectionner un client', 'اختر عميلاً')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: Client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('Articles', 'العناصر')}</Label>
              {newInvoice.items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Input 
                      placeholder={t('Description', 'الوصف')} 
                      value={item.description} 
                      onChange={e => {
                        const items = [...newInvoice.items]
                        items[idx].description = e.target.value
                        setNewInvoice({...newInvoice, items})
                      }} 
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      placeholder="Qté" 
                      value={item.quantity} 
                      onChange={e => {
                        const items = [...newInvoice.items]
                        items[idx].quantity = parseInt(e.target.value) || 0
                        setNewInvoice({...newInvoice, items})
                      }} 
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      placeholder="Prix" 
                      value={item.unitPrice} 
                      onChange={e => {
                        const items = [...newInvoice.items]
                        items[idx].unitPrice = parseFloat(e.target.value) || 0
                        setNewInvoice({...newInvoice, items})
                      }} 
                    />
                  </div>
                  <div className="col-span-2">
                    <Select 
                      value={String(item.tvaRate)} 
                      onValueChange={v => {
                        const items = [...newInvoice.items]
                        items[idx].tvaRate = parseInt(v)
                        setNewInvoice({...newInvoice, items})
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TVA_RATES.map(rate => (
                          <SelectItem key={rate.value} value={String(rate.value)}>{rate.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        if (newInvoice.items.length > 1) {
                          setNewInvoice({...newInvoice, items: newInvoice.items.filter((_, i) => i !== idx)})
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setNewInvoice({
                  ...newInvoice, 
                  items: [...newInvoice.items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }]
                })}
              >
                <Plus className="w-4 h-4 mr-2" /> {t('Ajouter une ligne', 'إضافة سطر')}
              </Button>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('Sous-total', 'المجموع الفرعي')}:</span>
                <span>{formatCurrency(newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('TVA', 'ضريبة القيمة المضافة')}:</span>
                <span>{formatCurrency(newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.tvaRate / 100), 0))}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{t('Total', 'المجموع')}:</span>
                <span>{formatCurrency(
                  newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0) +
                  newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.tvaRate / 100), 0)
                )}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Date d\'échéance', 'تاريخ الاستحقاق')}</Label>
                <Input 
                  type="date" 
                  value={newInvoice.dueDate} 
                  onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('Notes', 'ملاحظات')}</Label>
              <Textarea 
                value={newInvoice.notes} 
                onChange={e => setNewInvoice({...newInvoice, notes: e.target.value})} 
                placeholder={t('Notes visibles sur la facture', 'ملاحظات مرئية على الفاتورة')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={handleCreateInvoice} className="bg-blue-600">{t('Créer', 'إنشاء')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={dialogOpen === 'edit-invoice'} onOpenChange={() => { setDialogOpen(null); setSelectedItem(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('Modifier la facture', 'تعديل الفاتورة')} - {selectedItem?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Client', 'العميل')}</Label>
              <Select value={newInvoice.clientId} onValueChange={v => setNewInvoice({...newInvoice, clientId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder={t('Sélectionner un client', 'اختر عميلاً')} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: Client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{t('Articles', 'العناصر')}</Label>
              {newInvoice.items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Input 
                      placeholder={t('Description', 'الوصف')} 
                      value={item.description} 
                      onChange={e => {
                        const items = [...newInvoice.items]
                        items[idx].description = e.target.value
                        setNewInvoice({...newInvoice, items})
                      }} 
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      placeholder="Qté" 
                      value={item.quantity} 
                      onChange={e => {
                        const items = [...newInvoice.items]
                        items[idx].quantity = parseInt(e.target.value) || 0
                        setNewInvoice({...newInvoice, items})
                      }} 
                    />
                  </div>
                  <div className="col-span-2">
                    <Input 
                      type="number" 
                      placeholder="Prix" 
                      value={item.unitPrice} 
                      onChange={e => {
                        const items = [...newInvoice.items]
                        items[idx].unitPrice = parseFloat(e.target.value) || 0
                        setNewInvoice({...newInvoice, items})
                      }} 
                    />
                  </div>
                  <div className="col-span-2">
                    <Select 
                      value={String(item.tvaRate)} 
                      onValueChange={v => {
                        const items = [...newInvoice.items]
                        items[idx].tvaRate = parseInt(v)
                        setNewInvoice({...newInvoice, items})
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TVA_RATES.map(rate => (
                          <SelectItem key={rate.value} value={String(rate.value)}>{rate.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        if (newInvoice.items.length > 1) {
                          setNewInvoice({...newInvoice, items: newInvoice.items.filter((_, i) => i !== idx)})
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setNewInvoice({
                  ...newInvoice, 
                  items: [...newInvoice.items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }]
                })}
              >
                <Plus className="w-4 h-4 mr-2" /> {t('Ajouter une ligne', 'إضافة سطر')}
              </Button>
            </div>

            {/* Totals */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('Sous-total', 'المجموع الفرعي')}:</span>
                <span>{formatCurrency(newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t('TVA', 'ضريبة القيمة المضافة')}:</span>
                <span>{formatCurrency(newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.tvaRate / 100), 0))}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{t('Total', 'المجموع')}:</span>
                <span>{formatCurrency(
                  newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0) +
                  newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.tvaRate / 100), 0)
                )}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Date d\'échéance', 'تاريخ الاستحقاق')}</Label>
                <Input 
                  type="date" 
                  value={newInvoice.dueDate} 
                  onChange={e => setNewInvoice({...newInvoice, dueDate: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('Notes', 'ملاحظات')}</Label>
              <Textarea 
                value={newInvoice.notes} 
                onChange={e => setNewInvoice({...newInvoice, notes: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(null); setSelectedItem(null); }}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={handleEditInvoice} className="bg-blue-600">{t('Enregistrer', 'حفظ')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Payment Link Dialog */}
      <Dialog open={dialogOpen === 'new-payment-links'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Créer un lien de paiement', 'إنشاء رابط دفع')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Montant (MAD) *', 'المبلغ (درهم) *')}</Label>
              <Input 
                type="number" 
                value={newPaymentLink.amount || ''} 
                onChange={e => setNewPaymentLink({...newPaymentLink, amount: parseFloat(e.target.value) || 0})} 
              />
            </div>
            <div className="space-y-2">
              <Label>{t('Description *', 'الوصف *')}</Label>
              <Textarea 
                value={newPaymentLink.description} 
                onChange={e => setNewPaymentLink({...newPaymentLink, description: e.target.value})} 
                placeholder={t('Ex: Facture #123', 'مثال: فاتورة #123')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Email client', 'بريد العميل')}</Label>
                <Input 
                  type="email" 
                  value={newPaymentLink.clientEmail} 
                  onChange={e => setNewPaymentLink({...newPaymentLink, clientEmail: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>{t('Téléphone client', 'هاتف العميل')}</Label>
                <Input 
                  value={newPaymentLink.clientPhone} 
                  onChange={e => setNewPaymentLink({...newPaymentLink, clientPhone: e.target.value})} 
                  placeholder="+212 6XX XX XX XX"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('Date d\'expiration', 'تاريخ الانتهاء')}</Label>
              <Input 
                type="date" 
                value={newPaymentLink.dueDate} 
                onChange={e => setNewPaymentLink({...newPaymentLink, dueDate: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={handleCreatePaymentLink} className="bg-purple-600">{t('Créer', 'إنشاء')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== NEW MODULE DIALOGS ==================== */}

      {/* New Lead Dialog */}
      <Dialog open={dialogOpen === 'new-leads'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Ajouter un prospect', 'إضافة عميل محتمل')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Nom *', 'الاسم *')}</Label>
              <Input value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Email', 'البريد الإلكتروني')}</Label>
                <Input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('Téléphone', 'الهاتف')}</Label>
                <Input value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Entreprise', 'الشركة')}</Label>
                <Input value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('Source', 'المصدر')}</Label>
                <Select value={newLead.source} onValueChange={v => setNewLead({...newLead, source: v})}>
                  <SelectTrigger><SelectValue placeholder={t('Sélectionner', 'اختر')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">{t('Site web', 'الموقع')}</SelectItem>
                    <SelectItem value="referral">{t('Référence', 'إحالة')}</SelectItem>
                    <SelectItem value="social">{t('Réseaux sociaux', 'وسائل التواصل')}</SelectItem>
                    <SelectItem value="other">{t('Autre', 'أخرى')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={() => { 
              setLeads([...leads, { ...newLead, id: generateId(), createdAt: new Date().toISOString() }]);
              setNewLead({ name: '', email: '', phone: '', company: '', status: 'new', source: '' });
              setDialogOpen(null);
              showToast(t('Prospect ajouté!', 'تم إضافة العميل المحتمل!'));
            }} className="bg-violet-600">{t('Ajouter', 'إضافة')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Task Dialog */}
      <Dialog open={dialogOpen === 'new-tasks'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Ajouter une tâche', 'إضافة مهمة')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Titre *', 'العنوان *')}</Label>
              <Input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Description', 'الوصف')}</Label>
              <Textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Priorité', 'الأولوية')}</Label>
                <Select value={newTask.priority} onValueChange={v => setNewTask({...newTask, priority: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">{t('Haute', 'عالية')}</SelectItem>
                    <SelectItem value="medium">{t('Moyenne', 'متوسطة')}</SelectItem>
                    <SelectItem value="low">{t('Basse', 'منخفضة')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Date d\'échéance', 'تاريخ الاستحقاق')}</Label>
                <Input type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={() => { 
              setTasks([...tasks, { ...newTask, id: generateId(), status: 'pending', createdAt: new Date().toISOString() }]);
              setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' });
              setDialogOpen(null);
              showToast(t('Tâche ajoutée!', 'تم إضافة المهمة!'));
            }} className="bg-violet-600">{t('Ajouter', 'إضافة')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Supplier Dialog */}
      <Dialog open={dialogOpen === 'new-suppliers'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Ajouter un fournisseur', 'إضافة مورد')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Nom *', 'الاسم *')}</Label>
              <Input value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Email', 'البريد الإلكتروني')}</Label>
                <Input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('Téléphone', 'الهاتف')}</Label>
                <Input value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('ICE', 'ICE')}</Label>
                <Input value={newSupplier.ice} onChange={e => setNewSupplier({...newSupplier, ice: e.target.value})} maxLength={15} />
              </div>
              <div className="space-y-2">
                <Label>{t('Ville', 'المدينة')}</Label>
                <Input value={newSupplier.city} onChange={e => setNewSupplier({...newSupplier, city: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('Adresse', 'العنوان')}</Label>
              <Input value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={() => { 
              setSuppliers([...suppliers, { ...newSupplier, id: generateId(), createdAt: new Date().toISOString() }]);
              setNewSupplier({ name: '', email: '', phone: '', ice: '', address: '', city: '' });
              setDialogOpen(null);
              showToast(t('Fournisseur ajouté!', 'تم إضافة المورد!'));
            }} className="bg-emerald-600">{t('Ajouter', 'إضافة')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Quote Dialog */}
      <Dialog open={dialogOpen === 'new-quotes'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Créer un devis', 'إنشاء عرض')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Client', 'العميل')}</Label>
              <Select value={newQuote.clientId} onValueChange={v => setNewQuote({...newQuote, clientId: v})}>
                <SelectTrigger><SelectValue placeholder={t('Sélectionner un client', 'اختر عميلاً')} /></SelectTrigger>
                <SelectContent>
                  {clients.map((client: Client) => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Articles', 'العناصر')}</Label>
              {newQuote.items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Input placeholder={t('Description', 'الوصف')} value={item.description} onChange={e => {
                      const items = [...newQuote.items]; items[idx].description = e.target.value;
                      setNewQuote({...newQuote, items});
                    }} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="Qté" value={item.quantity} onChange={e => {
                      const items = [...newQuote.items]; items[idx].quantity = parseInt(e.target.value) || 0;
                      setNewQuote({...newQuote, items});
                    }} />
                  </div>
                  <div className="col-span-2">
                    <Input type="number" placeholder="Prix" value={item.unitPrice} onChange={e => {
                      const items = [...newQuote.items]; items[idx].unitPrice = parseFloat(e.target.value) || 0;
                      setNewQuote({...newQuote, items});
                    }} />
                  </div>
                  <div className="col-span-2">
                    <Select value={String(item.tvaRate)} onValueChange={v => {
                      const items = [...newQuote.items]; items[idx].tvaRate = parseInt(v);
                      setNewQuote({...newQuote, items});
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TVA_RATES.map(rate => <SelectItem key={rate.value} value={String(rate.value)}>{rate.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => {
                      if (newQuote.items.length > 1) setNewQuote({...newQuote, items: newQuote.items.filter((_, i) => i !== idx)});
                    }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setNewQuote({...newQuote, items: [...newQuote.items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }]})}>
                <Plus className="w-4 h-4 mr-2" /> {t('Ajouter une ligne', 'إضافة سطر')}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Valide jusqu\'au', 'صالح حتى')}</Label>
                <Input type="date" value={newQuote.validUntil} onChange={e => setNewQuote({...newQuote, validUntil: e.target.value})} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={() => { 
              const subtotal = newQuote.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
              const tvaAmount = newQuote.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.tvaRate / 100), 0);
              setQuotes([...quotes, { 
                ...newQuote, id: generateId(), number: `DEV-${Date.now().toString().slice(-6)}`,
                subtotal, tvaAmount, total: subtotal + tvaAmount,
                status: 'pending', createdAt: new Date().toISOString()
              }]);
              setNewQuote({ clientId: '', items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }], validUntil: '', notes: '' });
              setDialogOpen(null);
              showToast(t('Devis créé!', 'تم إنشاء العرض!'));
            }} className="bg-emerald-600">{t('Créer', 'إنشاء')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Expense Dialog */}
      <Dialog open={dialogOpen === 'new-expenses'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Ajouter une dépense', 'إضافة مصروف')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Description *', 'الوصف *')}</Label>
              <Input value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Montant (MAD) *', 'المبلغ (درهم) *')}</Label>
                <Input type="number" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label>{t('Catégorie', 'الفئة')}</Label>
                <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})}>
                  <SelectTrigger><SelectValue placeholder={t('Sélectionner', 'اختر')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplies">{t('Fournitures', 'المستلزمات')}</SelectItem>
                    <SelectItem value="services">{t('Services', 'الخدمات')}</SelectItem>
                    <SelectItem value="rent">{t('Loyer', 'الإيجار')}</SelectItem>
                    <SelectItem value="utilities">{t('Factures', 'الفواتير')}</SelectItem>
                    <SelectItem value="travel">{t('Déplacements', 'التنقلات')}</SelectItem>
                    <SelectItem value="other">{t('Autre', 'أخرى')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Date', 'التاريخ')}</Label>
                <Input type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('TVA (%)', 'الضريبة (%)')}</Label>
                <Select value={String(newExpense.tvaRate)} onValueChange={v => setNewExpense({...newExpense, tvaRate: parseInt(v)})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="7">7%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="14">14%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('Fournisseur', 'المورد')}</Label>
              <Input value={newExpense.supplier} onChange={e => setNewExpense({...newExpense, supplier: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={() => { 
              setExpenses([...expenses, { ...newExpense, id: generateId(), createdAt: new Date().toISOString() }]);
              setNewExpense({ description: '', amount: 0, category: '', date: '', tvaRate: 0, supplier: '' });
              setDialogOpen(null);
              showToast(t('Dépense ajoutée!', 'تم إضافة المصروف!'));
            }} className="bg-amber-600">{t('Ajouter', 'إضافة')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Credit Note Dialog */}
      <Dialog open={dialogOpen === 'new-credit-notes'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Créer un avoir', 'إنشاء إشعار دائن')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Facture associée', 'الفاتورة المرتبطة')}</Label>
              <Select value={newCreditNote.invoiceId} onValueChange={v => setNewCreditNote({...newCreditNote, invoiceId: v})}>
                <SelectTrigger><SelectValue placeholder={t('Sélectionner une facture', 'اختر فاتورة')} /></SelectTrigger>
                <SelectContent>
                  {invoices.map((inv: Invoice) => (
                    <SelectItem key={inv.id} value={inv.id}>{inv.number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Motif', 'السبب')}</Label>
              <Textarea value={newCreditNote.reason} onChange={e => setNewCreditNote({...newCreditNote, reason: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Montant (MAD)', 'المبلغ (درهم)')}</Label>
              <Input type="number" value={newCreditNote.amount || ''} onChange={e => setNewCreditNote({...newCreditNote, amount: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={() => { 
              setCreditNotes([...creditNotes, { 
                ...newCreditNote, id: generateId(), number: `AV-${Date.now().toString().slice(-6)}`,
                status: 'pending', createdAt: new Date().toISOString()
              }]);
              setNewCreditNote({ invoiceId: '', reason: '', amount: 0 });
              setDialogOpen(null);
              showToast(t('Avoir créé!', 'تم إنشاء الإشعار الدائن!'));
            }} className="bg-amber-600">{t('Créer', 'إنشاء')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Product Dialog */}
      <Dialog open={dialogOpen === 'new-products'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Ajouter un produit', 'إضافة منتج')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('Nom *', 'الاسم *')}</Label>
                <Input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>{t('SKU', 'رمز المنتج')}</Label>
                <Input value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('Description', 'الوصف')}</Label>
              <Textarea value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t('Prix (MAD)', 'السعر (درهم)')}</Label>
                <Input type="number" value={newProduct.price || ''} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label>{t('TVA (%)', 'الضريبة (%)')}</Label>
                <Select value={String(newProduct.tvaRate)} onValueChange={v => setNewProduct({...newProduct, tvaRate: parseInt(v)})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TVA_RATES.map(rate => <SelectItem key={rate.value} value={String(rate.value)}>{rate.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('Stock initial', 'المخزون الأولي')}</Label>
                <Input type="number" value={newProduct.stock || ''} onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('Catégorie', 'الفئة')}</Label>
              <Input value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={() => { 
              setProducts([...products, { ...newProduct, id: generateId(), createdAt: new Date().toISOString() }]);
              setNewProduct({ name: '', sku: '', description: '', price: 0, tvaRate: 20, category: '', stock: 0 });
              setDialogOpen(null);
              showToast(t('Produit ajouté!', 'تم إضافة المنتج!'));
            }} className="bg-red-600">{t('Ajouter', 'إضافة')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Team Member Dialog */}
      <Dialog open={dialogOpen === 'new-team'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Inviter un membre', 'دعوة عضو')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Nom *', 'الاسم *')}</Label>
              <Input value={newTeamMember.name} onChange={e => setNewTeamMember({...newTeamMember, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Email *', 'البريد الإلكتروني *')}</Label>
              <Input type="email" value={newTeamMember.email} onChange={e => setNewTeamMember({...newTeamMember, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Rôle', 'الدور')}</Label>
              <Select value={newTeamMember.role} onValueChange={v => setNewTeamMember({...newTeamMember, role: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('Administrateur', 'مدير')}</SelectItem>
                  <SelectItem value="accountant">{t('Comptable', 'محاسب')}</SelectItem>
                  <SelectItem value="reader">{t('Lecteur', 'قارئ')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={() => { 
              setTeamMembers([...teamMembers, { ...newTeamMember, id: generateId(), status: 'pending', createdAt: new Date().toISOString() }]);
              setNewTeamMember({ name: '', email: '', role: 'accountant' });
              setDialogOpen(null);
              showToast(t('Invitation envoyée!', 'تم إرسال الدعوة!'));
            }} className="bg-cyan-600">{t('Inviter', 'دعوة')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New API Key Dialog */}
      <Dialog open={dialogOpen === 'new-api-keys'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Générer une clé API', 'إنشاء مفتاح API')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('Nom de la clé', 'اسم المفتاح')}</Label>
              <Input value={newApiKey.name} onChange={e => setNewApiKey({...newApiKey, name: e.target.value})} placeholder={t('Ex: Integration CRM', 'مثال: تكامل CRM')} />
            </div>
            <div className="space-y-2">
              <Label>{t('Permissions', 'الصلاحيات')}</Label>
              <Select value={newApiKey.permissions} onValueChange={v => setNewApiKey({...newApiKey, permissions: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">{t('Lecture seule', 'قراءة فقط')}</SelectItem>
                  <SelectItem value="write">{t('Lecture/Écriture', 'قراءة/كتابة')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{t('Annuler', 'إلغاء')}</Button>
            <Button onClick={() => { 
              const apiKey = `ep_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
              setApiKeys([...apiKeys, { ...newApiKey, id: generateId(), key: apiKey, createdAt: new Date().toISOString() }]);
              setNewApiKey({ name: '', permissions: 'read' });
              setDialogOpen(null);
              showToast(t('Clé générée!', 'تم إنشاء المفتاح!'));
            }} className="bg-pink-600">{t('Générer', 'إنشاء')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
