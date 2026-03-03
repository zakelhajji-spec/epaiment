'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Package, Warehouse, AlertCircle, Edit, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../constants'
import type { Product, Language } from '../../types'

// ============ Products Page ============
interface ProductsPageProps {
  products: Product[]
  language: Language
  onCreateNew: () => void
}

export function ProductsPage({ products, language, onCreateNew }: ProductsPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            {products.length === 0 ? (
              <div className="text-center py-16">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{t('Aucun produit', 'لا توجد منتجات')}</p>
                <Button onClick={onCreateNew} className="bg-red-600">
                  {t('Ajouter un produit', 'إضافة منتج')}
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">SKU: {product.sku} • {product.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-gray-500">{t('Stock', 'المخزون')}: {product.stock}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
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

// ============ Inventory Page ============
interface InventoryPageProps {
  products: Product[]
  language: Language
}

export function InventoryPage({ products, language }: InventoryPageProps) {
  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 text-center">
          <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('Gestion des Stocks', 'إدارة المخزون')}</h3>
          <p className="text-gray-500 mb-4">{t('Fonctionnalité en cours de développement', 'الميزة قيد التطوير')}</p>
          <Badge variant="secondary">{t('Bientôt disponible', 'قريباً')}</Badge>
        </CardContent>
      </Card>
      {/* Stock Alerts Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            {t('Alertes Stock', 'تنبيهات المخزون')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {products.filter(p => p.stock < 10).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="font-medium">{product.name}</span>
                <Badge variant="destructive">{t('Stock bas', 'مخزون منخفض')}: {product.stock}</Badge>
              </div>
            ))}
            {products.filter(p => p.stock < 10).length === 0 && (
              <p className="text-gray-500 text-center py-4">{t('Aucune alerte', 'لا توجد تنبيهات')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
