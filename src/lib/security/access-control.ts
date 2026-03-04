/**
 * Access Control Module
 * PCI DSS Requirements 7.x & 8.x - Implement Strong Access Control Measures
 * 
 * @module lib/security/access-control
 * @version 1.0.0
 */

import { randomBytes, createHash, timingSafeEqual as cryptoTimingSafeEqual } from 'crypto'

// ============================================
// Role-Based Access Control (RBAC)
// ============================================

export enum Role {
  SUPER_ADMIN = 'superadmin',
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant',
  USER = 'user',
  READER = 'reader',
}

export enum Permission {
  // Invoice permissions
  INVOICE_CREATE = 'invoice:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  INVOICE_SEND = 'invoice:send',
  
  // Payment permissions
  PAYMENT_CREATE = 'payment:create',
  PAYMENT_READ = 'payment:read',
  PAYMENT_REFUND = 'payment:refund',
  
  // Client permissions
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',
  
  // Settings permissions
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',
  
  // User management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Audit
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',
  
  // Reports
  REPORT_READ = 'report:read',
  REPORT_EXPORT = 'report:export',
  
  // Admin
  ADMIN_ACCESS = 'admin:access',
  SYSTEM_CONFIG = 'system:config',
}

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: Object.values(Permission), // All permissions
  
  [Role.ADMIN]: [
    Permission.INVOICE_CREATE, Permission.INVOICE_READ, Permission.INVOICE_UPDATE, 
    Permission.INVOICE_DELETE, Permission.INVOICE_SEND,
    Permission.PAYMENT_CREATE, Permission.PAYMENT_READ, Permission.PAYMENT_REFUND,
    Permission.CLIENT_CREATE, Permission.CLIENT_READ, Permission.CLIENT_UPDATE, Permission.CLIENT_DELETE,
    Permission.SETTINGS_READ, Permission.SETTINGS_UPDATE,
    Permission.USER_CREATE, Permission.USER_READ, Permission.USER_UPDATE,
    Permission.AUDIT_READ, Permission.AUDIT_EXPORT,
    Permission.REPORT_READ, Permission.REPORT_EXPORT,
    Permission.ADMIN_ACCESS,
  ],
  
  [Role.ACCOUNTANT]: [
    Permission.INVOICE_CREATE, Permission.INVOICE_READ, Permission.INVOICE_UPDATE, Permission.INVOICE_SEND,
    Permission.PAYMENT_CREATE, Permission.PAYMENT_READ,
    Permission.CLIENT_CREATE, Permission.CLIENT_READ, Permission.CLIENT_UPDATE,
    Permission.REPORT_READ, Permission.REPORT_EXPORT,
    Permission.AUDIT_READ,
  ],
  
  [Role.USER]: [
    Permission.INVOICE_CREATE, Permission.INVOICE_READ, Permission.INVOICE_UPDATE, Permission.INVOICE_SEND,
    Permission.PAYMENT_CREATE, Permission.PAYMENT_READ,
    Permission.CLIENT_CREATE, Permission.CLIENT_READ, Permission.CLIENT_UPDATE,
    Permission.REPORT_READ,
  ],
  
  [Role.READER]: [
    Permission.INVOICE_READ,
    Permission.PAYMENT_READ,
    Permission.CLIENT_READ,
    Permission.REPORT_READ,
  ],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

/**
 * Check if a role has all specified permissions
 */
export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

// ============================================
// Session Management
// ============================================

export interface SessionConfig {
  maxInactiveMinutes: number      // PCI DSS 8.1.8 - 15 minutes
  maxAbsoluteHours: number        // Maximum session length
  maxConcurrentSessions: number   // Limit concurrent sessions
  requireReauth: boolean          // Require re-auth for sensitive ops
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxInactiveMinutes: 15,         // PCI DSS requirement
  maxAbsoluteHours: 8,
  maxConcurrentSessions: 3,
  requireReauth: true,
}

interface Session {
  id: string
  userId: string
  createdAt: Date
  lastActivity: Date
  ipAddress: string
  userAgent: string
  mfaVerified: boolean
}

// In production, store in Redis or database
const activeSessions = new Map<string, Session[]>()

/**
 * Create new session
 */
export function createSession(
  userId: string, 
  ipAddress: string, 
  userAgent: string
): string {
  const sessionId = randomBytes(32).toString('base64url')
  
  const session: Session = {
    id: sessionId,
    userId,
    createdAt: new Date(),
    lastActivity: new Date(),
    ipAddress,
    userAgent,
    mfaVerified: false,
  }
  
  // Get existing sessions for user
  const userSessions = activeSessions.get(userId) || []
  
  // Check concurrent session limit
  if (userSessions.length >= DEFAULT_SESSION_CONFIG.maxConcurrentSessions) {
    // Remove oldest session
    userSessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    userSessions.shift()
  }
  
  userSessions.push(session)
  activeSessions.set(userId, userSessions)
  
  return sessionId
}

/**
 * Validate session
 */
export function validateSession(
  sessionId: string, 
  userId: string
): { valid: boolean; reason?: string; session?: Session } {
  const userSessions = activeSessions.get(userId) || []
  const session = userSessions.find(s => s.id === sessionId)
  
  if (!session) {
    return { valid: false, reason: 'Session not found' }
  }
  
  // Check inactivity timeout (PCI DSS 8.1.8)
  const inactiveMs = Date.now() - session.lastActivity.getTime()
  const maxInactiveMs = DEFAULT_SESSION_CONFIG.maxInactiveMinutes * 60 * 1000
  
  if (inactiveMs > maxInactiveMs) {
    removeSession(sessionId, userId)
    return { valid: false, reason: 'Session expired due to inactivity' }
  }
  
  // Check absolute timeout
  const absoluteMs = Date.now() - session.createdAt.getTime()
  const maxAbsoluteMs = DEFAULT_SESSION_CONFIG.maxAbsoluteHours * 60 * 60 * 1000
  
  if (absoluteMs > maxAbsoluteMs) {
    removeSession(sessionId, userId)
    return { valid: false, reason: 'Session expired' }
  }
  
  // Update last activity
  session.lastActivity = new Date()
  
  return { valid: true, session }
}

/**
 * Remove session
 */
export function removeSession(sessionId: string, userId: string): void {
  const userSessions = activeSessions.get(userId) || []
  const filtered = userSessions.filter(s => s.id !== sessionId)
  
  if (filtered.length === 0) {
    activeSessions.delete(userId)
  } else {
    activeSessions.set(userId, filtered)
  }
}

/**
 * Remove all sessions for user (logout from all devices)
 */
export function removeAllSessions(userId: string): number {
  const sessions = activeSessions.get(userId) || []
  activeSessions.delete(userId)
  return sessions.length
}

/**
 * Get active sessions for user
 */
export function getActiveSessions(userId: string): Session[] {
  return activeSessions.get(userId) || []
}

// ============================================
// Multi-Factor Authentication (MFA)
// ============================================

interface MFAConfig {
  requiredForRoles: Role[]
  requiredForSensitiveOps: boolean
  codeValidityMinutes: number
  maxAttempts: number
}

export const DEFAULT_MFA_CONFIG: MFAConfig = {
  requiredForRoles: [Role.SUPER_ADMIN, Role.ADMIN],
  requiredForSensitiveOps: true,
  codeValidityMinutes: 5,
  maxAttempts: 3,
}

interface MFAAttempt {
  hashedCode: string
  createdAt: Date
  attempts: number
  verified: boolean
}

// In production, store in Redis with TTL
const mfaAttempts = new Map<string, MFAAttempt>()

/**
 * Generate MFA code
 */
export function generateMFACode(): string {
  // Generate 6-digit code
  return randomBytes(3).toString('hex').slice(0, 6).toUpperCase()
}

/**
 * Store MFA code for verification
 */
export function storeMFACode(userId: string, code: string): void {
  const hashedCode = hashCode(code)
  
  mfaAttempts.set(userId, {
    hashedCode,
    createdAt: new Date(),
    attempts: 0,
    verified: false,
  })
}

/**
 * Verify MFA code
 */
export function verifyMFACode(userId: string, code: string): { valid: boolean; reason?: string } {
  const attempt = mfaAttempts.get(userId)
  
  if (!attempt) {
    return { valid: false, reason: 'No MFA code found' }
  }
  
  // Check expiration
  const ageMs = Date.now() - attempt.createdAt.getTime()
  const maxAgeMs = DEFAULT_MFA_CONFIG.codeValidityMinutes * 60 * 1000
  
  if (ageMs > maxAgeMs) {
    mfaAttempts.delete(userId)
    return { valid: false, reason: 'MFA code expired' }
  }
  
  // Check attempts
  if (attempt.attempts >= DEFAULT_MFA_CONFIG.maxAttempts) {
    mfaAttempts.delete(userId)
    return { valid: false, reason: 'Too many attempts' }
  }
  
  // Verify code
  const hashedInput = hashCode(code)
  
  if (timingSafeEqual(attempt.hashedCode, hashedInput)) {
    attempt.verified = true
    mfaAttempts.delete(userId) // Clean up after successful verification
    return { valid: true }
  }
  
  attempt.attempts++
  return { valid: false, reason: 'Invalid code' }
}

/**
 * Hash code for secure storage
 */
function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return cryptoTimingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

// ============================================
// Password Policy (PCI DSS 8.2.3)
// ============================================

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  historyCount: number          // Password history
  maxAgeDays: number           // PCI DSS 8.2.9 - 90 days
  minChangeIntervalHours: number
  lockoutThreshold: number      // PCI DSS 8.1.6 - 6 attempts
  lockoutDurationMinutes: number
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,                 // PCI DSS 8.2.3 - minimum 7, we use 8
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  historyCount: 4,              // Remember last 4 passwords
  maxAgeDays: 90,               // PCI DSS 8.2.9
  minChangeIntervalHours: 24,
  lockoutThreshold: 6,          // PCI DSS 8.1.6
  lockoutDurationMinutes: 30,
}

/**
 * Validate password against policy
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): { valid: boolean; errors: string[]; strength: 'weak' | 'medium' | 'strong' } {
  const errors: string[] = []
  
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`)
  }
  
  if (password.length > policy.maxLength) {
    errors.push(`Password must be less than ${policy.maxLength} characters`)
  }
  
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters')
  }
  
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters')
  }
  
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain numbers')
  }
  
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password)) {
    errors.push('Password must contain special characters')
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  if (errors.length === 0) {
    if (password.length >= 12 && (policy.requireSpecialChars && /[!@#$%^&*(),.?":{}|<>]/.test(password))) {
      strength = 'strong'
    } else {
      strength = 'medium'
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength
  }
}

// ============================================
// Access Review (PCI DSS 7.1.2)
// ============================================

interface AccessReview {
  id: string
  userId: string
  reviewerId: string
  reviewedAt: Date
  changes: {
    roleChanged: boolean
    oldRole?: Role
    newRole?: Role
    permissionsRemoved: Permission[]
    reason: string
  }
  nextReviewDate: Date
}

// In production, store in database
const accessReviews = new Map<string, AccessReview>()

/**
 * Schedule access review
 * PCI DSS 7.1.2 - Review at least every 6 months
 */
export function scheduleAccessReview(userId: string): Date {
  const nextReview = new Date()
  nextReview.setMonth(nextReview.getMonth() + 6) // Every 6 months
  return nextReview
}

/**
 * Record access review
 */
export function recordAccessReview(
  userId: string,
  reviewerId: string,
  changes: AccessReview['changes']
): AccessReview {
  const review: AccessReview = {
    id: randomBytes(16).toString('base64url'),
    userId,
    reviewerId,
    reviewedAt: new Date(),
    changes,
    nextReviewDate: scheduleAccessReview(userId)
  }
  
  accessReviews.set(review.id, review)
  return review
}

// ============================================
// Export Access Control Utilities
// ============================================

export const AccessControl = {
  // RBAC
  Role,
  Permission,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  
  // Session
  createSession,
  validateSession,
  removeSession,
  removeAllSessions,
  getActiveSessions,
  DEFAULT_SESSION_CONFIG,
  
  // MFA
  generateMFACode,
  storeMFACode,
  verifyMFACode,
  DEFAULT_MFA_CONFIG,
  
  // Password
  validatePassword,
  DEFAULT_PASSWORD_POLICY,
  
  // Access Review
  scheduleAccessReview,
  recordAccessReview,
}

export default AccessControl
