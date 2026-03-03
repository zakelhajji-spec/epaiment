'use client'

import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { TVA_RATES, formatCurrency, generateId } from '../../constants'
import type { 
  Language, NewLeadForm, NewTaskForm, NewSupplierForm, 
  NewQuoteForm, NewExpenseForm, NewCreditNoteForm,
  NewProductForm, NewTeamMemberForm, NewApiKeyForm,
  Client, Invoice, InvoiceLineItem
} from '../../types'

// ============ Lead Dialog ============
interface LeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewLeadForm
  onFormDataChange: (data: NewLeadForm) => void
  onSubmit: () => void
  language: Language
}

export function LeadDialog({ open, onOpenChange, formData, onFormDataChange, onSubmit, language }: LeadDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Ajouter un prospect', 'إضافة عميل محتمل')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Nom *', 'الاسم *')}</Label>
            <Input value={formData.name} onChange={e => onFormDataChange({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Email', 'البريد الإلكتروني')}</Label>
              <Input type="email" value={formData.email} onChange={e => onFormDataChange({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Téléphone', 'الهاتف')}</Label>
              <Input value={formData.phone} onChange={e => onFormDataChange({...formData, phone: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Entreprise', 'الشركة')}</Label>
              <Input value={formData.company} onChange={e => onFormDataChange({...formData, company: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Source', 'المصدر')}</Label>
              <Select value={formData.source} onValueChange={v => onFormDataChange({...formData, source: v})}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Annuler', 'إلغاء')}</Button>
          <Button onClick={onSubmit} className="bg-violet-600">{t('Ajouter', 'إضافة')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ Task Dialog ============
interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewTaskForm
  onFormDataChange: (data: NewTaskForm) => void
  onSubmit: () => void
  language: Language
}

export function TaskDialog({ open, onOpenChange, formData, onFormDataChange, onSubmit, language }: TaskDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Ajouter une tâche', 'إضافة مهمة')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Titre *', 'العنوان *')}</Label>
            <Input value={formData.title} onChange={e => onFormDataChange({...formData, title: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>{t('Description', 'الوصف')}</Label>
            <Textarea value={formData.description} onChange={e => onFormDataChange({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Priorité', 'الأولوية')}</Label>
              <Select value={formData.priority} onValueChange={v => onFormDataChange({...formData, priority: v as any})}>
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
              <Input type="date" value={formData.dueDate} onChange={e => onFormDataChange({...formData, dueDate: e.target.value})} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Annuler', 'إلغاء')}</Button>
          <Button onClick={onSubmit} className="bg-violet-600">{t('Ajouter', 'إضافة')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ Supplier Dialog ============
interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewSupplierForm
  onFormDataChange: (data: NewSupplierForm) => void
  onSubmit: () => void
  language: Language
}

export function SupplierDialog({ open, onOpenChange, formData, onFormDataChange, onSubmit, language }: SupplierDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Ajouter un fournisseur', 'إضافة مورد')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Nom *', 'الاسم *')}</Label>
            <Input value={formData.name} onChange={e => onFormDataChange({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Email', 'البريد الإلكتروني')}</Label>
              <Input type="email" value={formData.email} onChange={e => onFormDataChange({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Téléphone', 'الهاتف')}</Label>
              <Input value={formData.phone} onChange={e => onFormDataChange({...formData, phone: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('ICE', 'ICE')}</Label>
              <Input value={formData.ice} onChange={e => onFormDataChange({...formData, ice: e.target.value})} maxLength={15} />
            </div>
            <div className="space-y-2">
              <Label>{t('Ville', 'المدينة')}</Label>
              <Input value={formData.city} onChange={e => onFormDataChange({...formData, city: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('Adresse', 'العنوان')}</Label>
            <Input value={formData.address} onChange={e => onFormDataChange({...formData, address: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Annuler', 'إلغاء')}</Button>
          <Button onClick={onSubmit} className="bg-emerald-600">{t('Ajouter', 'إضافة')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ Quote Dialog ============
interface QuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewQuoteForm
  onFormDataChange: (data: NewQuoteForm) => void
  onSubmit: () => void
  clients: Client[]
  language: Language
}

export function QuoteDialog({ open, onOpenChange, formData, onFormDataChange, onSubmit, clients, language }: QuoteDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  const updateItem = (idx: number, field: keyof InvoiceLineItem, value: string | number) => {
    const items = [...formData.items]
    if (field === 'tvaRate') {
      items[idx].tvaRate = value as number
    } else {
      (items[idx] as any)[field] = value
    }
    onFormDataChange({...formData, items})
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Créer un devis', 'إنشاء عرض')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Client', 'العميل')}</Label>
            <Select value={formData.clientId} onValueChange={v => onFormDataChange({...formData, clientId: v})}>
              <SelectTrigger><SelectValue placeholder={t('Sélectionner un client', 'اختر عميلاً')} /></SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('Articles', 'العناصر')}</Label>
            {formData.items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Input placeholder={t('Description', 'الوصف')} value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Input type="number" placeholder="Qté" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} />
                </div>
                <div className="col-span-2">
                  <Input type="number" placeholder="Prix" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-2">
                  <Select value={String(item.tvaRate)} onValueChange={v => updateItem(idx, 'tvaRate', parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TVA_RATES.map(rate => <SelectItem key={rate.value} value={String(rate.value)}>{rate.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (formData.items.length > 1) {
                      onFormDataChange({...formData, items: formData.items.filter((_, i) => i !== idx)})
                    }
                  }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => onFormDataChange({...formData, items: [...formData.items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }]})}>
              <Plus className="w-4 h-4 mr-2" /> {t('Ajouter une ligne', 'إضافة سطر')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Valide jusqu\'au', 'صالح حتى')}</Label>
              <Input type="date" value={formData.validUntil} onChange={e => onFormDataChange({...formData, validUntil: e.target.value})} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Annuler', 'إلغاء')}</Button>
          <Button onClick={onSubmit} className="bg-emerald-600">{t('Créer', 'إنشاء')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ Expense Dialog ============
interface ExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewExpenseForm
  onFormDataChange: (data: NewExpenseForm) => void
  onSubmit: () => void
  language: Language
}

export function ExpenseDialog({ open, onOpenChange, formData, onFormDataChange, onSubmit, language }: ExpenseDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Ajouter une dépense', 'إضافة مصروف')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Description *', 'الوصف *')}</Label>
            <Input value={formData.description} onChange={e => onFormDataChange({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Montant (MAD) *', 'المبلغ (درهم) *')}</Label>
              <Input type="number" value={formData.amount || ''} onChange={e => onFormDataChange({...formData, amount: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>{t('Catégorie', 'الفئة')}</Label>
              <Select value={formData.category} onValueChange={v => onFormDataChange({...formData, category: v})}>
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
              <Input type="date" value={formData.date} onChange={e => onFormDataChange({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('TVA (%)', 'الضريبة (%)')}</Label>
              <Select value={String(formData.tvaRate)} onValueChange={v => onFormDataChange({...formData, tvaRate: parseInt(v)})}>
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
            <Input value={formData.supplier} onChange={e => onFormDataChange({...formData, supplier: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Annuler', 'إلغاء')}</Button>
          <Button onClick={onSubmit} className="bg-amber-600">{t('Ajouter', 'إضافة')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ Credit Note Dialog ============
interface CreditNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewCreditNoteForm
  onFormDataChange: (data: NewCreditNoteForm) => void
  onSubmit: () => void
  invoices: Invoice[]
  language: Language
}

export function CreditNoteDialog({ open, onOpenChange, formData, onFormDataChange, onSubmit, invoices, language }: CreditNoteDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Créer un avoir', 'إنشاء إشعار دائن')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Facture associée', 'الفاتورة المرتبطة')}</Label>
            <Select value={formData.invoiceId} onValueChange={v => onFormDataChange({...formData, invoiceId: v})}>
              <SelectTrigger><SelectValue placeholder={t('Sélectionner une facture', 'اختر فاتورة')} /></SelectTrigger>
              <SelectContent>
                {invoices.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>{inv.number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('Motif', 'السبب')}</Label>
            <Textarea value={formData.reason} onChange={e => onFormDataChange({...formData, reason: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>{t('Montant (MAD)', 'المبلغ (درهم)')}</Label>
            <Input type="number" value={formData.amount || ''} onChange={e => onFormDataChange({...formData, amount: parseFloat(e.target.value) || 0})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Annuler', 'إلغاء')}</Button>
          <Button onClick={onSubmit} className="bg-amber-600">{t('Créer', 'إنشاء')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ Product Dialog ============
interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewProductForm
  onFormDataChange: (data: NewProductForm) => void
  onSubmit: () => void
  language: Language
}

export function ProductDialog({ open, onOpenChange, formData, onFormDataChange, onSubmit, language }: ProductDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Ajouter un produit', 'إضافة منتج')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Nom *', 'الاسم *')}</Label>
              <Input value={formData.name} onChange={e => onFormDataChange({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>{t('SKU', 'رمز المنتج')}</Label>
              <Input value={formData.sku} onChange={e => onFormDataChange({...formData, sku: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('Description', 'الوصف')}</Label>
            <Textarea value={formData.description} onChange={e => onFormDataChange({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('Prix (MAD)', 'السعر (درهم)')}</Label>
              <Input type="number" value={formData.price || ''} onChange={e => onFormDataChange({...formData, price: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>{t('TVA (%)', 'الضريبة (%)')}</Label>
              <Select value={String(formData.tvaRate)} onValueChange={v => onFormDataChange({...formData, tvaRate: parseInt(v)})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TVA_RATES.map(rate => <SelectItem key={rate.value} value={String(rate.value)}>{rate.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Stock initial', 'المخزون الأولي')}</Label>
              <Input type="number" value={formData.stock || ''} onChange={e => onFormDataChange({...formData, stock: parseInt(e.target.value) || 0})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('Catégorie', 'الفئة')}</Label>
            <Input value={formData.category} onChange={e => onFormDataChange({...formData, category: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Annuler', 'إلغاء')}</Button>
          <Button onClick={onSubmit} className="bg-red-600">{t('Ajouter', 'إضافة')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ Team Member Dialog ============
interface TeamMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewTeamMemberForm
  onFormDataChange: (data: NewTeamMemberForm) => void
  onSubmit: () => void
  language: Language
}

export function TeamMemberDialog({ open, onOpenChange, formData, onFormDataChange, onSubmit, language }: TeamMemberDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Inviter un membre', 'دعوة عضو')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Nom *', 'الاسم *')}</Label>
            <Input value={formData.name} onChange={e => onFormDataChange({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>{t('Email *', 'البريد الإلكتروني *')}</Label>
            <Input type="email" value={formData.email} onChange={e => onFormDataChange({...formData, email: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>{t('Rôle', 'الدور')}</Label>
            <Select value={formData.role} onValueChange={v => onFormDataChange({...formData, role: v as any})}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Annuler', 'إلغاء')}</Button>
          <Button onClick={onSubmit} className="bg-cyan-600">{t('Inviter', 'دعوة')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============ API Key Dialog ============
interface ApiKeyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewApiKeyForm
  onFormDataChange: (data: NewApiKeyForm) => void
  onSubmit: () => void
  language: Language
}

export function ApiKeyDialog({ open, onOpenChange, formData, onFormDataChange, onSubmit, language }: ApiKeyDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Générer une clé API', 'إنشاء مفتاح API')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Nom de la clé', 'اسم المفتاح')}</Label>
            <Input value={formData.name} onChange={e => onFormDataChange({...formData, name: e.target.value})} placeholder={t('Ex: Integration CRM', 'مثال: تكامل CRM')} />
          </div>
          <div className="space-y-2">
            <Label>{t('Permissions', 'الصلاحيات')}</Label>
            <Select value={formData.permissions} onValueChange={v => onFormDataChange({...formData, permissions: v as any})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="read">{t('Lecture seule', 'قراءة فقط')}</SelectItem>
                <SelectItem value="write">{t('Lecture/Écriture', 'قراءة/كتابة')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('Annuler', 'إلغاء')}</Button>
          <Button onClick={onSubmit} className="bg-pink-600">{t('Générer', 'إنشاء')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
