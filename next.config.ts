import type { NextConfig } from "next";

// Security headers configuration
const securityHeaders = [
  // Prevent DNS prefetching
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // HTTPS enforcement
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // XSS Protection
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Referrer policy
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  // Permissions policy
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      connect-src 'self' https:;
      frame-ancestors 'self';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  // Enable security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  // Powered-by header removal
  poweredByHeader: false,
};

export default nextConfig;
