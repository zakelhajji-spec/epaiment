/**
 * Permissions System for Epaiement.ma
 * 
 * Role-Based Access Control (RBAC) for team management.
 * Defines roles, permissions, and access control rules.
 */

// ============================================
// Permission Definitions
// ============================================

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  
  // Invoices
  INVOICES_READ: 'invoices:read',
  INVOICES_WRITE: 'invoices:write',
  INVOICES_DELETE: 'invoices:delete',
  INVOICES_SEND: 'invoices:send',
  
  // Payment Links
  PAYMENT_LINKS_READ: 'payment_links:read',
  PAYMENT_LINKS_WRITE: 'payment_links:write',
  PAYMENT_LINKS_DELETE: 'payment_links:delete',
  
  // Clients
  CLIENTS_READ: 'clients:read',
  CLIENTS_WRITE: 'clients:write',
  CLIENTS_DELETE: 'clients:delete',
  
  // Suppliers
  SUPPLIERS_READ: 'suppliers:read',
  SUPPLIERS_WRITE: 'suppliers:write',
  
  // Quotes
  QUOTES_READ: 'quotes:read',
  QUOTES_WRITE: 'quotes:write',
  QUOTES_CONVERT: 'quotes:convert',
  
  // Expenses
  EXPENSES_READ: 'expenses:read',
  EXPENSES_WRITE: 'expenses:write',
  EXPENSES_DELETE: 'expenses:delete',
  
  // Credit Notes
  CREDIT_NOTES_READ: 'credit_notes:read',
  CREDIT_NOTES_WRITE: 'credit_notes:write',
  
  // Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  REPORTS_TVA: 'reports:tva',
  
  // Products
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  PRODUCTS_DELETE: 'products:delete',
  
  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  
  // Team
  TEAM_VIEW: 'team:view',
  TEAM_MANAGE: 'team:manage',
  TEAM_INVITE: 'team:invite',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_WRITE: 'settings:write',
  SETTINGS_COMPANY: 'settings:company',
  
  // Integrations
  INTEGRATIONS_VIEW: 'integrations:view',
  INTEGRATIONS_MANAGE: 'integrations:manage',
  API_KEYS_MANAGE: 'api_keys:manage',
  
  // Audit
  AUDIT_VIEW: 'audit:view',
  AUDIT_EXPORT: 'audit:export',
  
  // Admin
  ADMIN_ACCESS: 'admin:access',
  ADMIN_USERS: 'admin:users',
  ADMIN_BILLING: 'admin:billing',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// ============================================
// Role Definitions
// ============================================

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // Owner - Full access
  owner: Object.values(PERMISSIONS),
  
  // Admin - Almost full access, no admin panel
  admin: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.INVOICES_READ,
    PERMISSIONS.INVOICES_WRITE,
    PERMISSIONS.INVOICES_DELETE,
    PERMISSIONS.INVOICES_SEND,
    PERMISSIONS.PAYMENT_LINKS_READ,
    PERMISSIONS.PAYMENT_LINKS_WRITE,
    PERMISSIONS.PAYMENT_LINKS_DELETE,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_WRITE,
    PERMISSIONS.CLIENTS_DELETE,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.SUPPLIERS_WRITE,
    PERMISSIONS.QUOTES_READ,
    PERMISSIONS.QUOTES_WRITE,
    PERMISSIONS.QUOTES_CONVERT,
    PERMISSIONS.EXPENSES_READ,
    PERMISSIONS.EXPENSES_WRITE,
    PERMISSIONS.EXPENSES_DELETE,
    PERMISSIONS.CREDIT_NOTES_READ,
    PERMISSIONS.CREDIT_NOTES_WRITE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.REPORTS_TVA,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.TEAM_VIEW,
    PERMISSIONS.TEAM_INVITE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_WRITE,
    PERMISSIONS.INTEGRATIONS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
  ],
  
  // Accountant - Financial operations
  accountant: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.INVOICES_READ,
    PERMISSIONS.INVOICES_WRITE,
    PERMISSIONS.INVOICES_SEND,
    PERMISSIONS.PAYMENT_LINKS_READ,
    PERMISSIONS.PAYMENT_LINKS_WRITE,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_WRITE,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.SUPPLIERS_WRITE,
    PERMISSIONS.QUOTES_READ,
    PERMISSIONS.QUOTES_WRITE,
    PERMISSIONS.EXPENSES_READ,
    PERMISSIONS.EXPENSES_WRITE,
    PERMISSIONS.CREDIT_NOTES_READ,
    PERMISSIONS.CREDIT_NOTES_WRITE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.REPORTS_TVA,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  
  // Sales - Sales operations
  sales: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.INVOICES_READ,
    PERMISSIONS.INVOICES_WRITE,
    PERMISSIONS.INVOICES_SEND,
    PERMISSIONS.PAYMENT_LINKS_READ,
    PERMISSIONS.PAYMENT_LINKS_WRITE,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.CLIENTS_WRITE,
    PERMISSIONS.QUOTES_READ,
    PERMISSIONS.QUOTES_WRITE,
    PERMISSIONS.QUOTES_CONVERT,
    PERMISSIONS.PRODUCTS_READ,
  ],
  
  // Viewer - Read-only
  viewer: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.INVOICES_READ,
    PERMISSIONS.PAYMENT_LINKS_READ,
    PERMISSIONS.CLIENTS_READ,
    PERMISSIONS.SUPPLIERS_READ,
    PERMISSIONS.QUOTES_READ,
    PERMISSIONS.REPORTS_VIEW,
  ],
}

export type Role = keyof typeof ROLE_PERMISSIONS

// ============================================
// Permission Checking Functions
// ============================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  return permissions.includes(permission)
}

/**
 * Check if a role has all specified permissions
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

/**
 * Check if a role has at least one of the specified permissions
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Get all available roles
 */
export function getAvailableRoles(): { id: Role; name: string; description: string }[] {
  return [
    { id: 'owner', name: 'Propriétaire', description: 'Accès complet à toutes les fonctionnalités' },
    { id: 'admin', name: 'Administrateur', description: 'Gestion complète de l\'entreprise' },
    { id: 'accountant', name: 'Comptable', description: 'Opérations financières et facturation' },
    { id: 'sales', name: 'Commercial', description: 'Ventes, devis et relations clients' },
    { id: 'viewer', name: 'Lecteur', description: 'Consultation uniquement' },
  ]
}

// ============================================
// Resource-Based Permissions
// ============================================

export const RESOURCE_PERMISSIONS: Record<string, { read: Permission; write: Permission; delete?: Permission }> = {
  invoices: {
    read: PERMISSIONS.INVOICES_READ,
    write: PERMISSIONS.INVOICES_WRITE,
    delete: PERMISSIONS.INVOICES_DELETE,
  },
  payment_links: {
    read: PERMISSIONS.PAYMENT_LINKS_READ,
    write: PERMISSIONS.PAYMENT_LINKS_WRITE,
    delete: PERMISSIONS.PAYMENT_LINKS_DELETE,
  },
  clients: {
    read: PERMISSIONS.CLIENTS_READ,
    write: PERMISSIONS.CLIENTS_WRITE,
    delete: PERMISSIONS.CLIENTS_DELETE,
  },
  suppliers: {
    read: PERMISSIONS.SUPPLIERS_READ,
    write: PERMISSIONS.SUPPLIERS_WRITE,
  },
  quotes: {
    read: PERMISSIONS.QUOTES_READ,
    write: PERMISSIONS.QUOTES_WRITE,
  },
  expenses: {
    read: PERMISSIONS.EXPENSES_READ,
    write: PERMISSIONS.EXPENSES_WRITE,
    delete: PERMISSIONS.EXPENSES_DELETE,
  },
  products: {
    read: PERMISSIONS.PRODUCTS_READ,
    write: PERMISSIONS.PRODUCTS_WRITE,
    delete: PERMISSIONS.PRODUCTS_DELETE,
  },
  reports: {
    read: PERMISSIONS.REPORTS_VIEW,
    write: PERMISSIONS.REPORTS_EXPORT,
  },
}

/**
 * Check if user can access a resource
 */
export function canAccessResource(
  role: string,
  resource: string,
  action: 'read' | 'write' | 'delete'
): boolean {
  const resourcePerms = RESOURCE_PERMISSIONS[resource]
  if (!resourcePerms) return false
  
  const permission = resourcePerms[action]
  if (!permission) return false
  
  return hasPermission(role, permission)
}

// ============================================
// Export Default
// ============================================

const PermissionsService = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  RESOURCE_PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissionsForRole,
  getAvailableRoles,
  canAccessResource,
}

export default PermissionsService
