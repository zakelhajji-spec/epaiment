'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CreditCard, Copy, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink, TestTube } from 'lucide-react'
import type { Language } from '@/lib/modules/types'

// Payment Gateway configurations
export const GATEWAY_CONFIGS = {
  cmi: {
    id: 'cmi',
    name: 'CMI',
    fullName: 'Centre Monétique Interbancaire',
    logo: '/gateways/cmi.png',
    fees: 2.5,
    color: '#1E3A8A',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { key: 'merchantSecret', label: 'Merchant Secret Key', type: 'password', required: true },
      { key: 'terminalId', label: 'Terminal ID', type: 'text', required: false },
      { key: 'storeId', label: 'Store ID', type: 'text', required: false },
    ],
    endpoints: {
      test: 'https://test.cmi.co.ma/fim/est3Dgate',
      production: 'https://payment.cmi.co.ma/fim/est3Dgate',
    },
    webhookPath: '/api/webhooks/cmi',
  },
  fatourati: {
    id: 'fatourati',
    name: 'Fatourati',
    fullName: 'Fatourati (CDG Group)',
    logo: '/gateways/fatourati.png',
    fees: 2.0,
    color: '#059669',
    fields: [
      { key: 'merchantId', label: 'Identifiant Marchand', type: 'text', required: true },
      { key: 'apiKey', label: 'Clé API', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
    ],
    endpoints: {
      test: 'https://api-test.fatourati.ma/v1',
      production: 'https://api.fatourati.ma/v1',
    },
    webhookPath: '/api/webhooks/fatourati',
  },
  cih_pay: {
    id: 'cih_pay',
    name: 'CIH Pay',
    fullName: 'CIH Bank Payment Gateway',
    logo: '/gateways/cih.png',
    fees: 1.8,
    color: '#DC2626',
    fields: [
      { key: 'merchantId', label: 'ID Marchand', type: 'text', required: true },
      { key: 'merchantKey', label: 'Clé Marchand', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
    ],
    endpoints: {
      test: 'https://api-test.cihpay.ma/v2',
      production: 'https://api.cihpay.ma/v2',
    },
    webhookPath: '/api/webhooks/cih-pay',
  },
  custom: {
    id: 'custom',
    name: 'Personnalisé',
    fullName: 'Passerelle personnalisée',
    logo: null,
    fees: 0,
    color: '#6B7280',
    fields: [
      { key: 'gatewayName', label: 'Nom de la passerelle', type: 'text', required: true },
      { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
      { key: 'secretKey', label: 'Secret Key', type: 'password', required: false },
      { key: 'apiEndpoint', label: 'API Endpoint URL', type: 'url', required: true },
    ],
    endpoints: {
      test: '',
      production: '',
    },
    webhookPath: '/api/webhooks/custom',
  },
}

export type GatewayId = keyof typeof GATEWAY_CONFIGS

// Gateway data interface
interface GatewayData {
  id: string
  gatewayId: GatewayId
  enabled: boolean
  testMode: boolean
  config: Record<string, string>
  webhookSecret?: string
  fees: number
  createdAt: string
  updatedAt: string
}

interface PaymentGatewayFormProps {
  language: Language
  existingGateways?: GatewayData[]
  onSave: (gateway: GatewayData) => void
  onDelete?: (gatewayId: string) => void
  onTest?: (gatewayId: string) => void
}

export function PaymentGatewayForm({
  language,
  existingGateways = [],
  onSave,
  onDelete,
  onTest
}: PaymentGatewayFormProps) {
  const [selectedGateway, setSelectedGateway] = useState<GatewayId | null>(null)
  const [config, setConfig] = useState<Record<string, string>>({})
  const [testMode, setTestMode] = useState(true)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr
  
  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }
  
  const handleSave = () => {
    if (!selectedGateway) return
    
    const gatewayConfig = GATEWAY_CONFIGS[selectedGateway]
    const gatewayData: GatewayData = {
      id: `gw_${Date.now()}`,
      gatewayId: selectedGateway,
      enabled: true,
      testMode,
      config,
      fees: gatewayConfig.fees,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    onSave(gatewayData)
    setSelectedGateway(null)
    setConfig({})
  }
  
  const getWebhookUrl = (gatewayId: GatewayId) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://epaiement.ma'
    return `${baseUrl}${GATEWAY_CONFIGS[gatewayId].webhookPath}`
  }
  
  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{t('Passerelles de paiement', 'بوابات الدفع')}</h2>
        <p className="text-gray-500 mt-1">
          {t('Configurez vos passerelles de paiement pour recevoir des paiements en ligne', 'قم بتكوين بوابات الدفع لتلقي المدفوعات عبر الإنترنت')}
        </p>
      </div>
      
      {/* Configured Gateways */}
      {existingGateways.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('Passerelles configurées', 'البوابات المكونة')}</h3>
          {existingGateways.map(gw => {
            const gwConfig = GATEWAY_CONFIGS[gw.gatewayId]
            return (
              <Card key={gw.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: gwConfig.color }}
                      >
                        {gwConfig.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{gwConfig.name}</p>
                        <p className="text-sm text-gray-500">
                          {gw.testMode ? t('Mode test', 'وضع الاختبار') : t('Mode production', 'وضع الإنتاج')}
                        </p>
                      </div>
                      {gw.enabled ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t('Actif', 'نشط')}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          {t('Inactif', 'غير نشط')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {t('Frais', 'الرسوم')}: {gw.fees}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTest?.(gw.id)}
                      >
                        <TestTube className="w-4 h-4 mr-1" />
                        {t('Tester', 'اختبار')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => onDelete?.(gw.id)}
                      >
                        {t('Supprimer', 'حذف')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      
      {/* Add New Gateway */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Ajouter une passerelle', 'إضافة بوابة')}</CardTitle>
          <CardDescription>
            {t('Sélectionnez une passerelle de paiement pour la configurer', 'اختر بوابة دفع لتكوينها')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Gateway Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(GATEWAY_CONFIGS).map(([id, gw]) => (
              <button
                key={id}
                onClick={() => {
                  setSelectedGateway(id as GatewayId)
                  setConfig({})
                }}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  selectedGateway === id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: gw.color }}
                >
                  {gw.name.charAt(0)}
                </div>
                <p className="font-medium">{gw.name}</p>
                <p className="text-xs text-gray-500">{gw.fees}% {t('frais', 'رسوم')}</p>
              </button>
            ))}
          </div>
          
          {/* Configuration Form */}
          {selectedGateway && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{t('Configuration', 'التكوين')}</h4>
                  <div className="flex items-center gap-2">
                    <Label>{t('Mode test', 'وضع الاختبار')}</Label>
                    <Switch checked={testMode} onCheckedChange={setTestMode} />
                  </div>
                </div>
                
                {/* API Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  {GATEWAY_CONFIGS[selectedGateway].fields.map(field => (
                    <div key={field.key}>
                      <Label>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <div className="relative">
                        <Input
                          type={field.type === 'password' && !showSecrets[field.key] ? 'password' : 'text'}
                          value={config[field.key] || ''}
                          onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.label}
                          className={field.type === 'password' ? 'pr-10' : ''}
                        />
                        {field.type === 'password' && (
                          <button
                            type="button"
                            onClick={() => toggleSecretVisibility(field.key)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Webhook Configuration */}
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{t('URL de webhook', 'رابط Webhook')}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          {t('Configurez cette URL dans votre compte marchand pour recevoir les notifications de paiement', 'قم بتكوين هذا الرابط في حساب التاجر الخاص بك لتلقي إشعارات الدفع')}
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                            {getWebhookUrl(selectedGateway)}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(getWebhookUrl(selectedGateway))
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* API Endpoints */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>{t('Endpoint test', 'نقطة نهاية الاختبار')}</Label>
                    <code className="block px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                      {GATEWAY_CONFIGS[selectedGateway].endpoints.test || t('Non disponible', 'غير متوفر')}
                    </code>
                  </div>
                  <div>
                    <Label>{t('Endpoint production', 'نقطة نهاية الإنتاج')}</Label>
                    <code className="block px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                      {GATEWAY_CONFIGS[selectedGateway].endpoints.production || t('Non disponible', 'غير متوفر')}
                    </code>
                  </div>
                </div>
                
                {/* Documentation Link */}
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <a
                    href="#"
                    className="text-blue-500 hover:underline text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('Documentation officielle', 'الوثائق الرسمية')} - {GATEWAY_CONFIGS[selectedGateway].fullName}
                  </a>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedGateway(null)}>
                  {t('Annuler', 'إلغاء')}
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                  {t('Enregistrer', 'حفظ')}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export type { GatewayData }
export default PaymentGatewayForm
