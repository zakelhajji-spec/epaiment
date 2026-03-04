'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Receipt, ArrowLeftRight, Edit, Trash2, TrendingUp, Wallet, FileText, BarChart3 } from 'lucide-react'
import { formatCurrency, formatDate } from '../../constants'
import type { Expense, CreditNote, DashboardMetrics, Language } from '../../types'

// ============ Expenses Page ============
interface ExpensesPageProps {
  expenses: Expense[]
  language: Language
  onCreateNew: () => void
}

export function ExpensesPage({ expenses, language, onCreateNew }: ExpensesPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('Total Dépenses', 'إجمالي المصروفات')}</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('TVA Déductible', 'الضريبة القابلة للخصم')}</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(expenses.reduce((s, e) => s + (e.amount * e.tvaRate / 100), 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('Ce mois', 'هذا الشهر')}</p>
            <p className="text-2xl font-bold text-gray-600">{formatCurrency(expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((s, e) => s + e.amount, 0))}</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-420px)]">
            {expenses.length === 0 ? (
              <div className="text-center py-16">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucune dépense', 'لا توجد مصروفات')}</p>
                <Button onClick={onCreateNew} className="bg-amber-600">
                  {t('Ajouter une dépense', 'إضافة مصروف')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-500">{expense.category} • {expense.supplier} • {formatDate(expense.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                        {expense.tvaRate > 0 && <p className="text-xs text-gray-500">TVA {expense.tvaRate}%</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ Credit Notes Page ============
interface CreditNotesPageProps {
  creditNotes: CreditNote[]
  language: Language
  onCreateNew: () => void
}

export function CreditNotesPage({ creditNotes, language, onCreateNew }: CreditNotesPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {creditNotes.length === 0 ? (
              <div className="text-center py-16">
                <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucun avoir', 'لا توجد إشعارات دائنة')}</p>
                <Button onClick={onCreateNew} className="bg-amber-600">
                  {t('Créer un avoir', 'إنشاء إشعار دائن')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {creditNotes.map((cn) => (
                  <div key={cn.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <ArrowLeftRight className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">{cn.number}</p>
                        <p className="text-sm text-gray-500">{t('Facture', 'فاتورة')}: {cn.invoiceId} • {cn.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(cn.amount)}</p>
                        <Badge variant={cn.status === 'applied' ? 'default' : 'secondary'}>
                          {cn.status === 'applied' ? t('Appliqué', 'تم التطبيق') : t('En attente', 'قيد الانتظار')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ Reports Page ============
interface ReportsPageProps {
  metrics: DashboardMetrics
  language: Language
}

export function ReportsPage({ metrics, language }: ReportsPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      {/* Report Types */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-amber-300 transition-colors">
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <p className="font-medium">{t('Rapport TVA', 'تقرير الضريبة')}</p>
            <p className="text-sm text-gray-500">{t('Déclaration mensuelle', 'الإقرار الشهري')}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-300 transition-colors">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <p className="font-medium">{t('Rapport Revenus', 'تقرير الإيرادات')}</p>
            <p className="text-sm text-gray-500">{t('Par période', 'حسب الفترة')}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-300 transition-colors">
          <CardContent className="p-6 text-center">
            <Wallet className="w-10 h-10 text-violet-600 mx-auto mb-3" />
            <p className="font-medium">{t('Flux de Trésorerie', 'التدفقات النقدية')}</p>
            <p className="text-sm text-gray-500">{t('Entrées/Sorties', 'المدخلات/المخرجات')}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-300 transition-colors">
          <CardContent className="p-6 text-center">
            <FileText className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <p className="font-medium">{t('Grand Livre', 'دفتر الأستاذ')}</p>
            <p className="text-sm text-gray-500">{t('Toutes les écritures', 'جميع القيود')}</p>
          </CardContent>
        </Card>
      </div>
      {/* TVA Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Résumé TVA', 'ملخص الضريبة')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-violet-50 rounded-lg">
              <p className="text-sm text-gray-500">{t('TVA Collectée', 'الضريبة المحصلة')}</p>
              <p className="text-2xl font-bold text-violet-600">{formatCurrency(metrics.tvaCollected)}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-500">{t('TVA Déductible', 'الضريبة القابلة للخصم')}</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.tvaDeductible)}</p>
            </div>
            <div className={`p-4 rounded-lg ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-sm text-gray-500">{t('TVA à payer', 'الضريبة المستحقة')}</p>
              <p className={`text-2xl font-bold ${metrics.tvaCollected - metrics.tvaDeductible >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(metrics.tvaCollected - metrics.tvaDeductible))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
