'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserPlus, CheckSquare } from 'lucide-react'
import { formatDate } from '../../constants'
import type { Lead, Task, Language } from '../../types'

// ============ Leads Page ============
interface LeadsPageProps {
  leads: Lead[]
  language: Language
  onCreateNew: () => void
}

export function LeadsPage({ leads, language, onCreateNew }: LeadsPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      {/* Pipeline Kanban View */}
      <div className="grid grid-cols-5 gap-4">
        {['new', 'contacted', 'qualified', 'converted', 'lost'].map((status) => (
          <Card key={status} className="bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                {status === 'new' && t('Nouveau', 'جديد')}
                {status === 'contacted' && t('Contacté', 'تم التواصل')}
                {status === 'qualified' && t('Qualifié', 'مؤهل')}
                {status === 'converted' && t('Converti', 'محول')}
                {status === 'lost' && t('Perdu', 'مفقود')}
                <Badge variant="secondary" className="ml-2">
                  {leads.filter(l => l.status === status).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {leads.filter(l => l.status === status).map((lead) => (
                <div key={lead.id} className="bg-white p-3 rounded-lg border shadow-sm">
                  <p className="font-medium text-sm">{lead.name}</p>
                  <p className="text-xs text-gray-500">{lead.company}</p>
                  <p className="text-xs text-gray-400 mt-1">{lead.email}</p>
                </div>
              ))}
              {leads.filter(l => l.status === status).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">{t('Aucun prospect', 'لا يوجد عملاء محتملين')}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {leads.length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">{t('Aucun prospect enregistré', 'لا يوجد عملاء محتملين مسجلين')}</p>
            <Button onClick={onCreateNew} className="bg-violet-600">
              {t('Ajouter un prospect', 'إضافة عميل محتمل')}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============ Tasks Page ============
interface TasksPageProps {
  tasks: Task[]
  language: Language
  onCreateNew: () => void
}

export function TasksPage({ tasks, language, onCreateNew }: TasksPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {tasks.length === 0 ? (
              <div className="text-center py-16">
                <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucune tâche', 'لا توجد مهام')}</p>
                <Button onClick={onCreateNew} className="bg-violet-600">
                  {t('Ajouter une tâche', 'إضافة مهمة')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-gray-500">{task.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-gray-500">{task.dueDate ? formatDate(task.dueDate) : ''}</p>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                        {task.status === 'completed' ? t('Terminé', 'مكتمل') : t('En cours', 'قيد التنفيذ')}
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
