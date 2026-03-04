/**
 * Security Module Index
 * Central export for all security utilities
 * 
 * @module lib/security
 */

// Network Security (PCI DSS 1.x)
export { NetworkSecurity, FIREWALL_CONFIG, SECURITY_HEADERS } from './network-security'
export type { SecurityCheckResult } from './network-security'

// Data Protection (PCI DSS 3.x)
export { 
  DataProtection, 
  DataClassification,
  DATA_CLASSIFICATION_RULES,
  maskPAN,
  maskEmail,
  maskPhone,
  maskICE,
  encryptData,
  decryptData,
  tokenize,
  detokenize,
  shouldEncrypt,
  canStore,
} from './data-protection'
export type { EncryptedData, DataClassificationRule } from './data-protection'

// Access Control (PCI DSS 7.x, 8.x)
export {
  AccessControl,
  Role,
  Permission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  createSession,
  validateSession,
  removeSession,
  removeAllSessions,
  generateMFACode,
  storeMFACode,
  verifyMFACode,
  validatePassword,
  DEFAULT_PASSWORD_POLICY,
  DEFAULT_SESSION_CONFIG,
} from './access-control'
export type { SessionConfig, PasswordPolicy } from './access-control'

// Audit Logging (PCI DSS 10.x)
export {
  AuditLogging,
  AuditEventType,
  logAuditEvent,
  getRecentLogs,
  getLogsByUser,
  getLogsByType,
  generateDailyReviewSummary,
  exportLogs,
  LOG_RETENTION_POLICY,
} from './audit-logging'
export type { AuditLogEntry, LogReviewSummary } from './audit-logging'

// Vulnerability Management (PCI DSS 6.x, 11.x)
export {
  VulnerabilityManagement,
  VulnerabilitySeverity,
  VulnerabilityStatus,
  SCAN_SCHEDULE,
  REMEDIATION_SLA,
  addVulnerability,
  updateVulnerabilityStatus,
  getVulnerability,
  getOpenVulnerabilities,
  getOverdueVulnerabilities,
  calculateSecurityMetrics,
} from './vulnerability-management'
export type { Vulnerability, SecurityMetrics, DependencyVulnerability } from './vulnerability-management'

// Re-export from original security.ts
export {
  SecurityUtils,
  generateSecureId,
  generateSecureToken,
  generateApiKey,
  hashValue,
  hashApiKey,
  verifyApiKey,
  encrypt,
  decrypt,
  sanitizeInput,
  isValidEmail,
  isValidICE,
  isValidMoroccanPhone,
  isValidAmount,
  isValidCurrency,
  escapeSql,
  generateCsrfToken,
  verifyCsrfToken,
  rateLimit,
  createAuditLog,
  validatePasswordStrength,
  generateSessionToken,
  getSessionExpiry,
} from '../security'

// Combined security check for requests
export { detectAttacks, checkIPAllowed, checkOriginAllowed } from './network-security'
