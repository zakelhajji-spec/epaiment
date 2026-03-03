'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserCog, Key, Server, FileSearch, Copy, Trash2 } from 'lucide-react'
import { formatDate } from '../../constants'
import type { TeamMember, ApiKey, AuditLog, Language } from '../../types'

// ============ Team Page ============
interface TeamPageProps {
  teamMembers: TeamMember[]
  language: Language
  onCreateNew: () => void
}

export function TeamPage({ teamMembers, language, onCreateNew }: TeamPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {teamMembers.length === 0 ? (
              <div className="text-center py-16">
                <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucun membre', 'لا يوجد أعضاء')}</p>
                <Button onClick={onCreateNew} className="bg-cyan-600">
                  {t('Inviter un membre', 'دعوة عضو')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-cyan-600">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role === 'admin' ? t('Admin', 'مدير') : member.role === 'accountant' ? t('Comptable', 'محاسب') : t('Lecteur', 'قارئ')}
                      </Badge>
                      <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                        {member.status === 'active' ? t('Actif', 'نشط') : t('En attente', 'قيد الانتظار')}
                      </Badge>
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

// ============ API Keys Page ============
interface ApiKeysPageProps {
  apiKeys: ApiKey[]
  language: Language
  onCreateNew: () => void
}

export function ApiKeysPage({ apiKeys, language, onCreateNew }: ApiKeysPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {apiKeys.length === 0 ? (
              <div className="text-center py-16">
                <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucune clé API', 'لا توجد مفاتيح API')}</p>
                <Button onClick={onCreateNew} className="bg-pink-600">
                  {t('Générer une clé', 'إنشاء مفتاح')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Key className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <p className="text-sm text-gray-500 font-mono">{key.key?.substring(0, 20)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={key.permissions === 'write' ? 'default' : 'secondary'}>
                        {key.permissions === 'write' ? t('Lecture/Écriture', 'قراءة/كتابة') : t('Lecture seule', 'قراءة فقط')}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(key.key)}>
                          <Copy className="w-4 h-4" />
                        </Button>
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

// ============ Gateways Page ============
interface GatewaysPageProps {
  language: Language
}

export function GatewaysPage({ language }: GatewaysPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CMI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              CMI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">{t('Centre Monétique Interbancaire', 'المركز النقدي البيني')}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t('Non configuré', 'غير مكون')}</Badge>
            </div>
            <Button variant="outline" className="w-full">{t('Configurer', 'إعداد')}</Button>
          </CardContent>
        </Card>
        {/* Fatourati */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Fatourati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">{t('CDG Group - Paiement en ligne', 'مجموعة صندوق الإيداع والتدبير')}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t('Non configuré', 'غير مكون')}</Badge>
            </div>
            <Button variant="outline" className="w-full">{t('Configurer', 'إعداد')}</Button>
          </CardContent>
        </Card>
        {/* CIH Pay */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              CIH Pay
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">{t('CIH Bank - Paiement mobile', 'البنك المغربي للتجارة الخارجية')}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t('Non configuré', 'غير مكون')}</Badge>
            </div>
            <Button variant="outline" className="w-full">{t('Configurer', 'إعداد')}</Button>
          </CardContent>
        </Card>
      </div>
      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Webhooks', 'الخطاطات')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">{t('URLs de callback pour les événements de paiement', 'عناوين URL للاستدعاء لأحداث الدفع')}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">https://api.epaiement.ma/webhooks/payment</span>
              <Badge variant="secondary">{t('Actif', 'نشط')}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============ Audit Page ============
interface AuditPageProps {
  auditLogs: AuditLog[]
  language: Language
}

export function AuditPage({ auditLogs, language }: AuditPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {auditLogs.length === 0 ? (
              <div className="text-center py-16">
                <FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">{t('Journal d\'audit vide', 'سجل التدقيق فارغ')}</p>
                <p className="text-sm text-gray-400">{t('Les actions seront enregistrées automatiquement', 'سيتم تسجيل الإجراءات تلقائياً')}</p>
              </div>
            ) : (
              <div className="divide-y">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileSearch className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-500">{log.user} • {log.resource}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{formatDate(log.timestamp)}</p>
                      <p className="text-xs text-gray-400">{log.ip}</p>
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
