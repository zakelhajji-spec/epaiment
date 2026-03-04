// Dashboard Constants

// TVA Rates for Morocco
export const TVA_RATES = [
  { value: 20, label: '20% - Normal' },
  { value: 14, label: '14% - Services' },
  { value: 10, label: '10% - Hôtels' },
  { value: 7, label: '7% - Eau/Élec.' },
  { value: 0, label: '0% - Exonéré' },
] as const

// Format currency in MAD
export const formatCurrency = (amount: number): string => 
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount)

// Format date
export const formatDate = (date: string): string => {
  try {
    return new Date(date).toLocaleDateString('fr-MA')
  } catch {
    return date
  }
}

// Generate unique ID
export const generateId = (): string => 
  Math.random().toString(36).substring(2, 9)

// Translation helper factory
export const createTranslator = (language: 'fr' | 'ar') => 
  (fr: string, ar: string) => language === 'ar' ? ar : fr

// Invoice status labels
export const INVOICE_STATUS_LABELS = {
  draft: { fr: 'Brouillon', ar: 'مسودة' },
  sent: { fr: 'Envoyée', ar: 'مرسلة' },
  paid: { fr: 'Payée', ar: 'مدفوعة' },
  overdue: { fr: 'En retard', ar: 'متأخرة' },
} as const

// Payment link status labels
export const PAYMENT_LINK_STATUS_LABELS = {
  pending: { fr: 'En attente', ar: 'معلقة' },
  paid: { fr: 'Payé', ar: 'مدفوع' },
  expired: { fr: 'Expiré', ar: 'منتهي' },
} as const

// Page titles
export const PAGE_TITLES: Record<string, { fr: string; ar: string }> = {
  dashboard: { fr: 'Tableau de bord', ar: 'لوحة التحكم' },
  invoices: { fr: 'Factures', ar: 'الفواتير' },
  'payment-links': { fr: 'Liens de paiement', ar: 'روابط الدفع' },
  clients: { fr: 'Clients', ar: 'العملاء' },
  modules: { fr: 'Modules', ar: 'الوحدات' },
  settings: { fr: 'Paramètres', ar: 'الإعدادات' },
  leads: { fr: 'Prospects', ar: 'العملاء المحتملين' },
  tasks: { fr: 'Tâches', ar: 'المهام' },
  suppliers: { fr: 'Fournisseurs', ar: 'الموردين' },
  quotes: { fr: 'Devis', ar: 'العروض' },
  expenses: { fr: 'Dépenses', ar: 'المصروفات' },
  'credit-notes': { fr: 'Avoirs', ar: 'إشعارات دائنة' },
  reports: { fr: 'Rapports', ar: 'التقارير' },
  products: { fr: 'Produits', ar: 'المنتجات' },
  inventory: { fr: 'Inventaire', ar: 'المخزون' },
  team: { fr: 'Équipe', ar: 'الفريق' },
  'api-keys': { fr: 'Clés API', ar: 'مفاتيح API' },
  gateways: { fr: 'Passerelles', ar: 'البوابات' },
  audit: { fr: 'Audit', ar: 'التدقيق' },
  'ai-lead-qualifier': { fr: 'AI Lead', ar: 'AI Lead' },
}
