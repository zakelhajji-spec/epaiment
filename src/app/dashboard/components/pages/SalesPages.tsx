'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Truck, FileCheck, Edit, Trash2, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '../../constants'
import type { Supplier, Quote, Language } from '../../types'

// ============ Suppliers Page ============
interface SuppliersPageProps {
  suppliers: Supplier[]
  language: Language
  onCreateNew: () => void
}

export function SuppliersPage({ suppliers, language, onCreateNew }: SuppliersPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {suppliers.length === 0 ? (
              <div className="text-center py-16">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucun fournisseur', 'لا يوجد موردين')}</p>
                <Button onClick={onCreateNew} className="bg-emerald-600">
                  {t('Ajouter un fournisseur', 'إضافة مورد')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <Truck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-gray-500">{supplier.email} {supplier.ice && `• ICE: ${supplier.ice}`}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
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

// ============ Quotes Page ============
interface QuotesPageProps {
  quotes: Quote[]
  language: Language
  onCreateNew: () => void
}

export function QuotesPage({ quotes, language, onCreateNew }: QuotesPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {quotes.length === 0 ? (
              <div className="text-center py-16">
                <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucun devis', 'لا توجد عروض')}</p>
                <Button onClick={onCreateNew} className="bg-emerald-600">
                  {t('Créer un devis', 'إنشاء عرض')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {quotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">{quote.number}</p>
                        <p className="text-sm text-gray-500">{quote.client?.name || t('Client inconnu', 'عميل غير معروف')} • {formatDate(quote.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(quote.total)}</p>
                        <Badge variant={quote.status === 'accepted' ? 'default' : quote.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {quote.status === 'accepted' ? t('Accepté', 'مقبول') : quote.status === 'rejected' ? t('Refusé', 'مرفوض') : t('En attente', 'قيد الانتظار')}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title={t('Convertir en facture', 'تحويل لفاتورة')}><FileText className="w-4 h-4" /></Button>
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
