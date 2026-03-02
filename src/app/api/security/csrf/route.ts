/**
 * Secure API Route - CSRF Token
 * Generates and returns a CSRF token for form submissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateCsrfToken } from '@/lib/security'

export async function GET(request: NextRequest) {
  // Generate CSRF token
  const csrfToken = generateCsrfToken()
  
  // Create response with CSRF token
  const response = NextResponse.json({
    success: true,
    csrfToken
  })
  
  // Set CSRF token in HTTP-only cookie for verification
  response.cookies.set('csrf_token', csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600 // 1 hour
  })
  
  return response
}
