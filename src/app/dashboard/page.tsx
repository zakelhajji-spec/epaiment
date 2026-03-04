'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import { ToastContainer, showToast } from '@/components/shared/Toast'
import { ModuleGroupPricing } from '@/components/pricing/ModuleGroupPricing'
import { CompanyForm } from '@/components/shared/CompanyForm'
import type { CompanyFormData } from '@/components/shared/CompanyForm'
import type { Language } from '@/lib/modules/types'
import { useClients, useInvoices, usePaymentLinks, useSettings, useReports } from '@/hooks/useApiData'
import { invoiceApi, paymentLinkApi, clientApi, settingsApi, subscriptionApi, leadApi, taskApi, supplierApi, quoteApi, expenseApi, creditNoteApi, productApi, teamApi } from '@/lib/api/client'
import { downloadInvoicePDF, previewInvoicePDF } from '@/lib/pdf-generator'
import { MODULE_GROUPS, getModulesForGroups } from '@/lib/module-groups.config'
import { parseInvoiceItems } from '@/lib/invoice-utils'
import { AILeadQualifierDashboard } from '@/modules/ai-lead-qualifier'

// Import extracted components
import { 
  ClientDialog, 
  InvoiceDialog, 
  PaymentLinkDialog,
  LeadDialog,
  TaskDialog,
  SupplierDialog,
  QuoteDialog,
  ExpenseDialog,
  CreditNoteDialog,
  ProductDialog,
  TeamMemberDialog,
  ApiKeyDialog
} from './components/dialogs'

import {
  DashboardHome,
  InvoicesPage,
  ClientsPage,
  PaymentLinksPage,
  LeadsPage,
  TasksPage,
  SuppliersPage,
  QuotesPage,
  ExpensesPage,
  CreditNotesPage,
  ReportsPage,
  ProductsPage,
  InventoryPage,
  TeamPage,
  ApiKeysPage,
  GatewaysPage,
  AuditPage
} from './components/pages'

// Import types and constants
import type { 
  Client, Invoice, InvoiceLineItem, PaymentLink, 
  Lead, Task, Supplier, Quote, Expense, CreditNote,
  Product, TeamMember, ApiKey, AuditLog,
  NewClientForm, NewInvoiceForm, NewPaymentLinkForm,
  NewLeadForm, NewTaskForm, NewSupplierForm, NewQuoteForm,
  NewExpenseForm, NewCreditNoteForm, NewProductForm,
  NewTeamMemberForm, NewApiKeyForm, DashboardMetrics
} from './types'
import { TVA_RATES, formatCurrency, formatDate, generateId, PAGE_TITLES } from './constants'

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
  const [newClient, setNewClient] = useState<NewClientForm>({ name: '', ice: '', email: '', phone: '', address: '', city: '' })
  const [newPaymentLink, setNewPaymentLink] = useState<NewPaymentLinkForm>({ amount: 0, description: '', clientEmail: '', clientPhone: '', dueDate: '' })
  const [newInvoice, setNewInvoice] = useState<NewInvoiceForm>({
    clientId: '', 
    items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }] as InvoiceLineItem[],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  })
  
  // CRM states
  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [newLead, setNewLead] = useState<NewLeadForm>({ name: '', email: '', phone: '', company: '', status: 'new', source: '' })
  const [newTask, setNewTask] = useState<NewTaskForm>({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' })
  
  // Sales states
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [newSupplier, setNewSupplier] = useState<NewSupplierForm>({ name: '', email: '', phone: '', ice: '', address: '', city: '' })
  const [newQuote, setNewQuote] = useState<NewQuoteForm>({ clientId: '', items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }] as InvoiceLineItem[], validUntil: '', notes: '' })
  
  // Accounting states
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [newExpense, setNewExpense] = useState<NewExpenseForm>({ description: '', amount: 0, category: '', date: '', tvaRate: 0, supplier: '' })
  const [newCreditNote, setNewCreditNote] = useState<NewCreditNoteForm>({ invoiceId: '', reason: '', amount: 0 })
  
  // Stock states
  const [products, setProducts] = useState<Product[]>([])
  const [newProduct, setNewProduct] = useState<NewProductForm>({ name: '', sku: '', description: '', price: 0, tvaRate: 20, category: '', stock: 0 })
  
  // Team states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [newTeamMember, setNewTeamMember] = useState<NewTeamMemberForm>({ name: '', email: '', role: 'accountant' })
  
  // Integrations states
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newApiKey, setNewApiKey] = useState<NewApiKeyForm>({ name: '', permissions: 'read' })
  
  // Audit states
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  
  // Settings form state
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

  // ==================== LOAD DATA FROM APIs ====================
  
  // Load Leads
  useEffect(() => {
    const loadLeads = async () => {
      if (status !== 'authenticated') return
      try {
        const result = await leadApi.list()
        if (result.data?.leads) {
          setLeads(result.data.leads)
        }
      } catch (e) {
        console.error('Failed to load leads:', e)
      }
    }
    loadLeads()
  }, [status])

  // Load Tasks
  useEffect(() => {
    const loadTasks = async () => {
      if (status !== 'authenticated') return
      try {
        const result = await taskApi.list()
        if (result.data?.tasks) {
          setTasks(result.data.tasks)
        }
      } catch (e) {
        console.error('Failed to load tasks:', e)
      }
    }
    loadTasks()
  }, [status])

  // Load Suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      if (status !== 'authenticated') return
      try {
        const result = await supplierApi.list()
        if (result.data?.suppliers) {
          setSuppliers(result.data.suppliers)
        }
      } catch (e) {
        console.error('Failed to load suppliers:', e)
      }
    }
    loadSuppliers()
  }, [status])

  // Load Quotes
  useEffect(() => {
    const loadQuotes = async () => {
      if (status !== 'authenticated') return
      try {
        const result = await quoteApi.list()
        if (result.data?.quotes) {
          setQuotes(result.data.quotes)
        }
      } catch (e) {
        console.error('Failed to load quotes:', e)
      }
    }
    loadQuotes()
  }, [status])

  // Load Expenses
  useEffect(() => {
    const loadExpenses = async () => {
      if (status !== 'authenticated') return
      try {
        const result = await expenseApi.list()
        if (result.data?.expenses) {
          setExpenses(result.data.expenses)
        }
      } catch (e) {
        console.error('Failed to load expenses:', e)
      }
    }
    loadExpenses()
  }, [status])

  // Load Credit Notes
  useEffect(() => {
    const loadCreditNotes = async () => {
      if (status !== 'authenticated') return
      try {
        const result = await creditNoteApi.list()
        if (result.data?.creditNotes) {
          setCreditNotes(result.data.creditNotes)
        }
      } catch (e) {
        console.error('Failed to load credit notes:', e)
      }
    }
    loadCreditNotes()
  }, [status])

  // Load Products
  useEffect(() => {
    const loadProducts = async () => {
      if (status !== 'authenticated') return
      try {
        const result = await productApi.list()
        if (result.data?.products) {
          setProducts(result.data.products)
        }
      } catch (e) {
        console.error('Failed to load products:', e)
      }
    }
    loadProducts()
  }, [status])

  // Load Team Members
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (status !== 'authenticated') return
      try {
        const result = await teamApi.list()
        if (result.data?.members) {
          setTeamMembers(result.data.members)
        }
      } catch (e) {
        console.error('Failed to load team members:', e)
      }
    }
    loadTeamMembers()
  }, [status])

  // ==================== REFRESH FUNCTIONS ====================
  
  const refreshLeads = async () => {
    const result = await leadApi.list()
    if (result.data?.leads) setLeads(result.data.leads)
  }

  const refreshTasks = async () => {
    const result = await taskApi.list()
    if (result.data?.tasks) setTasks(result.data.tasks)
  }

  const refreshSuppliers = async () => {
    const result = await supplierApi.list()
    if (result.data?.suppliers) setSuppliers(result.data.suppliers)
  }

  const refreshQuotes = async () => {
    const result = await quoteApi.list()
    if (result.data?.quotes) setQuotes(result.data.quotes)
  }

  const refreshExpenses = async () => {
    const result = await expenseApi.list()
    if (result.data?.expenses) setExpenses(result.data.expenses)
  }

  const refreshCreditNotes = async () => {
    const result = await creditNoteApi.list()
    if (result.data?.creditNotes) setCreditNotes(result.data.creditNotes)
  }

  const refreshProducts = async () => {
    const result = await productApi.list()
    if (result.data?.products) setProducts(result.data.products)
  }

  const refreshTeamMembers = async () => {
    const result = await teamApi.list()
    if (result.data?.members) setTeamMembers(result.data.members)
  }

  // Translation helper
  const t = useCallback((fr: string, ar: string) => language === 'ar' ? ar : fr, [language])

  // Metrics
  const metrics: DashboardMetrics = {
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

  const openEditInvoiceDialog = (invoice: Invoice) => {
    const parsedItems = parseInvoiceItems(invoice.items)
    setSelectedItem(invoice)
    setNewInvoice({
      clientId: invoice.clientId,
      items: parsedItems.length > 0 ? parsedItems : [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }],
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
    
    setActiveGroups(newGroups)
    const modules = getModulesForGroups(newGroups)
    setUserModules(modules)
    
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe_group', groupId })
      })
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        setActiveGroups(previousGroups)
        setUserModules(getModulesForGroups(previousGroups))
        showToast(result.error || t('Erreur lors de l\'activation', 'خطأ في التفعيل'), 'error')
        return
      }
      
      showToast(t('Groupe activé!', 'تم تفعيل المجموعة!'))
    } catch (e) {
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
    
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsubscribe_group', groupId })
      })
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        setActiveGroups(previousGroups)
        setUserModules(getModulesForGroups(previousGroups))
        showToast(result.error || t('Erreur lors de la désactivation', 'خطأ في التعطيل'), 'error')
        return
      }
      
      showToast(t('Groupe désactivé', 'تم تعطيل المجموعة'))
    } catch (e) {
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
    
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe_bundle', bundleId })
      })
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        setActiveGroups(previousGroups)
        setUserModules(getModulesForGroups(previousGroups))
        showToast(result.error || t('Erreur lors de l\'activation', 'خطأ في التفعيل'), 'error')
        return
      }
      
      showToast(t('Forfait activé!', 'تم تفعيل الباقة!'))
    } catch (e) {
      setActiveGroups(previousGroups)
      setUserModules(getModulesForGroups(previousGroups))
      console.error('Failed to save subscription:', e)
      showToast(t('Erreur de connexion', 'خطأ في الاتصال'), 'error')
    }
  }

  // Module handlers - Connected to APIs
  const handleCreateLead = async () => {
    if (!newLead.name) {
      showToast(t('Le nom est requis', 'الاسم مطلوب'), 'error')
      return
    }
    const result = await leadApi.create(newLead)
    if (result.data) {
      showToast(t('Prospect ajouté!', 'تم إضافة العميل المحتمل!'))
      setNewLead({ name: '', email: '', phone: '', company: '', status: 'new', source: '' })
      setDialogOpen(null)
      refreshLeads()
    } else {
      showToast(result.error || t('Erreur lors de la création', 'خطأ في الإنشاء'), 'error')
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title) {
      showToast(t('Le titre est requis', 'العنوان مطلوب'), 'error')
      return
    }
    const result = await taskApi.create(newTask)
    if (result.data) {
      showToast(t('Tâche ajoutée!', 'تم إضافة المهمة!'))
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: '' })
      setDialogOpen(null)
      refreshTasks()
    } else {
      showToast(result.error || t('Erreur lors de la création', 'خطأ في الإنشاء'), 'error')
    }
  }

  const handleCreateSupplier = async () => {
    if (!newSupplier.name) {
      showToast(t('Le nom est requis', 'الاسم مطلوب'), 'error')
      return
    }
    const result = await supplierApi.create(newSupplier)
    if (result.data) {
      showToast(t('Fournisseur ajouté!', 'تم إضافة المورد!'))
      setNewSupplier({ name: '', email: '', phone: '', ice: '', address: '', city: '' })
      setDialogOpen(null)
      refreshSuppliers()
    } else {
      showToast(result.error || t('Erreur lors de la création', 'خطأ في الإنشاء'), 'error')
    }
  }

  const handleCreateQuote = async () => {
    if (!newQuote.clientId || newQuote.items.length === 0) {
      showToast(t('Veuillez sélectionner un client et ajouter des articles', 'يرجى اختيار عميل وإضافة عناصر'), 'error')
      return
    }
    const subtotal = newQuote.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
    const tvaAmount = newQuote.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.tvaRate / 100), 0)
    const result = await quoteApi.create({
      clientId: newQuote.clientId,
      items: newQuote.items,
      subtotal,
      tvaAmount,
      total: subtotal + tvaAmount,
      validUntil: newQuote.validUntil,
      notes: newQuote.notes
    })
    if (result.data) {
      showToast(t('Devis créé!', 'تم إنشاء العرض!'))
      setNewQuote({ clientId: '', items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }], validUntil: '', notes: '' })
      setDialogOpen(null)
      refreshQuotes()
    } else {
      showToast(result.error || t('Erreur lors de la création', 'خطأ في الإنشاء'), 'error')
    }
  }

  const handleCreateExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.category) {
      showToast(t('Veuillez remplir tous les champs requis', 'يرجى ملء جميع الحقول المطلوبة'), 'error')
      return
    }
    const result = await expenseApi.create({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount.toString()),
      category: newExpense.category,
      date: newExpense.date || new Date().toISOString().split('T')[0],
      tvaRate: newExpense.tvaRate || 0,
      tvaAmount: (parseFloat(newExpense.amount.toString()) * (newExpense.tvaRate || 0)) / 100,
      supplierId: newExpense.supplier || undefined
    })
    if (result.data) {
      showToast(t('Dépense ajoutée!', 'تم إضافة المصروف!'))
      setNewExpense({ description: '', amount: 0, category: '', date: '', tvaRate: 0, supplier: '' })
      setDialogOpen(null)
      refreshExpenses()
    } else {
      showToast(result.error || t('Erreur lors de la création', 'خطأ في الإنشاء'), 'error')
    }
  }

  const handleCreateCreditNote = async () => {
    if (!newCreditNote.reason || !newCreditNote.amount) {
      showToast(t('Veuillez remplir tous les champs requis', 'يرجى ملء جميع الحقول المطلوبة'), 'error')
      return
    }
    const result = await creditNoteApi.create({
      clientId: newCreditNote.invoiceId ? invoices.find(i => i.id === newCreditNote.invoiceId)?.clientId : clients[0]?.id,
      reason: newCreditNote.reason,
      subtotal: parseFloat(newCreditNote.amount.toString()),
      tvaAmount: 0,
      total: parseFloat(newCreditNote.amount.toString()),
      invoiceId: newCreditNote.invoiceId || undefined
    })
    if (result.data) {
      showToast(t('Avoir créé!', 'تم إنشاء الإشعار الدائن!'))
      setNewCreditNote({ invoiceId: '', reason: '', amount: 0 })
      setDialogOpen(null)
      refreshCreditNotes()
    } else {
      showToast(result.error || t('Erreur lors de la création', 'خطأ في الإنشاء'), 'error')
    }
  }

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      showToast(t('Le nom et le prix sont requis', 'الاسم والسعر مطلوبان'), 'error')
      return
    }
    const result = await productApi.create({
      name: newProduct.name,
      sku: newProduct.sku || undefined,
      description: newProduct.description || undefined,
      unitPrice: parseFloat(newProduct.price.toString()),
      tvaRate: newProduct.tvaRate || 20,
      stockQuantity: newProduct.stock || 0,
      category: newProduct.category || undefined
    })
    if (result.data) {
      showToast(t('Produit ajouté!', 'تم إضافة المنتج!'))
      setNewProduct({ name: '', sku: '', description: '', price: 0, tvaRate: 20, category: '', stock: 0 })
      setDialogOpen(null)
      refreshProducts()
    } else {
      showToast(result.error || t('Erreur lors de la création', 'خطأ في الإنشاء'), 'error')
    }
  }

  const handleCreateTeamMember = async () => {
    if (!newTeamMember.email || !newTeamMember.name) {
      showToast(t('Le nom et l\'email sont requis', 'الاسم والبريد الإلكتروني مطلوبان'), 'error')
      return
    }
    const result = await teamApi.invite({
      email: newTeamMember.email,
      name: newTeamMember.name,
      role: newTeamMember.role || 'viewer'
    })
    if (result.data) {
      showToast(t('Invitation envoyée!', 'تم إرسال الدعوة!'))
      setNewTeamMember({ name: '', email: '', role: 'accountant' })
      setDialogOpen(null)
      refreshTeamMembers()
    } else {
      showToast(result.error || t('Erreur lors de l\'invitation', 'خطأ في الإرسال'), 'error')
    }
  }

  const handleCreateApiKey = () => {
    setApiKeys([...apiKeys, { 
      ...newApiKey, id: generateId(), key: `ep_${generateId()}_${generateId()}`,
      createdAt: new Date().toISOString()
    } as ApiKey])
    setNewApiKey({ name: '', permissions: 'read' })
    setDialogOpen(null)
    showToast(t('Clé générée!', 'تم إنشاء المفتاح!'))
  }

  // Logout handler
  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/login' })
  }

  // Page title helper
  const getPageTitle = () => {
    const title = PAGE_TITLES[currentPage]
    return title ? (language === 'ar' ? title.ar : title.fr) : currentPage
  }

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse shadow-lg shadow-violet-500/30">
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
        
        {/* Main content */}
        <div className="flex-1 p-4 lg:p-6 pt-20 lg:pt-6 pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
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
                  <Button onClick={() => setDialogOpen(`new-${currentPage}`)} className="bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 shadow-lg shadow-violet-500/30">
                    <Plus className="w-4 h-4 mr-2" /><span className="hidden sm:inline">{t('Nouveau', 'جديد')}</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* ==================== PAGE CONTENT ==================== */}
            
            {/* Dashboard */}
            {currentPage === 'dashboard' && (
              <DashboardHome
                metrics={metrics}
                language={language}
                onCreateInvoice={() => setDialogOpen('new-invoices')}
                onCreatePaymentLink={() => setDialogOpen('new-payment-links')}
                onAddClient={() => setDialogOpen('new-clients')}
                onNavigateToModules={() => setCurrentPage('modules')}
              />
            )}

            {/* Invoices */}
            {currentPage === 'invoices' && (
              <InvoicesPage
                invoices={invoices}
                clients={clients}
                isLoading={invoicesLoading}
                language={language}
                onCreateNew={() => setDialogOpen('new-invoices')}
                onPreview={handlePreviewInvoice}
                onDownload={handleDownloadInvoice}
                onEdit={openEditInvoiceDialog}
                onAction={handleInvoiceAction}
              />
            )}

            {/* Payment Links */}
            {currentPage === 'payment-links' && (
              <PaymentLinksPage
                paymentLinks={paymentLinks}
                isLoading={paymentLinksLoading}
                language={language}
                onCreateNew={() => setDialogOpen('new-payment-links')}
                onAction={handlePaymentLinkAction}
              />
            )}

            {/* Clients */}
            {currentPage === 'clients' && (
              <ClientsPage
                clients={clients}
                isLoading={clientsLoading}
                language={language}
                onCreateNew={() => setDialogOpen('new-clients')}
              />
            )}

            {/* Modules */}
            {currentPage === 'modules' && (
              <ModuleGroupPricing
                language={language}
                subscribedGroups={activeGroups}
                onSubscribeGroup={handleSubscribeGroup}
                onUnsubscribeGroup={handleUnsubscribeGroup}
                onSubscribeBundle={handleSubscribeBundle}
              />
            )}

            {/* Settings */}
            {currentPage === 'settings' && (
              <CompanyForm
                initialData={settingsFormData}
                language={language}
                onSave={handleSaveSettings}
              />
            )}

            {/* CRM - Leads */}
            {currentPage === 'leads' && (
              <LeadsPage
                leads={leads}
                language={language}
                onCreateNew={() => setDialogOpen('new-leads')}
              />
            )}

            {/* CRM - Tasks */}
            {currentPage === 'tasks' && (
              <TasksPage
                tasks={tasks}
                language={language}
                onCreateNew={() => setDialogOpen('new-tasks')}
              />
            )}

            {/* Sales - Suppliers */}
            {currentPage === 'suppliers' && (
              <SuppliersPage
                suppliers={suppliers}
                language={language}
                onCreateNew={() => setDialogOpen('new-suppliers')}
              />
            )}

            {/* Sales - Quotes */}
            {currentPage === 'quotes' && (
              <QuotesPage
                quotes={quotes}
                language={language}
                onCreateNew={() => setDialogOpen('new-quotes')}
              />
            )}

            {/* Accounting - Expenses */}
            {currentPage === 'expenses' && (
              <ExpensesPage
                expenses={expenses}
                language={language}
                onCreateNew={() => setDialogOpen('new-expenses')}
              />
            )}

            {/* Accounting - Credit Notes */}
            {currentPage === 'credit-notes' && (
              <CreditNotesPage
                creditNotes={creditNotes}
                language={language}
                onCreateNew={() => setDialogOpen('new-credit-notes')}
              />
            )}

            {/* Accounting - Reports */}
            {currentPage === 'reports' && (
              <ReportsPage
                metrics={metrics}
                language={language}
              />
            )}

            {/* Stock - Products */}
            {currentPage === 'products' && (
              <ProductsPage
                products={products}
                language={language}
                onCreateNew={() => setDialogOpen('new-products')}
              />
            )}

            {/* Stock - Inventory */}
            {currentPage === 'inventory' && (
              <InventoryPage
                products={products}
                language={language}
              />
            )}

            {/* Team */}
            {currentPage === 'team' && (
              <TeamPage
                teamMembers={teamMembers}
                language={language}
                onCreateNew={() => setDialogOpen('new-team')}
              />
            )}

            {/* Integrations - API Keys */}
            {currentPage === 'api-keys' && (
              <ApiKeysPage
                apiKeys={apiKeys}
                language={language}
                onCreateNew={() => setDialogOpen('new-api-keys')}
              />
            )}

            {/* Integrations - Gateways */}
            {currentPage === 'gateways' && (
              <GatewaysPage language={language} />
            )}

            {/* Audit */}
            {currentPage === 'audit' && (
              <AuditPage
                auditLogs={auditLogs}
                language={language}
              />
            )}

            {/* AI Lead Qualifier */}
            {currentPage === 'ai-lead-qualifier' && (
              <AILeadQualifierDashboard language={language} />
            )}
          </div>
        </div>
      </main>

      {/* ==================== DIALOGS ==================== */}
      
      {/* Client Dialog */}
      <ClientDialog
        open={dialogOpen === 'new-clients'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newClient}
        onFormDataChange={setNewClient}
        onSubmit={handleCreateClient}
        language={language}
      />

      {/* Invoice Dialog - Create */}
      <InvoiceDialog
        open={dialogOpen === 'new-invoices'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newInvoice}
        onFormDataChange={setNewInvoice}
        onSubmit={handleCreateInvoice}
        clients={clients}
        language={language}
        mode="create"
      />

      {/* Invoice Dialog - Edit */}
      <InvoiceDialog
        open={dialogOpen === 'edit-invoice'}
        onOpenChange={() => { setDialogOpen(null); setSelectedItem(null); }}
        formData={newInvoice}
        onFormDataChange={setNewInvoice}
        onSubmit={handleEditInvoice}
        clients={clients}
        language={language}
        mode="edit"
        invoiceNumber={selectedItem?.number}
      />

      {/* Payment Link Dialog */}
      <PaymentLinkDialog
        open={dialogOpen === 'new-payment-links'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newPaymentLink}
        onFormDataChange={setNewPaymentLink}
        onSubmit={handleCreatePaymentLink}
        language={language}
      />

      {/* Lead Dialog */}
      <LeadDialog
        open={dialogOpen === 'new-leads'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newLead}
        onFormDataChange={setNewLead}
        onSubmit={handleCreateLead}
        language={language}
      />

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen === 'new-tasks'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newTask}
        onFormDataChange={setNewTask}
        onSubmit={handleCreateTask}
        language={language}
      />

      {/* Supplier Dialog */}
      <SupplierDialog
        open={dialogOpen === 'new-suppliers'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newSupplier}
        onFormDataChange={setNewSupplier}
        onSubmit={handleCreateSupplier}
        language={language}
      />

      {/* Quote Dialog */}
      <QuoteDialog
        open={dialogOpen === 'new-quotes'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newQuote}
        onFormDataChange={setNewQuote}
        onSubmit={handleCreateQuote}
        clients={clients}
        language={language}
      />

      {/* Expense Dialog */}
      <ExpenseDialog
        open={dialogOpen === 'new-expenses'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newExpense}
        onFormDataChange={setNewExpense}
        onSubmit={handleCreateExpense}
        language={language}
      />

      {/* Credit Note Dialog */}
      <CreditNoteDialog
        open={dialogOpen === 'new-credit-notes'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newCreditNote}
        onFormDataChange={setNewCreditNote}
        onSubmit={handleCreateCreditNote}
        invoices={invoices}
        language={language}
      />

      {/* Product Dialog */}
      <ProductDialog
        open={dialogOpen === 'new-products'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newProduct}
        onFormDataChange={setNewProduct}
        onSubmit={handleCreateProduct}
        language={language}
      />

      {/* Team Member Dialog */}
      <TeamMemberDialog
        open={dialogOpen === 'new-team'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newTeamMember}
        onFormDataChange={setNewTeamMember}
        onSubmit={handleCreateTeamMember}
        language={language}
      />

      {/* API Key Dialog */}
      <ApiKeyDialog
        open={dialogOpen === 'new-api-keys'}
        onOpenChange={() => setDialogOpen(null)}
        formData={newApiKey}
        onFormDataChange={setNewApiKey}
        onSubmit={handleCreateApiKey}
        language={language}
      />
    </div>
  )
}
