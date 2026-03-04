/**
 * ICE/IF Validation Service for Morocco
 * 
 * Validates Moroccan company identifiers:
 * - ICE (Identifiant Commun de l'Entreprise) - 15 digits
 * - IF (Identifiant Fiscal) - Tax ID
 * - RC (Registre du Commerce) - Trade Registry
 * 
 * Provides validation and lookup functionality for DGI compliance.
 */

import { z } from 'zod'

// ============================================
// Types
// ============================================

export interface CompanyValidationResult {
  valid: boolean
  ice?: string
  if?: string
  rc?: string
  companyName?: string
  legalForm?: string
  address?: string
  city?: string
  activity?: string
  error?: string
  source?: 'api' | 'local' | 'cache'
}

export interface ICEValidationResult {
  valid: boolean
  ice?: string
  company?: {
    name: string
    legalForm: string
    address: string
    city: string
    activity: string
    status: string
  }
  error?: string
}

export interface IFValidationResult {
  valid: boolean
  if?: string
  company?: {
    name: string
    taxCenter: string
    activity: string
  }
  error?: string
}

// ============================================
// Validation Schemas
// ============================================

export const iceSchema = z.string()
  .length(15, 'ICE doit contenir exactement 15 chiffres')
  .regex(/^\d{15}$/, 'ICE doit contenir uniquement des chiffres')

export const ifSchema = z.string()
  .regex(/^[14]\d{6,9}$/, 'IF invalide (doit commencer par 1 ou 4, suivi de 6-9 chiffres)')

export const rcSchema = z.string()
  .min(5, 'RC trop court')
  .max(20, 'RC trop long')
  .regex(/^[\d\-/\s]+$/, 'RC contient des caractères invalides')

// ============================================
// Local Validation Functions
// ============================================

/**
 * Validate ICE format locally
 * ICE structure: XXXXXXXXXXYYYYY
 * - First 10 digits: Company identifier
 * - Last 5 digits: Check digits
 */
export function validateICEFormat(ice: string): { valid: boolean; error?: string } {
  if (!ice) {
    return { valid: false, error: 'ICE est requis' }
  }
  
  // Remove spaces and dashes
  const cleanIce = ice.replace(/[\s\-]/g, '')
  
  if (!/^\d{15}$/.test(cleanIce)) {
    return { valid: false, error: 'ICE doit contenir exactement 15 chiffres' }
  }
  
  // Luhn algorithm check (optional but recommended)
  if (!luhnCheck(cleanIce)) {
    return { valid: false, error: 'ICE invalide (échec du contrôle de validité)' }
  }
  
  return { valid: true }
}

/**
 * Validate IF format locally
 * IF structure: XYYYYYY
 * - First digit: 1 (personne physique) or 4 (personne morale)
 * - Following digits: Registration number
 */
export function validateIFFormat(ifNumber: string): { valid: boolean; error?: string } {
  if (!ifNumber) {
    return { valid: false, error: 'IF est requis' }
  }
  
  // Remove spaces
  const cleanIf = ifNumber.replace(/\s/g, '')
  
  if (!/^[14]\d{6,9}$/.test(cleanIf)) {
    return { valid: false, error: 'IF invalide (doit commencer par 1 ou 4)' }
  }
  
  return { valid: true }
}

/**
 * Validate RC format locally
 * RC format varies by region but generally alphanumeric
 */
export function validateRCFormat(rc: string): { valid: boolean; error?: string } {
  if (!rc) {
    return { valid: false, error: 'RC est requis' }
  }
  
  // Clean input
  const cleanRc = rc.replace(/\s/g, '')
  
  // RC format: typically numbers with possible slashes/hyphens
  if (cleanRc.length < 5 || cleanRc.length > 20) {
    return { valid: false, error: 'RC doit contenir entre 5 et 20 caractères' }
  }
  
  return { valid: true }
}

// ============================================
// API Validation Functions
// ============================================

/**
 * Validate ICE via ANPME API
 * @see https://www.anpme.ma/
 */
export async function validateICEViaAPI(ice: string): Promise<ICEValidationResult> {
  // First validate format locally
  const formatCheck = validateICEFormat(ice)
  if (!formatCheck.valid) {
    return { valid: false, error: formatCheck.error }
  }
  
  const apiKey = process.env.ANPME_API_KEY
  const apiEndpoint = process.env.ANPME_API_ENDPOINT || 'https://api.anpme.ma/entreprise'
  
  // If no API key, return local validation result
  if (!apiKey) {
    return {
      valid: true,
      ice,
      source: 'local'
    }
  }
  
  try {
    const response = await fetch(`${apiEndpoint}/${ice}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, error: 'ICE non trouvé dans le registre national' }
      }
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      valid: true,
      ice,
      company: {
        name: data.raisonSociale || data.name,
        legalForm: data.formeJuridique || data.legalForm,
        address: data.adresse || data.address,
        city: data.ville || data.city,
        activity: data.activite || data.activity,
        status: data.statut || data.status || 'active'
      },
      source: 'api'
    }
  } catch (error) {
    console.error('[ICE Validation] API error:', error)
    // Fallback to local validation
    return {
      valid: true,
      ice,
      source: 'local'
    }
  }
}

/**
 * Validate IF via DGI API
 */
export async function validateIFViaAPI(ifNumber: string): Promise<IFValidationResult> {
  // First validate format locally
  const formatCheck = validateIFFormat(ifNumber)
  if (!formatCheck.valid) {
    return { valid: false, error: formatCheck.error }
  }
  
  const apiKey = process.env.DGI_API_KEY
  const apiEndpoint = process.env.DGI_API_ENDPOINT || 'https://api.tax.gov.ma/contribuable'
  
  if (!apiKey) {
    return {
      valid: true,
      if: ifNumber,
      source: 'local'
    }
  }
  
  try {
    const response = await fetch(`${apiEndpoint}/${ifNumber}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return { valid: false, error: 'IF non trouvé' }
      }
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      valid: true,
      if: ifNumber,
      company: {
        name: data.raisonSociale || data.name,
        taxCenter: data.centrefiscal || data.taxCenter,
        activity: data.activite || data.activity
      },
      source: 'api'
    }
  } catch (error) {
    console.error('[IF Validation] API error:', error)
    return {
      valid: true,
      if: ifNumber,
      source: 'local'
    }
  }
}

// ============================================
// Combined Validation
// ============================================

/**
 * Validate all company identifiers
 */
export async function validateCompanyIdentifiers(params: {
  ice?: string
  if?: string
  rc?: string
}): Promise<CompanyValidationResult> {
  const results: CompanyValidationResult = { valid: true }
  
  // Validate ICE
  if (params.ice) {
    const iceResult = await validateICEViaAPI(params.ice)
    if (!iceResult.valid) {
      results.valid = false
      results.error = iceResult.error
      return results
    }
    results.ice = params.ice
    if (iceResult.company) {
      results.companyName = iceResult.company.name
      results.legalForm = iceResult.company.legalForm
      results.address = iceResult.company.address
      results.city = iceResult.company.city
    }
    results.source = iceResult.source
  }
  
  // Validate IF
  if (params.if) {
    const ifResult = await validateIFViaAPI(params.if)
    if (!ifResult.valid) {
      results.valid = false
      results.error = ifResult.error
      return results
    }
    results.if = params.if
    results.source = results.source || ifResult.source
  }
  
  // Validate RC (local only)
  if (params.rc) {
    const rcResult = validateRCFormat(params.rc)
    if (!rcResult.valid) {
      results.valid = false
      results.error = rcResult.error
      return results
    }
    results.rc = params.rc
  }
  
  return results
}

// ============================================
// Helper Functions
// ============================================

/**
 * Luhn algorithm for ICE checksum validation
 */
function luhnCheck(number: string): boolean {
  let sum = 0
  let isEven = false
  
  // Loop through values starting from the right
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10)
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * Format ICE for display (XXXXX XXXXX XXXXX)
 */
export function formatICE(ice: string): string {
  const clean = ice.replace(/\D/g, '')
  if (clean.length !== 15) return ice
  return `${clean.slice(0, 5)} ${clean.slice(5, 10)} ${clean.slice(10)}`
}

/**
 * Format IF for display (X YYYYYY)
 */
export function formatIF(ifNumber: string): string {
  const clean = ifNumber.replace(/\s/g, '')
  if (clean.length < 2) return ifNumber
  return `${clean[0]} ${clean.slice(1)}`
}

/**
 * Normalize ICE (remove formatting)
 */
export function normalizeICE(ice: string): string {
  return ice.replace(/\D/g, '')
}

/**
 * Normalize IF (remove formatting)
 */
export function normalizeIF(ifNumber: string): string {
  return ifNumber.replace(/\s/g, '')
}

// ============================================
// Export Default
// ============================================

const ICEValidationService = {
  validateICEFormat,
  validateIFFormat,
  validateRCFormat,
  validateICEViaAPI,
  validateIFViaAPI,
  validateCompanyIdentifiers,
  formatICE,
  formatIF,
  normalizeICE,
  normalizeIF,
  iceSchema,
  ifSchema,
  rcSchema
}

export default ICEValidationService
