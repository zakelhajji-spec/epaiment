/**
 * Epaiement.ma Module Configuration
 * Comprehensive module system for the payment and invoicing platform
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
  type LucideIcon,
} from 'lucide-react';

// ============================================
// Types
// ============================================

export interface ModuleFeature {
  id: string;
  name: { fr: string; ar: string };
  description: { fr: string; ar: string };
  included: boolean;
  limit?: number; // -1 for unlimited
}

export interface ModuleConfig {
  id: string;
  name: { fr: string; ar: string };
  description: { fr: string; ar: string };
  category: 'core' | 'sales' | 'accounting' | 'crm' | 'stock' | 'team' | 'integrations' | 'audit';
  icon: LucideIcon;
  price: number; // MAD per month, 0 = free
  isRequired: boolean;
  dependencies: string[];
  features: ModuleFeature[];
  limits: {
    [key: string]: number; // -1 for unlimited
  };
  status: 'active' | 'coming_soon' | 'beta';
  rolloutPhase: number;
}

export interface BundleConfig {
  id: string;
  name: { fr: string; ar: string };
  description: { fr: string; ar: string };
  modules: string[];
  discount: number; // Percentage discount
  price: number; // MAD per month
  savings: number; // MAD saved per month
}

// ============================================
// Core Modules (FREE - Required)
// ============================================

export const CORE_MODULES: ModuleConfig[] = [
  {
    id: 'dashboard',
    name: { fr: 'Tableau de Bord', ar: 'لوحة القيادة' },
    description: {
      fr: 'Vue d\'ensemble de votre activité avec statistiques et indicateurs clés',
      ar: 'نظرة عامة على نشاطك مع الإحصائيات والمؤشرات الرئيسية',
    },
    category: 'core',
    icon: LayoutDashboard,
    price: 0,
    isRequired: true,
    dependencies: [],
    features: [
      {
        id: 'metrics',
        name: { fr: 'Métriques', ar: 'المقاييس' },
        description: { fr: 'CA, factures, clients, TVA', ar: 'الإيرادات، الفواتير، العملاء، الضريبة' },
        included: true,
      },
      {
        id: 'charts',
        name: { fr: 'Graphiques', ar: 'الرسوم البيانية' },
        description: { fr: 'Évolution du chiffre d\'affaires', ar: 'تطور الإيرادات' },
        included: true,
      },
      {
        id: 'quick_actions',
        name: { fr: 'Actions rapides', ar: 'إجراءات سريعة' },
        description: { fr: 'Créer facture, lien de paiement', ar: 'إنشاء فاتورة، رابط دفع' },
        included: true,
      },
      {
        id: 'recent_activity',
        name: { fr: 'Activité récente', ar: 'النشاط الأخير' },
        description: { fr: 'Dernières transactions', ar: 'آخر المعاملات' },
        included: true,
      },
    ],
    limits: {},
    status: 'active',
    rolloutPhase: 0,
  },
  {
    id: 'invoices',
    name: { fr: 'Factures', ar: 'الفواتير' },
    description: {
      fr: 'Gestion complète des factures conformes DGI 2026 avec TVA marocaine',
      ar: 'إدارة كاملة للفواتير متوافقة مع المديرية العامة للضرائب 2026 مع ضريبة القيمة المضافة المغربية',
    },
    category: 'core',
    icon: FileText,
    price: 0,
    isRequired: true,
    dependencies: [],
    features: [
      {
        id: 'create_edit',
        name: { fr: 'Création & Modification', ar: 'الإنشاء والتعديل' },
        description: { fr: 'Créer et modifier des factures', ar: 'إنشاء وتعديل الفواتير' },
        included: true,
      },
      {
        id: 'tva_rates',
        name: { fr: 'Taux TVA', ar: 'نسب الضريبة' },
        description: { fr: '4 taux: 20%, 14%, 10%, 7%', ar: '4 نسب: 20٪، 14٪، 10٪، 7٪' },
        included: true,
      },
      {
        id: 'dgi_compliance',
        name: { fr: 'Conformité DGI', ar: 'توافق المديرية' },
        description: { fr: 'ICE, IF, RC, Patente, CNSS', ar: 'المعرفات الضريبية الخمسة' },
        included: true,
      },
      {
        id: 'pdf_export',
        name: { fr: 'Export PDF', ar: 'تصدير PDF' },
        description: { fr: 'Génération automatique PDF', ar: 'إنشاء تلقائي لـ PDF' },
        included: true,
      },
      {
        id: 'recurring',
        name: { fr: 'Factures récurrentes', ar: 'الفواتير المتكررة' },
        description: { fr: 'Mensuel, trimestriel, annuel', ar: 'شهري، ربع سنوي، سنوي' },
        included: true,
      },
      {
        id: 'payment_tracking',
        name: { fr: 'Suivi des paiements', ar: 'متابعة المدفوعات' },
        description: { fr: 'Paiements partiels et complets', ar: 'المدفوعات الجزئية والكاملة' },
        included: true,
      },
    ],
    limits: {
      invoices_per_month: 10, // Free tier
    },
    status: 'active',
    rolloutPhase: 0,
  },
  {
    id: 'payment-links',
    name: { fr: 'Liens de Paiement', ar: 'روابط الدفع' },
    description: {
      fr: 'Création de liens de paiement avec codes QR pour WhatsApp et Email',
      ar: 'إنشاء روابط الدفع مع رموز QR للواتساب والبريد الإلكتروني',
    },
    category: 'core',
    icon: Link2,
    price: 0,
    isRequired: true,
    dependencies: [],
    features: [
      {
        id: 'create_link',
        name: { fr: 'Création de liens', ar: 'إنشاء الروابط' },
        description: { fr: 'Générer des liens de paiement', ar: 'إنشاء روابط الدفع' },
        included: true,
      },
      {
        id: 'qr_code',
        name: { fr: 'Code QR', ar: 'رمز QR' },
        description: { fr: 'Génération automatique', ar: 'إنشاء تلقائي' },
        included: true,
      },
      {
        id: 'whatsapp_share',
        name: { fr: 'Partage WhatsApp', ar: 'مشاركة واتساب' },
        description: { fr: 'Envoi direct via WhatsApp', ar: 'إرسال مباشر عبر واتساب' },
        included: true,
      },
      {
        id: 'email_share',
        name: { fr: 'Partage Email', ar: 'مشاركة بريد' },
        description: { fr: 'Envoi par email', ar: 'إرسال عبر البريد' },
        included: true,
      },
      {
        id: 'status_tracking',
        name: { fr: 'Suivi du statut', ar: 'متابعة الحالة' },
        description: { fr: 'Payé, en attente, expiré', ar: 'مدفوع، قيد الانتظار، منتهي' },
        included: true,
      },
    ],
    limits: {
      links_per_month: 10, // Free tier
    },
    status: 'active',
    rolloutPhase: 0,
  },
];

// ============================================
// Sales Modules
// ============================================

export const SALES_MODULES: ModuleConfig[] = [
  {
    id: 'clients',
    name: { fr: 'Clients', ar: 'العملاء' },
    description: {
      fr: 'Gestion complète de votre portefeuille clients avec historique',
      ar: 'إدارة كاملة لمحفظة عملائك مع السجل',
    },
    category: 'sales',
    icon: Users,
    price: 0,
    isRequired: false,
    dependencies: ['invoices'],
    features: [
      {
        id: 'create_edit',
        name: { fr: 'Création & Modification', ar: 'الإنشاء والتعديل' },
        description: { fr: 'Gérer les informations clients', ar: 'إدارة معلومات العملاء' },
        included: true,
      },
      {
        id: 'ice_validation',
        name: { fr: 'Validation ICE', ar: 'التحقق من المعرف' },
        description: { fr: 'Vérification automatique ICE', ar: 'التحقق التلقائي من المعرف' },
        included: true,
      },
      {
        id: 'history',
        name: { fr: 'Historique', ar: 'السجل' },
        description: { fr: 'Factures et paiements client', ar: 'فواتير ومدفوعات العميل' },
        included: true,
      },
      {
        id: 'statement',
        name: { fr: 'Relevé client', ar: 'كشف حساب العميل' },
        description: { fr: 'Génération de relevés PDF', ar: 'إنشاء كشوف PDF' },
        included: true,
      },
    ],
    limits: {
      clients: 50, // Free tier
    },
    status: 'active',
    rolloutPhase: 0,
  },
  {
    id: 'suppliers',
    name: { fr: 'Fournisseurs', ar: 'الموردين' },
    description: {
      fr: 'Gestion de vos fournisseurs et factures d\'achat',
      ar: 'إدارة مورديك وفواتير الشراء',
    },
    category: 'sales',
    icon: Truck,
    price: 0,
    isRequired: false,
    dependencies: ['invoices'],
    features: [
      {
        id: 'create_edit',
        name: { fr: 'Création & Modification', ar: 'الإنشاء والتعديل' },
        description: { fr: 'Gérer les fournisseurs', ar: 'إدارة الموردين' },
        included: true,
      },
      {
        id: 'purchase_invoices',
        name: { fr: 'Factures d\'achat', ar: 'فواتير الشراء' },
        description: { fr: 'Enregistrer les achats', ar: 'تسجيل المشتريات' },
        included: true,
      },
      {
        id: 'payment_tracking',
        name: { fr: 'Suivi des paiements', ar: 'متابعة المدفوعات' },
        description: { fr: 'Paiements fournisseurs', ar: 'مدفوعات الموردين' },
        included: true,
      },
    ],
    limits: {
      suppliers: 20, // Free tier
    },
    status: 'active',
    rolloutPhase: 0,
  },
  {
    id: 'quotes',
    name: { fr: 'Devis', ar: 'العروض' },
    description: {
      fr: 'Création et suivi des devis avec conversion en facture',
      ar: 'إنشاء ومتابعة العروض مع التحويل إلى فاتورة',
    },
    category: 'sales',
    icon: FileCheck,
    price: 49,
    isRequired: false,
    dependencies: ['invoices', 'clients'],
    features: [
      {
        id: 'create_edit',
        name: { fr: 'Création & Modification', ar: 'الإنشاء والتعديل' },
        description: { fr: 'Créer des devis professionnels', ar: 'إنشاء عروض احترافية' },
        included: true,
      },
      {
        id: 'validity',
        name: { fr: 'Validité', ar: 'الصلاحية' },
        description: { fr: 'Définir la durée de validité', ar: 'تحديد مدة الصلاحية' },
        included: true,
      },
      {
        id: 'convert',
        name: { fr: 'Conversion', ar: 'التحويل' },
        description: { fr: 'Convertir en facture en 1 clic', ar: 'التحويل لفاتورة بنقرة واحدة' },
        included: true,
      },
      {
        id: 'status_tracking',
        name: { fr: 'Suivi des statuts', ar: 'متابعة الحالات' },
        description: { fr: 'Brouillon, envoyé, accepté, refusé', ar: 'مسودة، مرسل، مقبول، مرفوض' },
        included: true,
      },
    ],
    limits: {
      quotes_per_month: 25,
    },
    status: 'active',
    rolloutPhase: 2,
  },
];

// ============================================
// Accounting Modules
// ============================================

export const ACCOUNTING_MODULES: ModuleConfig[] = [
  {
    id: 'expenses',
    name: { fr: 'Dépenses', ar: 'المصروفات' },
    description: {
      fr: 'Suivi des dépenses avec TVA déductible et catégories',
      ar: 'متابعة المصروفات مع الضريبة القابلة للخصم والفئات',
    },
    category: 'accounting',
    icon: Receipt,
    price: 49,
    isRequired: false,
    dependencies: ['invoices'],
    features: [
      {
        id: 'create_edit',
        name: { fr: 'Création & Modification', ar: 'الإنشاء والتعديل' },
        description: { fr: 'Enregistrer les dépenses', ar: 'تسجيل المصروفات' },
        included: true,
      },
      {
        id: 'categories',
        name: { fr: 'Catégories', ar: 'الفئات' },
        description: { fr: '7 catégories prédéfinies', ar: '7 فئات محددة مسبقاً' },
        included: true,
      },
      {
        id: 'tva_deductible',
        name: { fr: 'TVA Déductible', ar: 'الضريبة القابلة للخصم' },
        description: { fr: 'Calcul automatique TVA', ar: 'حساب تلقائي للضريبة' },
        included: true,
      },
      {
        id: 'supplier_link',
        name: { fr: 'Lien fournisseur', ar: 'ربط المورد' },
        description: { fr: 'Associer aux fournisseurs', ar: 'الربط مع الموردين' },
        included: true,
      },
    ],
    limits: {
      expenses_per_month: 50,
    },
    status: 'active',
    rolloutPhase: 1,
  },
  {
    id: 'credit-notes',
    name: { fr: 'Avoirs', ar: 'إشعارات دائنة' },
    description: {
      fr: 'Gestion des avoirs et notes de crédit',
      ar: 'إدارة الإشعارات الدائنة وملاحظات الائتمان',
    },
    category: 'accounting',
    icon: ArrowLeftRight,
    price: 49,
    isRequired: false,
    dependencies: ['invoices'],
    features: [
      {
        id: 'create_edit',
        name: { fr: 'Création & Modification', ar: 'الإنشاء والتعديل' },
        description: { fr: 'Créer des avoirs', ar: 'إنشاء إشعارات دائنة' },
        included: true,
      },
      {
        id: 'invoice_link',
        name: { fr: 'Lien facture', ar: 'ربط الفاتورة' },
        description: { fr: 'Lier à la facture originale', ar: 'الربط بالفاتورة الأصلية' },
        included: true,
      },
      {
        id: 'reasons',
        name: { fr: 'Motifs', ar: 'الأسباب' },
        description: { fr: 'Remboursement, remise, correction', ar: 'استرداد، خصم، تصحيح' },
        included: true,
      },
      {
        id: 'tva_adjustment',
        name: { fr: 'Ajustement TVA', ar: 'تعديل الضريبة' },
        description: { fr: 'Impact sur la TVA', ar: 'التأثير على الضريبة' },
        included: true,
      },
    ],
    limits: {
      credit_notes_per_month: 20,
    },
    status: 'active',
    rolloutPhase: 2,
  },
  {
    id: 'reports',
    name: { fr: 'Rapports', ar: 'التقارير' },
    description: {
      fr: 'Rapports financiers: TVA, revenus, flux de trésorerie',
      ar: 'التقارير المالية: الضريبة، الإيرادات، التدفقات النقدية',
    },
    category: 'accounting',
    icon: BarChart3,
    price: 99,
    isRequired: false,
    dependencies: ['invoices', 'expenses'],
    features: [
      {
        id: 'tva_report',
        name: { fr: 'Rapport TVA', ar: 'تقرير الضريبة' },
        description: { fr: 'TVA collectée/déductible/à payer', ar: 'الضريبة المجمعة/القابلة للخصم/المستحقة' },
        included: true,
      },
      {
        id: 'revenue_report',
        name: { fr: 'Rapport revenus', ar: 'تقرير الإيرادات' },
        description: { fr: 'Évolution du CA', ar: 'تطور الإيرادات' },
        included: true,
      },
      {
        id: 'expense_report',
        name: { fr: 'Rapport dépenses', ar: 'تقرير المصروفات' },
        description: { fr: 'Par catégorie', ar: 'حسب الفئة' },
        included: true,
      },
      {
        id: 'cash_flow',
        name: { fr: 'Flux de trésorerie', ar: 'التدفقات النقدية' },
        description: { fr: 'Entrées/sorties', ar: 'الوارد/الصادر' },
        included: true,
      },
      {
        id: 'export',
        name: { fr: 'Export', ar: 'التصدير' },
        description: { fr: 'Excel, PDF', ar: 'إكسل، PDF' },
        included: true,
      },
    ],
    limits: {},
    status: 'active',
    rolloutPhase: 1,
  },
];

// ============================================
// CRM Modules
// ============================================

export const CRM_MODULES: ModuleConfig[] = [
  {
    id: 'leads',
    name: { fr: 'Prospects', ar: 'العملاء المحتملين' },
    description: {
      fr: 'Gestion des leads et conversion en clients',
      ar: 'إدارة العملاء المحتملين والتحويل إلى عملاء',
    },
    category: 'crm',
    icon: UserPlus,
    price: 99,
    isRequired: false,
    dependencies: ['clients'],
    features: [
      {
        id: 'create_edit',
        name: { fr: 'Création & Modification', ar: 'الإنشاء والتعديل' },
        description: { fr: 'Gérer les prospects', ar: 'إدارة العملاء المحتملين' },
        included: true,
      },
      {
        id: 'sources',
        name: { fr: 'Sources', ar: 'المصادر' },
        description: { fr: 'Site, réferral, réseaux sociaux', ar: 'الموقع، الإحالة، وسائل التواصل' },
        included: true,
      },
      {
        id: 'pipeline',
        name: { fr: 'Pipeline', ar: 'خط الأنابيب' },
        description: { fr: 'Nouveau → Contacté → Qualifié → Proposition → Gagné', ar: 'جديد ← متصل ← مؤهل ← عرض ← مكتسب' },
        included: true,
      },
      {
        id: 'convert',
        name: { fr: 'Conversion', ar: 'التحويل' },
        description: { fr: 'Convertir en client', ar: 'التحويل إلى عميل' },
        included: true,
      },
      {
        id: 'statistics',
        name: { fr: 'Statistiques', ar: 'الإحصائيات' },
        description: { fr: 'Taux de conversion', ar: 'معدل التحويل' },
        included: true,
      },
    ],
    limits: {
      leads: 100,
    },
    status: 'active',
    rolloutPhase: 3,
  },
  {
    id: 'tasks',
    name: { fr: 'Tâches', ar: 'المهام' },
    description: {
      fr: 'Gestion des tâches et suivi des activités',
      ar: 'إدارة المهام ومتابعة الأنشطة',
    },
    category: 'crm',
    icon: CheckSquare,
    price: 49,
    isRequired: false,
    dependencies: [],
    features: [
      {
        id: 'create_edit',
        name: { fr: 'Création & Modification', ar: 'الإنشاء والتعديل' },
        description: { fr: 'Créer des tâches', ar: 'إنشاء مهام' },
        included: true,
      },
      {
        id: 'priorities',
        name: { fr: 'Priorités', ar: 'الأولويات' },
        description: { fr: 'Basse, moyenne, haute', ar: 'منخفضة، متوسطة، عالية' },
        included: true,
      },
      {
        id: 'due_dates',
        name: { fr: 'Dates d\'échéance', ar: 'تواريخ الاستحقاق' },
        description: { fr: 'Rappels automatiques', ar: 'تذكيرات تلقائية' },
        included: true,
      },
      {
        id: 'linking',
        name: { fr: 'Liaison', ar: 'الربط' },
        description: { fr: 'Clients, factures associées', ar: 'العملاء، الفواتير المرتبطة' },
        included: true,
      },
    ],
    limits: {
      tasks: 100,
    },
    status: 'active',
    rolloutPhase: 3,
  },
];

// ============================================
// Stock Modules
// ============================================

export const STOCK_MODULES: ModuleConfig[] = [
  {
    id: 'products',
    name: { fr: 'Produits', ar: 'المنتجات' },
    description: {
      fr: 'Catalogue de produits et services',
      ar: 'كتالوج المنتجات والخدمات',
    },
    category: 'stock',
    icon: Package,
    price: 149,
    isRequired: false,
    dependencies: ['invoices'],
    features: [
      {
        id: 'create_edit',
        name: { fr: 'Création & Modification', ar: 'الإنشاء والتعديل' },
        description: { fr: 'Gérer les produits', ar: 'إدارة المنتجات' },
        included: true,
      },
      {
        id: 'categories',
        name: { fr: 'Catégories', ar: 'الفئات' },
        description: { fr: 'Organiser par catégorie', ar: 'التنظيم حسب الفئة' },
        included: true,
      },
      {
        id: 'pricing',
        name: { fr: 'Tarification', ar: 'التسعير' },
        description: { fr: 'Prix et TVA par produit', ar: 'السعر والضريبة لكل منتج' },
        included: true,
      },
      {
        id: 'invoice_integration',
        name: { fr: 'Intégration factures', ar: 'تكامل الفواتير' },
        description: { fr: 'Ajouter aux factures', ar: 'الإضافة للفواتير' },
        included: true,
      },
    ],
    limits: {
      products: 200,
    },
    status: 'active',
    rolloutPhase: 4,
  },
  {
    id: 'inventory',
    name: { fr: 'Inventaire', ar: 'المخزون' },
    description: {
      fr: 'Gestion des stocks et mouvements',
      ar: 'إدارة المخزون والحركات',
    },
    category: 'stock',
    icon: Warehouse,
    price: 199,
    isRequired: false,
    dependencies: ['products'],
    features: [
      {
        id: 'stock_tracking',
        name: { fr: 'Suivi du stock', ar: 'متابعة المخزون' },
        description: { fr: 'Quantités en temps réel', ar: 'الكميات في الوقت الفعلي' },
        included: true,
      },
      {
        id: 'movements',
        name: { fr: 'Mouvements', ar: 'الحركات' },
        description: { fr: 'Entrées/sorties', ar: 'الوارد/الصادر' },
        included: true,
      },
      {
        id: 'alerts',
        name: { fr: 'Alertes', ar: 'التنبيهات' },
        description: { fr: 'Stock minimum', ar: 'الحد الأدنى للمخزون' },
        included: true,
      },
      {
        id: 'inventory_report',
        name: { fr: 'Rapport inventaire', ar: 'تقرير المخزون' },
        description: { fr: 'Évaluation du stock', ar: 'تقييم المخزون' },
        included: true,
      },
    ],
    limits: {},
    status: 'coming_soon',
    rolloutPhase: 4,
  },
];

// ============================================
// Team Modules
// ============================================

export const TEAM_MODULES: ModuleConfig[] = [
  {
    id: 'team',
    name: { fr: 'Équipe', ar: 'الفريق' },
    description: {
      fr: 'Gestion multi-utilisateurs avec rôles et permissions',
      ar: 'إدارة متعددة المستخدمين مع الأدوار والصلاحيات',
    },
    category: 'team',
    icon: UserCog,
    price: 199,
    isRequired: false,
    dependencies: [],
    features: [
      {
        id: 'invite',
        name: { fr: 'Invitation', ar: 'الدعوة' },
        description: { fr: 'Inviter des membres', ar: 'دعوة أعضاء' },
        included: true,
      },
      {
        id: 'roles',
        name: { fr: 'Rôles', ar: 'الأدوار' },
        description: { fr: 'Admin, Comptable, Lecteur', ar: 'مدير، محاسب، قارئ' },
        included: true,
      },
      {
        id: 'permissions',
        name: { fr: 'Permissions', ar: 'الصلاحيات' },
        description: { fr: 'Contrôle d\'accès fin', ar: 'تحكم دقيق في الوصول' },
        included: true,
      },
      {
        id: 'activity',
        name: { fr: 'Activité', ar: 'النشاط' },
        description: { fr: 'Actions par membre', ar: 'إجراءات كل عضو' },
        included: true,
      },
    ],
    limits: {
      team_members: 5,
    },
    status: 'active',
    rolloutPhase: 3,
  },
];

// ============================================
// Integration Modules
// ============================================

export const INTEGRATION_MODULES: ModuleConfig[] = [
  {
    id: 'api-keys',
    name: { fr: 'Clés API', ar: 'مفاتيح API' },
    description: {
      fr: 'Accès API pour intégrations tierces',
      ar: 'الوصول عبر API للتكاملات الخارجية',
    },
    category: 'integrations',
    icon: Key,
    price: 99,
    isRequired: false,
    dependencies: [],
    features: [
      {
        id: 'generate',
        name: { fr: 'Génération', ar: 'الإنشاء' },
        description: { fr: 'Créer des clés API', ar: 'إنشاء مفاتيح API' },
        included: true,
      },
      {
        id: 'permissions',
        name: { fr: 'Permissions', ar: 'الصلاحيات' },
        description: { fr: 'Lecture, écriture, suppression', ar: 'قراءة، كتابة، حذف' },
        included: true,
      },
      {
        id: 'tracking',
        name: { fr: 'Suivi', ar: 'المتابعة' },
        description: { fr: 'Dernière utilisation', ar: 'آخر استخدام' },
        included: true,
      },
      {
        id: 'revoke',
        name: { fr: 'Révocation', ar: 'الإلغاء' },
        description: { fr: 'Révoquer les clés', ar: 'إلغاء المفاتيح' },
        included: true,
      },
    ],
    limits: {
      api_keys: 5,
      api_requests_per_month: 10000,
    },
    status: 'active',
    rolloutPhase: 3,
  },
  {
    id: 'gateways',
    name: { fr: 'Passerelles de paiement', ar: 'بوابات الدفع' },
    description: {
      fr: 'Configuration CMI, Fatourati, CIH Pay',
      ar: 'تكوين CMI، فاتوراتي، CIH Pay',
    },
    category: 'integrations',
    icon: Server,
    price: 199,
    isRequired: false,
    dependencies: ['payment-links'],
    features: [
      {
        id: 'cmi',
        name: { fr: 'CMI', ar: 'CMI' },
        description: { fr: 'Centre Monétique Interbancaire', ar: 'المركز النقدي بين البنكي' },
        included: true,
      },
      {
        id: 'fatourati',
        name: { fr: 'Fatourati', ar: 'فاتوراتي' },
        description: { fr: 'CDG Group', ar: 'مجموعة الصندوق الوطني' },
        included: true,
      },
      {
        id: 'cih_pay',
        name: { fr: 'CIH Pay', ar: 'CIH Pay' },
        description: { fr: 'CIH Bank', ar: 'بنك CIH' },
        included: true,
      },
      {
        id: 'test_mode',
        name: { fr: 'Mode test', ar: 'وضع الاختبار' },
        description: { fr: 'Tests avant production', ar: 'اختبارات قبل الإنتاج' },
        included: true,
      },
      {
        id: 'webhooks',
        name: { fr: 'Webhooks', ar: 'الخطاطات' },
        description: { fr: 'Notifications automatiques', ar: 'إشعارات تلقائية' },
        included: true,
      },
    ],
    limits: {},
    status: 'active',
    rolloutPhase: 3,
  },
];

// ============================================
// Audit Modules
// ============================================

export const AUDIT_MODULES: ModuleConfig[] = [
  {
    id: 'audit',
    name: { fr: 'Audit', ar: 'التدقيق' },
    description: {
      fr: 'Journal d\'audit et traçabilité complète',
      ar: 'سجل التدقيق والتتبع الكامل',
    },
    category: 'audit',
    icon: FileSearch,
    price: 99,
    isRequired: false,
    dependencies: [],
    features: [
      {
        id: 'tracking',
        name: { fr: 'Traçabilité', ar: 'التتبع' },
        description: { fr: 'Toutes les actions enregistrées', ar: 'جميع الإجراءات مسجلة' },
        included: true,
      },
      {
        id: 'export',
        name: { fr: 'Export', ar: 'التصدير' },
        description: { fr: 'Export pour conformité', ar: 'التصدير للامتثال' },
        included: true,
      },
      {
        id: 'retention',
        name: { fr: 'Rétention', ar: 'الاحتفاظ' },
        description: { fr: 'Historique 5 ans', ar: 'سجل 5 سنوات' },
        included: true,
      },
      {
        id: 'search',
        name: { fr: 'Recherche', ar: 'البحث' },
        description: { fr: 'Filtres avancés', ar: 'مرشحات متقدمة' },
        included: true,
      },
    ],
    limits: {
      audit_retention_days: 1825, // 5 years
    },
    status: 'active',
    rolloutPhase: 3,
  },
];

// ============================================
// AI Modules
// ============================================

export const AI_MODULES: ModuleConfig[] = [
  {
    id: 'ai-lead-qualifier',
    name: { fr: 'AI Lead Qualifier', ar: 'مؤهل العملاء AI' },
    description: {
      fr: 'Qualification automatique des prospects avec WhatsApp + Gemini AI',
      ar: 'التأهيل التلقائي للعملاء المحتملين مع واتساب + Gemini AI',
    },
    category: 'crm',
    icon: Brain,
    price: 199,
    isRequired: false,
    dependencies: ['leads'],
    features: [
      {
        id: 'whatsapp_integration',
        name: { fr: 'Intégration WhatsApp', ar: 'تكامل واتساب' },
        description: { fr: 'Réception et envoi via WhatsApp', ar: 'الاستلام والإرسال عبر واتساب' },
        included: true,
      },
      {
        id: 'gemini_ai',
        name: { fr: 'Gemini AI', ar: 'Gemini AI' },
        description: { fr: 'IA Google Gemini pour la qualification', ar: 'ذكاء Google Gemini للتأهيل' },
        included: true,
      },
      {
        id: 'bant_scoring',
        name: { fr: 'Scoring BANT', ar: 'تقييم BANT' },
        description: { fr: 'Budget, Autorité, Besoin, Timeline', ar: 'الميزانية، السلطة، الحاجة، الجدول الزمني' },
        included: true,
      },
      {
        id: 'auto_qualification',
        name: { fr: 'Qualification automatique', ar: 'التأهيل التلقائي' },
        description: { fr: 'Classification hot/warm/cold', ar: 'تصنيف ساخن/دافئ/بارد' },
        included: true,
      },
      {
        id: 'conversation_history',
        name: { fr: 'Historique des conversations', ar: 'سجل المحادثات' },
        description: { fr: 'Toutes les conversations sauvegardées', ar: 'جميع المحادثات محفوظة' },
        included: true,
      },
      {
        id: 'lead_conversion',
        name: { fr: 'Conversion de leads', ar: 'تحويل العملاء' },
        description: { fr: 'Conversion automatique en clients', ar: 'التحويل التلقائي إلى عملاء' },
        included: true,
      },
    ],
    limits: {
      conversations_per_month: 500,
      ai_tokens_per_month: 100000,
    },
    status: 'active',
    rolloutPhase: 4,
  },
];

// ============================================
// All Modules Combined
// ============================================

export const ALL_MODULES: ModuleConfig[] = [
  ...CORE_MODULES,
  ...SALES_MODULES,
  ...ACCOUNTING_MODULES,
  ...CRM_MODULES,
  ...STOCK_MODULES,
  ...TEAM_MODULES,
  ...INTEGRATION_MODULES,
  ...AUDIT_MODULES,
  ...AI_MODULES,
];

// ============================================
// Bundle Configurations
// ============================================

export const BUNDLES: BundleConfig[] = [
  {
    id: 'starter',
    name: { fr: 'Starter', ar: 'المبتدئ' },
    description: {
      fr: 'Pour les freelances et micro-entreprises',
      ar: 'للمستقلين والمشاريع الصغيرة',
    },
    modules: ['dashboard', 'invoices', 'payment-links', 'clients', 'suppliers'],
    discount: 0,
    price: 0,
    savings: 0,
  },
  {
    id: 'basic',
    name: { fr: 'Basic', ar: 'الأساسي' },
    description: {
      fr: 'Pour les petites entreprises',
      ar: 'للشركات الصغيرة',
    },
    modules: [
      'dashboard',
      'invoices',
      'payment-links',
      'clients',
      'suppliers',
      'quotes',
      'expenses',
      'tasks',
    ],
    discount: 20,
    price: 49,
    savings: 98, // (49 + 49 + 49) * 0.20 = ~29, adjusted
  },
  {
    id: 'pro',
    name: { fr: 'Pro', ar: 'المحترف' },
    description: {
      fr: 'Pour les entreprises en croissance',
      ar: 'للشركات النامية',
    },
    modules: [
      'dashboard',
      'invoices',
      'payment-links',
      'clients',
      'suppliers',
      'quotes',
      'expenses',
      'credit-notes',
      'reports',
      'leads',
      'tasks',
      'api-keys',
      'audit',
    ],
    discount: 30,
    price: 99,
    savings: 250,
  },
  {
    id: 'business',
    name: { fr: 'Business', ar: 'الأعمال' },
    description: {
      fr: 'Pour les entreprises établies',
      ar: 'للشركات الراسخة',
    },
    modules: [
      'dashboard',
      'invoices',
      'payment-links',
      'clients',
      'suppliers',
      'quotes',
      'expenses',
      'credit-notes',
      'reports',
      'leads',
      'tasks',
      'products',
      'team',
      'api-keys',
      'gateways',
      'audit',
    ],
    discount: 40,
    price: 199,
    savings: 500,
  },
];

// ============================================
// Plan Limits
// ============================================

export const PLAN_LIMITS = {
  starter: {
    invoices_per_month: 5,
    links_per_month: 10,
    clients: 50,
    suppliers: 20,
    quotes_per_month: 0,
    expenses_per_month: 0,
    credit_notes_per_month: 0,
    leads: 0,
    tasks: 0,
    products: 0,
    team_members: 1,
    api_keys: 0,
    api_requests_per_month: 0,
  },
  basic: {
    invoices_per_month: 25,
    links_per_month: 50,
    clients: 100,
    suppliers: 50,
    quotes_per_month: 25,
    expenses_per_month: 50,
    credit_notes_per_month: 10,
    leads: 0,
    tasks: 50,
    products: 0,
    team_members: 1,
    api_keys: 0,
    api_requests_per_month: 0,
  },
  pro: {
    invoices_per_month: 100,
    links_per_month: 200,
    clients: 500,
    suppliers: 200,
    quotes_per_month: 100,
    expenses_per_month: 200,
    credit_notes_per_month: 50,
    leads: 200,
    tasks: 200,
    products: 100,
    team_members: 3,
    api_keys: 3,
    api_requests_per_month: 10000,
  },
  business: {
    invoices_per_month: -1, // Unlimited
    links_per_month: -1,
    clients: -1,
    suppliers: -1,
    quotes_per_month: -1,
    expenses_per_month: -1,
    credit_notes_per_month: -1,
    leads: -1,
    tasks: -1,
    products: 500,
    team_members: 10,
    api_keys: 10,
    api_requests_per_month: 100000,
  },
};

// ============================================
// Helper Functions
// ============================================

export function getModuleById(id: string): ModuleConfig | undefined {
  return ALL_MODULES.find((m) => m.id === id);
}

export function getModulesByCategory(category: ModuleConfig['category']): ModuleConfig[] {
  return ALL_MODULES.filter((m) => m.category === category);
}

export function getRequiredModules(): ModuleConfig[] {
  return ALL_MODULES.filter((m) => m.isRequired);
}

export function getModuleDependencies(moduleId: string): string[] {
  const mod = getModuleById(moduleId);
  if (!mod) return [];
  return mod.dependencies;
}

export function checkDependencies(moduleId: string, activeModules: string[]): boolean {
  const dependencies = getModuleDependencies(moduleId);
  return dependencies.every((dep) => activeModules.includes(dep));
}

export function calculateBundlePrice(moduleIds: string[]): number {
  return moduleIds.reduce((total, id) => {
    const mod = getModuleById(id);
    return total + (mod?.price || 0);
  }, 0);
}

export function getActiveModulesForPlan(planId: string): ModuleConfig[] {
  const bundle = BUNDLES.find((b) => b.id === planId);
  if (!bundle) return CORE_MODULES;
  return bundle.modules.map((id) => getModuleById(id)).filter(Boolean) as ModuleConfig[];
}

export function getModuleLimitsForPlan(planId: keyof typeof PLAN_LIMITS) {
  return PLAN_LIMITS[planId] || PLAN_LIMITS.starter;
}

// ============================================
// MODULES_CONFIG - Simplified object for UI components
// ============================================

export const MODULES_CONFIG: Record<string, {
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  price: number;
  dependencies: string[];
  features: string[];
}> = Object.fromEntries(
  ALL_MODULES.map((mod) => [
    mod.id,
    {
      name: mod.name.fr,
      nameAr: mod.name.ar,
      description: mod.description.fr,
      descriptionAr: mod.description.ar,
      icon: mod.icon.displayName || mod.icon.name || 'FileText',
      price: mod.price,
      dependencies: mod.dependencies,
      features: mod.features.map((f) => f.id),
    },
  ])
);

const ModuleConfigExport = {
  CORE_MODULES,
  SALES_MODULES,
  ACCOUNTING_MODULES,
  CRM_MODULES,
  STOCK_MODULES,
  TEAM_MODULES,
  INTEGRATION_MODULES,
  AUDIT_MODULES,
  ALL_MODULES,
  BUNDLES,
  PLAN_LIMITS,
  getModuleById,
  getModulesByCategory,
  getRequiredModules,
  getModuleDependencies,
  checkDependencies,
  calculateBundlePrice,
  getActiveModulesForPlan,
  getModuleLimitsForPlan,
};

export default ModuleConfigExport;
