'use client'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  LayoutDashboard, FileText, Users, Truck, Wallet, Settings,
  Plus, Search, Eye, Edit, Trash2, Send, Download, Copy,
  CheckCircle, Clock, XCircle, Menu, X, Bell, ChevronLeft,
  MessageCircle, Printer, FileCheck, ArrowLeftRight,
  FileBarChart, TrendingUp, TrendingDown, AlertTriangle,
  Key, UserCog, CloudDownload, Server, Languages, LogOut,
  Link2, CreditCard, RefreshCw, Globe, Sparkles, UserPlus,
  CheckSquare, Flag, Calendar, FileSearch, UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'
import { ToastContainer, showToast } from '@/components/shared/Toast'
import { CompanyForm, type CompanyFormData } from '@/components/shared/CompanyForm'
import { ModulePricing } from '@/components/pricing/ModulePricing'
import { PaymentGatewayForm, type GatewayData } from '@/modules/integrations/gateways/components/PaymentGatewayForm'
import { AILeadQualifierDashboard } from '@/modules/ai-lead-qualifier'
import { MODULES_CONFIG } from '@/lib/modules.config'
import type { Language } from '@/lib/modules/types'

// ==================== TYPES ====================
interface Client {
  id: string
  name: string
  ice: string
  email: string
  phone: string
  address: string
  city: string
  createdAt: string
}

interface Supplier {
  id: string
  name: string
  ice: string
  email: string
  phone: string
  address: string
  city: string
  createdAt: string
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
  supplierId?: string
  notes?: string
  tvaDeductible: boolean
  tvaAmount: number
  createdAt: string
}

interface PaymentLink {
  id: string
  amount: number
  description: string
  clientEmail: string
  clientPhone: string
  dueDate: string
  status: 'pending' | 'paid' | 'expired'
  createdAt: string
  paidAt?: string
  reference: string
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
  items: InvoiceLineItem[]
  subtotal: number
  tvaAmount: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  createdAt: string
  dueDate: string
  paidAt?: string
  notes?: string
  payments?: Payment[]
  amountPaid?: number
  isRecurring?: boolean
  recurringFrequency?: 'monthly' | 'quarterly' | 'annually'
  recurringNextDate?: string
}

interface Quote {
  id: string
  number: string
  clientId: string
  items: InvoiceLineItem[]
  subtotal: number
  tvaAmount: number
  total: number
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  createdAt: string
  validUntil: string
  notes?: string
}

interface CreditNote {
  id: string
  number: string
  invoiceId?: string
  clientId: string
  items: InvoiceLineItem[]
  subtotal: number
  tvaAmount: number
  total: number
  reason: string
  reasonDescription?: string
  createdAt: string
  status: 'draft' | 'issued'
}

interface Payment {
  id: string
  invoiceId: string
  amount: number
  method: string
  reference?: string
  paidAt: string
  notes?: string
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  source: 'website' | 'referral' | 'social' | 'direct' | 'other'
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'
  notes: string
  createdAt: string
  convertedToClientId?: string
}

interface Task {
  id: string
  title: string
  description: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed'
  relatedClientId?: string
  relatedInvoiceId?: string
  assignedTo?: string
  createdAt: string
}

interface AuditEntry {
  id: string
  action: 'create' | 'update' | 'delete'
  entityType: 'invoice' | 'client' | 'quote' | 'expense' | 'credit_note' | 'lead' | 'task'
  entityId: string
  userId?: string
  details: string
  timestamp: string
  ipAddress?: string
}

interface Settings {
  companyName: string
  companyIce: string
  companyAddress: string
  companyCity: string
  companyPhone: string
  companyEmail: string
  companyIf: string
  companyRc: string
  companyPatente: string
  companyCnss: string
  autoEntrepreneur: boolean
  defaultTvaRate: number
  invoicePrefix: string
  remindersEnabled?: boolean
  reminderDays?: number[]
  reminderMethod?: 'email' | 'whatsapp' | 'both'
}

// ==================== CONSTANTS ====================
const EXPENSE_CATEGORIES = [
  { value: 'Loyer', label: 'Loyer' },
  { value: 'Salaires', label: 'Salaires' },
  { value: 'Fournitures', label: 'Fournitures' },
  { value: 'Services', label: 'Services' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Autres', label: 'Autres' },
]

const TVA_RATES = [
  { value: 20, label: '20% - Normal' },
  { value: 14, label: '14% - Services' },
  { value: 10, label: '10% - Hôtels' },
  { value: 7, label: '7% - Eau/Élec.' },
  { value: 0, label: '0% - Exonéré' },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'check', label: 'Chèque' },
  { value: 'bank_transfer', label: 'Virement' },
  { value: 'card', label: 'Carte' },
]

const CREDIT_NOTE_REASONS = [
  { value: 'refund', label: 'Remboursement' },
  { value: 'discount', label: 'Réduction' },
  { value: 'correction', label: 'Correction' },
  { value: 'other', label: 'Autre' },
]

const LEAD_SOURCES = [
  { value: 'website', label: 'Site Web' },
  { value: 'referral', label: 'Référence' },
  { value: 'social', label: 'Réseaux sociaux' },
  { value: 'direct', label: 'Contact direct' },
  { value: 'other', label: 'Autre' },
]

const LEAD_STATUSES = [
  { value: 'new', label: 'Nouveau', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: 'Contacté', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'qualified', label: 'Qualifié', color: 'bg-purple-100 text-purple-700' },
  { value: 'proposal', label: 'Proposition', color: 'bg-orange-100 text-orange-700' },
  { value: 'won', label: 'Gagné', color: 'bg-green-100 text-green-700' },
  { value: 'lost', label: 'Perdu', color: 'bg-red-100 text-red-700' },
]

const TASK_PRIORITIES = [
  { value: 'low', label: 'Basse', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'high', label: 'Haute', color: 'bg-red-100 text-red-700' },
]

const AUDIT_ACTIONS = [
  { value: 'create', label: 'Création' },
  { value: 'update', label: 'Modification' },
  { value: 'delete', label: 'Suppression' },
]

const AUDIT_ENTITY_TYPES = [
  { value: 'invoice', label: 'Facture' },
  { value: 'client', label: 'Client' },
  { value: 'quote', label: 'Devis' },
  { value: 'expense', label: 'Dépense' },
  { value: 'credit_note', label: 'Avoir' },
  { value: 'lead', label: 'Prospect' },
  { value: 'task', label: 'Tâche' },
]

const DEFAULT_SETTINGS: Settings = {
  companyName: 'Mon Entreprise',
  companyIce: '',
  companyAddress: '',
  companyCity: 'Casablanca',
  companyPhone: '',
  companyEmail: '',
  companyIf: '',
  companyRc: '',
  companyPatente: '',
  companyCnss: '',
  autoEntrepreneur: false,
  defaultTvaRate: 20,
  invoicePrefix: 'FA',
  remindersEnabled: true,
  reminderDays: [7, 3, 1],
  reminderMethod: 'email',
}

// ==================== TRANSLATIONS ====================
const translations = {
  fr: {
    dashboard: 'Tableau de bord',
    paymentLinks: 'Liens de paiement',
    invoices: 'Factures',
    quotes: 'Devis',
    creditNotes: 'Avoirs',
    clients: 'Clients',
    suppliers: 'Fournisseurs',
    expenses: 'Dépenses',
    reports: 'Rapports',
    team: 'Équipe',
    api: 'API',
    gateways: 'Passerelles',
    export: 'Export',
    settings: 'Paramètres',
    leads: 'Prospects',
    tasks: 'Tâches',
    audit: 'Audit',
    modules: 'Modules',
    createInvoice: 'Créer une facture',
    createQuote: 'Créer un devis',
    createPaymentLink: 'Créer un lien',
    addClient: 'Ajouter un client',
    addLead: 'Ajouter un prospect',
    addTask: 'Ajouter une tâche',
    totalRevenue: 'Revenus',
    pendingPayments: 'En attente',
    totalExpenses: 'Dépenses',
    activeClients: 'Clients',
    quickActions: 'Actions rapides',
    recentInvoices: 'Factures récentes',
    tvaCollected: 'TVA Collectée',
    tvaDeductible: 'TVA Déductible',
    tvaToPay: 'TVA à payer',
    new: 'Nouveau',
    search: 'Rechercher',
    status: 'Statut',
    paid: 'Payée',
    sent: 'Envoyée',
    draft: 'Brouillon',
    overdue: 'En retard',
    accepted: 'Accepté',
    rejected: 'Refusé',
    expired: 'Expiré',
    pending: 'En attente',
    generateLink: 'Générer le lien',
    copyLink: 'Copier le lien',
    shareWhatsApp: 'WhatsApp',
    downloadPDF: 'PDF',
    markPaid: 'Marquer payée',
    convertInvoice: 'Convertir en facture',
    totalLeads: 'Total prospects',
    newLeads: 'Nouveaux',
    conversionRate: 'Taux conversion',
    auditLog: 'Journal d\'audit',
    exportAuditLog: 'Exporter le journal',
    clientStatement: 'Relevé client',
  },
  ar: {
    dashboard: 'لوحة التحكم',
    paymentLinks: 'روابط الدفع',
    invoices: 'الفواتير',
    quotes: 'العروض',
    creditNotes: 'إشعارات دائنة',
    clients: 'العملاء',
    suppliers: 'الموردين',
    expenses: 'المصاريف',
    reports: 'التقارير',
    team: 'الفريق',
    api: 'API',
    gateways: 'البوابات',
    export: 'تصدير',
    settings: 'الإعدادات',
    leads: 'العملاء المحتملين',
    tasks: 'المهام',
    audit: 'التدقيق',
    modules: 'الوحدات',
    createInvoice: 'إنشاء فاتورة',
    createQuote: 'إنشاء عرض',
    createPaymentLink: 'إنشاء رابط',
    addClient: 'إضافة عميل',
    addLead: 'إضافة عميل محتمل',
    addTask: 'إضافة مهمة',
    totalRevenue: 'الإيرادات',
    pendingPayments: 'معلقة',
    totalExpenses: 'المصاريف',
    activeClients: 'العملاء',
    quickActions: 'إجراءات سريعة',
    recentInvoices: 'الفواتير الأخيرة',
    tvaCollected: 'ضريبة القيمة المضافة المحصلة',
    tvaDeductible: 'ضريبة القيمة المضافة القابلة للخصم',
    tvaToPay: 'ضريبة القيمة المضافة المستحقة',
    new: 'جديد',
    search: 'بحث',
    status: 'الحالة',
    paid: 'مدفوعة',
    sent: 'مرسلة',
    draft: 'مسودة',
    overdue: 'متأخرة',
    accepted: 'مقبول',
    rejected: 'مرفوض',
    expired: 'منتهي',
    pending: 'قيد الانتظار',
    generateLink: 'إنشاء الرابط',
    copyLink: 'نسخ الرابط',
    shareWhatsApp: 'واتساب',
    downloadPDF: 'PDF',
    markPaid: 'تحديد كمدفوعة',
    convertInvoice: 'تحويل إلى فاتورة',
    totalLeads: 'إجمالي العملاء المحتملين',
    newLeads: 'جدد',
    conversionRate: 'معدل التحويل',
    auditLog: 'سجل التدقيق',
    exportAuditLog: 'تصدير السجل',
    clientStatement: 'كشف حساب العميل',
  }
}

// ==================== HELPERS ====================
const generateId = () => Math.random().toString(36).substring(2, 9)
const generateInvoiceNumber = (prefix: string, count: number) => `${prefix}-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`
const generateQuoteNumber = (count: number) => `DV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`
const generateCreditNoteNumber = (count: number) => `AV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`
const generateReference = () => `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount)
const formatDate = (date: string) => { try { return format(new Date(date), 'dd/MM/yyyy', { locale: fr }) } catch { return date } }

const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : defaultValue }
  catch { return defaultValue }
}

const setStorageItem = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

// ==================== MAIN COMPONENT ====================
export default function EpaiementApp() {
  // Hydration state - prevent flash of wrong content
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Auth & Language - initialize with defaults, load from localStorage after hydration
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLanding, setShowLanding] = useState(true)
  const [language, setLanguage] = useState<Language>('fr')
  
  // Navigation
  const [currentPage, setCurrentPage] = useState('dashboard')
  
  // User modules (subscribed) - default to core free modules
  const [userModules, setUserModules] = useState<string[]>(['dashboard', 'invoices', 'payment-links', 'clients', 'suppliers'])
  
  // Data - initialize empty, load from localStorage after hydration
  const [clients, setClients] = useState<Client[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [gateways, setGateways] = useState<GatewayData[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [invoiceCount, setInvoiceCount] = useState(1)
  const [quoteCount, setQuoteCount] = useState(1)
  const [creditNoteCount, setCreditNoteCount] = useState(1)
  
  // Load data from localStorage after hydration (client-side only)
  useEffect(() => {
    setIsLoggedIn(getStorageItem('ep_logged_in', false))
    setShowLanding(!getStorageItem('ep_logged_in', false))
    setLanguage(getStorageItem('ep_lang', 'fr'))
    setUserModules(getStorageItem('ep_user_modules', ['dashboard', 'invoices', 'payment-links', 'clients', 'suppliers']))
    setClients(getStorageItem('ep_clients', []))
    setSuppliers(getStorageItem('ep_suppliers', []))
    setInvoices(getStorageItem('ep_invoices', []))
    setQuotes(getStorageItem('ep_quotes', []))
    setCreditNotes(getStorageItem('ep_credit_notes', []))
    setExpenses(getStorageItem('ep_expenses', []))
    setPaymentLinks(getStorageItem('ep_payment_links', []))
    setLeads(getStorageItem('ep_leads', []))
    setTasks(getStorageItem('ep_tasks', []))
    setAuditLog(getStorageItem('ep_audit_log', []))
    setGateways(getStorageItem('ep_gateways', []))
    setSettings(getStorageItem('ep_settings', DEFAULT_SETTINGS))
    setInvoiceCount(getStorageItem('ep_invoice_count', 1))
    setQuoteCount(getStorageItem('ep_quote_count', 1))
    setCreditNoteCount(getStorageItem('ep_credit_note_count', 1))
    setIsHydrated(true)
  }, [])
  
  // Dialogs
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form states
  const [newClient, setNewClient] = useState({ name: '', ice: '', email: '', phone: '', address: '', city: '' })
  const [newPaymentLink, setNewPaymentLink] = useState({ amount: 0, description: '', clientEmail: '', clientPhone: '', dueDate: '' })
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: 'Autres', date: new Date().toISOString().split('T')[0], tvaDeductible: true, tvaRate: 20 })
  const [newLead, setNewLead] = useState<Partial<Lead>>({ name: '', email: '', phone: '', company: '', source: 'website', status: 'new', notes: '' })
  const [newTask, setNewTask] = useState<Partial<Task>>({ title: '', description: '', dueDate: '', priority: 'medium', status: 'pending', relatedClientId: '' })
  const [newInvoice, setNewInvoice] = useState({
    clientId: '', items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }] as InvoiceLineItem[],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '', isRecurring: false, recurringFrequency: 'monthly' as const
  })
  
  // Translation helper
  const t = useCallback((key: keyof typeof translations.fr) => translations[language][key] || key, [language])
  
  // Save data on change
  useEffect(() => { setStorageItem('ep_clients', clients) }, [clients])
  useEffect(() => { setStorageItem('ep_suppliers', suppliers) }, [suppliers])
  useEffect(() => { setStorageItem('ep_invoices', invoices) }, [invoices])
  useEffect(() => { setStorageItem('ep_quotes', quotes) }, [quotes])
  useEffect(() => { setStorageItem('ep_credit_notes', creditNotes) }, [creditNotes])
  useEffect(() => { setStorageItem('ep_expenses', expenses) }, [expenses])
  useEffect(() => { setStorageItem('ep_payment_links', paymentLinks) }, [paymentLinks])
  useEffect(() => { setStorageItem('ep_leads', leads) }, [leads])
  useEffect(() => { setStorageItem('ep_tasks', tasks) }, [tasks])
  useEffect(() => { setStorageItem('ep_audit_log', auditLog) }, [auditLog])
  useEffect(() => { setStorageItem('ep_gateways', gateways) }, [gateways])
  useEffect(() => { setStorageItem('ep_settings', settings) }, [settings])
  useEffect(() => { setStorageItem('ep_invoice_count', invoiceCount) }, [invoiceCount])
  useEffect(() => { setStorageItem('ep_quote_count', quoteCount) }, [quoteCount])
  useEffect(() => { setStorageItem('ep_credit_note_count', creditNoteCount) }, [creditNoteCount])
  useEffect(() => { setStorageItem('ep_logged_in', isLoggedIn) }, [isLoggedIn])
  useEffect(() => { setStorageItem('ep_lang', language) }, [language])
  useEffect(() => { setStorageItem('ep_user_modules', userModules) }, [userModules])
  
  // Audit log helper
  const addAuditEntry = useCallback((action: AuditEntry['action'], entityType: AuditEntry['entityType'], entityId: string, details: string) => {
    const entry: AuditEntry = { id: generateId(), action, entityType, entityId, details, timestamp: new Date().toISOString() }
    setAuditLog(prev => [entry, ...prev].slice(0, 1000))
  }, [])
  
  // Metrics
  const metrics = {
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    pendingAmount: invoices.filter(i => i.status === 'sent').reduce((s, i) => s + i.total, 0) + paymentLinks.filter(l => l.status === 'pending').reduce((s, l) => s + l.amount, 0),
    totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
    activeClients: clients.length,
    tvaCollected: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.tvaAmount, 0),
    tvaDeductible: expenses.filter(e => e.tvaDeductible).reduce((s, e) => s + e.tvaAmount, 0),
    conversionRate: leads.length > 0 ? Math.round((leads.filter(l => l.status === 'won').length / leads.length) * 100) : 0,
  }
  
  // ==================== LANDING PAGE ====================
  // Show loading state during hydration to prevent flash
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse">
            E
          </div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }
  
  if (showLanding && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">E</div>
              <span className="text-xl font-bold text-gray-800">Epaiement.ma</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}>
                <Globe className="w-5 h-5" />
              </Button>
              <Button variant="ghost" onClick={() => { setIsLoggedIn(true); setShowLanding(false) }}>
                {language === 'fr' ? 'Connexion' : 'تسجيل الدخول'}
              </Button>
              <Button onClick={() => { setIsLoggedIn(true); setShowLanding(false) }} className="bg-blue-600 hover:bg-blue-700">
                {language === 'fr' ? 'Essai gratuit' : 'تجربة مجانية'}
              </Button>
            </div>
          </div>
        </header>
        
        <section className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700"><Sparkles className="w-4 h-4 mr-1" />{language === 'fr' ? 'Conforme DGI 2026' : 'متوافق مع DGI 2026'}</Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {language === 'fr' ? <>Gérez votre <span className="text-blue-600">facturation</span> en toute simplicité</> : <>أدر <span className="text-blue-600">فواتيرك</span> بسهولة تامة</>}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {language === 'fr' ? 'Solution marocaine modulaire de facturation électronique. Payez uniquement pour les fonctionnalités dont vous avez besoin.' : 'حل مغربي معياري للفواتير الإلكترونية. ادفع فقط مقابل الميزات التي تحتاجها.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => { setIsLoggedIn(true); setShowLanding(false) }} className="bg-blue-600 hover:bg-blue-700 text-lg px-8 h-14">
                {language === 'fr' ? 'Commencer gratuitement' : 'ابدأ مجاناً'}
              </Button>
            </div>
          </div>
        </section>
        
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">{language === 'fr' ? 'Modules disponibles' : 'الوحدات المتاحة'}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {Object.entries(MODULES_CONFIG).slice(0, 6).map(([id, mod]) => (
                <Card key={id} className="border-0 shadow-lg hover:shadow-xl transition">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{language === 'ar' ? mod.nameAr : mod.name}</h3>
                    <p className="text-gray-600 mb-2">{language === 'ar' ? mod.descriptionAr : mod.description}</p>
                    <Badge variant={mod.price === 0 ? 'default' : 'outline'}>{mod.price === 0 ? (language === 'fr' ? 'Gratuit' : 'مجاني') : `${mod.price} MAD/${language === 'fr' ? 'mois' : 'شهر'}`}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        <footer className="bg-gray-900 text-gray-400 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p>© 2025 Epaiement.ma - {language === 'fr' ? 'Solution de facturation conforme DGI 2026' : 'حل فواتير متوافق مع DGI 2026'}</p>
          </div>
        </footer>
      </div>
    )
  }
  
  // ==================== MAIN APP ====================
  return (
    <div className="min-h-screen bg-gray-50 flex" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <ToastContainer language={language} />
      
      {/* Sidebar */}
      <Sidebar
        userModules={userModules}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={() => { setIsLoggedIn(false); setShowLanding(true) }}
        onNavigate={setCurrentPage}
        currentPage={currentPage}
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <Header
          user={{ id: '1', name: 'Utilisateur', email: 'user@example.com', company: settings.companyName }}
          language={language}
          onLanguageChange={setLanguage}
          onLogout={() => { setIsLoggedIn(false); setShowLanding(true) }}
        />
        
        <div className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header with Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t(currentPage as keyof typeof translations.fr) || t('dashboard')}</h1>
                <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder={t('search') + '...'} className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                {['invoices', 'quotes', 'clients', 'suppliers', 'expenses', 'payment-links', 'credit-notes', 'leads', 'tasks'].includes(currentPage) && (
                  <Button onClick={() => setDialogOpen(`new-${currentPage}`)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /><span className="hidden sm:inline">{t('new')}</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* ==================== DASHBOARD ==================== */}
            {currentPage === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{t('totalRevenue')}</p>
                          <p className="text-xl font-bold text-emerald-600">{formatCurrency(metrics.totalRevenue)}</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-amber-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{t('pendingPayments')}</p>
                          <p className="text-xl font-bold text-amber-600">{formatCurrency(metrics.pendingAmount)}</p>
                        </div>
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{t('totalExpenses')}</p>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</p>
                        </div>
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{t('activeClients')}</p>
                          <p className="text-xl font-bold text-blue-600">{metrics.activeClients}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader><CardTitle className="text-lg">{t('quickActions')}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {[
                        { label: t('createInvoice'), icon: FileText, action: () => setDialogOpen('new-invoices') },
                        { label: t('createQuote'), icon: FileCheck, action: () => setDialogOpen('new-quotes') },
                        { label: t('createPaymentLink'), icon: Link2, action: () => setDialogOpen('new-payment-links') },
                        { label: t('addClient'), icon: Users, action: () => setDialogOpen('new-clients') },
                        { label: t('expenses'), icon: Wallet, action: () => setDialogOpen('new-expenses') },
                        { label: t('addLead'), icon: UserPlus, action: () => setDialogOpen('new-leads') },
                      ].map((action, i) => (
                        <button key={i} onClick={action.action} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                          <action.icon className="w-8 h-8 text-blue-500" />
                          <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader><CardTitle className="text-lg">{language === 'fr' ? 'Résumé TVA' : 'ملخص ضريبة القيمة المضافة'}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('tvaCollected')}</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(metrics.tvaCollected)}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-500">{t('tvaDeductible')}</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.tvaDeductible)}</p>
                      </div>
                      <div className={`p-4 rounded-lg ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                        <p className="text-sm text-gray-500">{t('tvaToPay')}</p>
                        <p className={`text-xl font-bold ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(Math.abs(metrics.tvaCollected - metrics.tvaDeductible))}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* ==================== MODULES PAGE ==================== */}
            {currentPage === 'modules' && (
              <ModulePricing
                language={language}
                subscribedModules={userModules}
                onSubscribe={(moduleId) => {
                  const mod = MODULES_CONFIG[moduleId as keyof typeof MODULES_CONFIG]
                  if (mod?.dependencies) {
                    const depsMet = mod.dependencies.every(d => userModules.includes(d))
                    if (!depsMet) {
                      showToast(language === 'fr' ? 'Dépendances non satisfaites' : 'التبعيات غير ملباة', 'error')
                      return
                    }
                  }
                  setUserModules([...userModules, moduleId])
                  showToast(language === 'fr' ? 'Module activé!' : 'تم تفعيل الوحدة!')
                }}
                onUnsubscribe={(moduleId) => {
                  // Prevent unsubscribing from free modules
                  const freeModules = ['dashboard', 'invoices', 'payment-links', 'clients', 'suppliers']
                  if (freeModules.includes(moduleId)) return
                  setUserModules(userModules.filter(m => m !== moduleId))
                  showToast(language === 'fr' ? 'Module désactivé' : 'تم تعطيل الوحدة')
                }}
                onSubscribeBundle={(bundleId) => {
                  // In real app, this would handle payment
                  showToast(language === 'fr' ? 'Forfait activé!' : 'تم تفعيل الباقة!')
                }}
              />
            )}
            
            {/* ==================== PAYMENT LINKS ==================== */}
            {currentPage === 'payment-links' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {paymentLinks.length === 0 ? (
                        <div className="text-center py-16">
                          <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{language === 'fr' ? 'Aucun lien de paiement' : 'لا توجد روابط دفع'}</p>
                          <Button onClick={() => setDialogOpen('new-payment-links')} className="bg-purple-600">{t('createPaymentLink')}</Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {paymentLinks.map(link => (
                            <div key={link.id} className="p-4 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Link2 className="w-5 h-5 text-purple-600" /></div>
                                  <div>
                                    <p className="font-medium">{link.description}</p>
                                    <p className="text-sm text-gray-500">{link.reference} • {formatDate(link.createdAt)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(link.amount)}</p>
                                    <Badge variant={link.status === 'paid' ? 'default' : link.status === 'expired' ? 'destructive' : 'secondary'}>
                                      {link.status === 'paid' ? t('paid') : link.status === 'expired' ? t('expired') : t('pending')}
                                    </Badge>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(`https://epaiement.ma/pay/${link.reference}`); showToast(language === 'fr' ? 'Lien copié!' : 'تم نسخ الرابط!') }}><Copy className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                      const text = language === 'fr' ? `Bonjour, voici votre lien de paiement: https://epaiement.ma/pay/${link.reference} - Montant: ${formatCurrency(link.amount)}` : `مرحباً، هذا رابط الدفع الخاص بك: https://epaiement.ma/pay/${link.reference} - المبلغ: ${formatCurrency(link.amount)}`
                                      window.open(`https://wa.me/${link.clientPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank')
                                    }}><MessageCircle className="w-4 h-4 text-green-600" /></Button>
                                  </div>
                                </div>
                              </div>
                              {link.status === 'pending' && (
                                <div className="mt-3 flex justify-center">
                                  <div className="bg-white p-2 rounded-lg border"><QRCodeSVG value={`https://epaiement.ma/pay/${link.reference}`} size={100} /></div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
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
                      {invoices.length === 0 ? (
                        <div className="text-center py-16">
                          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{language === 'fr' ? 'Aucune facture' : 'لا توجد فواتير'}</p>
                          <Button onClick={() => setDialogOpen('new-invoices')} className="bg-blue-600">{t('createInvoice')}</Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {invoices.map(invoice => (
                            <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
                                <div>
                                  <p className="font-medium">{invoice.number}</p>
                                  <p className="text-sm text-gray-500">{clients.find(c => c.id === invoice.clientId)?.name || 'Client'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                                  <Badge variant={invoice.status === 'paid' ? 'default' : invoice.status === 'overdue' ? 'destructive' : 'secondary'}>
                                    {invoice.status === 'paid' ? t('paid') : invoice.status === 'overdue' ? t('overdue') : invoice.status === 'sent' ? t('sent') : t('draft')}
                                  </Badge>
                                </div>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(invoice); setDialogOpen('view-invoice') }}><Eye className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => { setInvoices(invoices.filter(i => i.id !== invoice.id)); showToast(language === 'fr' ? 'Facture supprimée' : 'تم حذف الفاتورة') }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
                      {clients.length === 0 ? (
                        <div className="text-center py-16">
                          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{language === 'fr' ? 'Aucun client' : 'لا يوجد عملاء'}</p>
                          <Button onClick={() => setDialogOpen('new-clients')} className="bg-blue-600">{t('addClient')}</Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(client => (
                            <div key={client.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><span className="font-medium text-blue-600">{client.name.charAt(0).toUpperCase()}</span></div>
                                <div>
                                  <p className="font-medium">{client.name}</p>
                                  <p className="text-sm text-gray-500">{client.email} {client.ice && `• ICE: ${client.ice}`}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedItem(client); setDialogOpen('client-statement') }}><FileBarChart className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => { setClients(clients.filter(c => c.id !== client.id)); showToast(language === 'fr' ? 'Client supprimé' : 'تم حذف العميل') }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
            
            {/* ==================== EXPENSES ==================== */}
            {currentPage === 'expenses' && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-280px)]">
                      {expenses.length === 0 ? (
                        <div className="text-center py-16">
                          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{language === 'fr' ? 'Aucune dépense' : 'لا توجد مصاريف'}</p>
                          <Button onClick={() => setDialogOpen('new-expenses')} className="bg-red-600">{language === 'fr' ? 'Ajouter une dépense' : 'إضافة مصروف'}</Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {expenses.map(expense => (
                            <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><Wallet className="w-5 h-5 text-red-600" /></div>
                                <div>
                                  <p className="font-medium">{expense.description}</p>
                                  <p className="text-sm text-gray-500">{expense.category} • {formatDate(expense.date)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-semibold text-red-600">{formatCurrency(expense.amount)}</p>
                                  {expense.tvaDeductible && <p className="text-sm text-gray-500">TVA: {formatCurrency(expense.tvaAmount)}</p>}
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { setExpenses(expenses.filter(e => e.id !== expense.id)); showToast(language === 'fr' ? 'Dépense supprimée' : 'تم حذف المصروف') }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
            
            {/* ==================== LEADS ==================== */}
            {currentPage === 'leads' && userModules.includes('crm') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-sm text-gray-500">{t('totalLeads')}</p><p className="text-2xl font-bold text-blue-600">{leads.length}</p></CardContent></Card>
                  <Card className="border-l-4 border-l-emerald-500"><CardContent className="p-4"><p className="text-sm text-gray-500">{t('newLeads')}</p><p className="text-2xl font-bold text-emerald-600">{leads.filter(l => l.status === 'new').length}</p></CardContent></Card>
                  <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-sm text-gray-500">{language === 'fr' ? 'Gagnés' : 'مكتسب'}</p><p className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'won').length}</p></CardContent></Card>
                  <Card className="border-l-4 border-l-purple-500"><CardContent className="p-4"><p className="text-sm text-gray-500">{t('conversionRate')}</p><p className="text-2xl font-bold text-purple-600">{metrics.conversionRate}%</p></CardContent></Card>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-420px)]">
                      {leads.length === 0 ? (
                        <div className="text-center py-16">
                          <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{language === 'fr' ? 'Aucun prospect' : 'لا يوجد عملاء محتملين'}</p>
                          <Button onClick={() => setDialogOpen('new-leads')} className="bg-blue-600">{t('addLead')}</Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {leads.map(lead => (
                            <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><span className="font-medium text-blue-600">{lead.name.charAt(0).toUpperCase()}</span></div>
                                <div>
                                  <p className="font-medium">{lead.name}</p>
                                  <p className="text-sm text-gray-500">{lead.company} • {lead.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge className={LEAD_STATUSES.find(s => s.value === lead.status)?.color}>{LEAD_STATUSES.find(s => s.value === lead.status)?.label}</Badge>
                                {!lead.convertedToClientId && lead.status !== 'won' && (
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    const newClient: Client = { id: generateId(), name: lead.name, email: lead.email, phone: lead.phone, ice: '', address: '', city: '', createdAt: new Date().toISOString() }
                                    setClients([...clients, newClient])
                                    setLeads(leads.map(l => l.id === lead.id ? { ...l, convertedToClientId: newClient.id, status: 'won' } : l))
                                    showToast(language === 'fr' ? 'Prospect converti en client!' : 'تم تحويل العميل المحتمل إلى عميل!')
                                  }} className="text-green-600"><UserCheck className="w-4 h-4 mr-1" />{language === 'fr' ? 'Convertir' : 'تحويل'}</Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => { setLeads(leads.filter(l => l.id !== lead.id)); showToast(language === 'fr' ? 'Prospect supprimé' : 'تم حذف العميل المحتمل') }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
            
            {/* ==================== TASKS ==================== */}
            {currentPage === 'tasks' && userModules.includes('crm') && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-gray-400"><CardContent className="p-4"><p className="text-sm text-gray-500">{language === 'fr' ? 'En attente' : 'قيد الانتظار'}</p><p className="text-2xl font-bold text-gray-600">{tasks.filter(t => t.status === 'pending').length}</p></CardContent></Card>
                  <Card className="border-l-4 border-l-blue-500"><CardContent className="p-4"><p className="text-sm text-gray-500">{language === 'fr' ? 'En cours' : 'جارية'}</p><p className="text-2xl font-bold text-blue-600">{tasks.filter(t => t.status === 'in_progress').length}</p></CardContent></Card>
                  <Card className="border-l-4 border-l-green-500"><CardContent className="p-4"><p className="text-sm text-gray-500">{language === 'fr' ? 'Terminées' : 'مكتملة'}</p><p className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'completed').length}</p></CardContent></Card>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[calc(100vh-380px)]">
                      {tasks.length === 0 ? (
                        <div className="text-center py-16">
                          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-4">{language === 'fr' ? 'Aucune tâche' : 'لا توجد مهام'}</p>
                          <Button onClick={() => setDialogOpen('new-tasks')} className="bg-blue-600">{t('addTask')}</Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {tasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                              <div className="flex items-center gap-4">
                                <button onClick={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t))} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>{task.status === 'completed' && <CheckCircle className="w-4 h-4" />}</button>
                                <div>
                                  <p className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <span className={TASK_PRIORITIES.find(p => p.value === task.priority)?.color + ' px-2 py-0.5 rounded'}>{TASK_PRIORITIES.find(p => p.value === task.priority)?.label}</span>
                                    {task.dueDate && <><Calendar className="w-3 h-3 ml-2" /><span>{formatDate(task.dueDate)}</span></>}
                                  </div>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => { setTasks(tasks.filter(t => t.id !== task.id)); showToast(language === 'fr' ? 'Tâche supprimée' : 'تم حذف المهمة') }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* ==================== AUDIT LOG ==================== */}
            {currentPage === 'audit' && userModules.includes('audit') && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t('auditLog')}</CardTitle>
                  <Button variant="outline" onClick={() => showToast(language === 'fr' ? 'Export du journal en cours...' : 'جاري تصدير السجل...')}><Download className="w-4 h-4 mr-2" />{t('exportAuditLog')}</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-340px)]">
                    {auditLog.length === 0 ? (
                      <div className="text-center py-16"><FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">{language === 'fr' ? 'Aucune entrée dans le journal' : 'لا توجد إدخالات في السجل'}</p></div>
                    ) : (
                      <div className="divide-y">
                        {auditLog.map(entry => (
                          <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entry.action === 'create' ? 'bg-green-100 text-green-600' : entry.action === 'update' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                {entry.action === 'create' ? <Plus className="w-5 h-5" /> : entry.action === 'update' ? <Edit className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="font-medium"><span className="text-gray-500">{AUDIT_ACTIONS.find(a => a.value === entry.action)?.label}</span> <Badge variant="outline">{AUDIT_ENTITY_TYPES.find(e => e.value === entry.entityType)?.label}</Badge></p>
                                <p className="text-sm text-gray-500">{entry.details}</p>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-500"><p>{formatDate(entry.timestamp)}</p><p>{new Date(entry.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
            
            {/* ==================== GATEWAYS ==================== */}
            {currentPage === 'gateways' && userModules.includes('integrations') && (
              <PaymentGatewayForm
                language={language}
                existingGateways={gateways}
                onSave={(gw) => { setGateways([...gateways, gw]); showToast(language === 'fr' ? 'Passerelle configurée!' : 'تم تكوين البوابة!') }}
                onDelete={(id) => { setGateways(gateways.filter(g => g.id !== id)); showToast(language === 'fr' ? 'Passerelle supprimée' : 'تم حذف البوابة') }}
                onTest={(id) => showToast(language === 'fr' ? 'Test en cours...' : 'جاري الاختبار...')}
              />
            )}
            
            {/* ==================== AI LEAD QUALIFIER ==================== */}
            {currentPage === 'ai-lead-qualifier' && userModules.includes('ai-lead-qualifier') && (
              <AILeadQualifierDashboard language={language} />
            )}
            
            {/* ==================== SETTINGS ==================== */}
            {currentPage === 'settings' && (
              <CompanyForm
                language={language}
                initialData={{
                  name: settings.companyName,
                  ice: settings.companyIce,
                  if: settings.companyIf,
                  rc: settings.companyRc,
                  patente: settings.companyPatente,
                  cnss: settings.companyCnss,
                  address: settings.companyAddress,
                  city: settings.companyCity,
                  phone: settings.companyPhone,
                  email: settings.companyEmail,
                  autoEntrepreneur: settings.autoEntrepreneur,
                  defaultTvaRate: settings.defaultTvaRate,
                  invoicePrefix: settings.invoicePrefix,
                  remindersEnabled: settings.remindersEnabled,
                  reminderDays: settings.reminderDays,
                  reminderMethod: settings.reminderMethod,
                }}
                onSave={(data) => {
                  setSettings({
                    ...settings,
                    companyName: data.name,
                    companyIce: data.ice,
                    companyIf: data.if,
                    companyRc: data.rc,
                    companyPatente: data.patente,
                    companyCnss: data.cnss,
                    companyAddress: data.address,
                    companyCity: data.city,
                    companyPhone: data.phone,
                    companyEmail: data.email,
                    autoEntrepreneur: data.autoEntrepreneur,
                    defaultTvaRate: data.defaultTvaRate,
                    invoicePrefix: data.invoicePrefix,
                    remindersEnabled: data.remindersEnabled,
                    reminderDays: data.reminderDays,
                    reminderMethod: data.reminderMethod,
                  })
                  showToast(language === 'fr' ? 'Paramètres enregistrés!' : 'تم حفظ الإعدادات!')
                }}
              />
            )}
          </div>
        </div>
      </main>
      
      {/* ==================== DIALOGS ==================== */}
      {/* New Client Dialog */}
      <Dialog open={dialogOpen === 'new-clients'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('addClient')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{language === 'fr' ? 'Nom' : 'الاسم'}</Label><Input value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} /></div>
            <div><Label>ICE</Label><Input value={newClient.ice} onChange={e => setNewClient({ ...newClient, ice: e.target.value })} placeholder="001234567890123" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} /></div>
              <div><Label>{language === 'fr' ? 'Téléphone' : 'الهاتف'}</Label><Input value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{language === 'fr' ? 'Annuler' : 'إلغاء'}</Button>
            <Button onClick={() => {
              const client: Client = { id: generateId(), ...newClient, createdAt: new Date().toISOString() }
              setClients([...clients, client])
              addAuditEntry('create', 'client', client.id, `Nouveau client: ${newClient.name}`)
              setNewClient({ name: '', ice: '', email: '', phone: '', address: '', city: '' })
              setDialogOpen(null)
              showToast(language === 'fr' ? 'Client ajouté!' : 'تم إضافة العميل!')
            }}>{language === 'fr' ? 'Ajouter' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Payment Link Dialog */}
      <Dialog open={dialogOpen === 'new-payment-links'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('createPaymentLink')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{language === 'fr' ? 'Montant (MAD)' : 'المبلغ (درهم)'}</Label><Input type="number" value={newPaymentLink.amount} onChange={e => setNewPaymentLink({ ...newPaymentLink, amount: Number(e.target.value) })} /></div>
            <div><Label>{language === 'fr' ? 'Description' : 'الوصف'}</Label><Input value={newPaymentLink.description} onChange={e => setNewPaymentLink({ ...newPaymentLink, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input type="email" value={newPaymentLink.clientEmail} onChange={e => setNewPaymentLink({ ...newPaymentLink, clientEmail: e.target.value })} /></div>
              <div><Label>{language === 'fr' ? 'Téléphone' : 'الهاتف'}</Label><Input value={newPaymentLink.clientPhone} onChange={e => setNewPaymentLink({ ...newPaymentLink, clientPhone: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{language === 'fr' ? 'Annuler' : 'إلغاء'}</Button>
            <Button onClick={() => {
              const link: PaymentLink = { id: generateId(), ...newPaymentLink, reference: generateReference(), status: 'pending', createdAt: new Date().toISOString() }
              setPaymentLinks([...paymentLinks, link])
              setNewPaymentLink({ amount: 0, description: '', clientEmail: '', clientPhone: '', dueDate: '' })
              setDialogOpen(null)
              showToast(language === 'fr' ? 'Lien de paiement créé!' : 'تم إنشاء رابط الدفع!')
            }}>{t('generateLink')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Expense Dialog */}
      <Dialog open={dialogOpen === 'new-expenses'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === 'fr' ? 'Ajouter une dépense' : 'إضافة مصروف'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{language === 'fr' ? 'Description' : 'الوصف'}</Label><Input value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{language === 'fr' ? 'Montant (MAD)' : 'المبلغ (درهم)'}</Label><Input type="number" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} /></div>
              <div><Label>{language === 'fr' ? 'Catégorie' : 'الفئة'}</Label>
                <Select value={newExpense.category} onValueChange={v => setNewExpense({ ...newExpense, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newExpense.tvaDeductible} onCheckedChange={v => setNewExpense({ ...newExpense, tvaDeductible: v })} />
              <Label>{language === 'fr' ? 'TVA déductible' : 'ضريبة القيمة المضافة قابلة للخصم'}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{language === 'fr' ? 'Annuler' : 'إلغاء'}</Button>
            <Button onClick={() => {
              const tvaAmount = newExpense.tvaDeductible ? newExpense.amount * (newExpense.tvaRate / 100) : 0
              const expense: Expense = { id: generateId(), ...newExpense, tvaAmount, createdAt: new Date().toISOString() }
              setExpenses([...expenses, expense])
              addAuditEntry('create', 'expense', expense.id, `Dépense: ${newExpense.description}`)
              setNewExpense({ description: '', amount: 0, category: 'Autres', date: new Date().toISOString().split('T')[0], tvaDeductible: true, tvaRate: 20 })
              setDialogOpen(null)
              showToast(language === 'fr' ? 'Dépense ajoutée!' : 'تم إضافة المصروف!')
            }}>{language === 'fr' ? 'Ajouter' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Lead Dialog */}
      <Dialog open={dialogOpen === 'new-leads'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('addLead')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{language === 'fr' ? 'Nom' : 'الاسم'}</Label><Input value={newLead.name || ''} onChange={e => setNewLead({ ...newLead, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Email</Label><Input value={newLead.email || ''} onChange={e => setNewLead({ ...newLead, email: e.target.value })} /></div>
              <div><Label>{language === 'fr' ? 'Téléphone' : 'الهاتف'}</Label><Input value={newLead.phone || ''} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} /></div>
            </div>
            <div><Label>{language === 'fr' ? 'Entreprise' : 'الشركة'}</Label><Input value={newLead.company || ''} onChange={e => setNewLead({ ...newLead, company: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{language === 'fr' ? 'Source' : 'المصدر'}</Label>
                <Select value={newLead.source || 'website'} onValueChange={v => setNewLead({ ...newLead, source: v as Lead['source'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAD_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{language === 'fr' ? 'Statut' : 'الحالة'}</Label>
                <Select value={newLead.status || 'new'} onValueChange={v => setNewLead({ ...newLead, status: v as Lead['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{language === 'fr' ? 'Annuler' : 'إلغاء'}</Button>
            <Button onClick={() => {
              const lead: Lead = { id: generateId(), name: newLead.name || '', email: newLead.email || '', phone: newLead.phone || '', company: newLead.company || '', source: newLead.source || 'website', status: newLead.status || 'new', notes: newLead.notes || '', createdAt: new Date().toISOString() }
              setLeads([...leads, lead])
              addAuditEntry('create', 'lead', lead.id, `Nouveau prospect: ${newLead.name}`)
              setNewLead({ name: '', email: '', phone: '', company: '', source: 'website', status: 'new', notes: '' })
              setDialogOpen(null)
              showToast(language === 'fr' ? 'Prospect ajouté!' : 'تم إضافة العميل المحتمل!')
            }}>{language === 'fr' ? 'Ajouter' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Task Dialog */}
      <Dialog open={dialogOpen === 'new-tasks'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('addTask')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{language === 'fr' ? 'Titre' : 'العنوان'}</Label><Input value={newTask.title || ''} onChange={e => setNewTask({ ...newTask, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>{language === 'fr' ? 'Date d\'échéance' : 'تاريخ الاستحقاق'}</Label><Input type="date" value={newTask.dueDate || ''} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} /></div>
              <div><Label>{language === 'fr' ? 'Priorité' : 'الأولوية'}</Label>
                <Select value={newTask.priority || 'medium'} onValueChange={v => setNewTask({ ...newTask, priority: v as Task['priority'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{language === 'fr' ? 'Annuler' : 'إلغاء'}</Button>
            <Button onClick={() => {
              const task: Task = { id: generateId(), title: newTask.title || '', description: newTask.description || '', dueDate: newTask.dueDate || '', priority: newTask.priority || 'medium', status: 'pending', relatedClientId: newTask.relatedClientId, createdAt: new Date().toISOString() }
              setTasks([...tasks, task])
              addAuditEntry('create', 'task', task.id, `Nouvelle tâche: ${newTask.title}`)
              setNewTask({ title: '', description: '', dueDate: '', priority: 'medium', status: 'pending', relatedClientId: '' })
              setDialogOpen(null)
              showToast(language === 'fr' ? 'Tâche ajoutée!' : 'تم إضافة المهمة!')
            }}>{language === 'fr' ? 'Ajouter' : 'إضافة'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* New Invoice Dialog */}
      <Dialog open={dialogOpen === 'new-invoices'} onOpenChange={() => setDialogOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('createInvoice')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>{language === 'fr' ? 'Client' : 'العميل'}</Label>
              <Select value={newInvoice.clientId} onValueChange={v => setNewInvoice({ ...newInvoice, clientId: v })}>
                <SelectTrigger><SelectValue placeholder={language === 'fr' ? 'Sélectionner un client' : 'اختر عميلاً'} /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'fr' ? 'Articles' : 'البنود'}</Label>
              {newInvoice.items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-2">
                  <Input className="col-span-5" placeholder={language === 'fr' ? 'Description' : 'الوصف'} value={item.description} onChange={e => { const items = [...newInvoice.items]; items[idx].description = e.target.value; setNewInvoice({ ...newInvoice, items }) }} />
                  <Input className="col-span-2" type="number" placeholder="Qté" value={item.quantity} onChange={e => { const items = [...newInvoice.items]; items[idx].quantity = Number(e.target.value); setNewInvoice({ ...newInvoice, items }) }} />
                  <Input className="col-span-2" type="number" placeholder="Prix" value={item.unitPrice} onChange={e => { const items = [...newInvoice.items]; items[idx].unitPrice = Number(e.target.value); setNewInvoice({ ...newInvoice, items }) }} />
                  <Select value={String(item.tvaRate)} onValueChange={v => { const items = [...newInvoice.items]; items[idx].tvaRate = Number(v); setNewInvoice({ ...newInvoice, items }) }}>
                    <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                    <SelectContent>{TVA_RATES.map(r => <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="col-span-1" onClick={() => { if (newInvoice.items.length > 1) setNewInvoice({ ...newInvoice, items: newInvoice.items.filter((_, i) => i !== idx) }) }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setNewInvoice({ ...newInvoice, items: [...newInvoice.items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: settings.defaultTvaRate }] })}><Plus className="w-4 h-4 mr-2" />{language === 'fr' ? 'Ajouter une ligne' : 'إضافة بند'}</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(null)}>{language === 'fr' ? 'Annuler' : 'إلغاء'}</Button>
            <Button onClick={() => {
              const subtotal = newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
              const tvaAmount = newInvoice.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.tvaRate / 100), 0)
              const invoice: Invoice = { id: generateId(), number: generateInvoiceNumber(settings.invoicePrefix, invoiceCount), clientId: newInvoice.clientId, items: newInvoice.items, subtotal, tvaAmount, total: subtotal + tvaAmount, status: 'draft', createdAt: new Date().toISOString(), dueDate: newInvoice.dueDate }
              setInvoices([...invoices, invoice])
              setInvoiceCount(invoiceCount + 1)
              addAuditEntry('create', 'invoice', invoice.id, `Facture créée: ${invoice.number}`)
              setNewInvoice({ clientId: '', items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }], dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: '', isRecurring: false, recurringFrequency: 'monthly' })
              setDialogOpen(null)
              showToast(language === 'fr' ? 'Facture créée!' : 'تم إنشاء الفاتورة!')
            }}>{language === 'fr' ? 'Créer' : 'إنشاء'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Client Statement Dialog */}
      <Dialog open={dialogOpen === 'client-statement'} onOpenChange={() => { setDialogOpen(null); setSelectedItem(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('clientStatement')} - {selectedItem?.name}</DialogTitle></DialogHeader>
          {selectedItem && (() => {
            const clientInvoices = invoices.filter(i => i.clientId === selectedItem.id)
            const totalInvoiced = clientInvoices.reduce((s, i) => s + i.total, 0)
            const totalPaid = clientInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
            const balanceDue = totalInvoiced - totalPaid
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg"><p className="text-sm text-gray-500">{language === 'fr' ? 'Total facturé' : 'إجمالي الفواتير'}</p><p className="text-xl font-bold text-blue-600">{formatCurrency(totalInvoiced)}</p></div>
                  <div className="p-4 bg-green-50 rounded-lg"><p className="text-sm text-gray-500">{language === 'fr' ? 'Total payé' : 'إجمالي المدفوع'}</p><p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p></div>
                  <div className={`p-4 rounded-lg ${balanceDue > 0 ? 'bg-red-50' : 'bg-green-50'}`}><p className="text-sm text-gray-500">{language === 'fr' ? 'Solde dû' : 'الرصيد المستحق'}</p><p className={`text-xl font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(balanceDue)}</p></div>
                </div>
                <div className="space-y-2">{clientInvoices.map(inv => (
                  <div key={inv.id} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <div><p className="font-medium">{inv.number}</p><p className="text-sm text-gray-500">{formatDate(inv.createdAt)}</p></div>
                    <div className="text-right"><p className="font-semibold">{formatCurrency(inv.total)}</p><Badge variant={inv.status === 'paid' ? 'default' : 'secondary'}>{inv.status === 'paid' ? t('paid') : inv.status === 'sent' ? t('sent') : t('draft')}</Badge></div>
                  </div>
                ))}</div>
              </div>
            )
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(null); setSelectedItem(null) }}>{language === 'fr' ? 'Fermer' : 'إغلاق'}</Button>
            <Button onClick={() => showToast(language === 'fr' ? 'Export PDF en cours...' : 'جاري تصدير PDF...')}><Download className="w-4 h-4 mr-2" />PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
