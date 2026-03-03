'use client'

import { useState } from 'react'
import { Bell, Globe, Search, ChevronDown, User, Settings, LogOut, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Language } from '@/lib/modules/types'

interface User {
  id: string
  name: string
  email: string
  company?: string
}

interface HeaderProps {
  user: User
  language: Language
  onLanguageChange: (lang: Language) => void
  onLogout: () => void
  onSearch?: (query: string) => void
  notifications?: { id: string; title: string; read: boolean }[]
}

export function Header({
  user,
  language,
  onLanguageChange,
  onLogout,
  onSearch,
  notifications = []
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const unreadCount = notifications.filter(n => !n.read).length

  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('Rechercher...', 'بحث...')}
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* DGI 2026 Badge */}
          <Badge variant="outline" className="hidden sm:flex items-center gap-1 bg-violet-50 text-violet-700 border-violet-200">
            <Sparkles className="w-3 h-3" />
            DGI 2026
          </Badge>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onLanguageChange(language === 'fr' ? 'ar' : 'fr')}
            title={language === 'fr' ? 'العربية' : 'Français'}
          >
            <Globe className="w-5 h-5" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>{t('Notifications', 'الإشعارات')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  {t('Aucune notification', 'لا توجد إشعارات')}
                </div>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <DropdownMenuItem key={n.id} className={n.read ? '' : 'bg-blue-50'}>
                    {n.title}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <span className="text-sm font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:inline text-sm">{user.name}</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {user.company && <p className="text-xs text-gray-400">{user.company}</p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                {t('Mon profil', 'ملفي الشخصي')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                {t('Paramètres', 'الإعدادات')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                {t('Déconnexion', 'تسجيل الخروج')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default Header
