/**
 * AI Lead Qualifier Module Types
 * WhatsApp + Gemini AI Integration for Lead Qualification
 */

// ============================================
// WhatsApp Configuration
// ============================================

export interface WhatsAppConfig {
  id: string
  phoneNumberId: string
  businessAccountId: string
  accessToken: string
  webhookVerifyToken: string
  enabled: boolean
  testMode: boolean
  createdAt: string
  updatedAt: string
}

export interface WhatsAppMessage {
  id: string
  from: string
  to: string
  text?: string
  type: 'text' | 'interactive' | 'template' | 'image' | 'document'
  timestamp: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  direction: 'inbound' | 'outbound'
}

// ============================================
// Gemini AI Configuration
// ============================================

export interface GeminiConfig {
  id: string
  apiKey: string
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-pro'
  temperature: number
  maxTokens: number
  systemPrompt: string
  qualificationCriteria: QualificationCriteria
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface QualificationCriteria {
  // Budget related questions
  askBudget: boolean
  budgetThresholds: {
    low: number
    medium: number
    high: number
  }
  
  // Timeline questions
  askTimeline: boolean
  timelineThresholds: {
    urgent: number // days
    normal: number
    relaxed: number
  }
  
  // Decision maker
  askDecisionMaker: boolean
  
  // Project scope
  askProjectScope: boolean
  
  // Custom questions
  customQuestions: CustomQuestion[]
  
  // Qualification scoring
  scoringWeights: {
    budget: number
    timeline: number
    authority: number
    need: number
  }
}

export interface CustomQuestion {
  id: string
  question: string
  questionAr?: string
  expectedResponseType: 'text' | 'number' | 'choice' | 'date'
  choices?: string[]
  weight: number
  required: boolean
}

// ============================================
// Lead Conversation
// ============================================

export interface LeadConversation {
  id: string
  leadId: string
  phoneNumber: string
  contactName?: string
  status: ConversationStatus
  qualificationScore: number
  qualificationLevel: QualificationLevel
  messages: ConversationMessage[]
  aiSummary?: string
  extractedData: ExtractedLeadData
  nextAction?: string
  assignedTo?: string
  createdAt: string
  updatedAt: string
  lastMessageAt: string
  convertedToLeadId?: string
  convertedToClientId?: string
}

export type ConversationStatus = 
  | 'new'
  | 'in_progress'
  | 'waiting_response'
  | 'qualified'
  | 'disqualified'
  | 'converted'
  | 'closed'

export type QualificationLevel = 
  | 'hot'      // Ready to buy, high score
  | 'warm'     // Interested, needs nurturing
  | 'cold'     // Not interested or low fit
  | 'unqualified' // Does not meet criteria

export interface ConversationMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'human_agent'
  content: string
  timestamp: string
  metadata?: {
    intent?: string
    sentiment?: 'positive' | 'neutral' | 'negative'
    extractedInfo?: Record<string, unknown>
    confidence?: number
  }
}

export interface ExtractedLeadData {
  // Contact information
  name?: string
  email?: string
  company?: string
  position?: string
  
  // Budget information
  budget?: number
  budgetRange?: 'low' | 'medium' | 'high' | 'unknown'
  
  // Timeline
  timeline?: string
  timelineCategory?: 'urgent' | 'normal' | 'relaxed' | 'unknown'
  
  // Decision making
  isDecisionMaker?: boolean
  decisionMakerName?: string
  
  // Project details
  projectDescription?: string
  projectType?: string
  estimatedValue?: number
  
  // Needs & pain points
  painPoints?: string[]
  needs?: string[]
  
  // Qualification notes
  qualificationNotes?: string
  disqualificationReason?: string
}

// ============================================
// Qualification Result
// ============================================

export interface QualificationResult {
  conversationId: string
  leadId: string
  qualificationScore: number // 0-100
  qualificationLevel: QualificationLevel
  confidence: number // 0-1
  
  // BANT Score Breakdown
  budget: {
    score: number
    status: 'qualified' | 'unqualified' | 'unknown'
    details?: string
  }
  authority: {
    score: number
    status: 'qualified' | 'unqualified' | 'unknown'
    details?: string
  }
  need: {
    score: number
    status: 'qualified' | 'unqualified' | 'unknown'
    details?: string
  }
  timeline: {
    score: number
    status: 'qualified' | 'unqualified' | 'unknown'
    details?: string
  }
  
  // AI Insights
  summary: string
  recommendation: string
  nextBestAction: string
  suggestedResponse?: string
  
  // Extracted data
  extractedData: ExtractedLeadData
  
  // Timestamps
  qualifiedAt: string
  expiresAt?: string
}

// ============================================
// AI Response
// ============================================

export interface AIResponse {
  message: string
  intent?: string
  shouldContinue: boolean
  isComplete: boolean
  extractedInfo: Record<string, unknown>
  suggestedNextQuestion?: string
  qualificationScore?: number
}

// ============================================
// Webhook Events
// ============================================

export interface WhatsAppWebhookEvent {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        messages?: WhatsAppWebhookMessage[]
        statuses?: WhatsAppWebhookStatus[]
      }
      field: string
    }>
  }>
}

export interface WhatsAppWebhookMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: {
    body: string
  }
  interactive?: {
    type: string
    button_reply?: {
      id: string
      title: string
    }
    list_reply?: {
      id: string
      title: string
    }
  }
}

export interface WhatsAppWebhookStatus {
  id: string
  status: string
  timestamp: string
  recipient_id: string
}

// ============================================
// Module Statistics
// ============================================

export interface AILeadQualifierStats {
  totalConversations: number
  activeConversations: number
  qualifiedLeads: number
  disqualifiedLeads: number
  convertedLeads: number
  conversionRate: number
  averageQualificationScore: number
  averageConversationLength: number
  leadsByLevel: {
    hot: number
    warm: number
    cold: number
    unqualified: number
  }
  responseTime: {
    average: number
    median: number
  }
  dailyConversations: Array<{
    date: string
    count: number
    qualified: number
  }>
}

// ============================================
// Module Settings
// ============================================

export interface AILeadQualifierSettings {
  // Working hours for automated responses
  workingHours: {
    enabled: boolean
    start: string // HH:mm
    end: string // HH:mm
    timezone: string
    daysOff: number[] // 0-6 (Sunday-Saturday)
  }
  
  // Auto-assignment
  autoAssignment: {
    enabled: boolean
    roundRobin: boolean
    defaultAssignee?: string
  }
  
  // Notifications
  notifications: {
    newConversation: boolean
    qualifiedLead: boolean
    disqualification: boolean
    emailRecipients: string[]
  }
  
  // Fallback settings
  fallback: {
    enableHumanTakeover: boolean
    noResponseTimeout: number // minutes
    maxConversationDuration: number // hours
    fallbackMessage: string
    fallbackMessageAr: string
  }
  
  // Language settings
  language: {
    primary: 'fr' | 'ar'
    detectAutomatically: boolean
  }
}

// ============================================
// Export all types
// ============================================

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
}
