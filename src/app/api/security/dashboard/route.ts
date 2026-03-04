/**
 * Security Dashboard API
 * Provides security metrics and compliance status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Mock metrics for demonstration
// In production, these would be calculated from actual data

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role
    const userRole = (session.user as any).role
    if (!['admin', 'superadmin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      security: {
        vulnerabilities: {
          total: 3,
          critical: 0,
          high: 1,
          medium: 2,
          low: 0,
          overdue: 0,
          avgRemediationDays: 12,
        },
        audit: {
          totalEvents: 1234,
          failedLogins: 5,
          successfulLogins: 89,
          uniqueUsers: 12,
          uniqueIPs: 24,
          highSeverityEvents: 2,
          criticalEvents: 0,
          anomalies: [],
        },
      },
      compliance: {
        overall: 'partial',
        score: 85,
        categories: {
          network: { score: 95, status: 'compliant', issues: [] },
          dataProtection: { score: 90, status: 'compliant', issues: [] },
          accessControl: { score: 85, status: 'compliant', issues: [] },
          monitoring: { score: 80, status: 'partial', issues: ['Add centralized SIEM'] },
          vulnerability: { score: 90, status: 'compliant', issues: [] },
          policies: { score: 70, status: 'partial', issues: ['Complete documentation'] },
        },
      },
      recommendations: [
        'Complete security policy documentation',
        'Implement centralized SIEM logging',
        'Schedule quarterly security awareness training',
      ],
    })
  } catch (error) {
    console.error('Security dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve security metrics' },
      { status: 500 }
    )
  }
}
