'use client';

/**
 * Epaiement.ma Admin Revenue Dashboard
 * Displays cost analysis, break-even, and growth scenarios
 * Based on cost_analysis.xlsx recommendations
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Calculator,
  Target,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import { COST_ANALYSIS, PRICING_PLANS, formatPrice } from '@/lib/pricing-plans.config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RevenueDashboardProps {
  language?: 'fr' | 'ar';
  initialStats?: {
    totalClients: number;
    basicClients: number;
    proClients: number;
    businessClients: number;
    monthlyRevenue: number;
  };
}

export function RevenueDashboard({
  language = 'fr',
  initialStats,
}: RevenueDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [stats] = useState(initialStats || {
    totalClients: 0,
    basicClients: 0,
    proClients: 0,
    businessClients: 0,
    monthlyRevenue: 0,
  });

  const t = {
    fr: {
      title: 'Tableau de Bord Revenus',
      subtitle: 'Analyse de rentabilité et scénarios de croissance',
      monthlyRevenue: 'Revenu Mensuel',
      totalClients: 'Total Clients',
      monthlyCost: 'Coût Mensuel Total',
      profit: 'Profit',
      breakEven: 'Seuil de Rentabilité',
      clientsNeeded: 'clients nécessaires',
      growthScenarios: 'Scénarios de Croissance',
      revenue: 'Revenu',
      clients: 'Clients',
      conservative: 'Conservateur',
      moderate: 'Modéré',
      optimistic: 'Optimiste',
      ambitious: 'Ambitieux',
      months: 'mois',
      fixedCosts: 'Coûts Fixes',
      variableCosts: 'Coûts Variables',
      effort: 'Effort Mensuel',
      server: 'Serveur Cloud',
      storage: 'Stockage',
      domain: 'Domaine .ma',
      maintenance: 'Maintenance & Support',
      hoursPerMonth: 'heures/mois',
      mad: 'MAD',
      perMonth: '/mois',
      plan: 'Plan',
      price: 'Prix',
      limits: 'Limites',
      linksMonth: 'liens/mois',
      invoicesMonth: 'factures/mois',
      toBreakEven: 'Pour atteindre le seuil',
      fromProfit: 'de profit',
      recommendations: 'Recommandations',
      rec1: 'Augmenter les limites du plan Starter',
      rec2: 'Cibler les auto-entrepreneurs avec Basic',
      rec3: 'Marketing LinkedIn + Facebook',
      rec4: 'Intégrer CMI/Fatourati (obligation 2026)',
    },
    ar: {
      title: 'لوحة تحكم الإيرادات',
      subtitle: 'تحليل الربحية وسيناريوهات النمو',
      monthlyRevenue: 'الإيرادات الشهرية',
      totalClients: 'إجمالي العملاء',
      monthlyCost: 'التكلفة الشهرية الإجمالية',
      profit: 'الربح',
      breakEven: 'نقطة التعادل',
      clientsNeeded: 'عميل مطلوب',
      growthScenarios: 'سيناريوهات النمو',
      revenue: 'الإيرادات',
      clients: 'العملاء',
      conservative: 'محافظ',
      moderate: 'معتدل',
      optimistic: 'متفائل',
      ambitious: 'طموح',
      months: 'شهر',
      fixedCosts: 'التكاليف الثابتة',
      variableCosts: 'التكاليف المتغيرة',
      effort: 'الجهد الشهري',
      server: 'الخادم السحابي',
      storage: 'التخزين',
      domain: 'النطاق .ma',
      maintenance: 'الصيانة والدعم',
      hoursPerMonth: 'ساعة/شهر',
      mad: 'درهم',
      perMonth: '/شهر',
      plan: 'الخطة',
      price: 'السعر',
      limits: 'الحدود',
      linksMonth: 'رابط/شهر',
      invoicesMonth: 'فاتورة/شهر',
      toBreakEven: 'للوصول لنقطة التعادل',
      fromProfit: 'من الربح',
      recommendations: 'التوصيات',
      rec1: 'زيادة حدود الخطة المجانية',
      rec2: 'استهداف المقاولين الذاتيين',
      rec3: 'تسويق LinkedIn + Facebook',
      rec4: 'دمج CMI/Fatourati (التزام 2026)',
    },
  };

  const i18n = t[language];
  const isRTL = language === 'ar';
  const totalMonthlyCost = COST_ANALYSIS.totalMonthlyCost;

  // Calculate break-even progress
  const breakEvenProgress = stats.monthlyRevenue > 0
    ? Math.min((stats.monthlyRevenue / totalMonthlyCost) * 100, 100)
    : 0;

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{i18n.title}</h2>
          <p className="text-gray-500">{i18n.subtitle}</p>
        </div>
        <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as typeof selectedPeriod)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">{language === 'fr' ? 'Ce mois' : 'هذا الشهر'}</SelectItem>
            <SelectItem value="quarter">{language === 'fr' ? 'Ce trimestre' : 'هذا الربع'}</SelectItem>
            <SelectItem value="year">{language === 'fr' ? 'Cette année' : 'هذه السنة'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-700">{i18n.monthlyRevenue}</CardDescription>
              <CardTitle className="text-3xl text-green-800">
                {formatPrice(stats.monthlyRevenue)} <span className="text-sm">{i18n.mad}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                {stats.monthlyRevenue >= totalMonthlyCost ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">
                      +{formatPrice(stats.monthlyRevenue - totalMonthlyCost)} {i18n.profit}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">
                      -{formatPrice(totalMonthlyCost - stats.monthlyRevenue)} {language === 'fr' ? 'perte' : 'خسارة'}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Total Clients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-sky-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-700">{i18n.totalClients}</CardDescription>
              <CardTitle className="text-3xl text-blue-800">{stats.totalClients}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    Basic: {stats.basicClients}
                  </Badge>
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    Pro: {stats.proClients}
                  </Badge>
                </span>
                <span className="flex items-center gap-1">
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                    Business: {stats.businessClients}
                  </Badge>
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Cost */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-orange-700">{i18n.monthlyCost}</CardDescription>
              <CardTitle className="text-3xl text-orange-800">
                {formatPrice(totalMonthlyCost)} <span className="text-sm">{i18n.mad}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-orange-600">
                {COST_ANALYSIS.effort.hoursPerMonth}h {i18n.maintenance} @ {COST_ANALYSIS.effort.hourlyRate} {i18n.mad}/h
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Break-Even */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardDescription className="text-purple-700">{i18n.breakEven}</CardDescription>
              <CardTitle className="text-3xl text-purple-800">
                {COST_ANALYSIS.breakEven.mixedClients} <span className="text-sm">{i18n.clientsNeeded}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={breakEvenProgress} className="h-2 bg-purple-200" />
              <p className="text-xs text-purple-600 mt-1">
                {breakEvenProgress.toFixed(0)}% {language === 'fr' ? 'atteint' : 'تم الوصول'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="scenarios" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="scenarios">{i18n.growthScenarios}</TabsTrigger>
          <TabsTrigger value="costs">{i18n.fixedCosts}</TabsTrigger>
          <TabsTrigger value="plans">{i18n.plan}</TabsTrigger>
        </TabsList>

        {/* Growth Scenarios Tab */}
        <TabsContent value="scenarios">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {COST_ANALYSIS.growthScenarios.map((scenario, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full ${scenario.profit >= 0 ? 'border-green-200' : 'border-red-200'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{scenario.name[language]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Client Distribution */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Basic:</span>
                        <span className="font-medium">{scenario.clients.basic} {i18n.clients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Pro:</span>
                        <span className="font-medium">{scenario.clients.pro} {i18n.clients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Business:</span>
                        <span className="font-medium">{scenario.clients.business} {i18n.clients}</span>
                      </div>
                    </div>

                    {/* Revenue & Profit */}
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{i18n.revenue}:</span>
                        <span className="font-semibold">{formatPrice(scenario.revenue)} {i18n.mad}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{i18n.profit}:</span>
                        <span className={`font-bold ${scenario.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPrice(scenario.profit)} {i18n.mad}
                        </span>
                      </div>
                    </div>

                    {/* Profit Badge */}
                    {scenario.profit >= 0 && (
                      <Badge className="w-full justify-center bg-green-100 text-green-700 border-green-300">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {language === 'fr' ? 'Rentable' : 'مربح'}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fixed Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  {i18n.fixedCosts}
                </CardTitle>
                <CardDescription>
                  {language === 'fr' ? 'Coûts récurrents mensuels' : 'التكاليف المتكررة شهرياً'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{i18n.server}</span>
                    <span className="font-medium">{formatPrice(COST_ANALYSIS.fixedCosts.serverCloud)} {i18n.mad}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{i18n.storage}</span>
                    <span className="font-medium">{formatPrice(COST_ANALYSIS.fixedCosts.storage)} {i18n.mad}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{i18n.domain}</span>
                    <span className="font-medium">{formatPrice(COST_ANALYSIS.fixedCosts.domain)} {i18n.mad}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>CDN (Cloudflare)</span>
                    <span className="text-green-600">{language === 'fr' ? 'Gratuit' : 'مجاني'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Email (SendGrid)</span>
                    <span className="text-green-600">{language === 'fr' ? 'Gratuit' : 'مجاني'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>SSL (Let&apos;s Encrypt)</span>
                    <span className="text-green-600">{language === 'fr' ? 'Gratuit' : 'مجاني'}</span>
                  </div>
                </div>
                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="font-semibold">{language === 'fr' ? 'Total' : 'المجموع'}</span>
                  <span className="font-bold text-lg">{formatPrice(COST_ANALYSIS.fixedCosts.total)} {i18n.mad}</span>
                </div>
              </CardContent>
            </Card>

            {/* Effort Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  {i18n.effort}
                </CardTitle>
                <CardDescription>
                  {language === 'fr' ? 'Temps consacré au projet' : 'الوقت المخصص للمشروع'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{i18n.maintenance}</span>
                    <span className="font-medium">{COST_ANALYSIS.effort.hoursPerMonth} {i18n.hoursPerMonth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{language === 'fr' ? 'Tarif horaire' : 'السعر بالساعة'}</span>
                    <span className="font-medium">{COST_ANALYSIS.effort.hourlyRate} {i18n.mad}</span>
                  </div>
                </div>
                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="font-semibold">{language === 'fr' ? 'Coût effort' : 'تكلفة الجهد'}</span>
                  <span className="font-bold text-lg">{formatPrice(COST_ANALYSIS.effort.monthlyCost)} {i18n.mad}</span>
                </div>

                {/* Total Cost Summary */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">{language === 'fr' ? 'Coût Total Mensuel' : 'التكلفة الشهرية الإجمالية'}</span>
                    <span className="font-bold text-xl text-gray-900">{formatPrice(totalMonthlyCost)} {i18n.mad}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                {language === 'fr' ? 'Comparaison des Plans' : 'مقارنة الخطط'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">{i18n.plan}</th>
                      <th className="text-center py-3 px-4 font-semibold">{i18n.price}</th>
                      <th className="text-center py-3 px-4 font-semibold">{i18n.limits}</th>
                      <th className="text-center py-3 px-4 font-semibold">{i18n.clientsNeeded}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRICING_PLANS.map((plan) => (
                      <tr key={plan.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: plan.color }}
                            />
                            <span className="font-medium">{plan.name[language]}</span>
                            {plan.recommended && (
                              <Badge variant="secondary" className="text-xs">
                                {language === 'fr' ? 'Recommandé' : 'موصى به'}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="font-semibold">{formatPrice(plan.price)} {i18n.mad}</span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {plan.limits.paymentLinksPerMonth === -1
                              ? (language === 'fr' ? 'Illimité' : 'غير محدود')
                              : plan.limits.paymentLinksPerMonth} {i18n.linksMonth}
                          </span>
                          <br />
                          <span className="text-sm text-gray-600">
                            {plan.limits.invoicesPerMonth === -1
                              ? (language === 'fr' ? 'Illimité' : 'غير محدود')
                              : plan.limits.invoicesPerMonth} {i18n.invoicesMonth}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          {plan.price > 0 && (
                            <span className="font-medium">
                              {Math.ceil(totalMonthlyCost / plan.price)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Lightbulb className="w-5 h-5" />
            {i18n.recommendations}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">{i18n.rec1}</p>
                <p className="text-sm text-amber-600">
                  {language === 'fr'
                    ? '20 liens/mois, 10 factures/mois pour réduire la friction'
                    : '20 رابط/شهر، 10 فواتير/شهر لتقليل الاحتكاك'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">{i18n.rec2}</p>
                <p className="text-sm text-amber-600">
                  {language === 'fr'
                    ? '200,000+ auto-entrepreneurs au Maroc, 49 MAD = prix d\'un café/jour'
                    : '+200,000 مقاول ذاتي في المغرب، 49 درهم = سعر قهوة/يوم'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">{i18n.rec3}</p>
                <p className="text-sm text-amber-600">
                  {language === 'fr'
                    ? 'Cibler les entreprises marocaines avec LinkedIn et Facebook'
                    : 'استهدف الشركات المغربية عبر LinkedIn و Facebook'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">{i18n.rec4}</p>
                <p className="text-sm text-amber-600">
                  {language === 'fr'
                    ? 'Obligation fiscale 2026 pour toutes les entreprises'
                    : 'التزام ضريبي 2026 لجميع الشركات'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RevenueDashboard;
