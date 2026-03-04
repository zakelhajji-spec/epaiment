/**
 * Epaiement.ma Pricing Plans Configuration
 * Based on cost analysis recommendations - March 2026
 * 
 * Pricing Tiers:
 * - Starter (Free): For testers and individuals
 * - Basic (49 MAD): For auto-entrepreneurs and freelances
 * - Pro (99 MAD): For TPE and small businesses
 * - Business (199 MAD): For PME and established companies
 */

import {
  FileText,
  Link2,
  Users,
  Receipt,
  BarChart3,
  Calendar,
  Code,
  HeadphonesIcon,
  Shield,
  Sparkles,
  Palette,
  Check,
  X,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export interface PlanFeature {
  id: string;
  name: { fr: string; ar: string };
  description?: { fr: string; ar: string };
  included: boolean;
  limit?: number; // -1 = unlimited
  unit?: string;
}

export interface PlanConfig {
  id: string;
  name: { fr: string; ar: string };
  description: { fr: string; ar: string };
  price: number; // MAD per month
  annualPrice: number; // MAD per year (2 months free)
  annualSavings: number; // Percentage savings
  color: string;
  icon: LucideIcon;
  popular?: boolean;
  recommended?: boolean;
  cta: { fr: string; ar: string };
  features: PlanFeature[];
  limits: {
    paymentLinksPerMonth: number; // -1 = unlimited
    invoicesPerMonth: number; // -1 = unlimited
    clients: number; // -1 = unlimited
    suppliers: number; // -1 = unlimited
    expenses: number; // -1 = unlimited
    quotes: number; // -1 = unlimited
    teamMembers: number;
    apiKeys: number;
    storageMB: number;
  };
  modules: string[]; // Enabled module IDs
  support: { fr: string; ar: string };
}

// ============================================
// Features Definition
// ============================================

const createFeature = (
  id: string,
  nameFr: string,
  nameAr: string,
  included: boolean,
  limit?: number,
  unit?: string,
  descFr?: string,
  descAr?: string
): PlanFeature => ({
  id,
  name: { fr: nameFr, ar: nameAr },
  description: descFr ? { fr: descFr, ar: descAr || descFr } : undefined,
  included,
  limit,
  unit,
});

// ============================================
// Pricing Plans
// ============================================

export const PRICING_PLANS: PlanConfig[] = [
  // ==========================================
  // STARTER - FREE
  // ==========================================
  {
    id: 'starter',
    name: { fr: 'Starter', ar: 'المبتدئ' },
    description: {
      fr: 'Pour tester la plateforme et les particuliers',
      ar: 'لتجربة المنصة والأفراد',
    },
    price: 0,
    annualPrice: 0,
    annualSavings: 0,
    color: '#6b7280', // Gray
    icon: Sparkles,
    cta: { fr: 'Commencer Gratuitement', ar: 'ابدأ مجاناً' },
    features: [
      createFeature('payment_links', 'Liens de paiement', 'روابط الدفع', true, 10, '/mois'),
      createFeature('invoices', 'Factures DGI', 'فواتير المديرية', true, 5, '/mois'),
      createFeature('qr_code', 'Code QR intégré', 'رمز QR مدمج', true),
      createFeature('whatsapp', 'Partage WhatsApp', 'مشاركة واتساب', true),
      createFeature('pdf_export', 'Export PDF', 'تصدير PDF', false),
      createFeature('tva_reports', 'Rapports TVA', 'تقارير الضريبة', false),
      createFeature('auto_entrepreneur', 'Suivi Auto-Entrepreneur', 'متابعة المقاول الذاتي', false),
      createFeature('calendar', 'Calendrier fiscal', 'التقويم الضريبي', false),
      createFeature('api', 'API Integration', 'تكامل API', false),
      createFeature('team', 'Multi-utilisateurs', 'متعدد المستخدمين', false),
      createFeature('whitelabel', 'Marque blanche', 'العلامة التجارية البيضاء', false),
    ],
    limits: {
      paymentLinksPerMonth: 10,
      invoicesPerMonth: 5,
      clients: 10,
      suppliers: 5,
      expenses: 10,
      quotes: 5,
      teamMembers: 1,
      apiKeys: 0,
      storageMB: 50,
    },
    modules: ['dashboard', 'invoices', 'payment-links'],
    support: { fr: 'Email (48h)', ar: 'البريد الإلكتروني (48 ساعة)' },
  },

  // ==========================================
  // BASIC - 49 MAD/month
  // ==========================================
  {
    id: 'basic',
    name: { fr: 'Basic', ar: 'الأساسي' },
    description: {
      fr: 'Pour auto-entrepreneurs et freelances',
      ar: 'للمقاولين الذاتيين والمستقلين',
    },
    price: 49,
    annualPrice: 490, // 10 months (2 free)
    annualSavings: 17,
    color: '#10b981', // Emerald
    icon: Receipt,
    cta: { fr: 'Choisir Basic', ar: 'اختر الأساسي' },
    features: [
      createFeature('payment_links', 'Liens de paiement', 'روابط الدفع', true, 50, '/mois'),
      createFeature('invoices', 'Factures DGI', 'فواتير المديرية', true, 25, '/mois'),
      createFeature('qr_code', 'Code QR intégré', 'رمز QR مدمج', true),
      createFeature('whatsapp', 'Partage WhatsApp', 'مشاركة واتساب', true),
      createFeature('pdf_export', 'Export PDF', 'تصدير PDF', true),
      createFeature('tva_reports', 'Rapports TVA', 'تقارير الضريبة', true),
      createFeature('auto_entrepreneur', 'Suivi Auto-Entrepreneur', 'متابعة المقاول الذاتي', true, undefined, undefined, 'Limite 80,000 DH/an', 'حد 80,000 درهم/سنة'),
      createFeature('calendar', 'Calendrier fiscal', 'التقويم الضريبي', false),
      createFeature('api', 'API Integration', 'تكامل API', false),
      createFeature('team', 'Multi-utilisateurs', 'متعدد المستخدمين', false),
      createFeature('whitelabel', 'Marque blanche', 'العلامة التجارية البيضاء', false),
    ],
    limits: {
      paymentLinksPerMonth: 50,
      invoicesPerMonth: 25,
      clients: 100,
      suppliers: 50,
      expenses: 100,
      quotes: 50,
      teamMembers: 1,
      apiKeys: 0,
      storageMB: 200,
    },
    modules: ['dashboard', 'invoices', 'payment-links', 'clients', 'expenses', 'reports'],
    support: { fr: 'Email (24h)', ar: 'البريد الإلكتروني (24 ساعة)' },
  },

  // ==========================================
  // PRO - 99 MAD/month (RECOMMENDED)
  // ==========================================
  {
    id: 'pro',
    name: { fr: 'Pro', ar: 'المحترف' },
    description: {
      fr: 'Pour TPE et petites entreprises',
      ar: 'للمؤسسات الصغيرة جداً والشركات الصغيرة',
    },
    price: 99,
    annualPrice: 990, // 10 months (2 free)
    annualSavings: 17,
    color: '#3b82f6', // Blue
    icon: BarChart3,
    popular: true,
    recommended: true,
    cta: { fr: 'Choisir Pro', ar: 'اختر المحترف' },
    features: [
      createFeature('payment_links', 'Liens de paiement', 'روابط الدفع', true, 200, '/mois'),
      createFeature('invoices', 'Factures DGI', 'فواتير المديرية', true, 100, '/mois'),
      createFeature('qr_code', 'Code QR intégré', 'رمز QR مدمج', true),
      createFeature('whatsapp', 'Partage WhatsApp', 'مشاركة واتساب', true),
      createFeature('pdf_export', 'Export PDF', 'تصدير PDF', true),
      createFeature('tva_reports', 'Rapports TVA', 'تقارير الضريبة', true),
      createFeature('auto_entrepreneur', 'Suivi Auto-Entrepreneur', 'متابعة المقاول الذاتي', true),
      createFeature('calendar', 'Calendrier fiscal', 'التقويم الضريبي', true),
      createFeature('api', 'API Integration', 'تكامل API', true, undefined, undefined, 'Pour intégrations tierces', 'للتكاملات الخارجية'),
      createFeature('team', 'Multi-utilisateurs', 'متعدد المستخدمين', false),
      createFeature('whitelabel', 'Marque blanche', 'العلامة التجارية البيضاء', false),
    ],
    limits: {
      paymentLinksPerMonth: 200,
      invoicesPerMonth: 100,
      clients: 500,
      suppliers: 200,
      expenses: 500,
      quotes: 200,
      teamMembers: 1,
      apiKeys: 5,
      storageMB: 1000,
    },
    modules: [
      'dashboard', 'invoices', 'payment-links', 'clients', 'suppliers',
      'quotes', 'expenses', 'credit-notes', 'reports', 'leads', 'tasks'
    ],
    support: { fr: 'Prioritaire (4h)', ar: 'أولوية (4 ساعات)' },
  },

  // ==========================================
  // BUSINESS - 199 MAD/month
  // ==========================================
  {
    id: 'business',
    name: { fr: 'Business', ar: 'الأعمال' },
    description: {
      fr: 'Pour PME et entreprises établies',
      ar: 'للمؤسسات المتوسطة والشركات الراسخة',
    },
    price: 199,
    annualPrice: 1990, // 10 months (2 free)
    annualSavings: 17,
    color: '#8b5cf6', // Violet
    icon: Shield,
    cta: { fr: 'Choisir Business', ar: 'اختر الأعمال' },
    features: [
      createFeature('payment_links', 'Liens de paiement', 'روابط الدفع', true, -1, '/mois', 'Illimité', 'غير محدود'),
      createFeature('invoices', 'Factures DGI', 'فواتير المديرية', true, -1, '/mois', 'Illimité', 'غير محدود'),
      createFeature('qr_code', 'Code QR intégré', 'رمز QR مدمج', true),
      createFeature('whatsapp', 'Partage WhatsApp', 'مشاركة واتساب', true),
      createFeature('pdf_export', 'Export PDF', 'تصدير PDF', true),
      createFeature('tva_reports', 'Rapports TVA', 'تقارير الضريبة', true),
      createFeature('auto_entrepreneur', 'Suivi Auto-Entrepreneur', 'متابعة المقاول الذاتي', true),
      createFeature('calendar', 'Calendrier fiscal', 'التقويم الضريبي', true),
      createFeature('api', 'API Integration', 'تكامل API', true, undefined, undefined, 'Accès complet', 'وصول كامل'),
      createFeature('team', 'Multi-utilisateurs', 'متعدد المستخدمين', true, 10, 'membres'),
      createFeature('whitelabel', 'Marque blanche', 'العلامة التجارية البيضاء', true),
    ],
    limits: {
      paymentLinksPerMonth: -1, // unlimited
      invoicesPerMonth: -1, // unlimited
      clients: -1, // unlimited
      suppliers: -1, // unlimited
      expenses: -1, // unlimited
      quotes: -1, // unlimited
      teamMembers: 10,
      apiKeys: 20,
      storageMB: 10000,
    },
    modules: [
      'dashboard', 'invoices', 'payment-links', 'clients', 'suppliers',
      'quotes', 'expenses', 'credit-notes', 'reports', 'leads', 'tasks',
      'team', 'audit', 'api-keys', 'gateways', 'products'
    ],
    support: { fr: 'Dédié 24/7', ar: 'مخصص 24/7' },
  },
];

// ============================================
// Helper Functions
// ============================================

export function getPlanById(id: string): PlanConfig | undefined {
  return PRICING_PLANS.find((p) => p.id === id);
}

export function getPlanLimits(planId: string): PlanConfig['limits'] {
  const plan = getPlanById(planId);
  if (!plan) {
    return PRICING_PLANS[0].limits; // Return starter limits as default
  }
  return plan.limits;
}

export function getPlanModules(planId: string): string[] {
  const plan = getPlanById(planId);
  if (!plan) {
    return PRICING_PLANS[0].modules;
  }
  return plan.modules;
}

export function canUpgradeFeature(planId: string, featureId: string): boolean {
  const plan = getPlanById(planId);
  if (!plan) return false;
  
  const feature = plan.features.find((f) => f.id === featureId);
  return feature?.included ?? false;
}

export function getFeatureLimit(planId: string, featureId: string): number | undefined {
  const plan = getPlanById(planId);
  if (!plan) return undefined;
  
  const feature = plan.features.find((f) => f.id === featureId);
  return feature?.limit;
}

export function formatLimit(limit: number | undefined): string {
  if (limit === undefined) return '-';
  if (limit === -1) return 'Illimité';
  return limit.toLocaleString('fr-MA');
}

export function formatPrice(price: number): string {
  return price.toLocaleString('fr-MA');
}

// ============================================
// Cost Analysis Data (from Excel)
// ============================================

export const COST_ANALYSIS = {
  fixedCosts: {
    serverCloud: 400, // MAD/month - Google Cloud Run
    database: 0, // MAD/month - Supabase free tier
    storage: 20, // MAD/month - 10GB for PDFs
    domain: 15, // MAD/month - .ma domain
    cdn: 0, // MAD/month - Cloudflare free
    email: 0, // MAD/month - SendGrid free tier
    ssl: 0, // MAD/month - Let's Encrypt
    monitoring: 0, // MAD/month - Sentry free tier
    get total(): number {
      return this.serverCloud + this.database + this.storage + 
             this.domain + this.cdn + this.email + this.ssl + this.monitoring;
    },
  },
  
  variableCosts: {
    pdfPerInvoice: 0.00002, // MAD per invoice
    qrCode: 0, // Local generation - free
    emailNotification: 0, // Free up to 100/day
    apiCall: 0.01, // MAD per 1000 calls
  },
  
  effort: {
    hoursPerMonth: 20, // Maintenance and support
    hourlyRate: 100, // MAD/hour
    get monthlyCost(): number {
      return this.hoursPerMonth * this.hourlyRate;
    },
  },
  
  get totalMonthlyCost(): number {
    return this.fixedCosts.total + this.effort.monthlyCost;
  },
  
  // Break-even analysis
  breakEven: {
    basic: 49, // MAD
    pro: 99, // MAD
    business: 199, // MAD
    get basicClients(): number {
      return Math.ceil(COST_ANALYSIS.totalMonthlyCost / this.basic);
    },
    get proClients(): number {
      return Math.ceil(COST_ANALYSIS.totalMonthlyCost / this.pro);
    },
    get businessClients(): number {
      return Math.ceil(COST_ANALYSIS.totalMonthlyCost / this.business);
    },
    get mixedClients(): number {
      // Assuming average revenue of 100 MAD per client
      return Math.ceil(COST_ANALYSIS.totalMonthlyCost / 100);
    },
  },
  
  // Growth scenarios
  growthScenarios: [
    {
      name: { fr: 'Conservateur (6 mois)', ar: 'محافظ (6 أشهر)' },
      clients: { basic: 10, pro: 5, business: 2 },
      get revenue(): number {
        return this.clients.basic * 49 + this.clients.pro * 99 + this.clients.business * 199;
      },
      get profit(): number {
        return this.revenue - COST_ANALYSIS.totalMonthlyCost;
      },
    },
    {
      name: { fr: 'Modéré (12 mois)', ar: 'معتدل (12 شهراً)' },
      clients: { basic: 50, pro: 25, business: 10 },
      get revenue(): number {
        return this.clients.basic * 49 + this.clients.pro * 99 + this.clients.business * 199;
      },
      get profit(): number {
        return this.revenue - COST_ANALYSIS.totalMonthlyCost;
      },
    },
    {
      name: { fr: 'Optimiste (18 mois)', ar: 'متفائل (18 شهراً)' },
      clients: { basic: 150, pro: 75, business: 30 },
      get revenue(): number {
        return this.clients.basic * 49 + this.clients.pro * 99 + this.clients.business * 199;
      },
      get profit(): number {
        return this.revenue - COST_ANALYSIS.totalMonthlyCost;
      },
    },
    {
      name: { fr: 'Ambitieux (24 mois)', ar: 'طموح (24 شهراً)' },
      clients: { basic: 300, pro: 150, business: 50 },
      get revenue(): number {
        return this.clients.basic * 49 + this.clients.pro * 99 + this.clients.business * 199;
      },
      get profit(): number {
        return this.revenue - COST_ANALYSIS.totalMonthlyCost;
      },
    },
  ],
};

// Named default export
const PricingPlansConfig = {
  PRICING_PLANS,
  COST_ANALYSIS,
  getPlanById,
  getPlanLimits,
  getPlanModules,
  canUpgradeFeature,
  getFeatureLimit,
  formatLimit,
  formatPrice,
};

export default PricingPlansConfig;
