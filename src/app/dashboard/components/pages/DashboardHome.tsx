'use client'

import { TrendingUp, TrendingDown, Clock, Users, FileText, Link2, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '../../constants'
import type { Language } from '@/lib/modules/types'

interface DashboardMetrics {
  totalRevenue: number
  pendingAmount: number
  totalExpenses: number
  activeClients: number
  tvaCollected: number
  tvaDeductible: number
}

interface DashboardHomeProps {
  metrics: DashboardMetrics
  language: Language
  onCreateInvoice: () => void
  onCreatePaymentLink: () => void
  onAddClient: () => void
  onNavigateToModules: () => void
}

export function DashboardHome({
  metrics,
  language,
  onCreateInvoice,
  onCreatePaymentLink,
  onAddClient,
  onNavigateToModules
}: DashboardHomeProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  const quickActions = [
    { label: t('Créer une facture', 'إنشاء فاتورة'), icon: FileText, action: onCreateInvoice },
    { label: t('Créer un lien', 'إنشاء رابط'), icon: Link2, action: onCreatePaymentLink },
    { label: t('Ajouter un client', 'إضافة عميل'), icon: Users, action: onAddClient },
    { label: t('Modules', 'الوحدات'), icon: Sparkles, action: onNavigateToModules },
  ]

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('Revenus', 'الإيرادات')}</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('En attente', 'معلقة')}</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(metrics.pendingAmount)}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('Dépenses', 'المصاريف')}</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-violet-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('Clients', 'العملاء')}</p>
                <p className="text-xl font-bold text-violet-600">{metrics.activeClients}</p>
              </div>
              <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Actions rapides', 'إجراءات سريعة')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {quickActions.map((action, i) => (
              <button 
                key={i} 
                onClick={action.action} 
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors"
              >
                <action.icon className="w-8 h-8 text-violet-500" />
                <span className="text-sm font-medium text-gray-700 text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* TVA Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Résumé TVA', 'ملخص ضريبة القيمة المضافة')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-violet-50 rounded-lg">
              <p className="text-sm text-gray-500">{t('TVA Collectée', 'ضريبة القيمة المضافة المحصلة')}</p>
              <p className="text-xl font-bold text-violet-600">{formatCurrency(metrics.tvaCollected)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">{t('TVA Déductible', 'ضريبة القيمة المضافة القابلة للخصم')}</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.tvaDeductible)}</p>
            </div>
            <div className={`p-4 rounded-lg ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-sm text-gray-500">{t('TVA à payer', 'ضريبة القيمة المضافة المستحقة')}</p>
              <p className={`text-xl font-bold ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(metrics.tvaCollected - metrics.tvaDeductible))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardHome
