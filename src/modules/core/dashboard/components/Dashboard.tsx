'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp, TrendingDown, Users, FileText, Link2, Clock,
  CheckCircle, AlertTriangle, Plus, ArrowRight, RefreshCw
} from 'lucide-react'
import type { Language } from '@/lib/modules/types'

interface DashboardProps {
  language: Language
  onCreateInvoice?: () => void
  onCreatePaymentLink?: () => void
  onAddClient?: () => void
}

interface MetricCard {
  title: string
  titleAr: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: any
  color: string
  bgColor: string
}

export function Dashboard({
  language,
  onCreateInvoice,
  onCreatePaymentLink,
  onAddClient
}: DashboardProps) {
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    totalExpenses: 0,
    activeClients: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    tvaCollected: 0,
    tvaDeductible: 0,
  })
  
  const [recentInvoices, setRecentInvoices] = useState<any[]>([])
  const [recentPaymentLinks, setRecentPaymentLinks] = useState<any[]>([])
  
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount)
  
  // Load data from localStorage (demo mode)
  useEffect(() => {
    const loadData = () => {
      const invoices = JSON.parse(localStorage.getItem('ep_invoices') || '[]')
      const clients = JSON.parse(localStorage.getItem('ep_clients') || '[]')
      const expenses = JSON.parse(localStorage.getItem('ep_expenses') || '[]')
      const paymentLinks = JSON.parse(localStorage.getItem('ep_payment_links') || '[]')
      
      const totalRevenue = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + i.total, 0)
      const pendingAmount = invoices.filter((i: any) => i.status === 'sent').reduce((s: number, i: any) => s + i.total, 0)
      const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0)
      const tvaCollected = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + i.tvaAmount, 0)
      const tvaDeductible = expenses.filter((e: any) => e.tvaDeductible).reduce((s: number, e: any) => s + e.tvaAmount, 0)
      
      setMetrics({
        totalRevenue,
        pendingAmount,
        totalExpenses,
        activeClients: clients.length,
        pendingInvoices: invoices.filter((i: any) => i.status === 'sent').length,
        paidInvoices: invoices.filter((i: any) => i.status === 'paid').length,
        overdueInvoices: invoices.filter((i: any) => i.status === 'overdue').length,
        tvaCollected,
        tvaDeductible,
      })
      
      setRecentInvoices(invoices.slice(0, 5))
      setRecentPaymentLinks(paymentLinks.slice(0, 5))
    }
    // Use setTimeout to defer state updates to next tick
    const timeoutId = setTimeout(loadData, 0)
    return () => clearTimeout(timeoutId)
  }, [])
  
  const metricCards: MetricCard[] = [
    {
      title: 'Revenus totaux',
      titleAr: 'إجمالي الإيرادات',
      value: formatCurrency(metrics.totalRevenue),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      title: 'En attente',
      titleAr: 'معلقة',
      value: formatCurrency(metrics.pendingAmount),
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'Dépenses',
      titleAr: 'المصاريف',
      value: formatCurrency(metrics.totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Clients',
      titleAr: 'العملاء',
      value: metrics.activeClients,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ]
  
  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('Tableau de bord', 'لوحة التحكم')}</h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString(language === 'ar' ? 'ar-MA' : 'fr-MA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, i) => (
          <Card key={i} className="border-l-4 border-l-transparent hover:shadow-md transition-shadow"
            style={{ borderLeftColor: metric.color.replace('text-', '').replace('-600', '-500') }}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{t(metric.title, metric.titleAr)}</p>
                  <p className={`text-xl font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                </div>
                <div className={`w-10 h-10 ${metric.bgColor} rounded-full flex items-center justify-center`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Actions rapides', 'إجراءات سريعة')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: 'Nouvelle facture', labelAr: 'فاتورة جديدة', icon: FileText, action: onCreateInvoice, color: 'blue' },
              { label: 'Lien de paiement', labelAr: 'رابط دفع', icon: Link2, action: onCreatePaymentLink, color: 'purple' },
              { label: 'Nouveau client', labelAr: 'عميل جديد', icon: Users, action: onAddClient, color: 'indigo' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={action.action}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <action.icon className={`w-8 h-8 text-${action.color}-500`} />
                <span className="text-sm font-medium text-gray-700 text-center">
                  {t(action.label, action.labelAr)}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('Factures récentes', 'الفواتير الأخيرة')}</CardTitle>
            <Button variant="ghost" size="sm">
              {t('Voir tout', 'عرض الكل')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucune facture', 'لا توجد فواتير')}</p>
                <Button onClick={onCreateInvoice} size="sm" className="bg-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('Créer une facture', 'إنشاء فاتورة')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.number}</p>
                      <p className="text-sm text-gray-500">{invoice.clientName || 'Client'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status === 'paid' ? t('Payée', 'مدفوعة') : 
                         invoice.status === 'sent' ? t('Envoyée', 'مرسلة') : 
                         invoice.status === 'overdue' ? t('En retard', 'متأخرة') : t('Brouillon', 'مسودة')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Payment Links */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('Liens de paiement', 'روابط الدفع')}</CardTitle>
            <Button variant="ghost" size="sm">
              {t('Voir tout', 'عرض الكل')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentPaymentLinks.length === 0 ? (
              <div className="text-center py-8">
                <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucun lien de paiement', 'لا توجد روابط دفع')}</p>
                <Button onClick={onCreatePaymentLink} size="sm" className="bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('Créer un lien', 'إنشاء رابط')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPaymentLinks.map((link: any) => (
                  <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{link.description}</p>
                      <p className="text-sm text-gray-500">{link.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(link.amount)}</p>
                      <Badge variant={link.status === 'paid' ? 'default' : 'secondary'}>
                        {link.status === 'paid' ? t('Payé', 'مدفوع') : 
                         link.status === 'expired' ? t('Expiré', 'منتهي') : t('En attente', 'قيد الانتظار')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* TVA Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('Résumé TVA', 'ملخص الضريبة')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">{t('TVA Collectée', 'الضريبة المحصلة')}</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(metrics.tvaCollected)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">{t('TVA Déductible', 'الضريبة القابلة للخصم')}</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.tvaDeductible)}</p>
            </div>
            <div className={`p-4 rounded-lg ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-sm text-gray-500">{t('TVA à payer', 'الضريبة المستحقة')}</p>
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

export default Dashboard
