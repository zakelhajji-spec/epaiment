'use client';

/**
 * Epaiement.ma Pricing Plans Component
 * Displays the new pricing tiers: Starter, Basic, Pro, Business
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { PRICING_PLANS, formatPrice, formatLimit } from '@/lib/pricing-plans.config';
import type { PlanConfig } from '@/lib/pricing-plans.config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface PricingPlansProps {
  currentPlan?: string;
  onSelectPlan?: (planId: string, billingCycle: 'monthly' | 'annual') => void;
  language?: 'fr' | 'ar';
}

const translations = {
  fr: {
    monthly: 'Mensuel',
    annual: 'Annuel',
    mad: 'MAD',
    perMonth: '/mois',
    save: 'Économisez',
    monthsFree: '2 mois gratuits',
    currentPlan: 'Plan actuel',
    upgrade: 'Passer à',
    downgrade: 'Revenir à',
    getStarted: 'Commencer',
    choosePlan: 'Choisir',
    popular: 'Populaire',
    recommended: 'Recommandé',
    support: 'Support',
    unlimited: 'Illimité',
    viewDetails: 'Voir les détails',
    hideDetails: 'Masquer',
    title: 'Tarification simple et transparente',
    subtitle: 'Choisissez le plan adapté à votre activité. Tous les plans incluent la conformité DGI 2026.',
    faq1: 'Puis-je changer de plan à tout moment ?',
    faq1Answer: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont appliqués immédiatement et les frais sont ajustés au prorata.',
    faq2: 'Les factures sont-elles conformes à la DGI ?',
    faq2Answer: 'Absolument ! Toutes nos factures sont conformes aux mesures fiscales 2026 du Maroc, avec tous les champs requis: ICE, IF, RC, QR code DGI, etc.',
    faq3: 'Proposez-vous une période d\'essai ?',
    faq3Answer: 'Le plan Starter est gratuit et vous permet de tester toutes les fonctionnalités de base. Pour les plans payants, nous offrons 2 mois gratuits sur l\'abonnement annuel.',
    faq4: 'Quels modes de paiement acceptez-vous ?',
    faq4Answer: 'Nous acceptons les cartes bancaires marocaines et internationales (Visa, Mastercard), ainsi que le paiement par virement bancaire pour les plans Business.',
    faqTitle: 'Questions fréquentes',
  },
  ar: {
    monthly: 'شهري',
    annual: 'سنوي',
    mad: 'درهم',
    perMonth: '/شهر',
    save: 'وفر',
    monthsFree: 'شهران مجاناً',
    currentPlan: 'الخطة الحالية',
    upgrade: 'الترقية إلى',
    downgrade: 'الرجوع إلى',
    getStarted: 'ابدأ',
    choosePlan: 'اختر',
    popular: 'شائع',
    recommended: 'موصى به',
    support: 'الدعم',
    unlimited: 'غير محدود',
    viewDetails: 'عرض التفاصيل',
    hideDetails: 'إخفاء',
    title: 'أسعار بسيطة وشفافة',
    subtitle: 'اختر الخطة المناسبة لنشاطك. جميع الخطط تتضمن التوافق مع المديرية 2026.',
    faq1: 'هل يمكنني تغيير الخطة في أي وقت؟',
    faq1Answer: 'نعم، يمكنك ترقية أو تخفيض خطتك في أي وقت. يتم تطبيق التغييرات فورًا ويتم تعديل الرسوم بشكل متناسب.',
    faq2: 'هل الفواتير متوافقة مع المديرية؟',
    faq2Answer: 'بالتأكيد! جميع فواتيرنا متوافقة مع التدابير الضريبية 2026 في المغرب، مع جميع الحقول المطلوبة: المعرف، IF، RC، رمز QR للمديرية، إلخ.',
    faq3: 'هل تقدمون فترة تجريبية؟',
    faq3Answer: 'الخطة المجانية تتيح لك اختبار جميع الميزات الأساسية. للخطط المدفوعة، نقدم شهرين مجانًا عند الاشتراك السنوي.',
    faq4: 'ما هي طرق الدفع المقبولة؟',
    faq4Answer: 'نقبل البطاقات البنكية المغربية والدولية (فيزا، ماستركارد)، وكذلك الدفع عن طريق التحويل البنكي لخطط الأعمال.',
    faqTitle: 'الأسئلة الشائعة',
  },
};

function PlanCard({
  plan,
  index,
  currentPlan,
  billingCycle,
  isExpanded,
  onToggleExpand,
  onSelect,
  language,
}: {
  plan: PlanConfig;
  index: number;
  currentPlan?: string;
  billingCycle: 'monthly' | 'annual';
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelect: () => void;
  language: 'fr' | 'ar';
}) {
  const i18n = translations[language];
  const Icon = plan.icon;
  const isCurrentPlan = currentPlan === plan.id;
  const displayPrice = billingCycle === 'annual' ? Math.round(plan.annualPrice / 12) : plan.price;

  const getLimitText = (limit: number | undefined) => {
    if (limit === undefined) return '';
    if (limit === -1) return i18n.unlimited;
    return formatLimit(limit);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {(plan.popular || plan.recommended) && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className={plan.recommended 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1' 
            : 'bg-blue-100 text-blue-800 px-3 py-1'}
          >
            {plan.recommended ? i18n.recommended : i18n.popular}
          </Badge>
        </div>
      )}

      <Card className={`h-full flex flex-col transition-all duration-300 ${
        plan.recommended 
          ? 'border-2 border-blue-500 shadow-xl scale-105' 
          : plan.popular 
          ? 'border-2 border-blue-300 shadow-lg' 
          : 'border border-gray-200 hover:shadow-lg'
        } ${isCurrentPlan ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
      >
        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" 
            style={{ backgroundColor: `${plan.color}20` }}>
            <Icon className="w-6 h-6" style={{ color: plan.color }} />
          </div>
          <CardTitle className="text-xl font-bold">{plan.name[language]}</CardTitle>
          <CardDescription className="text-sm">{plan.description[language]}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-gray-900">{formatPrice(displayPrice)}</span>
              <span className="text-gray-500 text-sm">{i18n.mad}{i18n.perMonth}</span>
            </div>
            {billingCycle === 'annual' && plan.annualSavings > 0 && (
              <p className="text-sm text-green-600 mt-1">{i18n.save} {plan.annualSavings}%</p>
            )}
          </div>

          <div className="space-y-3">
            {plan.features.slice(0, 5).map((feature) => (
              <div key={feature.id} className="flex items-start gap-2">
                {feature.included 
                  ? <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  : <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                }
                <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                  {feature.name[language]}
                  {feature.included && feature.limit !== undefined && (
                    <span className="text-gray-500 ml-1">
                      ({getLimitText(feature.limit)}{feature.unit ? ` ${feature.unit}` : ''})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" className="w-full mt-4 text-blue-600" onClick={onToggleExpand}>
            {isExpanded ? i18n.hideDetails : i18n.viewDetails}
            {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>

          {isExpanded && (
            <div className="pt-4 border-t mt-4 space-y-3">
              {plan.features.slice(5).map((feature) => (
                <div key={feature.id} className="flex items-start gap-2">
                  {feature.included 
                    ? <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    : <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  }
                  <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                    {feature.name[language]}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{i18n.support}:</span>
              <span className="font-medium text-gray-700">{plan.support[language]}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4">
          <Button
            className={`w-full ${plan.recommended 
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
              : plan.popular 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-800 hover:bg-gray-900'}`}
            variant={isCurrentPlan ? 'outline' : 'default'}
            disabled={isCurrentPlan}
            onClick={onSelect}
          >
            {isCurrentPlan 
              ? i18n.currentPlan 
              : plan.price === 0 
              ? i18n.getStarted 
              : i18n.choosePlan}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export function PricingPlans({ currentPlan, onSelectPlan, language = 'fr' }: PricingPlansProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const i18n = translations[language];
  const isRTL = language === 'ar';

  const handleSelectPlan = (plan: PlanConfig) => {
    if (onSelectPlan) {
      onSelectPlan(plan.id, billingCycle);
    }
  };

  return (
    <div className={`w-full ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{i18n.title}</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{i18n.subtitle}</p>

        <div className="flex items-center justify-center gap-4 mt-8">
          <Label className={`text-sm ${billingCycle === 'monthly' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {i18n.monthly}
          </Label>
          <Switch
            checked={billingCycle === 'annual'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
          />
          <Label className={`text-sm ${billingCycle === 'annual' ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {i18n.annual}
          </Label>
          {billingCycle === 'annual' && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 ml-2">
              {i18n.monthsFree}
            </Badge>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {PRICING_PLANS.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            index={index}
            currentPlan={currentPlan}
            billingCycle={billingCycle}
            isExpanded={expandedPlan === plan.id}
            onToggleExpand={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
            onSelect={() => handleSelectPlan(plan)}
            language={language}
          />
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold text-center mb-8">{i18n.faqTitle}</h3>
        <Accordion type="single" collapsible className="max-w-2xl mx-auto">
          <AccordionItem value="q1">
            <AccordionTrigger>{i18n.faq1}</AccordionTrigger>
            <AccordionContent>{i18n.faq1Answer}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>{i18n.faq2}</AccordionTrigger>
            <AccordionContent>{i18n.faq2Answer}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>{i18n.faq3}</AccordionTrigger>
            <AccordionContent>{i18n.faq3Answer}</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4">
            <AccordionTrigger>{i18n.faq4}</AccordionTrigger>
            <AccordionContent>{i18n.faq4Answer}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

export default PricingPlans;
