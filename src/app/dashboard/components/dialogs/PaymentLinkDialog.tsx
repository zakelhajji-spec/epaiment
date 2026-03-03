'use client'

import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { NewPaymentLinkForm, Language } from '../../types'

interface PaymentLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: NewPaymentLinkForm
  onFormDataChange: (data: NewPaymentLinkForm) => void
  onSubmit: () => void
  language: Language
}

export function PaymentLinkDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  language
}: PaymentLinkDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Créer un lien de paiement', 'إنشاء رابط دفع')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('Montant (MAD) *', 'المبلغ (درهم) *')}</Label>
            <Input 
              type="number" 
              value={formData.amount || ''} 
              onChange={e => onFormDataChange({...formData, amount: parseFloat(e.target.value) || 0})} 
            />
          </div>
          <div className="space-y-2">
            <Label>{t('Description *', 'الوصف *')}</Label>
            <Textarea 
              value={formData.description} 
              onChange={e => onFormDataChange({...formData, description: e.target.value})} 
              placeholder={t('Ex: Facture #123', 'مثال: فاتورة #123')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('Email client', 'بريد العميل')}</Label>
              <Input 
                type="email" 
                value={formData.clientEmail} 
                onChange={e => onFormDataChange({...formData, clientEmail: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>{t('Téléphone client', 'هاتف العميل')}</Label>
              <Input 
                value={formData.clientPhone} 
                onChange={e => onFormDataChange({...formData, clientPhone: e.target.value})} 
                placeholder="+212 6XX XX XX XX"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('Date d\'expiration', 'تاريخ الانتهاء')}</Label>
            <Input 
              type="date" 
              value={formData.dueDate} 
              onChange={e => onFormDataChange({...formData, dueDate: e.target.value})} 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('Annuler', 'إلغاء')}
          </Button>
          <Button onClick={onSubmit} className="bg-purple-600">
            {t('Créer', 'إنشاء')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
