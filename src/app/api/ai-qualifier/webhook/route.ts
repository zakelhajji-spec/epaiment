/**
 * WhatsApp Webhook API
 * Handles incoming WhatsApp messages for AI qualification
 */

import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppService } from '@/modules/ai-lead-qualifier/services/whatsapp'
import { GeminiService } from '@/modules/ai-lead-qualifier/services/gemini'
import type { WhatsAppWebhookEvent, LeadConversation, ConversationMessage, ExtractedLeadData } from '@/modules/ai-lead-qualifier/types'
import { conversations, geminiConfigs, whatsAppConfigs } from '../config/route'

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9)

// Initialize services
const whatsappService = new WhatsAppService()
const geminiService = new GeminiService()

/**
 * GET /api/ai-qualifier/webhook
 * WhatsApp webhook verification
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Get WhatsApp config
  const whatsAppConfig = Array.from(whatsAppConfigs.values())[0]
  
  if (!whatsAppConfig) {
    return new NextResponse('WhatsApp not configured', { status: 403 })
  }

  // Verify webhook
  if (mode === 'subscribe' && token === whatsAppConfig.webhookVerifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Verification failed', { status: 403 })
}

/**
 * POST /api/ai-qualifier/webhook
 * Handle incoming WhatsApp messages
 */
export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppWebhookEvent = await request.json()
    
    // Get configs
    const whatsAppConfig = Array.from(whatsAppConfigs.values())[0]
    const geminiConfig = Array.from(geminiConfigs.values())[0]
    
    if (!whatsAppConfig || !geminiConfig || !whatsAppConfig.enabled || !geminiConfig.enabled) {
      return NextResponse.json({ success: false, error: 'Service not configured' }, { status: 400 })
    }

    // Initialize services
    whatsappService.initialize(whatsAppConfig)
    geminiService['config'] = geminiConfig

    // Parse incoming messages
    const incomingMessages = whatsappService.parseWebhookEvent(body)
    
    for (const { phoneNumber, message } of incomingMessages) {
      // Find or create conversation
      let conversation = findConversationByPhone(phoneNumber)
      
      if (!conversation) {
        // Create new conversation
        conversation = {
          id: generateId(),
          leadId: generateId(),
          phoneNumber: phoneNumber,
          status: 'new',
          qualificationScore: 0,
          qualificationLevel: 'unqualified',
          messages: [],
          extractedData: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
        }
      }

      // Extract message text
      const messageText = message.text?.body || ''
      if (!messageText) continue

      // Add user message
      const userMessage: ConversationMessage = {
        id: generateId(),
        conversationId: conversation.id,
        role: 'user',
        content: messageText,
        timestamp: new Date().toISOString(),
      }
      conversation.messages.push(userMessage)

      // Get AI response
      const aiResponse = await geminiService.generateResponse(
        conversation.messages,
        conversation.extractedData
      )

      // Add AI message
      const assistantMessage: ConversationMessage = {
        id: generateId(),
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date().toISOString(),
        metadata: {
          intent: aiResponse.intent,
          extractedInfo: aiResponse.extractedInfo,
        },
      }
      conversation.messages.push(assistantMessage)

      // Update extracted data
      conversation.extractedData = {
        ...conversation.extractedData,
        ...aiResponse.extractedInfo,
      } as ExtractedLeadData

      // Update conversation status
      conversation.status = aiResponse.isComplete ? 'qualified' : 'in_progress'
      conversation.updatedAt = new Date().toISOString()
      conversation.lastMessageAt = new Date().toISOString()

      // Qualify lead if complete
      if (aiResponse.isComplete) {
        const qualificationResult = await geminiService.qualifyLead(
          conversation.id,
          conversation.leadId,
          conversation.messages,
          conversation.extractedData
        )

        conversation.qualificationLevel = qualificationResult.qualificationLevel
        conversation.qualificationScore = qualificationResult.qualificationScore
        conversation.aiSummary = qualificationResult.summary
        conversation.nextAction = qualificationResult.nextBestAction
      }

      // Save conversation
      conversations.set(conversation.id, conversation)

      // Send WhatsApp response
      await whatsappService.sendTextMessage(phoneNumber, aiResponse.message)

      // Mark incoming message as read
      if (message.id) {
        await whatsappService.markAsRead(message.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 })
  }
}

/**
 * Find conversation by phone number
 */
function findConversationByPhone(phoneNumber: string): LeadConversation | undefined {
  for (const conversation of conversations.values()) {
    if (conversation.phoneNumber.replace(/\D/g, '') === phoneNumber.replace(/\D/g, '')) {
      return conversation
    }
  }
  return undefined
}
