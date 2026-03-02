'use client'

import { useState } from 'react'
import {
  LayoutDashboard, FileText, Link2, Users, Truck, Wallet,
  UserPlus, CheckSquare, Package, UserCog, Key, CreditCard,
  FileSearch, Settings, ChevronLeft, Globe, LogOut, Brain,
  Menu, X, Calculator, FileCheck, ArrowLeftRight, Plug,
  Receipt, BarChart3, Warehouse, Server, ChevronDown, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MODULES_CONFIG } from '@/lib/modules.config'
import type { Language } from '@/lib/modules/types'

// Icon map for dynamic icon rendering
const iconMap: Record<string, any> = {
  LayoutDashboard, FileText, Link2, Users, Truck, Wallet,
  UserPlus, CheckSquare, Package, UserCog, Key, CreditCard,
  FileSearch, Settings, Brain, Calculator, FileCheck, ArrowLeftRight, Plug,
  Receipt, BarChart3, Warehouse, Server
}

// Module categories with labels
const CATEGORIES = {
  core: { fr: 'Général', ar: 'عام', order: 0 },
  sales: { fr: 'Ventes', ar: 'المبيعات', order: 1 },
  accounting: { fr: 'Comptabilité', ar: 'المحاسبة', order: 2 },
  crm: { fr: 'CRM', ar: 'إدارة العملاء', order: 3 },
  stock: { fr: 'Stock', ar: 'المخزون', order: 4 },
  team: { fr: 'Équipe', ar: 'الفريق', order: 5 },
  integrations: { fr: 'Intégrations', ar: 'التكاملات', order: 6 },
  audit: { fr: 'Audit', ar: 'التدقيق', order: 7 },
}

// Module to category mapping
const MODULE_CATEGORIES: Record<string, string> = {
  'dashboard': 'core',
  'invoices': 'sales',
  'payment-links': 'sales',
  'clients': 'sales',
  'suppliers': 'sales',
  'quotes': 'sales',
  'expenses': 'accounting',
  'credit-notes': 'accounting',
  'reports': 'accounting',
  'leads': 'crm',
  'tasks': 'crm',
  'ai-lead-qualifier': 'crm',
  'products': 'stock',
  'inventory': 'stock',
  'team': 'team',
  'api-keys': 'integrations',
  'gateways': 'integrations',
  'audit': 'audit',
  'modules': 'core',
  'settings': 'core',
}

interface NavItem {
  id: string
  label: string
  labelAr: string
  icon: string
  category: string
}

interface SidebarProps {
  userModules: string[]
  language: Language
  onLanguageChange: (lang: Language) => void
  onLogout: () => void
  onNavigate: (page: string) => void
  currentPage: string
}

// Get navigation items grouped by category
function getGroupedNavItems(userModules: string[]): Record<string, NavItem[]> {
  const groups: Record<string, NavItem[]> = {}

  // Dashboard is always available
  const dashboardItem: NavItem = {
    id: 'dashboard',
    label: 'Tableau de bord',
    labelAr: 'لوحة التحكم',
    icon: 'LayoutDashboard',
    category: 'core'
  }

  // All available modules with their config
  const allModules: NavItem[] = [
    { id: 'invoices', label: 'Factures', labelAr: 'الفواتير', icon: 'FileText', category: 'sales' },
    { id: 'payment-links', label: 'Liens de paiement', labelAr: 'روابط الدفع', icon: 'Link2', category: 'sales' },
    { id: 'clients', label: 'Clients', labelAr: 'العملاء', icon: 'Users', category: 'sales' },
    { id: 'suppliers', label: 'Fournisseurs', labelAr: 'الموردين', icon: 'Truck', category: 'sales' },
    { id: 'quotes', label: 'Devis', labelAr: 'العروض', icon: 'FileCheck', category: 'sales' },
    { id: 'expenses', label: 'Dépenses', labelAr: 'المصاريف', icon: 'Wallet', category: 'accounting' },
    { id: 'credit-notes', label: 'Avoirs', labelAr: 'إشعارات دائنة', icon: 'ArrowLeftRight', category: 'accounting' },
    { id: 'reports', label: 'Rapports', labelAr: 'التقارير', icon: 'BarChart3', category: 'accounting' },
    { id: 'leads', label: 'Prospects', labelAr: 'العملاء المحتملين', icon: 'UserPlus', category: 'crm' },
    { id: 'tasks', label: 'Tâches', labelAr: 'المهام', icon: 'CheckSquare', category: 'crm' },
    { id: 'ai-lead-qualifier', label: 'AI Lead', labelAr: 'AI Lead', icon: 'Brain', category: 'crm' },
    { id: 'products', label: 'Produits', labelAr: 'المنتجات', icon: 'Package', category: 'stock' },
    { id: 'inventory', label: 'Inventaire', labelAr: 'المخزون', icon: 'Warehouse', category: 'stock' },
    { id: 'team', label: 'Équipe', labelAr: 'الفريق', icon: 'UserCog', category: 'team' },
    { id: 'api-keys', label: 'Clés API', labelAr: 'مفاتيح API', icon: 'Key', category: 'integrations' },
    { id: 'gateways', label: 'Passerelles', labelAr: 'البوابات', icon: 'Server', category: 'integrations' },
    { id: 'audit', label: 'Audit', labelAr: 'التدقيق', icon: 'FileSearch', category: 'audit' },
  ]

  // Filter modules based on user subscription
  const userNavItems = allModules.filter(item => userModules.includes(item.id))

  // Core items at top
  groups['core'] = [dashboardItem]

  // Group by category
  userNavItems.forEach(item => {
    const cat = item.category
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  })

  // Add Modules and Settings to core
  groups['core'].push(
    { id: 'modules', label: 'Modules', labelAr: 'الوحدات', icon: 'Plug', category: 'core' },
    { id: 'settings', label: 'Paramètres', labelAr: 'الإعدادات', icon: 'Settings', category: 'core' }
  )

  return groups
}

export function Sidebar({
  userModules,
  language,
  onLanguageChange,
  onLogout,
  onNavigate,
  currentPage
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['core', 'sales']) // Default expanded
  )
  const groupedItems = getGroupedNavItems(userModules)

  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  const handleNavigate = (id: string) => {
    onNavigate(id)
    setMobileOpen(false)
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Sort categories by order
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    return (CATEGORIES[a as keyof typeof CATEGORIES]?.order || 99) - 
           (CATEGORIES[b as keyof typeof CATEGORIES]?.order || 99)
  })

  // Render navigation items
  const renderNavItems = (isMobile = false) => (
    <>
      {sortedCategories.map(category => {
        const items = groupedItems[category]
        if (!items || items.length === 0) return null

        const categoryLabel = CATEGORIES[category as keyof typeof CATEGORIES]
        const isExpanded = expandedCategories.has(category)
        const isCore = category === 'core'

        return (
          <div key={category} className={isCore ? '' : 'mb-1'}>
            {/* Category Header (not for core) */}
            {!isCore && !collapsed && (
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
              >
                <span>{t(categoryLabel?.fr || category, categoryLabel?.ar || category)}</span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Category Items */}
            {((!isCore && isExpanded) || isCore) && items.map((item) => {
              const Icon = iconMap[item.icon] || FileText
              const isActive = currentPage === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isMobile ? 'text-base py-2.5' : 'text-sm py-2'
                  } ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={collapsed ? t(item.label, item.labelAr) : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {(!collapsed || isMobile) && (
                    <span className="truncate">{t(item.label, item.labelAr)}</span>
                  )}
                </button>
              )
            })}
          </div>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 h-screen flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                E
              </div>
              <span className="font-semibold text-gray-800 text-sm">Epaiement.ma</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-2">
          <nav className="space-y-0.5">
            {renderNavItems()}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 space-y-0.5 flex-shrink-0">
          <button
            onClick={() => onLanguageChange(language === 'fr' ? 'ar' : 'fr')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm"
          >
            <Globe className="w-5 h-5" />
            {!collapsed && <span>{language === 'fr' ? 'العربية' : 'Français'}</span>}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm"
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span>{t('Déconnexion', 'تسجيل الخروج')}</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            E
          </div>
          <span className="font-semibold text-gray-800">Epaiement.ma</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onLanguageChange(language === 'fr' ? 'ar' : 'fr')}>
            <Globe className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)}>
          <div
            className="bg-white w-64 h-full overflow-y-auto"
            onClick={e => e.stopPropagation()}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  E
                </div>
                <span className="font-semibold text-gray-800">Epaiement.ma</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="p-2 space-y-0.5">
              {renderNavItems(true)}
            </nav>
            <div className="border-t border-gray-200 p-3 space-y-2">
              <Button variant="outline" className="w-full h-9" onClick={() => onLanguageChange(language === 'fr' ? 'ar' : 'fr')}>
                <Globe className="w-4 h-4 mr-2" />
                {language === 'fr' ? 'العربية' : 'Français'}
              </Button>
              <Button variant="outline" className="w-full h-9" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {t('Déconnexion', 'تسجيل الخروج')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
