/**
 * AI Qualifier Chat API
 * Handles conversation with AI for lead qualification
 */

import { NextRequest, NextResponse } from 'next/server'
import { GeminiService } from '@/modules/ai-lead-qualifier/services/gemini'
import type { LeadConversation, ConversationMessage, ExtractedLeadData } from '@/modules/ai-lead-qualifier/types'
import { conversations, geminiConfigs } from '../config/route'

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9)

/**
 * GET /api/ai-qualifier/chat
 * Get all conversations or a specific conversation
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const conversationId = searchParams.get('id')
  const status = searchParams.get('status')
  const level = searchParams.get('level')

  try {
    if (conversationId) {
      const conversation = conversations.get(conversationId)
      if (!conversation) {
        return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, conversation })
    }

    // Filter conversations
    let filteredConversations = Array.from(conversations.values())
    
    if (status) {
      filteredConversations = filteredConversations.filter((c: LeadConversation) => c.status === status)
    }
    
    if (level) {
      filteredConversations = filteredConversations.filter((c: LeadConversation) => c.qualificationLevel === level)
    }

    // Sort by last message date (most recent first)
    filteredConversations.sort((a: LeadConversation, b: LeadConversation) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    )

    return NextResponse.json({ 
      success: true, 
      conversations: filteredConversations,
      total: filteredConversations.length
    })
  } catch (error) {
    console.error('Error getting conversations:', error)
    return NextResponse.json({ success: false, error: 'Failed to get conversations' }, { status: 500 })
  }
}

/**
 * POST /api/ai-qualifier/chat
 * Start a new conversation or send a message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, conversationId, message, phoneNumber, contactName } = body

    // Get Gemini config
    const geminiConfig = Array.from(geminiConfigs.values())[0]
    if (!geminiConfig || !geminiConfig.enabled) {
      return NextResponse.json({ 
        success: false, 
        error: 'AI service not configured or disabled' 
      }, { status: 400 })
    }

    // Initialize Gemini service
    const geminiService = new GeminiService(geminiConfig)

    if (action === 'start') {
      // Start new conversation
      const newConversation: LeadConversation = {
        id: generateId(),
        leadId: generateId(),
        phoneNumber: phoneNumber || '',
        contactName: contactName || undefined,
        status: 'new',
        qualificationScore: 0,
        qualificationLevel: 'unqualified',
        messages: [],
        extractedData: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString(),
      }

      // Generate greeting message
      const greetingMessage: ConversationMessage = {
        id: generateId(),
        conversationId: newConversation.id,
        role: 'assistant',
        content: language === 'ar' 
          ? 'مرحباً! أنا مساعد Epaiement.ma. كيف يمكنني مساعدتك اليوم؟'
          : 'Bonjour! Je suis l\'assistant Epaiement.ma. Comment puis-je vous aider aujourd\'hui?',
        timestamp: new Date().toISOString(),
      }

      newConversation.messages.push(greetingMessage)
      conversations.set(newConversation.id, newConversation)

      return NextResponse.json({ 
        success: true, 
        conversation: newConversation,
        message: greetingMessage
      })
    }

    if (action === 'send' && conversationId) {
      // Send message to existing conversation
      const conversation = conversations.get(conversationId)
      if (!conversation) {
        return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 })
      }

      // Add user message
      const userMessage: ConversationMessage = {
        id: generateId(),
        conversationId: conversation.id,
        role: 'user',
        content: message,
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
          confidence: aiResponse.qualificationScore ? aiResponse.qualificationScore / 100 : undefined,
        },
      }
      conversation.messages.push(assistantMessage)

      // Update extracted data
      conversation.extractedData = {
        ...conversation.extractedData,
        ...aiResponse.extractedInfo,
      } as ExtractedLeadData

      // Update qualification score
      if (aiResponse.qualificationScore) {
        conversation.qualificationScore = aiResponse.qualificationScore
      }

      // Update status
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

      return NextResponse.json({ 
        success: true, 
        conversation,
        message: assistantMessage,
        qualificationComplete: aiResponse.isComplete,
        qualificationLevel: conversation.qualificationLevel,
      })
    }

    if (action === 'qualify' && conversationId) {
      // Force qualification
      const conversation = conversations.get(conversationId)
      if (!conversation) {
        return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 })
      }

      const qualificationResult = await geminiService.qualifyLead(
        conversation.id,
        conversation.leadId,
        conversation.messages,
        conversation.extractedData
      )

      conversation.qualificationLevel = qualificationResult.qualificationLevel
      conversation.qualificationScore = qualificationResult.qualificationScore
      conversation.status = 'qualified'
      conversation.aiSummary = qualificationResult.summary
      conversation.nextAction = qualificationResult.nextBestAction
      conversation.updatedAt = new Date().toISOString()

      conversations.set(conversation.id, conversation)

      return NextResponse.json({ 
        success: true, 
        qualification: qualificationResult,
        conversation
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json({ success: false, error: 'Failed to process chat' }, { status: 500 })
  }
}

// Language helper (should come from request in real app)
let language: 'fr' | 'ar' = 'fr'
