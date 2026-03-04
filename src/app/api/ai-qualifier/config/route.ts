/**
 * AI Lead Qualifier API Routes
 * Handles configuration, conversations, and qualification
 */

import { NextRequest, NextResponse } from 'next/server'
import type { GeminiConfig, WhatsAppConfig } from '@/modules/ai-lead-qualifier/types'

// In-memory storage (replace with database in production)
export const geminiConfigs: Map<string, GeminiConfig> = new Map()
export const whatsAppConfigs: Map<string, WhatsAppConfig> = new Map()
export const conversations: Map<string, any> = new Map()

/**
 * GET /api/ai-qualifier/config
 * Get AI Lead Qualifier configuration
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') // 'gemini' | 'whatsapp' | 'all'

  try {
    if (type === 'gemini') {
      const config = Array.from(geminiConfigs.values())[0] || null
      return NextResponse.json({ 
        success: true, 
        config: config ? {
          ...config,
          apiKey: config.apiKey ? '••••••••' + config.apiKey.slice(-4) : ''
        } : null 
      })
    }

    if (type === 'whatsapp') {
      const config = Array.from(whatsAppConfigs.values())[0] || null
      return NextResponse.json({ 
        success: true, 
        config: config ? {
          ...config,
          accessToken: config.accessToken ? '••••••••' + config.accessToken.slice(-4) : '',
          webhookVerifyToken: '••••••••'
        } : null 
      })
    }

    // Return all configs
    const geminiConfig = Array.from(geminiConfigs.values())[0]
    const whatsappConfig = Array.from(whatsAppConfigs.values())[0]
    
    return NextResponse.json({
      success: true,
      gemini: geminiConfig ? {
        ...geminiConfig,
        apiKey: geminiConfig.apiKey ? '••••••••' + geminiConfig.apiKey.slice(-4) : ''
      } : null,
      whatsapp: whatsappConfig ? {
        ...whatsappConfig,
        accessToken: whatsappConfig.accessToken ? '••••••••' + whatsappConfig.accessToken.slice(-4) : '',
        webhookVerifyToken: '••••••••'
      } : null,
      stats: {
        totalConversations: conversations.size,
        activeConversations: Array.from(conversations.values()).filter((c: any) => c.status === 'in_progress').length,
        qualifiedLeads: Array.from(conversations.values()).filter((c: any) => c.qualificationLevel === 'hot' || c.qualificationLevel === 'warm').length,
      }
    })
  } catch (error) {
    console.error('Error getting AI qualifier config:', error)
    return NextResponse.json({ success: false, error: 'Failed to get configuration' }, { status: 500 })
  }
}

/**
 * POST /api/ai-qualifier/config
 * Save AI Lead Qualifier configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, config } = body

    if (type === 'gemini') {
      const geminiConfig: GeminiConfig = {
        id: config.id || `gemini_${Date.now()}`,
        apiKey: config.apiKey || '',
        model: config.model || 'gemini-1.5-flash',
        temperature: config.temperature ?? 0.7,
        maxTokens: config.maxTokens || 1024,
        systemPrompt: config.systemPrompt || '',
        qualificationCriteria: config.qualificationCriteria || {},
        enabled: config.enabled ?? true,
        createdAt: config.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      geminiConfigs.set(geminiConfig.id, geminiConfig)
      
      return NextResponse.json({ success: true, id: geminiConfig.id })
    }

    if (type === 'whatsapp') {
      const whatsappConfig: WhatsAppConfig = {
        id: config.id || `whatsapp_${Date.now()}`,
        phoneNumberId: config.phoneNumberId || '',
        businessAccountId: config.businessAccountId || '',
        accessToken: config.accessToken || '',
        webhookVerifyToken: config.webhookVerifyToken || '',
        enabled: config.enabled ?? true,
        testMode: config.testMode ?? true,
        createdAt: config.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      whatsAppConfigs.set(whatsappConfig.id, whatsappConfig)
      
      return NextResponse.json({ 
        success: true, 
        id: whatsappConfig.id,
        webhookUrl: `/api/ai-qualifier/webhook`
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid config type' }, { status: 400 })
  } catch (error) {
    console.error('Error saving AI qualifier config:', error)
    return NextResponse.json({ success: false, error: 'Failed to save configuration' }, { status: 500 })
  }
}

/**
 * DELETE /api/ai-qualifier/config
 * Delete configuration
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const id = searchParams.get('id')

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Missing type or id' }, { status: 400 })
    }

    if (type === 'gemini') {
      geminiConfigs.delete(id)
    } else if (type === 'whatsapp') {
      whatsAppConfigs.delete(id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting AI qualifier config:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete configuration' }, { status: 500 })
  }
}
