'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Download, Send, CheckCircle, Trash2, Edit, Printer
} from 'lucide-react'
import { downloadInvoicePDF, previewInvoicePDF } from '@/lib/pdf-generator'

interface InvoiceViewDialogProps {
  open: boolean
  onClose: () => void
  invoice: any | null
  language: 'fr' | 'ar'
  onSend?: () => void
  onMarkPaid?: (amount?: number, method?: string) => void
  onDelete?: () => void
  onEdit?: () => void
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD'
  }).format(amount)
}

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('fr-MA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500'
}

const statusLabels: Record<string, Record<'fr' | 'ar', string>> = {
  draft: { fr: 'Brouillon', ar: 'مسودة' },
  sent: { fr: 'Envoyée', ar: 'مرسلة' },
  viewed: { fr: 'Consultée', ar: 'تمت المشاهدة' },
  paid: { fr: 'Payée', ar: 'مدفوعة' },
  partial: { fr: 'Partielle', ar: 'جزئية' },
  overdue: { fr: 'En retard', ar: 'متأخرة' },
  cancelled: { fr: 'Annulée', ar: 'ملغاة' }
}

export function InvoiceViewDialog({
  open,
  onClose,
  invoice,
  language,
  onSend,
  onMarkPaid,
  onDelete,
  onEdit
}: InvoiceViewDialogProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')

  if (!invoice) return null

  const t = (key: string) => {
    const translations: Record<string, Record<'fr' | 'ar', string>> = {
      invoice: { fr: 'Facture', ar: 'فاتورة' },
      client: { fr: 'Client', ar: 'العميل' },
      date: { fr: 'Date', ar: 'التاريخ' },
      dueDate: { fr: 'Échéance', ar: 'تاريخ الاستحقاق' },
      items: { fr: 'Articles', ar: 'العناصر' },
      description: { fr: 'Description', ar: 'الوصف' },
      quantity: { fr: 'Qté', ar: 'الكمية' },
      unitPrice: { fr: 'Prix unit.', ar: 'سعر الوحدة' },
      tva: { fr: 'TVA', ar: 'ضريبة القيمة المضافة' },
      total: { fr: 'Total', ar: 'المجموع' },
      subtotal: { fr: 'Sous-total', ar: 'المجموع الفرعي' },
      tvaAmount: { fr: 'Montant TVA', ar: 'مبلغ الضريبة' },
      grandTotal: { fr: 'Total TTC', ar: 'المجموع شامل الضريبة' },
      amountPaid: { fr: 'Montant payé', ar: 'المبلغ المدفوع' },
      balance: { fr: 'Reste à payer', ar: 'المتبقي' },
      notes: { fr: 'Notes', ar: 'ملاحظات' },
      send: { fr: 'Envoyer', ar: 'إرسال' },
      markPaid: { fr: 'Marquer payée', ar: 'تحديد كمدفوعة' },
      download: { fr: 'Télécharger PDF', ar: 'تحميل PDF' },
      print: { fr: 'Imprimer', ar: 'طباعة' },
      edit: { fr: 'Modifier', ar: 'تعديل' },
      delete: { fr: 'Supprimer', ar: 'حذف' },
      close: { fr: 'Fermer', ar: 'إغلاق' },
      recordPayment: { fr: 'Enregistrer un paiement', ar: 'تسجيل دفعة' },
      paymentAmount: { fr: 'Montant du paiement', ar: 'مبلغ الدفع' },
      paymentMethod: { fr: 'Mode de paiement', ar: 'طريقة الدفع' },
      confirm: { fr: 'Confirmer', ar: 'تأكيد' },
      cancel: { fr: 'Annuler', ar: 'إلغاء' }
    }
    return translations[key]?.[language] || key
  }

  const handleDownload = () => {
    downloadInvoicePDF({
      number: invoice.number,
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      tvaAmount: invoice.tvaAmount,
      total: invoice.total,
      amountPaid: invoice.amountPaid || 0,
      balance: invoice.balance || invoice.total,
      notes: invoice.notes,
      items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
      client: invoice.client ? {
        name: invoice.client.name,
        email: invoice.client.email || undefined,
        phone: invoice.client.phone || undefined,
        address: invoice.client.address || undefined,
        city: invoice.client.city || undefined,
        ice: invoice.client.ice || undefined
      } : undefined
    }, 'invoice')
  }

  const handlePrint = () => {
    previewInvoicePDF({
      number: invoice.number,
      status: invoice.status,
      createdAt: invoice.createdAt,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      tvaAmount: invoice.tvaAmount,
      total: invoice.total,
      amountPaid: invoice.amountPaid || 0,
      balance: invoice.balance || invoice.total,
      notes: invoice.notes,
      items: typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items,
      client: invoice.client ? {
        name: invoice.client.name,
        email: invoice.client.email || undefined,
        phone: invoice.client.phone || undefined,
        address: invoice.client.address || undefined,
        city: invoice.client.city || undefined,
        ice: invoice.client.ice || undefined
      } : undefined
    }, 'invoice')
  }

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount) || invoice.balance
    onMarkPaid?.(amount, paymentMethod)
    setShowPaymentDialog(false)
    setPaymentAmount('')
  }

  const items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {t('invoice')} {invoice.number}
              <Badge className={statusColors[invoice.status]}>
                {statusLabels[invoice.status]?.[language]}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4 max-h-[50vh]">
            <div className="space-y-6">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t('client')}</p>
                  <p className="font-medium">{invoice.client?.name || 'N/A'}</p>
                  {invoice.client?.email && (
                    <p className="text-sm text-gray-500">{invoice.client.email}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t('date')}: {formatDate(invoice.createdAt)}</p>
                  <p className="text-sm text-gray-500">{t('dueDate')}: {formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              
              <Separator />
              
              {/* Items Table */}
              <div>
                <h3 className="font-medium mb-3">{t('items')}</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">{t('description')}</th>
                        <th className="px-3 py-2 text-right">{t('quantity')}</th>
                        <th className="px-3 py-2 text-right">{t('unitPrice')}</th>
                        <th className="px-3 py-2 text-right">{t('tva')}</th>
                        <th className="px-3 py-2 text-right">{t('total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items?.map((item: any, i: number) => {
                        const lineTotal = item.quantity * item.unitPrice
                        const lineTva = lineTotal * (item.tvaRate / 100)
                        return (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2">{item.description}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-3 py-2 text-right">{item.tvaRate}%</td>
                            <td className="px-3 py-2 text-right">{formatCurrency(lineTotal + lineTva)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('subtotal')}</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('tvaAmount')}</span>
                  <span>{formatCurrency(invoice.tvaAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>{t('grandTotal')}</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
                
                {invoice.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>{t('amountPaid')}</span>
                      <span>{formatCurrency(invoice.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-amber-600">
                      <span>{t('balance')}</span>
                      <span>{formatCurrency(invoice.balance)}</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Notes */}
              {invoice.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">{t('notes')}</p>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
            </div>
          </ScrollArea>
          
          {/* Actions */}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              {t('print')}
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              {t('download')}
            </Button>
            
            {invoice.status === 'draft' && (
              <>
                <Button variant="outline" onClick={onEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t('edit')}
                </Button>
                <Button onClick={onSend}>
                  <Send className="w-4 h-4 mr-2" />
                  {t('send')}
                </Button>
              </>
            )}
            
            {(invoice.status === 'sent' || invoice.status === 'partial' || invoice.status === 'overdue') && (
              <Button onClick={() => setShowPaymentDialog(true)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('recordPayment')}
              </Button>
            )}
            
            {invoice.status === 'draft' && (
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('delete')}
              </Button>
            )}
            
            <Button variant="ghost" onClick={onClose}>
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('recordPayment')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>{t('paymentAmount')}</Label>
              <Input
                type="number"
                placeholder={formatCurrency(invoice.balance)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Reste: {formatCurrency(invoice.balance)}
              </p>
            </div>
            
            <div>
              <Label>{t('paymentMethod')}</Label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="bank_transfer">Virement bancaire</option>
                <option value="cash">Espèces</option>
                <option value="check">Chèque</option>
                <option value="card">Carte bancaire</option>
              </select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleRecordPayment}>
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default InvoiceViewDialog
