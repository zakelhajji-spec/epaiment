'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FileText, Link2, Users, Truck, Wallet,
  UserPlus, CheckSquare, Package, UserCog, Key, CreditCard,
  FileSearch, Settings, ChevronLeft, Globe, LogOut, Brain,
  Menu, X, Calculator, FileCheck, ArrowLeftRight, Plug,
  Receipt, BarChart3, Warehouse, Server, ChevronDown, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MODULE_GROUPS, getModulesForGroups } from '@/lib/module-groups.config'
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
  const isRTL = language === 'ar'

  const t = (fr: string, ar: string) => isRTL ? ar : fr

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

  // Close mobile menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

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
                    isMobile ? 'text-base py-3' : 'text-sm py-2'
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

  // Quick access items for mobile bottom bar
  const quickAccessItems = ['dashboard', 'invoices', 'payment-links', 'clients', 'settings']
  const mobileNavItems = quickAccessItems.filter(id => 
    id === 'dashboard' || id === 'settings' || userModules.includes(id)
  ).slice(0, 5)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300 h-screen flex-shrink-0 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
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
            onClick={() => onLanguageChange(isRTL ? 'fr' : 'ar')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm"
          >
            <Globe className="w-5 h-5" />
            {!collapsed && <span>{isRTL ? 'Français' : 'العربية'}</span>}
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            E
          </div>
          <span className="font-semibold text-gray-800">Epaiement.ma</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onLanguageChange(isRTL ? 'fr' : 'ar')}>
            <Globe className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`lg:hidden fixed top-0 bottom-0 z-50 w-72 max-w-[85vw] bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          mobileOpen 
            ? (isRTL ? 'right-0' : 'left-0') 
            : (isRTL ? 'right-[-100%]' : 'left-[-100%]')
        }`}
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
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

        {/* Drawer Navigation */}
        <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
          <nav className="p-3 space-y-1">
            {renderNavItems(true)}
          </nav>
        </ScrollArea>

        {/* Drawer Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-3 space-y-2">
          <Button 
            variant="outline" 
            className="w-full h-10 justify-start" 
            onClick={() => onLanguageChange(isRTL ? 'fr' : 'ar')}
          >
            <Globe className="w-4 h-4 mr-3" />
            {isRTL ? 'Français' : 'العربية'}
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-10 justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            {t('Déconnexion', 'تسجيل الخروج')}
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-2 safe-area-bottom"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {mobileNavItems.map(id => {
          const item = Object.values(groupedItems).flat().find(i => i.id === id)
          if (!item) return null
          const Icon = iconMap[item.icon] || FileText
          const isActive = currentPage === id

          return (
            <button
              key={id}
              onClick={() => handleNavigate(id)}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-colors min-w-[60px] ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : ''}`} />
              <span className={`text-xs mt-0.5 truncate max-w-[60px] ${isActive ? 'font-medium text-blue-600' : ''}`}>
                {t(item.label.split(' ')[0], item.labelAr.split(' ')[0])}
              </span>
            </button>
          )
        })}
        
        {/* More button to open full menu */}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 hover:text-gray-700 min-w-[60px]"
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs mt-0.5">Plus</span>
        </button>
      </nav>

      {/* Add padding for fixed header and bottom nav on mobile */}
      <div className="lg:hidden h-14" /> {/* Top padding */}
      <div className="lg:hidden h-16" /> {/* Bottom padding */}
    </>
  )
}

export default Sidebar
