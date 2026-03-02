/**
 * Epaiement.ma Module Registry
 * Central registry for all application modules
 */

import {
  type ModuleConfig,
  type ModuleRegistryEntry,
  type ModuleRoute,
  type ModuleApiEndpoint,
  type ModulePermission,
  type SubscriptionPlan,
  type ModuleCategory,
} from './types';

// Import module configurations
import {
  ALL_MODULES,
  CORE_MODULES,
  SALES_MODULES,
  ACCOUNTING_MODULES,
  CRM_MODULES,
  STOCK_MODULES,
  TEAM_MODULES,
  INTEGRATION_MODULES,
  AUDIT_MODULES,
  BUNDLES,
  PLAN_LIMITS,
} from '@/lib/modules.config';

// ============================================
// Registry Storage
// ============================================

class ModuleRegistry {
  private modules: Map<string, ModuleRegistryEntry> = new Map();
  private initialized = false;

  // ============================================
  // Initialization
  // ============================================

  /**
   * Initialize the registry with all modules
   */
  initialize(): void {
    if (this.initialized) return;

    // Register all modules
    ALL_MODULES.forEach((config) => {
      this.register(config);
    });

    this.initialized = true;
    console.log(`[ModuleRegistry] Initialized with ${this.modules.size} modules`);
  }

  // ============================================
  // Registration
  // ============================================

  /**
   * Register a module in the registry
   */
  register(config: ModuleConfig): void {
    const entry: ModuleRegistryEntry = {
      config,
      requiredPermissions: this.getDefaultPermissions(config.id),
      routes: this.getDefaultRoutes(config.id),
      apiEndpoints: this.getDefaultApiEndpoints(config.id),
      hooks: this.getDefaultHooks(config.id),
    };

    this.modules.set(config.id, entry);
  }

  /**
   * Unregister a module from the registry
   */
  unregister(moduleId: string): boolean {
    return this.modules.delete(moduleId);
  }

  // ============================================
  // Getters
  // ============================================

  /**
   * Get a module by ID
   */
  get(moduleId: string): ModuleRegistryEntry | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get module configuration by ID
   */
  getConfig(moduleId: string): ModuleConfig | undefined {
    return this.modules.get(moduleId)?.config;
  }

  /**
   * Get all registered modules
   */
  getAll(): ModuleRegistryEntry[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get all module configurations
   */
  getAllConfigs(): ModuleConfig[] {
    return Array.from(this.modules.values()).map((entry) => entry.config);
  }

  /**
   * Get modules by category
   */
  getByCategory(category: ModuleCategory): ModuleRegistryEntry[] {
    return this.getAll().filter((entry) => entry.config.category === category);
  }

  /**
   * Get required modules
   */
  getRequired(): ModuleRegistryEntry[] {
    return this.getAll().filter((entry) => entry.config.isRequired);
  }

  /**
   * Get active modules
   */
  getActive(): ModuleRegistryEntry[] {
    return this.getAll().filter((entry) => entry.config.status === 'active');
  }

  /**
   * Check if a module exists
   */
  has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  /**
   * Check if a module is active
   */
  isActive(moduleId: string): boolean {
    const entry = this.modules.get(moduleId);
    return entry?.config.status === 'active';
  }

  // ============================================
  // Dependency Management
  // ============================================

  /**
   * Get module dependencies
   */
  getDependencies(moduleId: string): string[] {
    const config = this.getConfig(moduleId);
    return config?.dependencies || [];
  }

  /**
   * Get modules that depend on a given module
   */
  getDependents(moduleId: string): string[] {
    const dependents: string[] = [];
    this.modules.forEach((entry, id) => {
      if (entry.config.dependencies.includes(moduleId)) {
        dependents.push(id);
      }
    });
    return dependents;
  }

  /**
   * Check if all dependencies are satisfied
   */
  checkDependencies(moduleId: string, activeModules: string[]): {
    satisfied: boolean;
    missing: string[];
  } {
    const dependencies = this.getDependencies(moduleId);
    const missing = dependencies.filter((dep) => !activeModules.includes(dep));
    return {
      satisfied: missing.length === 0,
      missing,
    };
  }

  /**
   * Get dependency tree for a module
   */
  getDependencyTree(moduleId: string, visited = new Set<string>()): string[] {
    if (visited.has(moduleId)) return [];
    visited.add(moduleId);

    const dependencies = this.getDependencies(moduleId);
    const tree: string[] = [moduleId];

    for (const dep of dependencies) {
      const depTree = this.getDependencyTree(dep, visited);
      tree.push(...depTree.filter((id) => !tree.includes(id)));
    }

    return tree;
  }

  // ============================================
  // Validation
  // ============================================

  /**
   * Validate a module configuration
   */
  validateConfig(config: ModuleConfig): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!config.id) errors.push('Module ID is required');
    if (!config.name?.fr || !config.name?.ar) errors.push('Module name (fr/ar) is required');
    if (!config.description?.fr || !config.description?.ar)
      errors.push('Module description (fr/ar) is required');

    // Check for duplicate IDs
    if (this.has(config.id) && !config.isRequired) {
      warnings.push(`Module with ID "${config.id}" already exists`);
    }

    // Check dependencies exist
    for (const dep of config.dependencies) {
      if (!this.has(dep)) {
        errors.push(`Dependency "${dep}" does not exist`);
      }
    }

    // Check circular dependencies
    const depTree = this.getDependencyTree(config.id);
    if (depTree.includes(config.id) && depTree.length > 1) {
      errors.push('Circular dependency detected');
    }

    // Validate price
    if (config.price < 0) {
      errors.push('Price cannot be negative');
    }

    // Validate category
    const validCategories: ModuleCategory[] = [
      'core',
      'sales',
      'accounting',
      'crm',
      'stock',
      'team',
      'integrations',
      'ai',
      'audit',
    ];
    if (!validCategories.includes(config.category)) {
      errors.push(`Invalid category: ${config.category}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate module activation
   */
  validateActivation(
    moduleId: string,
    activeModules: string[],
    plan: SubscriptionPlan
  ): {
    canActivate: boolean;
    reason?: string;
  } {
    const config = this.getConfig(moduleId);

    if (!config) {
      return { canActivate: false, reason: 'Module not found' };
    }

    if (config.status === 'deprecated') {
      return { canActivate: false, reason: 'Module is deprecated' };
    }

    // Check dependencies
    const depCheck = this.checkDependencies(moduleId, activeModules);
    if (!depCheck.satisfied) {
      return {
        canActivate: false,
        reason: `Missing dependencies: ${depCheck.missing.join(', ')}`,
      };
    }

    // Check plan limits
    const bundle = BUNDLES.find((b) => b.id === plan);
    if (bundle && !bundle.modules.includes(moduleId) && config.price > 0) {
      return {
        canActivate: false,
        reason: `Module requires upgrade to a higher plan`,
      };
    }

    return { canActivate: true };
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Search modules by name or description
   */
  search(query: string, language: 'fr' | 'ar' = 'fr'): ModuleRegistryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter((entry) => {
      const config = entry.config;
      return (
        config.name[language].toLowerCase().includes(lowerQuery) ||
        config.description[language].toLowerCase().includes(lowerQuery) ||
        config.id.toLowerCase().includes(lowerQuery)
      );
    });
  }

  /**
   * Get modules within price range
   */
  getByPriceRange(min: number, max: number): ModuleRegistryEntry[] {
    return this.getAll().filter((entry) => {
      const price = entry.config.price;
      return price >= min && price <= max;
    });
  }

  /**
   * Get free modules
   */
  getFree(): ModuleRegistryEntry[] {
    return this.getByPriceRange(0, 0);
  }

  /**
   * Get paid modules
   */
  getPaid(): ModuleRegistryEntry[] {
    return this.getAll().filter((entry) => entry.config.price > 0);
  }

  // ============================================
  // Statistics
  // ============================================

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    byCategory: Record<ModuleCategory, number>;
    byStatus: Record<string, number>;
    free: number;
    paid: number;
    avgPrice: number;
  } {
    const entries = this.getAll();
    const byCategory: Record<ModuleCategory, number> = {
      core: 0,
      sales: 0,
      accounting: 0,
      crm: 0,
      stock: 0,
      team: 0,
      integrations: 0,
      ai: 0,
      audit: 0,
    };
    const byStatus: Record<string, number> = {};
    let free = 0;
    let paid = 0;
    let totalPrice = 0;

    entries.forEach((entry) => {
      const config = entry.config;
      byCategory[config.category]++;
      byStatus[config.status] = (byStatus[config.status] || 0) + 1;
      if (config.price === 0) free++;
      else paid++;
      totalPrice += config.price;
    });

    return {
      total: entries.length,
      byCategory,
      byStatus,
      free,
      paid,
      avgPrice: paid > 0 ? totalPrice / paid : 0,
    };
  }

  // ============================================
  // Default Values
  // ============================================

  private getDefaultPermissions(moduleId: string): string[] {
    const basePermissions: Record<string, string[]> = {
      dashboard: ['dashboard:view'],
      invoices: ['invoices:view', 'invoices:create', 'invoices:edit', 'invoices:delete'],
      'payment-links': ['links:view', 'links:create', 'links:edit', 'links:delete'],
      clients: ['clients:view', 'clients:create', 'clients:edit', 'clients:delete'],
      suppliers: ['suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:delete'],
      quotes: ['quotes:view', 'quotes:create', 'quotes:edit', 'quotes:delete', 'quotes:convert'],
      expenses: ['expenses:view', 'expenses:create', 'expenses:edit', 'expenses:delete'],
      'credit-notes': [
        'credit-notes:view',
        'credit-notes:create',
        'credit-notes:edit',
        'credit-notes:delete',
      ],
      reports: ['reports:view', 'reports:export'],
      leads: ['leads:view', 'leads:create', 'leads:edit', 'leads:delete', 'leads:convert'],
      tasks: ['tasks:view', 'tasks:create', 'tasks:edit', 'tasks:delete'],
      products: ['products:view', 'products:create', 'products:edit', 'products:delete'],
      inventory: ['inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete'],
      team: ['team:view', 'team:invite', 'team:edit', 'team:remove'],
      'api-keys': ['api-keys:view', 'api-keys:create', 'api-keys:revoke'],
      gateways: ['gateways:view', 'gateways:configure'],
      audit: ['audit:view', 'audit:export'],
    };

    return basePermissions[moduleId] || [`${moduleId}:view`];
  }

  private getDefaultRoutes(moduleId: string): ModuleRoute[] {
    const baseRoutes: Record<string, ModuleRoute[]> = {
      dashboard: [
        {
          path: '/',
          component: 'Dashboard',
          title: { fr: 'Tableau de bord', ar: 'لوحة القيادة' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 0,
        },
      ],
      invoices: [
        {
          path: '/invoices',
          component: 'InvoiceList',
          title: { fr: 'Factures', ar: 'الفواتير' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 1,
        },
        {
          path: '/invoices/new',
          component: 'InvoiceForm',
          title: { fr: 'Nouvelle facture', ar: 'فاتورة جديدة' },
          requiresAuth: true,
          permissions: ['invoices:create'],
        },
        {
          path: '/invoices/:id',
          component: 'InvoiceDetail',
          title: { fr: 'Détail facture', ar: 'تفاصيل الفاتورة' },
          requiresAuth: true,
        },
      ],
      'payment-links': [
        {
          path: '/payment-links',
          component: 'PaymentLinkList',
          title: { fr: 'Liens de paiement', ar: 'روابط الدفع' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 2,
        },
      ],
      clients: [
        {
          path: '/clients',
          component: 'ClientList',
          title: { fr: 'Clients', ar: 'العملاء' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 3,
        },
      ],
      suppliers: [
        {
          path: '/suppliers',
          component: 'SupplierList',
          title: { fr: 'Fournisseurs', ar: 'الموردين' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 4,
        },
      ],
      quotes: [
        {
          path: '/quotes',
          component: 'QuoteList',
          title: { fr: 'Devis', ar: 'العروض' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 5,
        },
      ],
      expenses: [
        {
          path: '/expenses',
          component: 'ExpenseList',
          title: { fr: 'Dépenses', ar: 'المصروفات' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 6,
        },
      ],
      reports: [
        {
          path: '/reports',
          component: 'Reports',
          title: { fr: 'Rapports', ar: 'التقارير' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 7,
        },
      ],
      leads: [
        {
          path: '/leads',
          component: 'LeadList',
          title: { fr: 'Prospects', ar: 'العملاء المحتملين' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 8,
        },
      ],
      tasks: [
        {
          path: '/tasks',
          component: 'TaskList',
          title: { fr: 'Tâches', ar: 'المهام' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 9,
        },
      ],
      team: [
        {
          path: '/team',
          component: 'TeamList',
          title: { fr: 'Équipe', ar: 'الفريق' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 10,
        },
      ],
      'api-keys': [
        {
          path: '/api-keys',
          component: 'ApiKeyList',
          title: { fr: 'Clés API', ar: 'مفاتيح API' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 11,
        },
      ],
      gateways: [
        {
          path: '/gateways',
          component: 'GatewayConfig',
          title: { fr: 'Passerelles', ar: 'البوابات' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 12,
        },
      ],
      audit: [
        {
          path: '/audit',
          component: 'AuditLog',
          title: { fr: 'Audit', ar: 'التدقيق' },
          requiresAuth: true,
          showInNav: true,
          navOrder: 13,
        },
      ],
    };

    return baseRoutes[moduleId] || [];
  }

  private getDefaultApiEndpoints(moduleId: string): ModuleApiEndpoint[] {
    const baseEndpoints: Record<string, ModuleApiEndpoint[]> = {
      invoices: [
        { method: 'GET', path: '/api/invoices', handler: 'listInvoices', permissions: ['invoices:view'], rateLimit: 100 },
        { method: 'POST', path: '/api/invoices', handler: 'createInvoice', permissions: ['invoices:create'], rateLimit: 50 },
        { method: 'GET', path: '/api/invoices/:id', handler: 'getInvoice', permissions: ['invoices:view'], rateLimit: 100 },
        { method: 'PUT', path: '/api/invoices/:id', handler: 'updateInvoice', permissions: ['invoices:edit'], rateLimit: 50 },
        { method: 'DELETE', path: '/api/invoices/:id', handler: 'deleteInvoice', permissions: ['invoices:delete'], rateLimit: 20 },
        { method: 'POST', path: '/api/invoices/:id/pdf', handler: 'generatePdf', permissions: ['invoices:view'], rateLimit: 20 },
      ],
      'payment-links': [
        { method: 'GET', path: '/api/payment-links', handler: 'listLinks', permissions: ['links:view'], rateLimit: 100 },
        { method: 'POST', path: '/api/payment-links', handler: 'createLink', permissions: ['links:create'], rateLimit: 50 },
        { method: 'DELETE', path: '/api/payment-links/:id', handler: 'deleteLink', permissions: ['links:delete'], rateLimit: 20 },
      ],
      clients: [
        { method: 'GET', path: '/api/clients', handler: 'listClients', permissions: ['clients:view'], rateLimit: 100 },
        { method: 'POST', path: '/api/clients', handler: 'createClient', permissions: ['clients:create'], rateLimit: 50 },
        { method: 'PUT', path: '/api/clients/:id', handler: 'updateClient', permissions: ['clients:edit'], rateLimit: 50 },
        { method: 'DELETE', path: '/api/clients/:id', handler: 'deleteClient', permissions: ['clients:delete'], rateLimit: 20 },
      ],
      quotes: [
        { method: 'GET', path: '/api/quotes', handler: 'listQuotes', permissions: ['quotes:view'], rateLimit: 100 },
        { method: 'POST', path: '/api/quotes', handler: 'createQuote', permissions: ['quotes:create'], rateLimit: 50 },
        { method: 'POST', path: '/api/quotes/:id/convert', handler: 'convertToInvoice', permissions: ['quotes:convert'], rateLimit: 20 },
      ],
      reports: [
        { method: 'GET', path: '/api/reports/tva', handler: 'getTvaReport', permissions: ['reports:view'], rateLimit: 30 },
        { method: 'GET', path: '/api/reports/revenue', handler: 'getRevenueReport', permissions: ['reports:view'], rateLimit: 30 },
        { method: 'GET', path: '/api/reports/expenses', handler: 'getExpenseReport', permissions: ['reports:view'], rateLimit: 30 },
      ],
    };

    return baseEndpoints[moduleId] || [];
  }

  private getDefaultHooks(moduleId: string): string[] {
    const baseHooks: Record<string, string[]> = {
      invoices: ['useInvoices', 'useInvoice', 'useInvoiceForm', 'useInvoiceStats'],
      'payment-links': ['usePaymentLinks', 'usePaymentLink', 'usePaymentLinkGenerator'],
      clients: ['useClients', 'useClient', 'useClientForm', 'useClientStats'],
      suppliers: ['useSuppliers', 'useSupplier', 'useSupplierForm'],
      quotes: ['useQuotes', 'useQuote', 'useQuoteForm', 'useQuoteConversion'],
      expenses: ['useExpenses', 'useExpense', 'useExpenseForm', 'useExpenseStats'],
      reports: ['useReports', 'useTvaReport', 'useRevenueReport', 'useExpenseReport'],
      leads: ['useLeads', 'useLead', 'useLeadForm', 'useLeadConversion'],
      tasks: ['useTasks', 'useTask', 'useTaskForm'],
      team: ['useTeamMembers', 'useTeamMember', 'useTeamInvite'],
      'api-keys': ['useApiKeys', 'useApiKeyGenerator'],
      gateways: ['useGateways', 'useGatewayConfig'],
      audit: ['useAuditLog', 'useAuditExport'],
    };

    return baseHooks[moduleId] || [];
  }
}

// ============================================
// Singleton Instance
// ============================================

export const moduleRegistry = new ModuleRegistry();

// Initialize on import
if (typeof window !== 'undefined') {
  moduleRegistry.initialize();
}

// ============================================
// Export Helpers
// ============================================

export function getModule(moduleId: string) {
  return moduleRegistry.get(moduleId);
}

export function getModuleConfig(moduleId: string) {
  return moduleRegistry.getConfig(moduleId);
}

export function getAllModules() {
  return moduleRegistry.getAll();
}

export function getModulesByCategory(category: ModuleCategory) {
  return moduleRegistry.getByCategory(category);
}

export function checkModuleDependencies(moduleId: string, activeModules: string[]) {
  return moduleRegistry.checkDependencies(moduleId, activeModules);
}

export function validateModuleActivation(
  moduleId: string,
  activeModules: string[],
  plan: SubscriptionPlan
) {
  return moduleRegistry.validateActivation(moduleId, activeModules, plan);
}

export { ALL_MODULES, BUNDLES, PLAN_LIMITS };
export { moduleRegistry };
