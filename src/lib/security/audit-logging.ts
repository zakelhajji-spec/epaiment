/**
 * Monitoring & Logging Module
 * PCI DSS Requirements 10.x - Track and Monitor All Access
 * 
 * @module lib/security/audit-logging
 * @version 1.0.0
 */

import { randomBytes } from 'crypto'

// ============================================
// Audit Event Types
// ============================================

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  SESSION_EXPIRED = 'auth.session.expired',
  MFA_ENABLED = 'auth.mfa.enabled',
  MFA_VERIFIED = 'auth.mfa.verified',
  MFA_FAILED = 'auth.mfa.failed',
  PASSWORD_CHANGED = 'auth.password.changed',
  PASSWORD_RESET = 'auth.password.reset',
  
  // User management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  ROLE_CHANGED = 'user.role.changed',
  ACCESS_GRANTED = 'user.access.granted',
  ACCESS_REVOKED = 'user.access.revoked',
  
  // Data access
  DATA_READ = 'data.read',
  DATA_CREATE = 'data.create',
  DATA_UPDATE = 'data.update',
  DATA_DELETE = 'data.delete',
  DATA_EXPORT = 'data.export',
  
  // Invoice events
  INVOICE_CREATED = 'invoice.created',
  INVOICE_SENT = 'invoice.sent',
  INVOICE_PAID = 'invoice.paid',
  INVOICE_CANCELLED = 'invoice.cancelled',
  
  // Payment events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUND = 'payment.refund',
  
  // Security events
  SECURITY_ALERT = 'security.alert',
  SUSPICIOUS_ACTIVITY = 'security.suspicious',
  RATE_LIMIT_EXCEEDED = 'security.rate_limit',
  BLOCKED_IP = 'security.blocked_ip',
  
  // System events
  SYSTEM_START = 'system.start',
  SYSTEM_STOP = 'system.stop',
  CONFIG_CHANGE = 'system.config.change',
  BACKUP_CREATED = 'system.backup.created',
  
  // Admin events
  ADMIN_ACCESS = 'admin.access',
  SETTINGS_CHANGE = 'admin.settings.change',
}

// ============================================
// Audit Log Entry
// ============================================

export interface AuditLogEntry {
  id: string
  timestamp: string
  type: AuditEventType
  
  // Actor
  userId?: string
  userEmail?: string
  userRole?: string
  
  // Context
  ipAddress: string
  userAgent: string
  sessionId?: string
  
  // Resource
  resource: string
  resourceId?: string
  action: string
  
  // Details
  status: 'success' | 'failure' | 'warning'
  details?: Record<string, unknown>
  
  // Changes (for audit trail)
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  
  // Severity for alerting
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  // Retention category
  retentionCategory: 'standard' | 'extended' | 'permanent'
}

// ============================================
// Log Retention Policy (PCI DSS 10.7)
// ============================================

export const LOG_RETENTION_POLICY = {
  // Standard retention: 1 year (minimum for PCI DSS)
  standard: {
    days: 365,
    description: 'Standard operational logs',
    types: [
      AuditEventType.DATA_READ,
      AuditEventType.INVOICE_CREATED,
      AuditEventType.PAYMENT_INITIATED,
    ]
  },
  
  // Extended retention: 3 years
  extended: {
    days: 1095,
    description: 'Security and compliance logs',
    types: [
      AuditEventType.LOGIN_SUCCESS,
      AuditEventType.LOGIN_FAILURE,
      AuditEventType.MFA_VERIFIED,
      AuditEventType.MFA_FAILED,
      AuditEventType.USER_CREATED,
      AuditEventType.USER_DELETED,
      AuditEventType.ROLE_CHANGED,
      AuditEventType.ACCESS_GRANTED,
      AuditEventType.ACCESS_REVOKED,
      AuditEventType.DATA_DELETE,
      AuditEventType.DATA_EXPORT,
      AuditEventType.SECURITY_ALERT,
      AuditEventType.SUSPICIOUS_ACTIVITY,
    ]
  },
  
  // Permanent retention: Indefinite
  permanent: {
    days: -1, // Never delete
    description: 'Critical security events',
    types: [
      AuditEventType.PAYMENT_SUCCESS,
      AuditEventType.PAYMENT_REFUND,
      AuditEventType.ADMIN_ACCESS,
      AuditEventType.SETTINGS_CHANGE,
      AuditEventType.SYSTEM_START,
      AuditEventType.SYSTEM_STOP,
    ]
  }
}

// ============================================
// Severity Classification
// ============================================

const SEVERITY_MAP: Partial<Record<AuditEventType, 'low' | 'medium' | 'high' | 'critical'>> = {
  // Critical
  [AuditEventType.PAYMENT_SUCCESS]: 'critical',
  [AuditEventType.PAYMENT_REFUND]: 'critical',
  [AuditEventType.SECURITY_ALERT]: 'critical',
  
  // High
  [AuditEventType.LOGIN_FAILURE]: 'high',
  [AuditEventType.MFA_FAILED]: 'high',
  [AuditEventType.USER_DELETED]: 'high',
  [AuditEventType.ROLE_CHANGED]: 'high',
  [AuditEventType.SUSPICIOUS_ACTIVITY]: 'high',
  [AuditEventType.DATA_DELETE]: 'high',
  [AuditEventType.DATA_EXPORT]: 'high',
  
  // Medium
  [AuditEventType.LOGIN_SUCCESS]: 'medium',
  [AuditEventType.MFA_VERIFIED]: 'medium',
  [AuditEventType.USER_CREATED]: 'medium',
  [AuditEventType.ACCESS_GRANTED]: 'medium',
  [AuditEventType.ACCESS_REVOKED]: 'medium',
  [AuditEventType.ADMIN_ACCESS]: 'medium',
  [AuditEventType.SETTINGS_CHANGE]: 'medium',
  [AuditEventType.RATE_LIMIT_EXCEEDED]: 'medium',
  
  // Low (default)
  [AuditEventType.DATA_READ]: 'low',
  [AuditEventType.INVOICE_CREATED]: 'low',
}

/**
 * Get severity for event type
 */
function getSeverity(type: AuditEventType): 'low' | 'medium' | 'high' | 'critical' {
  return SEVERITY_MAP[type] || 'low'
}

/**
 * Get retention category for event type
 */
function getRetentionCategory(type: AuditEventType): 'standard' | 'extended' | 'permanent' {
  if (LOG_RETENTION_POLICY.permanent.types.includes(type)) return 'permanent'
  if (LOG_RETENTION_POLICY.extended.types.includes(type)) return 'extended'
  return 'standard'
}

// ============================================
// Audit Logger
// ============================================

// In-memory buffer (for development)
const logBuffer: AuditLogEntry[] = []
const MAX_BUFFER_SIZE = 1000

/**
 * Log an audit event
 */
export function logAuditEvent(params: {
  type: AuditEventType
  userId?: string
  userEmail?: string
  userRole?: string
  ipAddress: string
  userAgent: string
  sessionId?: string
  resource: string
  resourceId?: string
  action: string
  status: 'success' | 'failure' | 'warning'
  details?: Record<string, unknown>
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: randomBytes(16).toString('base64url'),
    timestamp: new Date().toISOString(),
    type: params.type,
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    sessionId: params.sessionId,
    resource: params.resource,
    resourceId: params.resourceId,
    action: params.action,
    status: params.status,
    details: params.details,
    oldValues: params.oldValues,
    newValues: params.newValues,
    severity: getSeverity(params.type),
    retentionCategory: getRetentionCategory(params.type),
  }
  
  // Add to buffer
  logBuffer.push(entry)
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift()
  }
  
  // Console output (development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(entry))
  }
  
  // In production: send to SIEM, database, or logging service
  // await sendToSIEM(entry)
  // await saveToDatabase(entry)
  
  // Check for alerts
  checkForAlerts(entry)
  
  return entry
}

/**
 * Get recent logs
 */
export function getRecentLogs(count: number = 100): AuditLogEntry[] {
  return logBuffer.slice(-count)
}

/**
 * Get logs by user
 */
export function getLogsByUser(userId: string): AuditLogEntry[] {
  return logBuffer.filter(log => log.userId === userId)
}

/**
 * Get logs by type
 */
export function getLogsByType(type: AuditEventType): AuditLogEntry[] {
  return logBuffer.filter(log => log.type === type)
}

/**
 * Get logs by severity
 */
export function getLogsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): AuditLogEntry[] {
  return logBuffer.filter(log => log.severity === severity)
}

// ============================================
// Alerting
// ============================================

interface AlertRule {
  name: string
  condition: (entries: AuditLogEntry[]) => boolean
  severity: 'medium' | 'high' | 'critical'
  cooldown: number // minutes
  lastTriggered?: Date
}

const ALERT_RULES: AlertRule[] = [
  {
    name: 'Multiple failed logins',
    condition: (entries) => {
      const recent = entries.filter(e => 
        e.type === AuditEventType.LOGIN_FAILURE &&
        Date.now() - new Date(e.timestamp).getTime() < 5 * 60 * 1000
      )
      return recent.length >= 5
    },
    severity: 'high',
    cooldown: 15,
  },
  {
    name: 'Suspicious activity detected',
    condition: (entries) => {
      return entries.some(e => e.type === AuditEventType.SUSPICIOUS_ACTIVITY)
    },
    severity: 'high',
    cooldown: 5,
  },
  {
    name: 'Rate limit exceeded',
    condition: (entries) => {
      const recent = entries.filter(e => 
        e.type === AuditEventType.RATE_LIMIT_EXCEEDED &&
        Date.now() - new Date(e.timestamp).getTime() < 10 * 60 * 1000
      )
      return recent.length >= 3
    },
    severity: 'medium',
    cooldown: 30,
  },
  {
    name: 'Admin action outside hours',
    condition: (entries) => {
      return entries.some(e => {
        if (e.type !== AuditEventType.ADMIN_ACCESS) return false
        const hour = new Date(e.timestamp).getHours()
        return hour < 6 || hour > 22 // Outside 6am-10pm
      })
    },
    severity: 'medium',
    cooldown: 60,
  },
]

/**
 * Check for alert conditions
 */
function checkForAlerts(entry: AuditLogEntry): void {
  for (const rule of ALERT_RULES) {
    // Check cooldown
    if (rule.lastTriggered) {
      const cooldownMs = rule.cooldown * 60 * 1000
      if (Date.now() - rule.lastTriggered.getTime() < cooldownMs) {
        continue
      }
    }
    
    // Check condition
    if (rule.condition(logBuffer)) {
      triggerAlert(rule, entry)
      rule.lastTriggered = new Date()
    }
  }
}

/**
 * Trigger an alert
 */
function triggerAlert(rule: AlertRule, triggeringEntry: AuditLogEntry): void {
  const alert = {
    name: rule.name,
    severity: rule.severity,
    timestamp: new Date().toISOString(),
    triggeringEntry,
  }
  
  console.warn('[SECURITY ALERT]', JSON.stringify(alert))
  
  // In production: send notification
  // await sendSlackAlert(alert)
  // await sendEmailAlert(alert)
  // await createIncident(alert)
}

// ============================================
// Log Review Helpers (PCI DSS 10.6)
// ============================================

export interface LogReviewSummary {
  totalEvents: number
  failedLogins: number
  successfulLogins: number
  uniqueUsers: Set<string>
  uniqueIPs: Set<string>
  highSeverityEvents: number
  criticalEvents: number
  anomalies: string[]
}

/**
 * Generate daily review summary
 */
export function generateDailyReviewSummary(): LogReviewSummary {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const recentLogs = logBuffer.filter(e => 
    new Date(e.timestamp).getTime() > oneDayAgo
  )
  
  const summary: LogReviewSummary = {
    totalEvents: recentLogs.length,
    failedLogins: recentLogs.filter(e => e.type === AuditEventType.LOGIN_FAILURE).length,
    successfulLogins: recentLogs.filter(e => e.type === AuditEventType.LOGIN_SUCCESS).length,
    uniqueUsers: new Set(recentLogs.filter(e => e.userId).map(e => e.userId)),
    uniqueIPs: new Set(recentLogs.map(e => e.ipAddress)),
    highSeverityEvents: recentLogs.filter(e => e.severity === 'high').length,
    criticalEvents: recentLogs.filter(e => e.severity === 'critical').length,
    anomalies: [],
  }
  
  // Detect anomalies
  if (summary.failedLogins > 10) {
    summary.anomalies.push(`High number of failed logins: ${summary.failedLogins}`)
  }
  
  if (summary.uniqueIPs.size > 50) {
    summary.anomalies.push(`High number of unique IPs: ${summary.uniqueIPs.size}`)
  }
  
  if (summary.criticalEvents > 0) {
    summary.anomalies.push(`${summary.criticalEvents} critical events detected`)
  }
  
  return summary
}

/**
 * Export logs for compliance
 */
export function exportLogs(startDate: Date, endDate: Date, format: 'json' | 'csv' = 'json'): string {
  const filtered = logBuffer.filter(e => {
    const timestamp = new Date(e.timestamp)
    return timestamp >= startDate && timestamp <= endDate
  })
  
  if (format === 'json') {
    return JSON.stringify(filtered, null, 2)
  }
  
  // CSV format
  const headers = ['timestamp', 'type', 'userId', 'ipAddress', 'resource', 'action', 'status', 'severity']
  const rows = filtered.map(e => [
    e.timestamp,
    e.type,
    e.userId || '',
    e.ipAddress,
    e.resource,
    e.action,
    e.status,
    e.severity
  ])
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

// ============================================
// Export Audit Utilities
// ============================================

export const AuditLogging = {
  AuditEventType,
  logAuditEvent,
  getRecentLogs,
  getLogsByUser,
  getLogsByType,
  getLogsBySeverity,
  generateDailyReviewSummary,
  exportLogs,
  LOG_RETENTION_POLICY,
}

export default AuditLogging
