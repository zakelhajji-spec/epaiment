'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Zap,
  Package,
  ShoppingCart,
  Calculator,
  UserPlus,
  Warehouse,
  UserCog,
  Server,
  Brain,
  LayoutDashboard,
  Crown
} from 'lucide-react'
import { MODULE_GROUPS, GROUP_BUNDLES, checkGroupDependencies, calculateGroupsPrice } from '@/lib/module-groups.config'
import type { ModuleGroupConfig, ModuleInGroup } from '@/lib/module-groups.config'
import type { LucideIcon } from 'lucide-react'

type Language = 'fr' | 'ar'

interface ModuleGroupPricingProps {
  language: Language
  subscribedGroups: string[]
  onSubscribeGroup: (groupId: string) => void
  onUnsubscribeGroup: (groupId: string) => void
  onSubscribeBundle: (bundleId: string) => void
}

export function ModuleGroupPricing({
  language,
  subscribedGroups,
  onSubscribeGroup,
  onUnsubscribeGroup,
  onSubscribeBundle
}: ModuleGroupPricingProps) {
  const [viewMode, setViewMode] = useState<'groups' | 'bundles'>('bundles')
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['core'])
  
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr
  const formatPrice = (price: number) => price === 0 ? t('Gratuit', 'مجاني') : `${price} MAD/${t('mois', 'شهر')}`
  
  // Calculate total monthly cost
  const totalMonthly = calculateGroupsPrice(subscribedGroups)
  
  // Toggle group expansion
  const toggleExpand = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }
  
  // Check if group can be enabled (dependencies met)
  const canEnableGroup = (groupId: string): { canEnable: boolean; missingDependencies: string[] } => {
    return checkGroupDependencies(groupId, subscribedGroups)
  }

  // Icon mapping
  const getIconComponent = (iconName: string): LucideIcon => {
    const icons: Record<string, LucideIcon> = {
      LayoutDashboard,
      ShoppingCart,
      Calculator,
      UserPlus,
      Warehouse,
      UserCog,
      Server,
      Brain,
      Package,
    }
    return icons[iconName] || Package
  }
  
  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">{t('Choisissez vos modules', 'اختر وحداتك')}</h1>
        <p className="text-gray-500 mt-2">
          {t('Regroupés par fonctionnalité, payez uniquement ce dont vous avez besoin', 'مجمعة حسب الوظيفة، ادفع فقط ما تحتاجه')}
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
          variant={viewMode === 'groups' ? 'default' : 'outline'}
          onClick={() => setViewMode('groups')}
        >
          <Zap className="w-4 h-4 mr-2" />
          {t('Modules par groupe', 'الوحدات حسب المجموعة')}
        </Button>
      </div>
      
      {/* Current subscription summary */}
      {subscribedGroups.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-blue-700">
                {t('Votre abonnement actuel', 'اشتراكك الحالي')}
              </p>
              <p className="text-sm text-blue-600">
                {subscribedGroups.length} {t('groupes de modules', 'مجموعات وحدات')} • {formatPrice(totalMonthly)}
              </p>
            </div>
            <Badge className="bg-blue-600">
              {subscribedGroups.length} {t('groupes', 'مجموعات')}
            </Badge>
          </CardContent>
        </Card>
      )}
      
      {/* Bundles View */}
      {viewMode === 'bundles' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {GROUP_BUNDLES.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              language={language}
              isSubscribed={bundle.groups.every(g => subscribedGroups.includes(g))}
              onSubscribe={() => onSubscribeBundle(bundle.id)}
            />
          ))}
        </div>
      )}
      
      {/* Groups View */}
      {viewMode === 'groups' && (
        <div className="space-y-4">
          {MODULE_GROUPS.map((group) => (
            <ModuleGroupCard
              key={group.id}
              group={group}
              language={language}
              isSubscribed={subscribedGroups.includes(group.id)}
              isExpanded={expandedGroups.includes(group.id)}
              canEnable={canEnableGroup(group.id)}
              onToggleExpand={() => toggleExpand(group.id)}
              onToggle={() => {
                if (subscribedGroups.includes(group.id)) {
                  onUnsubscribeGroup(group.id)
                } else {
                  onSubscribeGroup(group.id)
                }
              }}
            />
          ))}
        </div>
      )}
      
      {/* Savings indicator */}
      {viewMode === 'groups' && subscribedGroups.length >= 2 && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-700">
                {t('Astuce: Économisez avec un forfait!', 'نصيحة: وفر مع باقة!')}
              </p>
              <p className="text-sm text-emerald-600">
                {t('Les forfaits vous permettent d\'économiser jusqu\'à 20%', 'الباقات تتيح لك توفير ما يصل إلى 20%')}
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

// ============================================
// Bundle Card Component
// ============================================

interface BundleCardProps {
  bundle: {
    id: string
    name: { fr: string; ar: string }
    description: { fr: string; ar: string }
    groups: string[]
    price: number
    annualPrice: number
    savings: number
    popular?: boolean
    recommended?: boolean
  }
  language: Language
  isSubscribed: boolean
  onSubscribe: () => void
}

function BundleCard({ bundle, language, isSubscribed, onSubscribe }: BundleCardProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr
  const formatPrice = (price: number) => price === 0 ? t('Gratuit', 'مجاني') : `${price} MAD/${t('mois', 'شهر')}`
  
  // Calculate individual price
  const individualPrice = calculateGroupsPrice(bundle.groups)
  const savingsAmount = individualPrice - bundle.price
  const savingsPercent = individualPrice > 0 ? Math.round((savingsAmount / individualPrice) * 100) : 0
  
  const bundleColors: Record<string, string> = {
    starter: 'border-gray-200',
    business: 'border-emerald-200',
    professional: 'border-purple-200',
    enterprise: 'border-amber-200',
  }
  
  return (
    <Card className={`relative ${bundleColors[bundle.id] || ''} ${isSubscribed ? 'bg-gray-50' : ''} ${bundle.popular ? 'ring-2 ring-blue-500' : ''}`}>
      {bundle.popular && (
        <Badge className="absolute -top-2 left-4 bg-blue-500">
          {t('Populaire', 'شائع')}
        </Badge>
      )}
      {bundle.recommended && (
        <Badge className="absolute -top-2 left-4 bg-amber-500">
          <Crown className="w-3 h-3 mr-1" />
          {t('Recommandé', 'موصى به')}
        </Badge>
      )}
      <CardHeader>
        <CardTitle>{language === 'ar' ? bundle.name.ar : bundle.name.fr}</CardTitle>
        <CardDescription>{language === 'ar' ? bundle.description.ar : bundle.description.fr}</CardDescription>
        <div className="mt-2">
          <span className="text-3xl font-bold">{formatPrice(bundle.price)}</span>
          {savingsPercent > 0 && (
            <span className="text-sm text-gray-500 line-through ml-2">
              {formatPrice(individualPrice)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {bundle.groups.map(groupId => {
            const group = MODULE_GROUPS.find(g => g.id === groupId)
            if (!group) return null
            return (
              <li key={groupId} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">
                  {language === 'ar' ? group.name.ar : group.name.fr}
                </span>
                <span className="text-gray-400 text-xs">
                  ({group.modules.length} {t('modules', 'وحدات')})
                </span>
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

// ============================================
// Module Group Card Component
// ============================================

interface ModuleGroupCardProps {
  group: ModuleGroupConfig
  language: Language
  isSubscribed: boolean
  isExpanded: boolean
  canEnable: { canEnable: boolean; missingDependencies: string[] }
  onToggleExpand: () => void
  onToggle: () => void
}

function ModuleGroupCard({ 
  group, 
  language, 
  isSubscribed, 
  isExpanded, 
  canEnable, 
  onToggleExpand, 
  onToggle 
}: ModuleGroupCardProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr
  const formatPrice = (price: number) => price === 0 ? t('Gratuit', 'مجاني') : `${price} MAD/${t('mois', 'شهر')}`
  
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    coming_soon: 'bg-amber-100 text-amber-700',
    beta: 'bg-blue-100 text-blue-700',
  }
  
  return (
    <Card 
      className={`${isSubscribed ? 'bg-blue-50 border-blue-200' : ''} ${!canEnable.canEnable && !isSubscribed ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg" 
              style={{ backgroundColor: `${group.color}20` }}
            >
              <group.icon className="w-5 h-5" style={{ color: group.color }} />
            </div>
            <div>
              <CardTitle className="text-lg">
                {language === 'ar' ? group.name.ar : group.name.fr}
              </CardTitle>
              <CardDescription className="mt-1">
                {language === 'ar' ? group.description.ar : group.description.fr}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {group.popular && (
              <Badge className="bg-blue-500">{t('Populaire', 'شائع')}</Badge>
            )}
            {group.recommended && (
              <Badge className="bg-amber-500">
                <Crown className="w-3 h-3 mr-1" />
                {t('Recommandé', 'موصى به')}
              </Badge>
            )}
            {group.price === 0 && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                {t('Gratuit', 'مجاني')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold">
              {formatPrice(group.price)}
            </div>
            <Badge variant="outline">
              {group.modules.length} {t('modules', 'وحدات')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {isExpanded ? t('Réduire', 'تصغير') : t('Détails', 'التفاصيل')}
            </Button>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={isSubscribed}
                onCheckedChange={onToggle}
                disabled={!canEnable.canEnable && !isSubscribed}
              />
              <Label className="text-sm">
                {isSubscribed ? t('Activé', 'مفعّل') : t('Désactivé', 'معطّل')}
              </Label>
            </div>
          </div>
        </div>
        
        {/* Dependency warning */}
        {!canEnable.canEnable && !isSubscribed && (
          <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-700">
              {t('Requiert:', 'يتطلب:')} {canEnable.missingDependencies.map(id => {
                const depGroup = MODULE_GROUPS.find(g => g.id === id)
                return depGroup ? (language === 'ar' ? depGroup.name.ar : depGroup.name.fr) : id
              }).join(', ')}
            </p>
          </div>
        )}
        
        {/* Expanded modules list */}
        {isExpanded && (
          <div className="mt-4 space-y-3">
            <Separator />
            {group.modules.map((module) => (
              <ModuleItem 
                key={module.id} 
                module={module} 
                language={language}
                statusColors={statusColors}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="w-full flex items-center justify-between text-sm text-gray-500">
          <div className="flex gap-4">
            {Object.entries(group.limits).slice(0, 3).map(([key, value]) => (
              <span key={key}>
                {value === -1 ? t('Illimité', 'غير محدود') : value} {t(key.replace(/_/g, ' '), key)}
              </span>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

// ============================================
// Module Item Component
// ============================================

interface ModuleItemProps {
  module: ModuleInGroup
  language: Language
  statusColors: Record<string, string>
}

function ModuleItem({ module, language, statusColors }: ModuleItemProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr
  
  return (
    <div className="p-3 bg-white rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <module.icon className="w-4 h-4 text-gray-500" />
          <span className="font-medium">
            {language === 'ar' ? module.name.ar : module.name.fr}
          </span>
        </div>
        <Badge className={statusColors[module.status] || statusColors.active}>
          {module.status === 'active' && t('Actif', 'نشط')}
          {module.status === 'coming_soon' && t('Bientôt', 'قريباً')}
          {module.status === 'beta' && t('Beta', 'تجريبي')}
        </Badge>
      </div>
      <p className="text-sm text-gray-500 mb-2">
        {language === 'ar' ? module.description.ar : module.description.fr}
      </p>
      <div className="flex flex-wrap gap-1">
        {module.features.map((feature) => (
          <Badge key={feature.id} variant="outline" className="text-xs">
            {language === 'ar' ? feature.name.ar : feature.name.fr}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export default ModuleGroupPricing
