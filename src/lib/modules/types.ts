/**
 * Epaiement.ma Module System Types
 * TypeScript interfaces for the modular architecture
 */

import type { LucideIcon } from 'lucide-react';

// ============================================
// Base Types
// ============================================

export type ModuleCategory =
  | 'core'
  | 'sales'
  | 'accounting'
  | 'crm'
  | 'stock'
  | 'team'
  | 'integrations'
  | 'audit';

export type ModuleStatus = 'active' | 'coming_soon' | 'beta' | 'deprecated';

export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'trial';

export type SubscriptionPlan = 'starter' | 'basic' | 'pro' | 'business';

// ============================================
// Module Feature
// ============================================

export interface ModuleFeature {
  /** Unique feature identifier */
  id: string;
  /** Feature name in French and Arabic */
  name: {
    fr: string;
    ar: string;
  };
  /** Feature description in French and Arabic */
  description: {
    fr: string;
    ar: string;
  };
  /** Whether this feature is included in the module */
  included: boolean;
  /** Usage limit (-1 for unlimited) */
  limit?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================
// Module Configuration
// ============================================

export interface ModuleConfig {
  /** Unique module identifier */
  id: string;
  /** Module name in French and Arabic */
  name: {
    fr: string;
    ar: string;
  };
  /** Module description in French and Arabic */
  description: {
    fr: string;
    ar: string;
  };
  /** Category for grouping modules */
  category: ModuleCategory;
  /** Icon component from Lucide */
  icon: LucideIcon;
  /** Monthly price in MAD (0 = free) */
  price: number;
  /** Whether this module is required */
  isRequired: boolean;
  /** IDs of modules this module depends on */
  dependencies: string[];
  /** List of features included in this module */
  features: ModuleFeature[];
  /** Usage limits for this module */
  limits: Record<string, number>;
  /** Current module status */
  status: ModuleStatus;
  /** Rollout phase (0 = MVP, higher = later) */
  rolloutPhase: number;
  /** Module version */
  version?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================
// Module Instance (Runtime)
// ============================================

export interface Module {
  /** Module configuration */
  config: ModuleConfig;
  /** Whether the module is currently loaded */
  isLoaded: boolean;
  /** Whether the module is enabled for this user */
  isEnabled: boolean;
  /** Current usage counts */
  usage: ModuleUsage;
  /** Error state if module failed to load */
  error?: string;
  /** Module-specific settings */
  settings?: Record<string, unknown>;
}

// ============================================
// Module Usage Tracking
// ============================================

export interface ModuleUsage {
  /** Module ID */
  moduleId: string;
  /** Current period usage counts */
  current: Record<string, number>;
  /** Previous period usage counts */
  previous: Record<string, number>;
  /** Billing period start date */
  periodStart: Date;
  /** Billing period end date */
  periodEnd: Date;
  /** Last updated timestamp */
  updatedAt: Date;
}

// ============================================
// Subscription
// ============================================

export interface ModuleSubscription {
  /** Subscription ID */
  id: string;
  /** User ID who owns this subscription */
  userId: string;
  /** Subscription plan */
  plan: SubscriptionPlan;
  /** Subscription status */
  status: SubscriptionStatus;
  /** Module IDs included in this subscription */
  modules: string[];
  /** Monthly price in MAD */
  price: number;
  /** Billing cycle start date */
  currentPeriodStart: Date;
  /** Billing cycle end date */
  currentPeriodEnd: Date;
  /** Trial end date (if applicable) */
  trialEnd?: Date;
  /** Cancellation date (if applicable) */
  canceledAt?: Date;
  /** Payment method ID */
  paymentMethodId?: string;
  /** Whether subscription will cancel at period end */
  cancelAtPeriodEnd: boolean;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

// ============================================
// User Modules
// ============================================

export interface UserModules {
  /** User ID */
  userId: string;
  /** Active subscription */
  subscription: ModuleSubscription | null;
  /** List of enabled module IDs */
  enabledModules: string[];
  /** Module usage records */
  usage: ModuleUsage[];
  /** Custom module settings per user */
  moduleSettings: Record<string, Record<string, unknown>>;
  /** Last updated timestamp */
  updatedAt: Date;
}

// ============================================
// Module Access Control
// ============================================

export interface ModulePermission {
  /** Module ID */
  moduleId: string;
  /** Permission level */
  level: 'none' | 'read' | 'write' | 'admin';
  /** Specific actions allowed */
  actions: string[];
}

export interface TeamMemberModuleAccess {
  /** Team member ID */
  memberId: string;
  /** Module-specific permissions */
  permissions: ModulePermission[];
}

// ============================================
// Module Loading State
// ============================================

export interface ModuleLoaderState {
  /** Module ID */
  moduleId: string;
  /** Loading status */
  status: 'idle' | 'loading' | 'loaded' | 'error';
  /** Loaded module component (if any) */
  component?: React.ComponentType;
  /** Error message (if any) */
  error?: string;
  /** Loading progress (0-100) */
  progress?: number;
}

// ============================================
// Module Registry Entry
// ============================================

export interface ModuleRegistryEntry {
  /** Module configuration */
  config: ModuleConfig;
  /** Lazy-loaded component factory */
  loader?: () => Promise<{ default: React.ComponentType }>;
  /** Required permissions */
  requiredPermissions: string[];
  /** Module routes */
  routes?: ModuleRoute[];
  /** Module API endpoints */
  apiEndpoints?: ModuleApiEndpoint[];
  /** Registered hooks */
  hooks?: string[];
}

// ============================================
// Module Route
// ============================================

export interface ModuleRoute {
  /** Route path (relative to module) */
  path: string;
  /** Route component name */
  component: string;
  /** Route title (localized) */
  title: {
    fr: string;
    ar: string;
  };
  /** Whether route requires authentication */
  requiresAuth: boolean;
  /** Required permissions */
  permissions?: string[];
  /** Whether to show in navigation */
  showInNav?: boolean;
  /** Navigation order */
  navOrder?: number;
  /** Navigation icon */
  navIcon?: LucideIcon;
}

// ============================================
// Module API Endpoint
// ============================================

export interface ModuleApiEndpoint {
  /** HTTP method */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Endpoint path */
  path: string;
  /** Handler function name */
  handler: string;
  /** Required permissions */
  permissions: string[];
  /** Rate limit (requests per minute) */
  rateLimit?: number;
}

// ============================================
// Module Event
// ============================================

export type ModuleEventType =
  | 'module:loaded'
  | 'module:enabled'
  | 'module:disabled'
  | 'module:upgraded'
  | 'module:downgraded'
  | 'module:error'
  | 'usage:limit_reached'
  | 'usage:warning';

export interface ModuleEvent {
  /** Event type */
  type: ModuleEventType;
  /** Module ID */
  moduleId: string;
  /** User ID */
  userId?: string;
  /** Event timestamp */
  timestamp: Date;
  /** Event data */
  data?: Record<string, unknown>;
}

// ============================================
// Module Analytics
// ============================================

export interface ModuleAnalytics {
  /** Module ID */
  moduleId: string;
  /** Period start date */
  periodStart: Date;
  /** Period end date */
  periodEnd: Date;
  /** Total active users */
  activeUsers: number;
  /** Total usage count */
  totalUsage: number;
  /** Usage by day */
  dailyUsage: Array<{
    date: Date;
    count: number;
  }>;
  /** Feature usage breakdown */
  featureUsage: Record<string, number>;
  /** Error count */
  errors: number;
  /** Average load time in ms */
  avgLoadTime: number;
}

// ============================================
// Plan Configuration
// ============================================

export interface PlanConfig {
  /** Plan ID */
  id: SubscriptionPlan;
  /** Plan name in French and Arabic */
  name: {
    fr: string;
    ar: string;
  };
  /** Plan description in French and Arabic */
  description: {
    fr: string;
    ar: string;
  };
  /** Monthly price in MAD */
  price: number;
  /** Modules included in this plan */
  modules: string[];
  /** Usage limits */
  limits: Record<string, number>;
  /** Discount percentage for annual billing */
  annualDiscount?: number;
  /** Features list for marketing */
  features: Array<{
    text: {
      fr: string;
      ar: string;
    };
    included: boolean;
  }>;
  /** Whether this is the recommended plan */
  recommended?: boolean;
  /** Plan highlight color */
  highlightColor?: string;
}

// ============================================
// Language Type
// ============================================

export type Language = 'fr' | 'ar';

// ============================================
// Export Types
// ============================================

export type {
  ModuleCategory,
  ModuleStatus,
  SubscriptionStatus,
  SubscriptionPlan,
  ModuleFeature,
  ModuleConfig,
  Module,
  ModuleUsage,
  ModuleSubscription,
  UserModules,
  ModulePermission,
  TeamMemberModuleAccess,
  ModuleLoaderState,
  ModuleRegistryEntry,
  ModuleRoute,
  ModuleApiEndpoint,
  ModuleEventType,
  ModuleEvent,
  ModuleAnalytics,
  PlanConfig,
};
