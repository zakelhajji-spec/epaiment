/**
 * Security Utilities Module
 * Implements security best practices for Epaiement.ma
 * 
 * @module lib/security
 * @version 1.0.0
 */

import { randomBytes, createHash, createCipheriv, createDecipheriv, scryptSync } from 'crypto'

// ============================================
// Constants
// ============================================

const AES_ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

// ============================================
// Secure ID Generation
// ============================================

/**
 * Generate a cryptographically secure unique identifier
 * @returns UUID v4 formatted string
 */
export function generateSecureId(): string {
  const bytes = randomBytes(16)
  
  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // Variant 1
  
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Generate a secure random token
 * @param length - Number of bytes (default 32)
 * @returns Hex-encoded random string
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Generate API Key with secure prefix
 * @param prefix - Key prefix (default 'ep_live_')
 * @returns Secure API key
 */
export function generateApiKey(prefix: string = 'ep_live_'): string {
  const keyBytes = randomBytes(32)
  const key = keyBytes.toString('base64url')
  return `${prefix}${key}`
}

/**
 * Generate API Key ID (for display purposes only)
 * @param key - Full API key
 * @returns Masked key ID
 */
export function getApiKeyId(key: string): string {
  return `${key.substring(0, 12)}...${key.substring(key.length - 4)}`
}

// ============================================
// Hashing Functions
// ============================================

/**
 * Hash a value using SHA-256
 * @param value - Value to hash
 * @returns Hex-encoded hash
 */
export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

/**
 * Hash API key for storage (never store plain keys)
 * @param key - API key to hash
 * @returns Hashed key
 */
export function hashApiKey(key: string): string {
  const salt = randomBytes(SALT_LENGTH).toString('hex')
  const hash = createHash('sha256')
    .update(`${salt}:${key}`)
    .digest('hex')
  return `${salt}:${hash}`
}

/**
 * Verify API key against stored hash
 * @param key - Plain API key
 * @param storedHash - Stored hash from database
 * @returns Boolean indicating match
 */
export function verifyApiKey(key: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  
  const computedHash = createHash('sha256')
    .update(`${salt}:${key}`)
    .digest('hex')
  
  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(hash, computedHash)
}

/**
 * Timing-safe string comparison
 * @param a - First string
 * @param b - Second string
 * @returns Boolean indicating equality
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// ============================================
// Encryption Functions (AES-256-GCM)
// ============================================

/**
 * Get encryption key from environment
 * @returns Encryption key as Buffer
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  // Derive a 32-byte key from the provided key
  const salt = process.env.ENCRYPTION_SALT || 'epaiement-default-salt'
  return scryptSync(key, salt, 32)
}

/**
 * Encrypt a string value
 * @param plaintext - Value to encrypt
 * @returns Encrypted value (base64 encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  
  const cipher = createCipheriv(AES_ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  // Combine IV, auth tag, and encrypted data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'base64')])
  return combined.toString('base64')
}

/**
 * Decrypt an encrypted string value
 * @param ciphertext - Encrypted value (base64 encoded)
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey()
  
  const combined = Buffer.from(ciphertext, 'base64')
  
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  
  const decipher = createDecipheriv(AES_ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, undefined, 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// ============================================
// Input Validation & Sanitization
// ============================================

/**
 * Sanitize string input to prevent XSS
 * @param input - Raw input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns Boolean indicating validity
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Validate Moroccan ICE number (15 digits)
 * @param ice - ICE number to validate
 * @returns Boolean indicating validity
 */
export function isValidICE(ice: string): boolean {
  return /^\d{15}$/.test(ice)
}

/**
 * Validate password strength with detailed feedback
 * @param password - Password to validate
 * @returns Object with validity, issues, and strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  issues: string[]
  strength: 'weak' | 'medium' | 'strong'
} {
  const issues: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  
  if (password.length < 8) issues.push('Le mot de passe doit contenir au moins 8 caractères')
  if (password.length > 128) issues.push('Le mot de passe doit contenir moins de 128 caractères')
  if (!/[a-z]/.test(password)) issues.push('Le mot de passe doit contenir des lettres minuscules')
  if (!/[A-Z]/.test(password)) issues.push('Le mot de passe doit contenir des lettres majuscules')
  if (!/\d/.test(password)) issues.push('Le mot de passe doit contenir des chiffres')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) issues.push('Le mot de passe doit contenir des caractères spéciaux')
  
  if (issues.length === 0) {
    strength = password.length >= 12 ? 'strong' : 'medium'
  }
  
  return {
    valid: issues.length === 0,
    issues,
    strength
  }
}

/**
 * Validate Moroccan phone number
 * @param phone - Phone number to validate
 * @returns Boolean indicating validity
 */
export function isValidMoroccanPhone(phone: string): boolean {
  // Moroccan phone: +212 or 0 followed by 6, 7 or 5 and 8 digits
  const phoneRegex = /^(\+212|0)[5-7]\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Validate amount (positive number with max 2 decimal places)
 * @param amount - Amount to validate
 * @returns Boolean indicating validity
 */
export function isValidAmount(amount: number): boolean {
  return !isNaN(amount) && amount >= 0 && /^\d+(\.\d{1,2})?$/.test(amount.toString())
}

/**
 * Validate currency code (MAD, EUR, USD)
 * @param currency - Currency code
 * @returns Boolean indicating validity
 */
export function isValidCurrency(currency: string): boolean {
  const validCurrencies = ['MAD', 'EUR', 'USD']
  return validCurrencies.includes(currency.toUpperCase())
}

/**
 * Escape SQL special characters (for additional protection)
 * @param value - Value to escape
 * @returns Escaped value
 */
export function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}

// ============================================
// CSRF Protection
// ============================================

/**
 * Generate CSRF token
 * @returns CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Verify CSRF token
 * @param token - Token from request
 * @param sessionToken - Token from session
 * @returns Boolean indicating validity
 */
export function verifyCsrfToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false
  return timingSafeEqual(token, sessionToken)
}

// ============================================
// Rate Limiting
// ============================================

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const rateLimitStore: RateLimitStore = {}

/**
 * Simple in-memory rate limiter
 * For production, use Redis-backed rate limiting
 * 
 * @param key - Identifier (IP, user ID, etc.)
 * @param maxRequests - Maximum requests per window
 * @param windowMs - Window in milliseconds
 * @returns Object with success flag and remaining requests
 */
export function rateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore[key]
  
  if (!record || now > record.resetTime) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + windowMs
    }
    return { success: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }
  
  if (record.count >= maxRequests) {
    return { success: false, remaining: 0, resetTime: record.resetTime }
  }
  
  record.count++
  return { success: true, remaining: maxRequests - record.count, resetTime: record.resetTime }
}

// ============================================
// Audit Logging
// ============================================

export interface AuditLogEntry {
  id: string
  timestamp: string
  action: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
  status: 'success' | 'failure'
}

/**
 * Create audit log entry
 * @param entry - Audit log data
 */
export function createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const log: AuditLogEntry = {
    id: generateSecureId(),
    timestamp: new Date().toISOString(),
    ...entry
  }
  
  // In production, send to logging service or database
  console.log('[AUDIT]', JSON.stringify(log))
  
  return log
}

// ============================================
// Session Utilities
// ============================================

/**
 * Generate session token
 * @returns Secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(48).toString('base64url')
}

/**
 * Calculate session expiry time
 * @param hours - Hours until expiry (default 24)
 * @returns ISO timestamp
 */
export function getSessionExpiry(hours: number = 24): string {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + hours)
  return expiry.toISOString()
}

// ============================================
// Export all utilities
// ============================================

export const SecurityUtils = {
  // ID Generation
  generateSecureId,
  generateSecureToken,
  generateApiKey,
  getApiKeyId,
  
  // Hashing
  hashValue,
  hashApiKey,
  verifyApiKey,
  
  // Encryption
  encrypt,
  decrypt,
  
  // Validation
  sanitizeInput,
  isValidEmail,
  isValidICE,
  isValidMoroccanPhone,
  isValidAmount,
  isValidCurrency,
  escapeSql,
  
  // CSRF
  generateCsrfToken,
  verifyCsrfToken,
  
  // Rate Limiting
  rateLimit,
  
  // Audit
  createAuditLog,
  
  // Password
  validatePasswordStrength,
  
  // Session
  generateSessionToken,
  getSessionExpiry
}

export default SecurityUtils
