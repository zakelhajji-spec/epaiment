'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Check, Package, Sparkles, Zap } from 'lucide-react'
import { MODULES_CONFIG, BUNDLES } from '@/lib/modules.config'
import type { Language } from '@/lib/modules/types'

// Local types for simplified module config
interface SimpleModuleConfig {
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  icon: string
  price: number
  dependencies: string[]
  features: string[]
}

interface ModulePricingProps {
  language: Language
  subscribedModules: string[]
  onSubscribe: (moduleId: string) => void
  onUnsubscribe: (moduleId: string) => void
  onSubscribeBundle: (bundleId: string) => void
}

export function ModulePricing({
  language,
  subscribedModules,
  onSubscribe,
  onUnsubscribe,
  onSubscribeBundle
}: ModulePricingProps) {
  const [viewMode, setViewMode] = useState<'modules' | 'bundles'>('bundles')
  
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr
  const formatPrice = (price: number) => price === 0 ? t('Gratuit', 'مجاني') : `${price} MAD/${t('mois', 'شهر')}`
  
  // Check if module can be enabled (dependencies met)
  const canEnable = (module: SimpleModuleConfig): boolean => {
    if (!module.dependencies) return true
    return module.dependencies.every(dep => subscribedModules.includes(dep))
  }
  
  // Calculate total monthly cost
  const totalMonthly = subscribedModules.reduce((sum, id) => {
    const mod = MODULES_CONFIG[id as keyof typeof MODULES_CONFIG]
    return sum + (mod?.price || 0)
  }, 0)
  
  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">{t('Choisissez vos modules', 'اختر وحداتك')}</h1>
        <p className="text-gray-500 mt-2">
          {t('Payez uniquement pour les fonctionnalités dont vous avez besoin', 'ادفع فقط مقابل الميزات التي تحتاجها')}
        </p>
      </div>
      
      {/* View Toggle */}
      <div className="flex justify-center gap-2">
        <Button
          variant={viewMode === 'bundles' ? 'default' : 'outline'}
          onClick={() => setViewMode('bundles')}
        >
          <Package className="w-4 h-4 mr-2" />
          {t('Forfaits', 'الباقات')}
        </Button>
        <Button
          variant={viewMode === 'modules' ? 'default' : 'outline'}
          onClick={() => setViewMode('modules')}
        >
          <Zap className="w-4 h-4 mr-2" />
          {t('Modules individuels', 'وحدات فردية')}
        </Button>
      </div>
      
      {/* Current subscription summary */}
      {subscribedModules.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-700">
                {t('Votre abonnement actuel', 'اشتراكك الحالي')}
              </p>
              <p className="text-sm text-blue-600">
                {subscribedModules.length} {t('modules', 'وحدات')} • {formatPrice(totalMonthly)}
              </p>
            </div>
            <Badge className="bg-blue-600">
              {subscribedModules.length} {t('modules', 'وحدات')}
            </Badge>
          </CardContent>
        </Card>
      )}
      
      {/* Bundles View */}
      {viewMode === 'bundles' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {BUNDLES.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              language={language}
              isSubscribed={bundle.modules.every(m => subscribedModules.includes(m))}
              onSubscribe={() => onSubscribeBundle(bundle.id)}
            />
          ))}
        </div>
      )}
      
      {/* Modules View */}
      {viewMode === 'modules' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(MODULES_CONFIG).map(([id, module]) => (
            <ModuleCard
              key={id}
              moduleId={id}
              module={module as SimpleModuleConfig}
              language={language}
              isSubscribed={subscribedModules.includes(id)}
              canEnable={canEnable(module as SimpleModuleConfig)}
              onToggle={() => {
                if (subscribedModules.includes(id)) {
                  onUnsubscribe(id)
                } else {
                  onSubscribe(id)
                }
              }}
            />
          ))}
        </div>
      )}
      
      {/* Savings indicator */}
      {viewMode === 'modules' && subscribedModules.length > 2 && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-700">
                {t('Astuce: Économisez avec un forfait!', 'نصيحة: وفر مع باقة!')}
              </p>
              <p className="text-sm text-emerald-600">
                {t('Les forfaits vous permettent d\'économiser jusqu\'à 30%', 'الباقات تتيح لك توفير ما يصل إلى 30%')}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setViewMode('bundles')} className="ml-auto">
              {t('Voir les forfaits', 'عرض الباقات')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Bundle Card Component
interface BundleCardProps {
  bundle: {
    id: string
    name: { fr: string; ar: string }
    description: { fr: string; ar: string }
    modules: string[]
    discount: number
    price: number
    savings: number
  }
  language: Language
  isSubscribed: boolean
  onSubscribe: () => void
}

function BundleCard({ bundle, language, isSubscribed, onSubscribe }: BundleCardProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr
  const formatPrice = (price: number) => price === 0 ? t('Gratuit', 'مجاني') : `${price} MAD/${t('mois', 'شهر')}`
  
  // Calculate individual price
  const individualPrice = bundle.modules.reduce((sum, id) => {
    const mod = MODULES_CONFIG[id as keyof typeof MODULES_CONFIG]
    return sum + (mod?.price || 0)
  }, 0)
  
  const savings = individualPrice - bundle.price
  const savingsPercent = individualPrice > 0 ? Math.round((savings / individualPrice) * 100) : 0
  
  const bundleColors: Record<string, string> = {
    starter: 'border-gray-200',
    basic: 'border-blue-200',
    pro: 'border-purple-200',
    business: 'border-emerald-200',
    ai_powered: 'border-amber-200',
  }
  
  return (
    <Card className={`relative ${bundleColors[bundle.id] || ''} ${isSubscribed ? 'bg-gray-50' : ''}`}>
      {savingsPercent > 0 && (
        <Badge className="absolute -top-2 right-4 bg-red-500">
          -{savingsPercent}%
        </Badge>
      )}
      <CardHeader>
        <CardTitle>{language === 'ar' ? bundle.name.ar : bundle.name.fr}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{formatPrice(bundle.price)}</span>
          {savings > 0 && (
            <span className="text-sm text-gray-500 line-through ml-2">
              {formatPrice(individualPrice)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {bundle.modules.map(modId => {
            const mod = MODULES_CONFIG[modId as keyof typeof MODULES_CONFIG]
            return (
              <li key={modId} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                {language === 'ar' ? mod?.nameAr : mod?.name}
              </li>
            )
          })}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isSubscribed ? 'outline' : 'default'}
          onClick={onSubscribe}
          disabled={isSubscribed}
        >
          {isSubscribed ? t('Actif', 'نشط') : t('Choisir', 'اختر')}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Module Card Component
interface ModuleCardProps {
  moduleId: string
  module: SimpleModuleConfig
  language: Language
  isSubscribed: boolean
  canEnable: boolean
  onToggle: () => void
}

function ModuleCard({ moduleId, module, language, isSubscribed, canEnable, onToggle }: ModuleCardProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr
  
  return (
    <Card className={`${isSubscribed ? 'bg-blue-50 border-blue-200' : ''} ${!canEnable ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {language === 'ar' ? module.nameAr : module.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {language === 'ar' ? module.descriptionAr : module.description}
            </CardDescription>
          </div>
          {module.price === 0 && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
              {t('Gratuit', 'مجاني')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-2xl font-bold">
          {module.price === 0 ? t('Gratuit', 'مجاني') : `${module.price} MAD`}
          {module.price > 0 && <span className="text-sm font-normal text-gray-500">/{t('mois', 'شهر')}</span>}
        </div>
        
        {module.features && (
          <ul className="mt-3 space-y-1">
            {module.features.slice(0, 3).map((feature: string) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-3 h-3 text-emerald-500" />
                {t(getFeatureLabel(feature).fr, getFeatureLabel(feature).ar)}
              </li>
            ))}
            {module.features.length > 3 && (
              <li className="text-sm text-gray-400">
                +{module.features.length - 3} {t('autres', 'أخرى')}
              </li>
            )}
          </ul>
        )}
        
        {module.dependencies && module.dependencies.length > 0 && (
          <p className="text-xs text-amber-600 mt-2">
            {t('Requiert:', 'يتطلب:')} {module.dependencies.map(d => 
              MODULES_CONFIG[d as keyof typeof MODULES_CONFIG]?.name
            ).join(', ')}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex items-center justify-between w-full">
          <Switch
            checked={isSubscribed}
            onCheckedChange={onToggle}
            disabled={!canEnable && !isSubscribed}
          />
          <Label className="text-sm">
            {isSubscribed ? t('Activé', 'مفعّل') : t('Désactivé', 'معطّل')}
          </Label>
        </div>
      </CardFooter>
    </Card>
  )
}

function getFeatureLabel(feature: string): { fr: string; ar: string } {
  const labels: Record<string, { fr: string; ar: string }> = {
    'invoices': { fr: 'Factures', ar: 'الفواتير' },
    'payment-links': { fr: 'Liens de paiement', ar: 'روابط الدفع' },
    'dashboard': { fr: 'Tableau de bord', ar: 'لوحة التحكم' },
    'clients': { fr: 'Clients', ar: 'العملاء' },
    'suppliers': { fr: 'Fournisseurs', ar: 'الموردين' },
    'quotes': { fr: 'Devis', ar: 'العروض' },
    'expenses': { fr: 'Dépenses', ar: 'المصاريف' },
    'credit-notes': { fr: 'Avoirs', ar: 'إشعارات دائنة' },
    'tva-reports': { fr: 'Rapports TVA', ar: 'تقارير الضريبة' },
    'leads': { fr: 'Prospects', ar: 'العملاء المحتملين' },
    'tasks': { fr: 'Tâches', ar: 'المهام' },
    'products': { fr: 'Produits', ar: 'المنتجات' },
    'inventory': { fr: 'Inventaire', ar: 'المخزون' },
    'team-members': { fr: 'Équipe', ar: 'الفريق' },
    'api-keys': { fr: 'Clés API', ar: 'مفاتيح API' },
    'payment-gateways': { fr: 'Passerelles', ar: 'البوابات' },
    'audit-log': { fr: 'Journal d\'audit', ar: 'سجل التدقيق' },
  }
  return labels[feature] || { fr: feature, ar: feature }
}

export default ModulePricing
