/**
 * Security & Authentication Middleware for Epaiement.ma
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Public paths that don't require authentication
const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/pay',  // Payment page for customers
  '/api/auth',
  '/api/public',
  '/api/webhooks',
]

// Static assets to skip
const staticPaths = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/fonts',
]

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path)) ||
         staticPaths.some(path => pathname.startsWith(path))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS - enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }
  
  // Content Security Policy (no unsafe-eval)
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', cspHeader)

  // Skip authentication check for public paths
  if (isPublicPath(pathname)) {
    return response
  }

  // Check authentication for protected paths
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // Redirect to login if not authenticated
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // For pages, redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
