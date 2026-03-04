/**
 * Network Security Module
 * PCI DSS Requirements 1.x - Build and Maintain a Secure Network
 * 
 * @module lib/security/network-security
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server'

// ============================================
// Firewall Configuration Documentation
// ============================================

/**
 * Firewall Rules Configuration
 * 
 * PCI DSS 1.1 - Firewall configuration standards
 * 
 * Inbound Rules:
 * | Port | Protocol | Source | Destination | Action | Description |
 * |------|----------|--------|-------------|--------|-------------|
 * | 443  | HTTPS    | Any    | Web Server  | ALLOW  | Production HTTPS |
 * | 80   | HTTP     | Any    | Web Server  | REDIRECT | Redirect to HTTPS |
 * 
 * Outbound Rules:
 * | Port | Protocol | Destination | Action | Description |
 * |------|----------|-------------|--------|-------------|
 * | 443  | HTTPS    | Any         | ALLOW  | API calls, webhooks |
 * | 5432 | PostgreSQL | Database | ALLOW  | Database connections |
 * 
 * Denied by Default:
 * - All other inbound traffic
 * - Direct database access from internet
 * - SSH from unauthorized IPs
 */

export const FIREWALL_CONFIG = {
  // Allowed origins for CORS
  allowedOrigins: [
    'https://epaiement.ma',
    'https://www.epaiement.ma',
    'https://api.epaiement.ma',
    process.env.NEXTAUTH_URL,
  ].filter(Boolean),
  
  // Blocked IP ranges (example - should be configured per environment)
  blockedIPRanges: [
    // Add known malicious IP ranges
  ],
  
  // Rate limiting thresholds
  rateLimits: {
    global: { requests: 1000, windowMs: 60000 },      // 1000 req/min globally
    api: { requests: 100, windowMs: 60000 },          // 100 req/min per IP for API
    auth: { requests: 5, windowMs: 300000 },          // 5 attempts per 5 min for auth
    payment: { requests: 10, windowMs: 60000 },       // 10 req/min for payment endpoints
  },
  
  // Session timeouts (PCI DSS 8.1.8)
  sessionTimeouts: {
    inactive: 15 * 60 * 1000,     // 15 minutes inactivity
    absolute: 8 * 60 * 60 * 1000, // 8 hours absolute max
  }
}

// ============================================
// Network Security Middleware
// ============================================

interface SecurityCheckResult {
  allowed: boolean
  reason?: string
  headers?: Record<string, string>
}

/**
 * Check if request IP is allowed
 */
export function checkIPAllowed(request: NextRequest): SecurityCheckResult {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = forwardedFor?.split(',')[0].trim() || realIP || 'unknown'
  
  // Check against blocked ranges
  for (const range of FIREWALL_CONFIG.blockedIPRanges) {
    if (isIPInRange(clientIP, range)) {
      return {
        allowed: false,
        reason: `IP ${clientIP} is in blocked range`
      }
    }
  }
  
  return { allowed: true }
}

/**
 * Check if origin is allowed (CORS)
 */
export function checkOriginAllowed(request: NextRequest): SecurityCheckResult {
  const origin = request.headers.get('origin')
  
  // Allow same-origin requests
  if (!origin) {
    return { allowed: true }
  }
  
  const isAllowed = FIREWALL_CONFIG.allowedOrigins.some(allowed => {
    if (allowed instanceof RegExp) {
      return allowed.test(origin)
    }
    return allowed === origin
  })
  
  if (!isAllowed) {
    return {
      allowed: false,
      reason: `Origin ${origin} not allowed`
    }
  }
  
  return {
    allowed: true,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
      'Access-Control-Max-Age': '86400',
    }
  }
}

/**
 * Check if request is a potential attack
 */
export function detectAttacks(request: NextRequest): SecurityCheckResult {
  const url = request.nextUrl.pathname + request.nextUrl.search
  const userAgent = request.headers.get('user-agent') || ''
  
  // SQL Injection patterns
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
  ]
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(url)) {
      return {
        allowed: false,
        reason: 'Potential SQL injection detected'
      }
    }
  }
  
  // XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ]
  
  for (const pattern of xssPatterns) {
    if (pattern.test(url) || pattern.test(userAgent)) {
      return {
        allowed: false,
        reason: 'Potential XSS attack detected'
      }
    }
  }
  
  // Path traversal
  if (url.includes('../') || url.includes('..\\')) {
    return {
      allowed: false,
      reason: 'Path traversal attempt detected'
    }
  }
  
  // Command injection
  const cmdPatterns = [
    /[;&|`$]/,
    /\$\(.*\)/,
    /\|.*\|/,
  ]
  
  for (const pattern of cmdPatterns) {
    if (pattern.test(url)) {
      return {
        allowed: false,
        reason: 'Potential command injection detected'
      }
    }
  }
  
  return { allowed: true }
}

/**
 * IP range check helper
 */
function isIPInRange(ip: string, range: string): boolean {
  // Simple implementation - for production, use a proper IP library
  if (range.includes('/')) {
    // CIDR notation - simplified check
    const [network, bits] = range.split('/')
    const networkParts = network.split('.').map(Number)
    const ipParts = ip.split('.').map(Number)
    
    if (networkParts.length !== 4 || ipParts.length !== 4) return false
    
    const mask = ~(2 ** (32 - parseInt(bits)) - 1) >>> 0
    
    const networkInt = (networkParts[0] << 24) + (networkParts[1] << 16) + 
                       (networkParts[2] << 8) + networkParts[3]
    const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + 
                  (ipParts[2] << 8) + ipParts[3]
    
    return (networkInt & mask) === (ipInt & mask)
  }
  
  return ip === range
}

// ============================================
// Connection Security Headers
// ============================================

export const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // HTTPS enforcement
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
  ].join(', '),
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
}

// ============================================
// Export Network Security Utilities
// ============================================

export const NetworkSecurity = {
  FIREWALL_CONFIG,
  checkIPAllowed,
  checkOriginAllowed,
  detectAttacks,
  SECURITY_HEADERS,
}

export default NetworkSecurity
