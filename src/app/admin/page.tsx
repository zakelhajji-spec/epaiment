'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Users, FileText, Link2, TrendingUp, TrendingDown, DollarSign,
  Search, Eye, Ban, CheckCircle, Trash2, Crown, RefreshCw,
  ChevronLeft, ChevronRight, Building2, Mail, Calendar,
  PieChart, BarChart3, AlertTriangle, Settings, LogOut, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ToastContainer, showToast } from '@/components/shared/Toast'

type Language = 'fr' | 'ar'

// ==================== STATS INTERFACE ====================
interface Stats {
  users: {
    total: number
    active: number
    newThisMonth: number
    newThisWeek: number
    growthRate: string
  }
  invoices: {
    total: number
    thisMonth: number
    paid: number
    pending: number
    overdue: number
  }
  revenue: {
    total: number
    thisMonth: number
    mrr: number
  }
  paymentLinks: {
    total: number
    paid: number
    pending: number
    conversionRate: string
  }
  subscriptions: Array<{ plan: string; count: number }>
  recentUsers: Array<any>
  topUsers: Array<any>
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
  accountStatus: string
  companyName: string | null
  companyIce: string | null
  companyCity: string | null
  subscriptionPlan: string
  createdAt: string
  lastLogin: string | null
  subscription: {
    plan: string
    status: string
    price: number
    billingCycle: string
    activeGroups: string
  } | null
  _count: {
    invoices: number
    clients: number
    paymentLinks: number
  }
}

// ==================== CONSTANTS ====================
const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount || 0)

const formatDate = (date: string) => {
  try {
    return new Date(date).toLocaleDateString('fr-MA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return date
  }
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700',
  business: 'bg-blue-100 text-blue-700',
  professional: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
  custom: 'bg-green-100 text-green-700'
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  deleted: 'bg-gray-100 text-gray-500',
  trial: 'bg-yellow-100 text-yellow-700'
}

// ==================== MAIN COMPONENT ====================
export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [language, setLanguage] = useState<Language>('fr')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogOpen, setDialogOpen] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  const t = useCallback((fr: string, ar: string) => language === 'ar' ? ar : fr, [language])
  
  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          const res = await fetch('/api/admin/stats')
          if (res.ok) {
            setIsAdmin(true)
          } else {
            router.push('/dashboard')
          }
        } catch {
          router.push('/dashboard')
        }
      }
    }
    checkAdmin()
  }, [status, session, router])
  
  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }
  
  // Fetch users
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('limit', '20')
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (planFilter) params.set('plan', planFilter)
      
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotalPages(data.pagination.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Initial fetch
  useEffect(() => {
    if (isAdmin) {
      fetchStats()
      fetchUsers()
    }
  }, [isAdmin, currentPage, statusFilter, planFilter])
  
  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAdmin && currentPage === 1) {
        fetchUsers()
      } else {
        setCurrentPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [search])
  
  // User actions
  const handleUserAction = async (userId: string, action: string, data?: any) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, data })
      })
      
      const result = await res.json()
      
      if (res.ok) {
        showToast(t('Action réussie!', 'تم الإجراء بنجاح!'))
        fetchUsers()
        fetchStats()
        setDialogOpen(null)
        setSelectedUser(null)
      } else {
        showToast(result.error || t('Erreur', 'خطأ'), 'error')
      }
    } catch (error) {
      showToast(t('Erreur de connexion', 'خطأ في الاتصال'), 'error')
    }
  }
  
  // Loading state
  if (status === 'loading' || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse">
            A
          </div>
          <p className="text-gray-400">{t('Chargement...', 'جاري التحميل...')}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold">Epaiement Admin</h1>
              <p className="text-xs text-gray-400">{t('Tableau de bord administrateur', 'لوحة تحكم المسؤول')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')} className="text-gray-400">
              <Globe className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="text-gray-400"
            >
              {t('Retour au dashboard', 'العودة للوحة التحكم')}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{t('Total Utilisateurs', 'إجمالي المستخدمين')}</p>
                      <p className="text-2xl font-bold">{stats.users.total}</p>
                      <p className="text-xs text-emerald-400">+{stats.users.newThisMonth} {t('ce mois', 'هذا الشهر')}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{t('Revenus Totaux', 'إجمالي الإيرادات')}</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.revenue.total)}</p>
                      <p className="text-xs text-emerald-400">{t('MRR:', 'MRR:')} {formatCurrency(stats.revenue.mrr)}</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{t('Total Factures', 'إجمالي الفواتير')}</p>
                      <p className="text-2xl font-bold">{stats.invoices.total}</p>
                      <p className="text-xs text-amber-400">{stats.invoices.pending} {t('en attente', 'معلقة')}</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{t('Liens de Paiement', 'روابط الدفع')}</p>
                      <p className="text-2xl font-bold">{stats.paymentLinks.total}</p>
                      <p className="text-xs text-purple-400">{stats.paymentLinks.conversionRate}% {t('conversion', 'تحويل')}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Link2 className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Subscription Breakdown */}
            <div className="grid lg:grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">{t('Répartition des Abonnements', 'توزيع الاشتراكات')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.subscriptions.map(sub => (
                      <div key={sub.plan} className="flex items-center justify-between">
                        <Badge className={PLAN_COLORS[sub.plan] || 'bg-gray-100 text-gray-700'}>
                          {sub.plan}
                        </Badge>
                        <span className="font-medium">{sub.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-400">{t('Top Utilisateurs', 'أفضل المستخدمين')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topUsers.slice(0, 5).map((user, i) => (
                      <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500 w-6">{i + 1}.</span>
                          <div>
                            <p className="font-medium">{user.companyName || user.name || user.email}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{user._count.invoices} {t('factures', 'فواتير')}</p>
                          <p className="text-xs text-gray-500">{user._count.clients} {t('clients', 'عملاء')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
        
        {/* Users Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>{t('Gestion des Utilisateurs', 'إدارة المستخدمين')}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    placeholder={t('Rechercher...', 'بحث...')}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-gray-700 border-gray-600"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                    <SelectValue placeholder={t('Statut', 'الحالة')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('Tous', 'الكل')}</SelectItem>
                    <SelectItem value="active">{t('Actif', 'نشط')}</SelectItem>
                    <SelectItem value="suspended">{t('Suspendu', 'معلق')}</SelectItem>
                    <SelectItem value="deleted">{t('Supprimé', 'محذوف')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                    <SelectValue placeholder={t('Plan', 'الخطة')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('Tous', 'الكل')}</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => { fetchStats(); fetchUsers(); }}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="text-center py-16">
                  <p className="text-gray-500">{t('Chargement...', 'جاري التحميل...')}</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">{t('Aucun utilisateur trouvé', 'لم يتم العثور على مستخدمين')}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {users.map(user => (
                    <div key={user.id} className="p-4 hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                            {(user.companyName || user.name || user.email)?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{user.companyName || user.name || 'N/A'}</p>
                              {user.role === 'admin' && (
                                <Crown className="w-4 h-4 text-amber-500" />
                              )}
                              {user.role === 'superadmin' && (
                                <Crown className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={PLAN_COLORS[user.subscriptionPlan]}>
                                {user.subscriptionPlan}
                              </Badge>
                              <Badge className={STATUS_COLORS[user.accountStatus]}>
                                {user.accountStatus}
                              </Badge>
                              {user.companyIce && (
                                <span className="text-xs text-gray-500">ICE: {user.companyIce}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right text-sm">
                            <p>{user._count.invoices} {t('factures', 'فواتير')}</p>
                            <p>{user._count.clients} {t('clients', 'عملاء')}</p>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            <p>{t('Inscrit:', 'مسجل:')} {formatDate(user.createdAt)}</p>
                            {user.lastLogin && (
                              <p>{t('Dernière connexion:', 'آخر دخول:')} {formatDate(user.lastLogin)}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setSelectedUser(user); setDialogOpen('view'); }}
                              title={t('Voir détails', 'عرض التفاصيل')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {user.accountStatus === 'active' && user.role !== 'superadmin' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleUserAction(user.id, 'suspend')}
                                title={t('Suspendre', 'تعليق')}
                                className="text-amber-500 hover:text-amber-600"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                            {user.accountStatus === 'suspended' && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleUserAction(user.id, 'activate')}
                                title={t('Activer', 'تفعيل')}
                                className="text-emerald-500 hover:text-emerald-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {t('Page', 'صفحة')} {currentPage} {t('sur', 'من')} {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* User Detail Dialog */}
      <Dialog open={dialogOpen === 'view'} onOpenChange={() => { setDialogOpen(null); setSelectedUser(null); }}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('Détails Utilisateur', 'تفاصيل المستخدم')}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {(selectedUser.companyName || selectedUser.name || selectedUser.email)?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-bold">{selectedUser.companyName || selectedUser.name || 'N/A'}</p>
                  <p className="text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              
              <Separator className="bg-gray-700" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">{t('Statut', 'الحالة')}</p>
                  <Badge className={STATUS_COLORS[selectedUser.accountStatus]}>
                    {selectedUser.accountStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">{t('Plan', 'الخطة')}</p>
                  <Badge className={PLAN_COLORS[selectedUser.subscriptionPlan]}>
                    {selectedUser.subscriptionPlan}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">{t('Rôle', 'الدور')}</p>
                  <p>{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('Ville', 'المدينة')}</p>
                  <p>{selectedUser.companyCity || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">ICE</p>
                  <p>{selectedUser.companyIce || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('Date d\'inscription', 'تاريخ التسجيل')}</p>
                  <p>{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
              
              <Separator className="bg-gray-700" />
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-2xl font-bold">{selectedUser._count.invoices}</p>
                  <p className="text-xs text-gray-500">{t('Factures', 'الفواتير')}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-2xl font-bold">{selectedUser._count.clients}</p>
                  <p className="text-xs text-gray-500">{t('Clients', 'العملاء')}</p>
                </div>
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-2xl font-bold">{selectedUser._count.paymentLinks}</p>
                  <p className="text-xs text-gray-500">{t('Liens', 'الروابط')}</p>
                </div>
              </div>
              
              {selectedUser.subscription && (
                <>
                  <Separator className="bg-gray-700" />
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{t('Modules Actifs', 'الوحدات النشطة')}</p>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        try {
                          const groups = JSON.parse(selectedUser.subscription.activeGroups)
                          return groups.map((g: string) => (
                            <Badge key={g} variant="outline" className="border-gray-600">
                              {g}
                            </Badge>
                          ))
                        } catch {
                          return <span className="text-gray-500">N/A</span>
                        }
                      })()}
                    </div>
                  </div>
                </>
              )}
              
              <DialogFooter className="gap-2">
                {selectedUser.accountStatus === 'active' && selectedUser.role !== 'superadmin' && (
                  <Button variant="outline" onClick={() => handleUserAction(selectedUser.id, 'suspend')}>
                    <Ban className="w-4 h-4 mr-2" />
                    {t('Suspendre', 'تعليق')}
                  </Button>
                )}
                {selectedUser.accountStatus === 'suspended' && (
                  <Button variant="outline" onClick={() => handleUserAction(selectedUser.id, 'activate')} className="border-emerald-600 text-emerald-500">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('Activer', 'تفعيل')}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <ToastContainer />
    </div>
  )
}
