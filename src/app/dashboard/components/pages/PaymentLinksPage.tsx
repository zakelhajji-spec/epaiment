'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Link2, Copy, Send } from 'lucide-react'
import { formatCurrency, formatDate } from '../../constants'
import type { PaymentLink, Language } from '../../types'

interface PaymentLinksPageProps {
  paymentLinks: PaymentLink[]
  isLoading: boolean
  language: Language
  onCreateNew: () => void
  onAction: (linkId: string, action: 'copy' | 'whatsapp' | 'delete') => void
}

export function PaymentLinksPage({
  paymentLinks,
  isLoading,
  language,
  onCreateNew,
  onAction
}: PaymentLinksPageProps) {
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
            ) : paymentLinks.length === 0 ? (
              <div className="text-center py-16">
                <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucun lien de paiement', 'لا توجد روابط دفع')}</p>
                <Button onClick={onCreateNew} className="bg-purple-600">
                  {t('Créer un lien', 'إنشاء رابط')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {paymentLinks.map((link) => (
                  <div key={link.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">{link.description}</p>
                          <p className="text-sm text-gray-500">{link.reference} • {formatDate(link.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(link.amount)}</p>
                          <Badge variant={link.status === 'paid' ? 'default' : link.status === 'expired' ? 'destructive' : 'secondary'}>
                            {link.status === 'paid' ? t('Payée', 'مدفوعة') : link.status === 'expired' ? t('Expiré', 'منتهي') : t('En attente', 'قيد الانتظار')}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => onAction(link.id, 'copy')}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onAction(link.id, 'whatsapp')}>
                            <Send className="w-4 h-4 text-green-600" />
                          </Button>
                        </div>
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
