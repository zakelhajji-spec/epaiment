'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Building2, FileText, CreditCard, Landmark, CheckCircle, AlertTriangle } from 'lucide-react'
import type { Language } from '@/lib/modules/types'

// TVA Regime options
const TVA_REGIMES = [
  { value: 'franchise', label: 'Franchise de TVA', description: 'CA < 500,000 MAD/an' },
  { value: 'reel_mensuel', label: 'Régime réel mensuel', description: 'Déclaration mensuelle' },
  { value: 'reel_trimestriel', label: 'Régime réel trimestriel', description: 'Déclaration trimestrielle' },
]

// Company form data interface - DGI 2026 compliant
interface CompanyFormData {
  // Identité
  name: string
  tradeName?: string
  legalForm?: string
  
  // Identifiants fiscaux - Required for DGI
  ice: string           // Identifiant Commun de l'Entreprise (15 digits)
  if: string            // Identifiant Fiscal
  rc: string            // Registre de Commerce
  patente: string       // Patente professionnelle
  cnss: string          // Numéro CNSS
  
  // Adresse
  address: string
  city: string
  postalCode?: string
  region?: string
  
  // Contact
  phone: string
  email: string
  website?: string
  
  // Banque
  bankName?: string
  bankAccount?: string  // RIB (24 digits)
  
  // TVA
  autoEntrepreneur: boolean
  tvaRegime: 'franchise' | 'reel_mensuel' | 'reel_trimestriel'
  defaultTvaRate: number
  
  // Facturation
  invoicePrefix: string
  invoiceNotes?: string
  
  // Reminders
  remindersEnabled: boolean
  reminderDays: number[]
  reminderMethod: 'email' | 'whatsapp' | 'both'
}

interface CompanyFormProps {
  initialData?: Partial<CompanyFormData>
  language: Language
  onSave: (data: CompanyFormData) => void
  onCancel?: () => void
}

export function CompanyForm({ initialData, language, onSave, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: initialData?.name || '',
    tradeName: initialData?.tradeName || '',
    legalForm: initialData?.legalForm || 'SARL',
    ice: initialData?.ice || '',
    if: initialData?.if || '',
    rc: initialData?.rc || '',
    patente: initialData?.patente || '',
    cnss: initialData?.cnss || '',
    address: initialData?.address || '',
    city: initialData?.city || 'Casablanca',
    postalCode: initialData?.postalCode || '',
    region: initialData?.region || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    website: initialData?.website || '',
    bankName: initialData?.bankName || '',
    bankAccount: initialData?.bankAccount || '',
    autoEntrepreneur: initialData?.autoEntrepreneur || false,
    tvaRegime: initialData?.tvaRegime || 'franchise',
    defaultTvaRate: initialData?.defaultTvaRate || 20,
    invoicePrefix: initialData?.invoicePrefix || 'FA',
    invoiceNotes: initialData?.invoiceNotes || '',
    remindersEnabled: initialData?.remindersEnabled ?? true,
    reminderDays: initialData?.reminderDays || [7, 3, 1],
    reminderMethod: initialData?.reminderMethod || 'email',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr
  
  // Validate ICE (15 digits)
  const validateICE = (ice: string): boolean => {
    return /^\d{15}$/.test(ice)
  }
  
  // Validate RIB (24 digits)
  const validateRIB = (rib: string): boolean => {
    return rib === '' || /^\d{24}$/.test(rib)
  }
  
  // Check DGI compliance
  const isDGIGCompliant = (): boolean => {
    return !!(
      formData.name &&
      formData.ice && validateICE(formData.ice) &&
      formData.if &&
      formData.address &&
      formData.city &&
      formData.phone &&
      formData.email
    )
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    
    if (!formData.name) newErrors.name = t('Nom requis', 'الاسم مطلوب')
    if (formData.ice && !validateICE(formData.ice)) {
      newErrors.ice = t('ICE doit contenir 15 chiffres', 'ICE يجب أن يحتوي على 15 رقماً')
    }
    if (formData.bankAccount && !validateRIB(formData.bankAccount)) {
      newErrors.bankAccount = t('RIB doit contenir 24 chiffres', 'RIB يجب أن يحتوي على 24 رقماً')
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setErrors({})
    onSave(formData)
  }
  
  const updateField = (field: keyof CompanyFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }
  
  const toggleReminderDay = (day: number) => {
    const days = formData.reminderDays.includes(day)
      ? formData.reminderDays.filter(d => d !== day)
      : [...formData.reminderDays, day].sort((a, b) => b - a)
    updateField('reminderDays', days)
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* DGI Compliance Status */}
      <Card className={isDGIGCompliant() ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}>
        <CardContent className="p-4 flex items-center gap-3">
          {isDGIGCompliant() ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-700">
                  {t('Conforme DGI 2026', 'متوافق مع DGI 2026')}
                </p>
                <p className="text-sm text-emerald-600">
                  {t('Toutes les informations requises sont renseignées', 'جميع المعلومات المطلوبة مملوءة')}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-700">
                  {t('Informations manquantes', 'معلومات ناقصة')}
                </p>
                <p className="text-sm text-amber-600">
                  {t('Complétez les champs requis pour la conformité DGI', 'أكمل الحقول المطلوبة للتوافق مع DGI')}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Identité de l'entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {t('Identité de l\'entreprise', 'هوية المؤسسة')}
          </CardTitle>
          <CardDescription>
            {t('Informations légales de votre entreprise', 'المعلومات القانونية لمؤسستك')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="required">{t('Raison sociale', 'الاسم القانوني')}</Label>
              <Input
                value={formData.name}
                onChange={e => updateField('name', e.target.value)}
                placeholder="Mon Entreprise SARL"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label>{t('Nom commercial', 'الاسم التجاري')}</Label>
              <Input
                value={formData.tradeName || ''}
                onChange={e => updateField('tradeName', e.target.value)}
                placeholder={t('Optionnel', 'اختياري')}
              />
            </div>
            <div>
              <Label>{t('Forme juridique', 'الشكل القانوني')}</Label>
              <Select
                value={formData.legalForm}
                onValueChange={v => updateField('legalForm', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SARL">SARL</SelectItem>
                  <SelectItem value="SA">SA</SelectItem>
                  <SelectItem value="SNC">SNC</SelectItem>
                  <SelectItem value="auto_entrepreneur">{t('Auto-entrepreneur', 'مقاول ذاتي')}</SelectItem>
                  <SelectItem value="autre">{t('Autre', 'أخرى')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Identifiants fiscaux - DGI Required */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('Identifiants fiscaux', 'المعرفات الضريبية')}
            <Badge variant="outline" className="ml-2">DGI 2026</Badge>
          </CardTitle>
          <CardDescription>
            {t('Numéros d\'identification requis pour la facturation électronique', 'أرقام التعريف المطلوبة للفواتير الإلكترونية')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="required">ICE (15 {t('chiffres', 'أرقام')})</Label>
              <Input
                value={formData.ice}
                onChange={e => updateField('ice', e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="001234567890123"
                maxLength={15}
                className={errors.ice ? 'border-red-500' : ''}
              />
              {errors.ice && <p className="text-sm text-red-500 mt-1">{errors.ice}</p>}
              <p className="text-xs text-gray-500 mt-1">
                {t('Identifiant Commun de l\'Entreprise', 'المعرف المشترك للمؤسسة')}
              </p>
            </div>
            <div>
              <Label className="required">IF ({t('Identifiant Fiscal', 'المعرف الضريبي')})</Label>
              <Input
                value={formData.if}
                onChange={e => updateField('if', e.target.value)}
                placeholder="12345678"
              />
            </div>
            <div>
              <Label>RC ({t('Registre de Commerce', 'السجل التجاري')})</Label>
              <Input
                value={formData.rc}
                onChange={e => updateField('rc', e.target.value)}
                placeholder="12345"
              />
            </div>
            <div>
              <Label>{t('Patente', 'البطاقة المهنية')}</Label>
              <Input
                value={formData.patente}
                onChange={e => updateField('patente', e.target.value)}
                placeholder="12345678"
              />
            </div>
            <div>
              <Label>N° CNSS</Label>
              <Input
                value={formData.cnss}
                onChange={e => updateField('cnss', e.target.value)}
                placeholder="1234567"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Adresse */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Adresse', 'العنوان')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label className="required">{t('Adresse', 'العنوان')}</Label>
              <Input
                value={formData.address}
                onChange={e => updateField('address', e.target.value)}
                placeholder="123 Rue Example"
              />
            </div>
            <div>
              <Label className="required">{t('Ville', 'المدينة')}</Label>
              <Input
                value={formData.city}
                onChange={e => updateField('city', e.target.value)}
                placeholder="Casablanca"
              />
            </div>
            <div>
              <Label>{t('Code postal', 'الرمز البريدي')}</Label>
              <Input
                value={formData.postalCode || ''}
                onChange={e => updateField('postalCode', e.target.value)}
                placeholder="20000"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Contact', 'جهة الاتصال')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="required">{t('Téléphone', 'الهاتف')}</Label>
              <Input
                value={formData.phone}
                onChange={e => updateField('phone', e.target.value)}
                placeholder="+212 5XX XX XX XX"
              />
            </div>
            <div>
              <Label className="required">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => updateField('email', e.target.value)}
                placeholder="contact@entreprise.ma"
              />
            </div>
            <div className="md:col-span-2">
              <Label>{t('Site web', 'الموقع الإلكتروني')}</Label>
              <Input
                value={formData.website || ''}
                onChange={e => updateField('website', e.target.value)}
                placeholder="https://www.entreprise.ma"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Banque */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t('Coordonnées bancaires', 'البيانات البنكية')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('Banque', 'البنك')}</Label>
              <Input
                value={formData.bankName || ''}
                onChange={e => updateField('bankName', e.target.value)}
                placeholder="Attijariwafa Bank"
              />
            </div>
            <div>
              <Label>RIB (24 {t('chiffres', 'أرقام')})</Label>
              <Input
                value={formData.bankAccount || ''}
                onChange={e => updateField('bankAccount', e.target.value.replace(/\D/g, '').slice(0, 24))}
                placeholder="011780000012345678901234"
                maxLength={24}
                className={errors.bankAccount ? 'border-red-500' : ''}
              />
              {errors.bankAccount && <p className="text-sm text-red-500 mt-1">{errors.bankAccount}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* TVA & Fiscal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="w-5 h-5" />
            {t('Régime fiscal', 'النظام الضريبي')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
            <Switch
              checked={formData.autoEntrepreneur}
              onCheckedChange={v => updateField('autoEntrepreneur', v)}
            />
            <div>
              <Label className="font-medium">{t('Auto-entrepreneur', 'مقاول ذاتي')}</Label>
              <p className="text-sm text-gray-500">
                {t('Sans TVA (CA < 500,000 MAD/an)', 'بدون ضريبة القيمة المضافة (رقم الأعمال < 500,000 درهم/سنة)')}
              </p>
            </div>
          </div>
          
          {!formData.autoEntrepreneur && (
            <>
              <div>
                <Label>{t('Régime TVA', 'نظام ضريبة القيمة المضافة')}</Label>
                <Select
                  value={formData.tvaRegime}
                  onValueChange={v => updateField('tvaRegime', v as CompanyFormData['tvaRegime'])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TVA_REGIMES.map(regime => (
                      <SelectItem key={regime.value} value={regime.value}>
                        <div>
                          <span>{regime.label}</span>
                          <span className="text-xs text-gray-500 ml-2">({regime.description})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{t('Taux TVA par défaut', 'معدل ضريبة القيمة المضافة الافتراضي')}</Label>
                <Select
                  value={String(formData.defaultTvaRate)}
                  onValueChange={v => updateField('defaultTvaRate', Number(v))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20% - {t('Normal', 'عادي')}</SelectItem>
                    <SelectItem value="14">14% - {t('Services', 'خدمات')}</SelectItem>
                    <SelectItem value="10">10% - {t('Hôtels/Restaurants', 'فنادق/مطاعم')}</SelectItem>
                    <SelectItem value="7">7% - {t('Eau/Électricité', 'ماء/كهرباء')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Facturation */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Paramètres de facturation', 'إعدادات الفواتير')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>{t('Préfixe facture', 'بادئة الفاتورة')}</Label>
              <Input
                value={formData.invoicePrefix}
                onChange={e => updateField('invoicePrefix', e.target.value.toUpperCase().slice(0, 4))}
                maxLength={4}
                placeholder="FA"
              />
            </div>
          </div>
          <div>
            <Label>{t('Notes sur les factures', 'ملاحظات على الفواتير')}</Label>
            <Input
              value={formData.invoiceNotes || ''}
              onChange={e => updateField('invoiceNotes', e.target.value)}
              placeholder={t('Merci de votre confiance!', 'شكراً لثقتكم!')}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Rappels */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Rappels automatiques', 'التذكيرات التلقائية')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.remindersEnabled}
              onCheckedChange={v => updateField('remindersEnabled', v)}
            />
            <Label>{t('Activer les rappels de paiement', 'تفعيل تذكيرات الدفع')}</Label>
          </div>
          
          {formData.remindersEnabled && (
            <>
              <div>
                <Label>{t('Jours avant échéance', 'أيام قبل الاستحقاق')}</Label>
                <div className="flex gap-2 mt-2">
                  {[14, 7, 3, 1].map(day => (
                    <Button
                      key={day}
                      type="button"
                      variant={formData.reminderDays.includes(day) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleReminderDay(day)}
                    >
                      {day} {t('jours', 'أيام')}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>{t('Méthode de rappel', 'طريقة التذكير')}</Label>
                <Select
                  value={formData.reminderMethod}
                  onValueChange={v => updateField('reminderMethod', v as CompanyFormData['reminderMethod'])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="both">{t('Email + WhatsApp', 'البريد + واتساب')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('Annuler', 'إلغاء')}
          </Button>
        )}
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          {t('Enregistrer', 'حفظ')}
        </Button>
      </div>
    </form>
  )
}

export type { CompanyFormData }
export default CompanyForm
