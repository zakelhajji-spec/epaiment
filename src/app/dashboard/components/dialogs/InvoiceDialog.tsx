'use client'

import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'
import { TVA_RATES, formatCurrency, generateId } from '../../constants'
import type { NewInvoiceForm, Client, Language, InvoiceLineItem } from '../../types'

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewInvoiceForm
  onFormDataChange: (data: NewInvoiceForm) => void
  onSubmit: () => void
  clients: Client[]
  language: Language
  mode: 'create' | 'edit'
  invoiceNumber?: string
}

export function InvoiceDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  clients,
  language,
  mode,
  invoiceNumber
}: InvoiceDialogProps) {
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

  const addItem = () => {
    onFormDataChange({
      ...formData, 
      items: [...formData.items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, tvaRate: 20 }]
    })
  }

  const removeItem = (idx: number) => {
    if (formData.items.length > 1) {
      onFormDataChange({...formData, items: formData.items.filter((_, i) => i !== idx)})
    }
  }

  const subtotal = formData.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)
  const tvaAmount = formData.items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.tvaRate / 100), 0)
  const total = subtotal + tvaAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' 
              ? t('Créer une facture', 'إنشاء فاتورة')
              : `${t('Modifier la facture', 'تعديل الفاتورة')} - ${invoiceNumber}`
            }
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Client', 'العميل')}</Label>
            <Select value={formData.clientId} onValueChange={v => onFormDataChange({...formData, clientId: v})}>
              <SelectTrigger>
                <SelectValue placeholder={t('Sélectionner un client', 'اختر عميلاً')} />
              </SelectTrigger>
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
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Input 
                    placeholder={t('Description', 'الوصف')} 
                    value={item.description} 
                    onChange={e => updateItem(idx, 'description', e.target.value)} 
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    type="number" 
                    placeholder="Qté" 
                    value={item.quantity} 
                    onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} 
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    type="number" 
                    placeholder="Prix" 
                    value={item.unitPrice} 
                    onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} 
                  />
                </div>
                <div className="col-span-2">
                  <Select 
                    value={String(item.tvaRate)} 
                    onValueChange={v => updateItem(idx, 'tvaRate', parseInt(v))}
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
                    onClick={() => removeItem(idx)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" /> {t('Ajouter une ligne', 'إضافة سطر')}
            </Button>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('Sous-total', 'المجموع الفرعي')}:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('TVA', 'ضريبة القيمة المضافة')}:</span>
              <span>{formatCurrency(tvaAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>{t('Total', 'المجموع')}:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Date d\'échéance', 'تاريخ الاستحقاق')}</Label>
              <Input 
                type="date" 
                value={formData.dueDate} 
                onChange={e => onFormDataChange({...formData, dueDate: e.target.value})} 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('Notes', 'ملاحظات')}</Label>
            <Textarea 
              value={formData.notes} 
              onChange={e => onFormDataChange({...formData, notes: e.target.value})} 
              placeholder={t('Notes visibles sur la facture', 'ملاحظات مرئية على الفاتورة')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Annuler', 'إلغاء')}
          </Button>
          <Button 
            onClick={onSubmit} 
            className="bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 shadow-lg shadow-violet-500/30"
          >
            {mode === 'create' ? t('Créer', 'إنشاء') : t('Enregistrer', 'حفظ')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
