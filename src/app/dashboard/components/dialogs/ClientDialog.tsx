'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Language } from '@/lib/modules/types'

interface ClientFormData {
  name: string
  ice: string
  email: string
  phone: string
  address: string
  city: string
}

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: ClientFormData
  onFormDataChange: (data: ClientFormData) => void
  onSubmit: () => void
  language: Language
}

export function ClientDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  language
}: ClientDialogProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormDataChange({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('Nouveau client', 'عميل جديد')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('Nom', 'الاسم')} *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('Nom du client', 'اسم العميل')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ice">ICE</Label>
            <Input
              id="ice"
              name="ice"
              value={formData.ice}
              onChange={handleChange}
              placeholder="000000000000000"
              maxLength={15}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('Email', 'البريد الإلكتروني')} *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="client@email.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t('Téléphone', 'الهاتف')}</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+212 6XX XXX XXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">{t('Ville', 'المدينة')}</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder={t('Ville', 'المدينة')}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{t('Adresse', 'العنوان')}</Label>
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={t('Adresse complète', 'العنوان الكامل')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{t('Annuler', 'إلغاء')}</Button>
          <Button 
            onClick={onSubmit} 
            className="bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 shadow-lg shadow-violet-500/30"
          >
            {t('Créer', 'إنشاء')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ClientDialog
