/**
 * Epaiement.ma Module Groups Configuration
 * Modules grouped by type with collective pricing
 */

import {
  FileText,
  Link2,
  LayoutDashboard,
  Users,
  Truck,
  FileCheck,
  ArrowLeftRight,
  Receipt,
  BarChart3,
  UserPlus,
  CheckSquare,
  Package,
  Warehouse,
  UserCog,
  Key,
  Server,
  FileSearch,
  Brain,
  ShoppingCart,
  Calculator,
  Cog,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export interface ModuleInGroup {
  id: string;
  name: { fr: string; ar: string };
  description: { fr: string; ar: string };
  icon: LucideIcon;
  features: Array<{ id: string; name: { fr: string; ar: string } }>;
  status: 'active' | 'coming_soon' | 'beta';
}

export interface ModuleGroupConfig {
  id: string;
  name: { fr: string; ar: string };
  description: { fr: string; ar: string };
  icon: LucideIcon;
  price: number; // MAD per month for the whole group, 0 = free
  color: string; // Theme color for the group
  modules: ModuleInGroup[];
  limits: Record<string, number>;
  recommended?: boolean;
  popular?: boolean;
}

// ============================================
// Module Groups Configuration
// ============================================

export const MODULE_GROUPS: ModuleGroupConfig[] = [
  // ==========================================
  // CORE GROUP - FREE
  // ==========================================
  {
    id: 'core',
    name: { fr: 'Module Principal', ar: 'الوحدة الأساسية' },
    description: {
      fr: 'Fonctionnalités essentielles pour la facturation et les paiements - GRATUIT',
      ar: 'الميزات الأساسية للفوترة والمدفوعات - مجاني',
    },
    icon: LayoutDashboard,
    price: 0,
    color: '#6366f1', // Indigo
    recommended: false,
    modules: [
      {
        id: 'dashboard',
        name: { fr: 'Tableau de Bord', ar: 'لوحة القيادة' },
        description: { fr: 'Vue d\'ensemble de votre activité', ar: 'نظرة عامة على نشاطك' },
        icon: LayoutDashboard,
        status: 'active',
        features: [
          { id: 'metrics', name: { fr: 'Métriques CA', ar: 'مقاييس الإيرادات' } },
          { id: 'charts', name: { fr: 'Graphiques', ar: 'الرسوم البيانية' } },
          { id: 'quick_actions', name: { fr: 'Actions rapides', ar: 'إجراءات سريعة' } },
        ],
      },
      {
        id: 'invoices',
        name: { fr: 'Factures DGI', ar: 'فواتير المديرية' },
        description: { fr: 'Factures conformes DGI 2026', ar: 'فواتير متوافقة مع المديرية 2026' },
        icon: FileText,
        status: 'active',
        features: [
          { id: 'create_edit', name: { fr: 'Création/Modification', ar: 'الإنشاء/التعديل' } },
          { id: 'tva_rates', name: { fr: 'Taux TVA marocains', ar: 'نسب الضريبة المغربية' } },
          { id: 'pdf_export', name: { fr: 'Export PDF', ar: 'تصدير PDF' } },
          { id: 'qr_code', name: { fr: 'Code QR', ar: 'رمز QR' } },
        ],
      },
      {
        id: 'payment-links',
        name: { fr: 'Liens de Paiement', ar: 'روابط الدفع' },
        description: { fr: 'Création de liens avec QR', ar: 'إنشاء روابط مع رمز QR' },
        icon: Link2,
        status: 'active',
        features: [
          { id: 'create_link', name: { fr: 'Création de liens', ar: 'إنشاء الروابط' } },
          { id: 'whatsapp', name: { fr: 'Partage WhatsApp', ar: 'مشاركة واتساب' } },
          { id: 'tracking', name: { fr: 'Suivi des statuts', ar: 'متابعة الحالات' } },
        ],
      },
    ],
    limits: {
      invoices_per_month: 10,
      links_per_month: 10,
    },
  },

  // ==========================================
  // SALES GROUP - 99 MAD/month
  // ==========================================
  {
    id: 'sales',
    name: { fr: 'Module Ventes', ar: 'وحدة المبيعات' },
    description: {
      fr: 'Gestion complète des clients, fournisseurs et devis',
      ar: 'إدارة كاملة للعملاء والموردين والعروض',
    },
    icon: ShoppingCart,
    price: 99,
    color: '#10b981', // Emerald
    popular: true,
    modules: [
      {
        id: 'clients',
        name: { fr: 'Clients', ar: 'العملاء' },
        description: { fr: 'Gestion du portefeuille clients', ar: 'إدارة محفظة العملاء' },
        icon: Users,
        status: 'active',
        features: [
          { id: 'create_edit', name: { fr: 'Création/Modification', ar: 'الإنشاء/التعديل' } },
          { id: 'ice_validation', name: { fr: 'Validation ICE', ar: 'التحقق من المعرف' } },
          { id: 'history', name: { fr: 'Historique', ar: 'السجل' } },
          { id: 'statements', name: { fr: 'Relevés client', ar: 'كشوف العميل' } },
        ],
      },
      {
        id: 'suppliers',
        name: { fr: 'Fournisseurs', ar: 'الموردين' },
        description: { fr: 'Gestion des fournisseurs', ar: 'إدارة الموردين' },
        icon: Truck,
        status: 'active',
        features: [
          { id: 'create_edit', name: { fr: 'Création/Modification', ar: 'الإنشاء/التعديل' } },
          { id: 'purchase_invoices', name: { fr: 'Factures d\'achat', ar: 'فواتير الشراء' } },
          { id: 'payment_tracking', name: { fr: 'Suivi paiements', ar: 'متابعة المدفوعات' } },
        ],
      },
      {
        id: 'quotes',
        name: { fr: 'Devis', ar: 'العروض' },
        description: { fr: 'Création et suivi des devis', ar: 'إنشاء ومتابعة العروض' },
        icon: FileCheck,
        status: 'active',
        features: [
          { id: 'create_edit', name: { fr: 'Création/Modification', ar: 'الإنشاء/التعديل' } },
          { id: 'convert', name: { fr: 'Conversion en facture', ar: 'التحويل لفاتورة' } },
          { id: 'status_tracking', name: { fr: 'Suivi des statuts', ar: 'متابعة الحالات' } },
        ],
      },
    ],
    limits: {
      clients: 500,
      suppliers: 200,
      quotes_per_month: 100,
    },
  },

  // ==========================================
  // ACCOUNTING GROUP - 99 MAD/month
  // ==========================================
  {
    id: 'accounting',
    name: { fr: 'Module Comptabilité', ar: 'وحدة المحاسبة' },
    description: {
      fr: 'Gestion des dépenses, avoirs et rapports financiers',
      ar: 'إدارة المصروفات والإشعارات والتقارير المالية',
    },
    icon: Calculator,
    price: 99,
    color: '#f59e0b', // Amber
    modules: [
      {
        id: 'expenses',
        name: { fr: 'Dépenses', ar: 'المصروفات' },
        description: { fr: 'Suivi des dépenses avec TVA', ar: 'متابعة المصروفات مع الضريبة' },
        icon: Receipt,
        status: 'active',
        features: [
          { id: 'create_edit', name: { fr: 'Enregistrement', ar: 'التسجيل' } },
          { id: 'categories', name: { fr: 'Catégories', ar: 'الفئات' } },
          { id: 'tva_deductible', name: { fr: 'TVA déductible', ar: 'الضريبة القابلة للخصم' } },
        ],
      },
      {
        id: 'credit-notes',
        name: { fr: 'Avoirs', ar: 'إشعارات دائنة' },
        description: { fr: 'Gestion des avoirs', ar: 'إدارة الإشعارات الدائنة' },
        icon: ArrowLeftRight,
        status: 'active',
        features: [
          { id: 'create_edit', name: { fr: 'Création/Modification', ar: 'الإنشاء/التعديل' } },
          { id: 'invoice_link', name: { fr: 'Lien facture', ar: 'ربط الفاتورة' } },
          { id: 'tva_adjustment', name: { fr: 'Ajustement TVA', ar: 'تعديل الضريبة' } },
        ],
      },
      {
        id: 'reports',
        name: { fr: 'Rapports', ar: 'التقارير' },
        description: { fr: 'Rapports financiers', ar: 'التقارير المالية' },
        icon: BarChart3,
        status: 'active',
        features: [
          { id: 'tva_report', name: { fr: 'Rapport TVA', ar: 'تقرير الضريبة' } },
          { id: 'revenue_report', name: { fr: 'Rapport revenus', ar: 'تقرير الإيرادات' } },
          { id: 'cash_flow', name: { fr: 'Flux de trésorerie', ar: 'التدفقات النقدية' } },
          { id: 'export', name: { fr: 'Export Excel/PDF', ar: 'تصدير Excel/PDF' } },
        ],
      },
    ],
    limits: {
      expenses_per_month: 200,
      credit_notes_per_month: 50,
    },
  },

  // ==========================================
  // CRM GROUP - 149 MAD/month
  // ==========================================
  {
    id: 'crm',
    name: { fr: 'Module CRM', ar: 'وحدة إدارة العملاء' },
    description: {
      fr: 'Gestion des prospects et des tâches',
      ar: 'إدارة العملاء المحتملين والمهام',
    },
    icon: UserPlus,
    price: 149,
    color: '#8b5cf6', // Violet
    modules: [
      {
        id: 'leads',
        name: { fr: 'Prospects', ar: 'العملاء المحتملين' },
        description: { fr: 'Gestion des leads', ar: 'إدارة العملاء المحتملين' },
        icon: UserPlus,
        status: 'active',
        features: [
          { id: 'create_edit', name: { fr: 'Création/Modification', ar: 'الإنشاء/التعديل' } },
          { id: 'pipeline', name: { fr: 'Pipeline de vente', ar: 'خط أنابيب المبيعات' } },
          { id: 'convert', name: { fr: 'Conversion en client', ar: 'التحويل لعميل' } },
          { id: 'statistics', name: { fr: 'Statistiques', ar: 'الإحصائيات' } },
        ],
      },
      {
        id: 'tasks',
        name: { fr: 'Tâches', ar: 'المهام' },
        description: { fr: 'Gestion des tâches', ar: 'إدارة المهام' },
        icon: CheckSquare,
        status: 'active',
        features: [
          { id: 'create_edit', name: { fr: 'Création/Modification', ar: 'الإنشاء/التعديل' } },
          { id: 'priorities', name: { fr: 'Priorités', ar: 'الأولويات' } },
          { id: 'due_dates', name: { fr: 'Dates d\'échéance', ar: 'تواريخ الاستحقاق' } },
          { id: 'reminders', name: { fr: 'Rappels', ar: 'التذكيرات' } },
        ],
      },
    ],
    limits: {
      leads: 500,
      tasks: 500,
    },
  },

  // ==========================================
  // STOCK GROUP - 199 MAD/month
  // ==========================================
  {
    id: 'stock',
    name: { fr: 'Module Stock', ar: 'وحدة المخزون' },
    description: {
      fr: 'Gestion des produits et inventaire',
      ar: 'إدارة المنتجات والمخزون',
    },
    icon: Warehouse,
    price: 199,
    color: '#ef4444', // Red
    modules: [
      {
        id: 'products',
        name: { fr: 'Produits', ar: 'المنتجات' },
        description: { fr: 'Catalogue de produits', ar: 'كتالوج المنتجات' },
        icon: Package,
        status: 'active',
        features: [
          { id: 'create_edit', name: { fr: 'Création/Modification', ar: 'الإنشاء/التعديل' } },
          { id: 'categories', name: { fr: 'Catégories', ar: 'الفئات' } },
          { id: 'pricing', name: { fr: 'Tarification', ar: 'التسعير' } },
          { id: 'invoice_integration', name: { fr: 'Intégration factures', ar: 'تكامل الفواتير' } },
        ],
      },
      {
        id: 'inventory',
        name: { fr: 'Inventaire', ar: 'المخزون' },
        description: { fr: 'Gestion des stocks', ar: 'إدارة المخزون' },
        icon: Warehouse,
        status: 'coming_soon',
        features: [
          { id: 'stock_tracking', name: { fr: 'Suivi du stock', ar: 'متابعة المخزون' } },
          { id: 'movements', name: { fr: 'Mouvements', ar: 'الحركات' } },
          { id: 'alerts', name: { fr: 'Alertes stock bas', ar: 'تنبيهات المخزون' } },
          { id: 'reports', name: { fr: 'Rapports', ar: 'التقارير' } },
        ],
      },
    ],
    limits: {
      products: 500,
    },
  },

  // ==========================================
  // TEAM GROUP - 99 MAD/month
  // ==========================================
  {
    id: 'team',
    name: { fr: 'Module Équipe', ar: 'وحدة الفريق' },
    description: {
      fr: 'Gestion multi-utilisateurs avec rôles et permissions',
      ar: 'إدارة متعددة المستخدمين مع الأدوار والصلاحيات',
    },
    icon: UserCog,
    price: 99,
    color: '#06b6d4', // Cyan
    modules: [
      {
        id: 'team',
        name: { fr: 'Équipe', ar: 'الفريق' },
        description: { fr: 'Gestion des membres', ar: 'إدارة الأعضاء' },
        icon: UserCog,
        status: 'active',
        features: [
          { id: 'invite', name: { fr: 'Invitation', ar: 'الدعوة' } },
          { id: 'roles', name: { fr: 'Rôles (Admin, Comptable, Lecteur)', ar: 'الأدوار' } },
          { id: 'permissions', name: { fr: 'Permissions détaillées', ar: 'الصلاحيات' } },
          { id: 'activity', name: { fr: 'Activité par membre', ar: 'النشاط' } },
        ],
      },
      {
        id: 'audit',
        name: { fr: 'Audit', ar: 'التدقيق' },
        description: { fr: 'Journal d\'audit', ar: 'سجل التدقيق' },
        icon: FileSearch,
        status: 'active',
        features: [
          { id: 'tracking', name: { fr: 'Traçabilité complète', ar: 'التتبع الكامل' } },
          { id: 'export', name: { fr: 'Export pour conformité', ar: 'التصدير للامتثال' } },
          { id: 'retention', name: { fr: 'Rétention 5 ans', ar: 'الاحتفاظ 5 سنوات' } },
        ],
      },
    ],
    limits: {
      team_members: 10,
    },
  },

  // ==========================================
  // INTEGRATIONS GROUP - 149 MAD/month
  // ==========================================
  {
    id: 'integrations',
    name: { fr: 'Module Intégrations', ar: 'وحدة التكاملات' },
    description: {
      fr: 'API et passerelles de paiement marocaines',
      ar: 'API وبوابات الدفع المغربية',
    },
    icon: Server,
    price: 149,
    color: '#ec4899', // Pink
    modules: [
      {
        id: 'api-keys',
        name: { fr: 'Clés API', ar: 'مفاتيح API' },
        description: { fr: 'Accès API pour intégrations', ar: 'الوصول عبر API' },
        icon: Key,
        status: 'active',
        features: [
          { id: 'generate', name: { fr: 'Génération de clés', ar: 'إنشاء المفاتيح' } },
          { id: 'permissions', name: { fr: 'Permissions (Lecture/Écriture)', ar: 'الصلاحيات' } },
          { id: 'tracking', name: { fr: 'Suivi d\'utilisation', ar: 'متابعة الاستخدام' } },
        ],
      },
      {
        id: 'gateways',
        name: { fr: 'Passerelles de paiement', ar: 'بوابات الدفع' },
        description: { fr: 'CMI, Fatourati, CIH Pay', ar: 'CMI، فاتوراتي، CIH Pay' },
        icon: Server,
        status: 'active',
        features: [
          { id: 'cmi', name: { fr: 'CMI - Centre Monétique', ar: 'CMI - المركز النقدي' } },
          { id: 'fatourati', name: { fr: 'Fatourati - CDG Group', ar: 'فاتوراتي - مجموعة الصندوق' } },
          { id: 'cih_pay', name: { fr: 'CIH Pay', ar: 'CIH Pay' } },
          { id: 'webhooks', name: { fr: 'Webhooks', ar: 'الخطاطات' } },
        ],
      },
    ],
    limits: {
      api_keys: 10,
      api_requests_per_month: 100000,
    },
  },

  // ==========================================
  // AI GROUP - 199 MAD/month
  // ==========================================
  {
    id: 'ai',
    name: { fr: 'Module IA', ar: 'وحدة الذكاء الاصطناعي' },
    description: {
      fr: 'Fonctionnalités IA avec WhatsApp et Gemini',
      ar: 'ميزات الذكاء الاصطناعي مع واتساب و Gemini',
    },
    icon: Brain,
    price: 199,
    color: '#f97316', // Orange
    recommended: true,
    modules: [
      {
        id: 'ai-lead-qualifier',
        name: { fr: 'AI Lead Qualifier', ar: 'مؤهل العملاء AI' },
        description: { fr: 'Qualification automatique des prospects', ar: 'التأهيل التلقائي للعملاء' },
        icon: Brain,
        status: 'active',
        features: [
          { id: 'whatsapp', name: { fr: 'Intégration WhatsApp', ar: 'تكامل واتساب' } },
          { id: 'gemini', name: { fr: 'Google Gemini AI', ar: 'Google Gemini AI' } },
          { id: 'bant', name: { fr: 'Scoring BANT', ar: 'تقييم BANT' } },
          { id: 'auto_qualify', name: { fr: 'Qualification auto', ar: 'التأهيل التلقائي' } },
        ],
      },
    ],
    limits: {
      ai_conversations_per_month: 500,
      ai_tokens_per_month: 100000,
    },
  },
];

// ============================================
// BUNDLES - Pre-configured packages
// ============================================

export const GROUP_BUNDLES = [
  {
    id: 'starter',
    name: { fr: 'Starter', ar: 'المبتدئ' },
    description: { fr: 'Pour tester la plateforme', ar: 'لتجربة المنصة' },
    groups: ['core'],
    price: 0,
    annualPrice: 0,
    savings: 0,
  },
  {
    id: 'business',
    name: { fr: 'Business', ar: 'الأعمال' },
    description: { fr: 'Pour les petites entreprises', ar: 'للشركات الصغيرة' },
    groups: ['core', 'sales', 'accounting'],
    price: 199, // Instead of 198 (99+99)
    annualPrice: 1990,
    savings: 17,
    popular: true,
  },
  {
    id: 'professional',
    name: { fr: 'Professional', ar: 'المحترف' },
    description: { fr: 'Pour les entreprises en croissance', ar: 'للشركات النامية' },
    groups: ['core', 'sales', 'accounting', 'crm', 'integrations'],
    price: 499, // Instead of 596
    annualPrice: 4990,
    savings: 16,
  },
  {
    id: 'enterprise',
    name: { fr: 'Enterprise', ar: 'المؤسسات' },
    description: { fr: 'Solution complète avec IA', ar: 'حل شامل مع الذكاء الاصطناعي' },
    groups: ['core', 'sales', 'accounting', 'crm', 'stock', 'team', 'integrations', 'ai'],
    price: 999, // Instead of 1092
    annualPrice: 9990,
    savings: 9,
    recommended: true,
  },
];

// ============================================
// Helper Functions
// ============================================

export function getGroupById(id: string): ModuleGroupConfig | undefined {
  return MODULE_GROUPS.find((g) => g.id === id);
}

export function calculateGroupsPrice(groupIds: string[]): number {
  return groupIds.reduce((total, id) => {
    const group = getGroupById(id);
    return total + (group?.price || 0);
  }, 0);
}

export function getModulesForGroups(groupIds: string[]): string[] {
  const modules: string[] = [];
  groupIds.forEach((groupId) => {
    const group = getGroupById(groupId);
    if (group) {
      group.modules.forEach((mod) => {
        if (!modules.includes(mod.id)) {
          modules.push(mod.id);
        }
      });
    }
  });
  return modules;
}

export function getGroupLimits(groupIds: string[]): Record<string, number> {
  const limits: Record<string, number> = {};
  groupIds.forEach((groupId) => {
    const group = getGroupById(groupId);
    if (group) {
      Object.entries(group.limits).forEach(([key, value]) => {
        if (limits[key] === undefined || value === -1 || (limits[key] !== -1 && value > limits[key])) {
          limits[key] = value;
        }
      });
    }
  });
  return limits;
}

export function checkGroupDependencies(groupId: string, activeGroups: string[]): { canEnable: boolean; missingDependencies: string[] } {
  const dependencies: Record<string, string[]> = {
    sales: ['core'],
    accounting: ['core'],
    crm: ['core', 'sales'],
    stock: ['core', 'sales'],
    team: ['core'],
    integrations: ['core'],
    ai: ['core', 'crm'],
  };

  const required = dependencies[groupId] || [];
  const missing = required.filter((dep) => !activeGroups.includes(dep));

  return {
    canEnable: missing.length === 0,
    missingDependencies: missing,
  };
}

// Named default export
const ModuleGroupsConfig = {
  MODULE_GROUPS,
  GROUP_BUNDLES,
  getGroupById,
  calculateGroupsPrice,
  getModulesForGroups,
  getGroupLimits,
  checkGroupDependencies,
};

export default ModuleGroupsConfig;
