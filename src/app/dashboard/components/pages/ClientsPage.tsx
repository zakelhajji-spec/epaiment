'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users } from 'lucide-react'
import type { Client, Language } from '../../types'

interface ClientsPageProps {
  clients: Client[]
  isLoading: boolean
  language: Language
  onCreateNew: () => void
}

export function ClientsPage({
  clients,
  isLoading,
  language,
  onCreateNew
}: ClientsPageProps) {
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
            ) : clients.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucun client', 'لا يوجد عملاء')}</p>
                <Button onClick={onCreateNew} className="bg-gradient-to-r from-violet-600 to-fuchsia-500">
                  {t('Ajouter un client', 'إضافة عميل')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {clients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.email} {client.ice && `• ICE: ${client.ice}`}</p>
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
