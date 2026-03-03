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
