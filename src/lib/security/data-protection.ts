/**
 * Data Protection Module
 * PCI DSS Requirements 3.x - Protect Stored Cardholder Data
 * 
 * @module lib/security/data-protection
 * @version 1.0.0
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, pbkdf2Sync } from 'crypto'

// ============================================
// Encryption Configuration
// ============================================

const AES_ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32
const KEY_LENGTH = 32

// ============================================
// Key Management
// ============================================

interface KeyInfo {
  id: string
  createdAt: Date
  version: number
  status: 'active' | 'deprecated' | 'retired'
}

// In production, store key metadata in database
const keyRegistry: Map<string, KeyInfo> = new Map()

/**
 * Get current encryption key
 * Implements key rotation support (PCI DSS 3.6)
 */
function getEncryptionKey(keyId?: string): { key: Buffer; keyInfo: KeyInfo } {
  const currentKeyId = keyId || process.env.CURRENT_KEY_ID || 'default'
  
  // Get key from environment or key management service
  const keyEnvVar = `ENCRYPTION_KEY_${currentKeyId.toUpperCase()}`
  let keyMaterial = process.env[keyEnvVar] || process.env.ENCRYPTION_KEY
  
  if (!keyMaterial) {
    throw new Error('Encryption key not configured')
  }
  
  // Derive key using PBKDF2 (more secure than scrypt for key derivation)
  const salt = process.env.ENCRYPTION_SALT || 'epaiement-key-derivation-salt'
  const key = pbkdf2Sync(keyMaterial, salt, 100000, KEY_LENGTH, 'sha256')
  
  // Track key usage
  let keyInfo = keyRegistry.get(currentKeyId)
  if (!keyInfo) {
    keyInfo = {
      id: currentKeyId,
      createdAt: new Date(),
      version: 1,
      status: 'active'
    }
    keyRegistry.set(currentKeyId, keyInfo)
  }
  
  return { key, keyInfo }
}

/**
 * Rotate encryption key
 * PCI DSS 3.6.4 - Key retirement and replacement
 */
export async function rotateEncryptionKey(newKeyId: string): Promise<void> {
  const oldKeyId = process.env.CURRENT_KEY_ID || 'default'
  
  // Mark old key as deprecated
  const oldKeyInfo = keyRegistry.get(oldKeyId)
  if (oldKeyInfo) {
    oldKeyInfo.status = 'deprecated'
  }
  
  // Create new key entry
  keyRegistry.set(newKeyId, {
    id: newKeyId,
    createdAt: new Date(),
    version: (oldKeyInfo?.version || 0) + 1,
    status: 'active'
  })
  
  console.log(`[SECURITY] Key rotation: ${oldKeyId} -> ${newKeyId}`)
}

// ============================================
// Data Encryption
// ============================================

interface EncryptedData {
  ciphertext: string
  keyId: string
  iv: string
  authTag: string
  version: number
}

/**
 * Encrypt sensitive data
 * PCI DSS 3.4 - Render cardholder data unreadable
 */
export function encryptData(plaintext: string, keyId?: string): EncryptedData {
  const { key, keyInfo } = getEncryptionKey(keyId)
  const iv = randomBytes(IV_LENGTH)
  
  const cipher = createCipheriv(AES_ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  return {
    ciphertext: encrypted,
    keyId: keyInfo.id,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    version: keyInfo.version
  }
}

/**
 * Decrypt sensitive data
 * Supports key rotation by trying multiple keys
 */
export function decryptData(encryptedData: EncryptedData): string {
  let keyToUse: Buffer | null = null
  
  // Try to get the key that was used for encryption
  try {
    const { key } = getEncryptionKey(encryptedData.keyId)
    keyToUse = key
  } catch {
    // If specific key not found, try current key (for backward compatibility)
    const { key } = getEncryptionKey()
    keyToUse = key
  }
  
  const iv = Buffer.from(encryptedData.iv, 'base64')
  const authTag = Buffer.from(encryptedData.authTag, 'base64')
  
  const decipher = createDecipheriv(AES_ALGORITHM, keyToUse, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encryptedData.ciphertext, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// ============================================
// Data Masking (PCI DSS 3.3)
// ============================================

/**
 * Mask card number (PAN) - show first 6 and last 4 digits
 */
export function maskPAN(pan: string): string {
  if (!pan || pan.length < 10) return pan
  const first6 = pan.substring(0, 6)
  const last4 = pan.substring(pan.length - 4)
  const masked = '*'.repeat(pan.length - 10)
  return `${first6}${masked}${last4}`
}

/**
 * Mask email - show first 2 chars and domain
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email
  const [localPart, domain] = email.split('@')
  const visibleChars = Math.min(2, localPart.length)
  const masked = '*'.repeat(localPart.length - visibleChars)
  return `${localPart.substring(0, visibleChars)}${masked}@${domain}`
}

/**
 * Mask phone number - show country code and last 4 digits
 */
export function maskPhone(phone: string): string {
  if (!phone) return phone
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length < 6) return phone
  const last4 = cleaned.substring(cleaned.length - 4)
  const masked = '*'.repeat(cleaned.length - 4)
  return `${masked}${last4}`
}

/**
 * Mask ICE number - show first 5 and last 3 digits
 */
export function maskICE(ice: string): string {
  if (!ice || ice.length < 10) return ice
  const first5 = ice.substring(0, 5)
  const last3 = ice.substring(ice.length - 3)
  const masked = '*'.repeat(ice.length - 8)
  return `${first5}${masked}${last3}`
}

// ============================================
// Data Classification
// ============================================

export enum DataClassification {
  PUBLIC = 'public',           // No restrictions
  INTERNAL = 'internal',       // Internal use only
  CONFIDENTIAL = 'confidential', // Business sensitive
  RESTRICTED = 'restricted',   // Cardholder data, PII
}

export interface DataClassificationRule {
  type: string
  classification: DataClassification
  encryption: boolean
  retentionDays: number
  masking?: (value: string) => string
}

export const DATA_CLASSIFICATION_RULES: DataClassificationRule[] = [
  // Cardholder Data (PCI DSS) - NEVER STORE
  { type: 'card_number', classification: DataClassification.RESTRICTED, encryption: true, retentionDays: 0, masking: maskPAN },
  { type: 'cvv', classification: DataClassification.RESTRICTED, encryption: false, retentionDays: 0 }, // NEVER STORE
  { type: 'expiry_date', classification: DataClassification.RESTRICTED, encryption: true, retentionDays: 0 },
  
  // Personal Identifiable Information (PII)
  { type: 'email', classification: DataClassification.CONFIDENTIAL, encryption: true, retentionDays: 2555, masking: maskEmail },
  { type: 'phone', classification: DataClassification.CONFIDENTIAL, encryption: true, retentionDays: 2555, masking: maskPhone },
  { type: 'address', classification: DataClassification.CONFIDENTIAL, encryption: true, retentionDays: 2555 },
  { type: 'ice', classification: DataClassification.CONFIDENTIAL, encryption: true, retentionDays: 2555, masking: maskICE },
  
  // Financial Data
  { type: 'invoice_total', classification: DataClassification.INTERNAL, encryption: false, retentionDays: 2555 },
  { type: 'payment_amount', classification: DataClassification.INTERNAL, encryption: false, retentionDays: 2555 },
  { type: 'bank_account', classification: DataClassification.RESTRICTED, encryption: true, retentionDays: 2555 },
  
  // Business Data
  { type: 'company_name', classification: DataClassification.PUBLIC, encryption: false, retentionDays: -1 },
  { type: 'invoice_number', classification: DataClassification.INTERNAL, encryption: false, retentionDays: 2555 },
  { type: 'reference', classification: DataClassification.INTERNAL, encryption: false, retentionDays: 2555 },
]

/**
 * Get classification rule for data type
 */
export function getDataClassification(dataType: string): DataClassificationRule | undefined {
  return DATA_CLASSIFICATION_RULES.find(rule => rule.type === dataType)
}

/**
 * Check if data should be encrypted
 */
export function shouldEncrypt(dataType: string): boolean {
  const rule = getDataClassification(dataType)
  return rule?.encryption ?? false
}

/**
 * Check if data can be stored
 */
export function canStore(dataType: string): boolean {
  const rule = getDataClassification(dataType)
  // CVV and similar should never be stored
  return rule?.retentionDays !== 0
}

// ============================================
// Tokenization
// ============================================

interface TokenMapping {
  token: string
  encryptedValue: string
  createdAt: Date
  expiresAt?: Date
}

// In production, store in secure database or vault
const tokenStore = new Map<string, TokenMapping>()

/**
 * Tokenize sensitive value
 * PCI DSS 3.4 - Use tokenization to protect data
 */
export function tokenize(value: string, expiresInMs?: number): string {
  // Generate random token
  const token = `tok_${randomBytes(24).toString('base64url')}`
  
  // Encrypt original value
  const encrypted = encryptData(value)
  
  // Store mapping
  tokenStore.set(token, {
    token,
    encryptedValue: JSON.stringify(encrypted),
    createdAt: new Date(),
    expiresAt: expiresInMs ? new Date(Date.now() + expiresInMs) : undefined
  })
  
  return token
}

/**
 * Detokenize - retrieve original value
 */
export function detokenize(token: string): string | null {
  const mapping = tokenStore.get(token)
  
  if (!mapping) {
    return null
  }
  
  // Check expiration
  if (mapping.expiresAt && mapping.expiresAt < new Date()) {
    tokenStore.delete(token)
    return null
  }
  
  const encryptedData: EncryptedData = JSON.parse(mapping.encryptedValue)
  return decryptData(encryptedData)
}

/**
 * Remove token (for one-time use tokens)
 */
export function removeToken(token: string): void {
  tokenStore.delete(token)
}

// ============================================
// Secure Data Deletion
// ============================================

/**
 * Securely delete sensitive data from memory
 */
export function secureMemoryWipe<T extends object>(obj: T): void {
  for (const key of Object.keys(obj)) {
    const value = (obj as Record<string, unknown>)[key]
    if (typeof value === 'string') {
      // Overwrite string memory (best effort in JS)
      (obj as Record<string, unknown>)[key] = '\0'.repeat(value.length)
    }
    delete (obj as Record<string, unknown>)[key]
  }
}

/**
 * Generate secure hash for data integrity
 */
export function generateDataHash(data: string): string {
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Verify data integrity
 */
export function verifyDataHash(data: string, hash: string): boolean {
  const computedHash = generateDataHash(data)
  return computedHash === hash
}

// ============================================
// Backup Encryption
// ============================================

/**
 * Encrypt backup data
 */
export function encryptBackup(data: string): string {
  const backupKey = process.env.BACKUP_ENCRYPTION_KEY
  if (!backupKey) {
    throw new Error('Backup encryption key not configured')
  }
  
  const salt = randomBytes(SALT_LENGTH)
  const key = scryptSync(backupKey, salt, KEY_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  
  const cipher = createCipheriv(AES_ALGORITHM, key, iv)
  
  let encrypted = cipher.update(data, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  // Combine salt, iv, authTag, and encrypted data
  const combined = Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'base64')])
  return combined.toString('base64')
}

/**
 * Decrypt backup data
 */
export function decryptBackup(encryptedBackup: string): string {
  const backupKey = process.env.BACKUP_ENCRYPTION_KEY
  if (!backupKey) {
    throw new Error('Backup encryption key not configured')
  }
  
  const combined = Buffer.from(encryptedBackup, 'base64')
  
  const salt = combined.subarray(0, SALT_LENGTH)
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const authTag = combined.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)
  
  const key = scryptSync(backupKey, salt, KEY_LENGTH)
  
  const decipher = createDecipheriv(AES_ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, undefined, 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// ============================================
// Export Data Protection Utilities
// ============================================

export const DataProtection = {
  // Encryption
  encryptData,
  decryptData,
  rotateEncryptionKey,
  
  // Masking
  maskPAN,
  maskEmail,
  maskPhone,
  maskICE,
  
  // Classification
  DataClassification,
  DATA_CLASSIFICATION_RULES,
  getDataClassification,
  shouldEncrypt,
  canStore,
  
  // Tokenization
  tokenize,
  detokenize,
  removeToken,
  
  // Integrity
  generateDataHash,
  verifyDataHash,
  secureMemoryWipe,
  
  // Backup
  encryptBackup,
  decryptBackup,
}

export default DataProtection
