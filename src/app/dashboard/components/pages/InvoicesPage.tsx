'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Eye, Download, Edit, Send, Trash2, CheckCircle, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '../../constants'
import type { Invoice, Client, Language } from '../../types'

interface InvoicesPageProps {
  invoices: Invoice[]
  clients: Client[]
  isLoading: boolean
  language: Language
  onCreateNew: () => void
  onPreview: (invoice: Invoice) => void
  onDownload: (invoice: Invoice) => void
  onEdit: (invoice: Invoice) => void
  onAction: (invoiceId: string, action: 'send' | 'mark_paid' | 'delete') => void
}

export function InvoicesPage({
  invoices,
  clients,
  isLoading,
  language,
  onCreateNew,
  onPreview,
  onDownload,
  onEdit,
  onAction
}: InvoicesPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {isLoading ? (
              <div className="text-center py-16">
                <p className="text-gray-500">{t('Chargement...', 'جاري التحميل...')}</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucune facture', 'لا توجد فواتير')}</p>
                <Button onClick={onCreateNew} className="bg-gradient-to-r from-violet-600 to-fuchsia-500">
                  {t('Créer une facture', 'إنشاء فاتورة')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.number}</p>
                        <p className="text-sm text-gray-500">
                          {invoice.client?.name || t('Client inconnu', 'عميل غير معروف')} • {formatDate(invoice.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' : 
                          invoice.status === 'overdue' ? 'destructive' : 
                          invoice.status === 'sent' ? 'secondary' : 'outline'
                        }>
                          {invoice.status === 'paid' ? t('Payée', 'مدفوعة') : 
                           invoice.status === 'overdue' ? t('En retard', 'متأخرة') : 
                           invoice.status === 'sent' ? t('Envoyée', 'مرسلة') : t('Brouillon', 'مسودة')}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onPreview(invoice)} title={t('Aperçu PDF', 'معاينة PDF')}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDownload(invoice)} title={t('Télécharger PDF', 'تحميل PDF')}>
                          <Download className="w-4 h-4" />
                        </Button>
                        {invoice.status === 'draft' && (
                          <Button variant="ghost" size="icon" onClick={() => onEdit(invoice)} title={t('Modifier', 'تعديل')}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {invoice.status === 'draft' && (
                          <Button variant="ghost" size="icon" onClick={() => onAction(invoice.id, 'send')} title={t('Envoyer', 'إرسال')}>
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        {invoice.status === 'sent' && (
                          <Button variant="ghost" size="icon" onClick={() => onAction(invoice.id, 'mark_paid')} title={t('Marquer payée', 'تحديد كمدفوعة')}>
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {invoice.status === 'draft' && (
                          <Button variant="ghost" size="icon" onClick={() => onAction(invoice.id, 'delete')} title={t('Supprimer', 'حذف')}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
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
