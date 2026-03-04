/**
 * AI Lead Qualifier Module
 * WhatsApp + Gemini AI Integration for Lead Qualification
 */

export { AILeadQualifierDashboard, default } from './components/AILeadQualifierDashboard'
export { GeminiService, geminiService } from './services/gemini'
export { WhatsAppService, whatsappService } from './services/whatsapp'

// Export types
export type {
  WhatsAppConfig,
  WhatsAppMessage,
  GeminiConfig,
  QualificationCriteria,
  CustomQuestion,
  LeadConversation,
  ConversationStatus,
  QualificationLevel,
  ConversationMessage,
  ExtractedLeadData,
  QualificationResult,
  AIResponse,
  WhatsAppWebhookEvent,
  WhatsAppWebhookMessage,
  WhatsAppWebhookStatus,
  AILeadQualifierStats,
  AILeadQualifierSettings,
} from './types'
