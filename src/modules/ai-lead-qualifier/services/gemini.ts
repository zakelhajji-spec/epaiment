/**
 * Gemini AI Service for Lead Qualification
 * Handles conversation processing, lead scoring, and qualification
 */

import type {
  GeminiConfig,
  QualificationCriteria,
  ConversationMessage,
  AIResponse,
  QualificationResult,
  ExtractedLeadData,
  QualificationLevel,
} from '../types'

// Default qualification criteria
const DEFAULT_CRITERIA: QualificationCriteria = {
  askBudget: true,
  budgetThresholds: {
    low: 5000,    // < 5000 MAD
    medium: 20000, // 5000 - 20000 MAD
    high: 20000,   // > 20000 MAD
  },
  askTimeline: true,
  timelineThresholds: {
    urgent: 7,    // < 7 days
    normal: 30,   // 7-30 days
    relaxed: 30,  // > 30 days
  },
  askDecisionMaker: true,
  askProjectScope: true,
  customQuestions: [],
  scoringWeights: {
    budget: 0.25,
    timeline: 0.25,
    authority: 0.25,
    need: 0.25,
  },
}

// Default system prompt for lead qualification
const DEFAULT_SYSTEM_PROMPT = `Tu es un assistant commercial IA spécialisé dans la qualification de prospects pour Epaiement.ma, une solution de facturation électronique marocaine conforme DGI 2026.

## Ton rôle:
1. Engager des conversations professionnelles avec les prospects
2. Qualifier les leads selon la méthode BANT (Budget, Autorité, Besoin, Timeline)
3. Collecter des informations clés de manière naturelle
4. Fournir des recommandations de qualification

## Questions à poser (de manière conversationnelle):
1. **Budget**: "Quel budget avez-vous prévu pour une solution de facturation ?"
2. **Autorité**: "Êtes-vous la personne décisionnaire pour ce type d'achat ?"
3. **Besoin**: "Quelles sont vos principales difficultés actuelles avec la facturation ?"
4. **Timeline**: "Quand souhaitez-vous mettre en place une nouvelle solution ?"

## Règles:
- Sois professionnel, courtois et concis
- Pose une question à la fois
- Réponds en français (ou en arabe si le prospect écrit en arabe)
- Ne sois pas trop insistant
- Si le prospect pose des questions sur Epaiement.ma, réponds de manière informative
- Termine la conversation poliment une fois la qualification terminée

## Informations sur Epaiement.ma:
- Solution de facturation électronique conforme DGI 2026
- Modules: Factures, Liens de paiement, Clients, Fournisseurs, Devis, Dépenses
- Tarifs: Modules gratuits + modules payants (49-199 MAD/mois)
- Support: WhatsApp, Email
- Intégrations: CMI, Fatourati, CIH Pay

## Format de réponse:
Réponds naturellement au prospect. Après chaque réponse, évalue si tu as suffisamment d'informations pour qualifier le lead.`

export class GeminiService {
  private config: GeminiConfig
  private criteria: QualificationCriteria

  constructor(config: Partial<GeminiConfig> = {}) {
    this.config = {
      id: config.id || 'default',
      apiKey: config.apiKey || process.env.GEMINI_API_KEY || '',
      model: config.model || 'gemini-1.5-flash',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 1024,
      systemPrompt: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      qualificationCriteria: config.qualificationCriteria || DEFAULT_CRITERIA,
      enabled: config.enabled ?? true,
      createdAt: config.createdAt || new Date().toISOString(),
      updatedAt: config.updatedAt || new Date().toISOString(),
    }
    this.criteria = this.config.qualificationCriteria
  }

  /**
   * Generate AI response for a conversation
   */
  async generateResponse(
    messages: ConversationMessage[],
    currentData: Partial<ExtractedLeadData> = {}
  ): Promise<AIResponse> {
    try {
      // Build conversation context
      const conversationHistory = this.buildConversationHistory(messages)
      const extractionPrompt = this.buildExtractionPrompt(currentData)
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${this.config.systemPrompt}\n\n${extractionPrompt}\n\nHistorique de conversation:\n${conversationHistory}` }],
              },
            ],
            generationConfig: {
              temperature: this.config.temperature,
              maxOutputTokens: this.config.maxTokens,
              topP: 0.95,
              topK: 40,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      // Extract information from the conversation
      const extractedInfo = await this.extractInformation(messages, aiMessage)
      
      // Calculate qualification score
      const qualificationScore = this.calculateScore(extractedInfo)
      
      // Determine if qualification is complete
      const isComplete = this.isQualificationComplete(extractedInfo)
      
      return {
        message: aiMessage,
        intent: this.detectIntent(messages[messages.length - 1]?.content || ''),
        shouldContinue: !isComplete,
        isComplete,
        extractedInfo,
        suggestedNextQuestion: this.getNextQuestion(extractedInfo),
        qualificationScore,
      }
    } catch (error) {
      console.error('Gemini API error:', error)
      return {
        message: "Je m'excuse, j'ai rencontré une erreur. Un conseiller va vous contacter rapidement.",
        shouldContinue: false,
        isComplete: false,
        extractedInfo: {},
      }
    }
  }

  /**
   * Qualify a lead based on extracted data
   */
  async qualifyLead(
    conversationId: string,
    leadId: string,
    messages: ConversationMessage[],
    extractedData: ExtractedLeadData
  ): Promise<QualificationResult> {
    // Calculate individual BANT scores
    const budgetScore = this.calculateBudgetScore(extractedData)
    const authorityScore = this.calculateAuthorityScore(extractedData)
    const needScore = this.calculateNeedScore(extractedData)
    const timelineScore = this.calculateTimelineScore(extractedData)
    
    // Calculate overall score
    const weights = this.criteria.scoringWeights
    const overallScore = Math.round(
      budgetScore.score * weights.budget +
      authorityScore.score * weights.authority +
      needScore.score * weights.need +
      timelineScore.score * weights.timeline
    )
    
    // Determine qualification level
    const level = this.determineQualificationLevel(overallScore, {
      budget: budgetScore,
      authority: authorityScore,
      need: needScore,
      timeline: timelineScore,
    })
    
    // Generate summary and recommendations
    const { summary, recommendation, nextBestAction } = await this.generateRecommendations(
      extractedData,
      level,
      overallScore
    )
    
    return {
      conversationId,
      leadId,
      qualificationScore: overallScore,
      qualificationLevel: level,
      confidence: this.calculateConfidence(extractedData),
      budget: budgetScore,
      authority: authorityScore,
      need: needScore,
      timeline: timelineScore,
      summary,
      recommendation,
      nextBestAction,
      extractedData,
      qualifiedAt: new Date().toISOString(),
    }
  }

  /**
   * Build conversation history string
   */
  private buildConversationHistory(messages: ConversationMessage[]): string {
    return messages
      .map(m => `${m.role === 'user' ? 'Prospect' : m.role === 'assistant' ? 'Assistant IA' : 'Agent'}: ${m.content}`)
      .join('\n')
  }

  /**
   * Build extraction prompt based on current data
   */
  private buildExtractionPrompt(currentData: Partial<ExtractedLeadData>): string {
    const missingInfo: string[] = []
    
    if (!currentData.name) missingInfo.push('nom du contact')
    if (!currentData.company) missingInfo.push('entreprise')
    if (!currentData.budget && !currentData.budgetRange) missingInfo.push('budget')
    if (!currentData.timeline) missingInfo.push('délai de projet')
    if (currentData.isDecisionMaker === undefined) missingInfo.push('décisionnaire')
    if (!currentData.projectDescription) missingInfo.push('description du projet/besoin')
    
    if (missingInfo.length > 0) {
      return `Informations manquantes à collecter: ${missingInfo.join(', ')}.
    
Instructions: Continue la conversation pour collecter ces informations de manière naturelle. Pose une seule question à la fois.`
    }
    
    return 'Toutes les informations nécessaires ont été collectées. Remercie le prospect et indique que quelqu\'un va le contacter prochainement.'
  }

  /**
   * Extract information from conversation
   */
  private async extractInformation(
    messages: ConversationMessage[],
    aiResponse: string
  ): Promise<Record<string, unknown>> {
    const extractedInfo: Record<string, unknown> = {}
    const allText = messages.map(m => m.content).join(' ') + ' ' + aiResponse
    
    // Extract name patterns
    const namePatterns = [
      /je m'appelle\s+([A-Z][a-z]+)/i,
      /mon nom (est|:)\s*([A-Z][a-z]+)/i,
      /c'est\s+([A-Z][a-z]+)/i,
    ]
    for (const pattern of namePatterns) {
      const match = allText.match(pattern)
      if (match) {
        extractedInfo.name = match[1] || match[2]
        break
      }
    }
    
    // Extract company
    const companyPatterns = [
      /entreprise\s+(?:est|:)\s*([A-Za-z0-9\s&]+)/i,
      /société\s+(?:est|:)\s*([A-Za-z0-9\s&]+)/i,
      /notre (?:société|entreprise)\s+(?:est|s'appelle)\s+([A-Za-z0-9\s&]+)/i,
    ]
    for (const pattern of companyPatterns) {
      const match = allText.match(pattern)
      if (match) {
        extractedInfo.company = match[1]?.trim()
        break
      }
    }
    
    // Extract budget
    const budgetPatterns = [
      /budget\s+(?:de|:)\s*(\d+(?:\s?\d+)*)\s*(MAD|DH|dirhams)?/i,
      /(\d+(?:\s?\d+)*)\s*(MAD|DH|dirhams)\s*(?:de budget)?/i,
      /autour de\s*(\d+(?:\s?\d+)*)\s*(MAD|DH)?/i,
      /entre\s*(\d+(?:\s?\d+)*)\s*et\s*(\d+(?:\s?\d+)*)\s*(MAD|DH)?/i,
    ]
    for (const pattern of budgetPatterns) {
      const match = allText.match(pattern)
      if (match) {
        const amount = parseInt((match[1] || '0').replace(/\s/g, ''))
        extractedInfo.budget = amount
        extractedInfo.budgetRange = this.categorizeBudget(amount)
        break
      }
    }
    
    // Extract timeline
    const timelinePatterns = [
      /dans\s*(\d+)\s*(jours?|semaines?|mois)/i,
      /sous\s*(\d+)\s*(jours?|semaines?|mois)/i,
      /d'ici\s*(\d+)\s*(jours?|semaines?|mois)/i,
      /(immédiatement|rapidement|bientôt|cette semaine|ce mois)/i,
      /(pas de délai|pas pressé|à temps)/i,
    ]
    for (const pattern of timelinePatterns) {
      const match = allText.match(pattern)
      if (match) {
        extractedInfo.timeline = match[0]
        extractedInfo.timelineCategory = this.categorizeTimeline(match[0])
        break
      }
    }
    
    // Extract decision maker status
    if (/je (suis|serai) (le |la )?(décisionnaire|responsable|décideur)/i.test(allText)) {
      extractedInfo.isDecisionMaker = true
    } else if (/je (ne suis pas|n\'?étais pas) (le |la )?(décisionnaire|responsable)/i.test(allText)) {
      extractedInfo.isDecisionMaker = false
    }
    
    // Extract needs/pain points
    const needsPatterns = [
      /besoin\s+(?:de|d')\s*([^.!?]+)/gi,
      /problème\s+(?:avec|de)\s*([^.!?]+)/gi,
      /difficulté\s+(?:avec|à)\s*([^.!?]+)/gi,
      /je cherche\s+([^.!?]+)/gi,
    ]
    const needs: string[] = []
    for (const pattern of needsPatterns) {
      const matches = allText.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) needs.push(match[1].trim())
      }
    }
    if (needs.length > 0) {
      extractedInfo.needs = needs
      extractedInfo.projectDescription = needs.join('. ')
    }
    
    return extractedInfo
  }

  /**
   * Calculate qualification score
   */
  private calculateScore(data: Record<string, unknown>): number {
    let score = 0
    const weights = this.criteria.scoringWeights
    
    // Budget score (0-25)
    if (data.budget) {
      score += weights.budget * 100
    } else if (data.budgetRange) {
      if (data.budgetRange === 'high') score += weights.budget * 100
      else if (data.budgetRange === 'medium') score += weights.budget * 75
      else if (data.budgetRange === 'low') score += weights.budget * 50
    }
    
    // Authority score (0-25)
    if (data.isDecisionMaker === true) {
      score += weights.authority * 100
    } else if (data.isDecisionMaker === false) {
      score += weights.authority * 25
    }
    
    // Need score (0-25)
    if (data.needs && Array.isArray(data.needs) && data.needs.length > 0) {
      score += weights.need * 100
    } else if (data.projectDescription) {
      score += weights.need * 75
    }
    
    // Timeline score (0-25)
    if (data.timeline) {
      if (data.timelineCategory === 'urgent') score += weights.timeline * 100
      else if (data.timelineCategory === 'normal') score += weights.timeline * 75
      else if (data.timelineCategory === 'relaxed') score += weights.timeline * 50
    }
    
    return Math.round(score)
  }

  /**
   * Calculate individual BANT scores
   */
  private calculateBudgetScore(data: ExtractedLeadData): { score: number; status: 'qualified' | 'unqualified' | 'unknown'; details?: string } {
    if (!data.budget && !data.budgetRange) {
      return { score: 0, status: 'unknown' }
    }
    
    if (data.budgetRange === 'high' || (data.budget && data.budget >= this.criteria.budgetThresholds.high)) {
      return { score: 100, status: 'qualified', details: `Budget élevé: ${data.budget || 'non spécifié'} MAD` }
    }
    
    if (data.budgetRange === 'medium' || (data.budget && data.budget >= this.criteria.budgetThresholds.medium)) {
      return { score: 75, status: 'qualified', details: `Budget moyen: ${data.budget || 'non spécifié'} MAD` }
    }
    
    if (data.budgetRange === 'low' || data.budget) {
      return { score: 50, status: 'qualified', details: `Budget limité: ${data.budget || 'non spécifié'} MAD` }
    }
    
    return { score: 0, status: 'unknown' }
  }

  private calculateAuthorityScore(data: ExtractedLeadData): { score: number; status: 'qualified' | 'unqualified' | 'unknown'; details?: string } {
    if (data.isDecisionMaker === undefined) {
      return { score: 0, status: 'unknown' }
    }
    
    if (data.isDecisionMaker) {
      return { score: 100, status: 'qualified', details: 'Est décisionnaire' }
    }
    
    return { score: 25, status: 'unqualified', details: 'N\'est pas décisionnaire' }
  }

  private calculateNeedScore(data: ExtractedLeadData): { score: number; status: 'qualified' | 'unqualified' | 'unknown'; details?: string } {
    const needsCount = data.needs?.length || 0
    
    if (needsCount === 0 && !data.projectDescription) {
      return { score: 0, status: 'unknown' }
    }
    
    if (needsCount >= 2) {
      return { score: 100, status: 'qualified', details: `${needsCount} besoins identifiés` }
    }
    
    if (needsCount === 1 || data.projectDescription) {
      return { score: 75, status: 'qualified', details: 'Besoin identifié' }
    }
    
    return { score: 50, status: 'unknown' }
  }

  private calculateTimelineScore(data: ExtractedLeadData): { score: number; status: 'qualified' | 'unqualified' | 'unknown'; details?: string } {
    if (!data.timeline && !data.timelineCategory) {
      return { score: 0, status: 'unknown' }
    }
    
    if (data.timelineCategory === 'urgent') {
      return { score: 100, status: 'qualified', details: `Projet urgent: ${data.timeline}` }
    }
    
    if (data.timelineCategory === 'normal') {
      return { score: 75, status: 'qualified', details: `Timeline standard: ${data.timeline}` }
    }
    
    if (data.timelineCategory === 'relaxed') {
      return { score: 50, status: 'qualified', details: `Timeline flexible: ${data.timeline}` }
    }
    
    return { score: 25, status: 'unknown' }
  }

  /**
   * Determine qualification level
   */
  private determineQualificationLevel(
    score: number,
    bantScores: { budget: { score: number }; authority: { score: number }; need: { score: number }; timeline: { score: number } }
  ): QualificationLevel {
    // Hot lead: High score and key criteria met
    if (score >= 70 && bantScores.budget.score >= 50 && bantScores.need.score >= 50) {
      return 'hot'
    }
    
    // Warm lead: Medium score or some criteria met
    if (score >= 40) {
      return 'warm'
    }
    
    // Cold lead: Low score but potential
    if (score >= 20) {
      return 'cold'
    }
    
    // Unqualified: Very low score
    return 'unqualified'
  }

  /**
   * Calculate confidence in qualification
   */
  private calculateConfidence(data: ExtractedLeadData): number {
    let confidence = 0
    const fields = ['name', 'company', 'budget', 'timeline', 'isDecisionMaker', 'needs', 'projectDescription']
    
    for (const field of fields) {
      if (data[field as keyof ExtractedLeadData] !== undefined) {
        confidence += 1 / fields.length
      }
    }
    
    return Math.round(confidence * 100) / 100
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(
    data: ExtractedLeadData,
    level: QualificationLevel,
    score: number
  ): Promise<{ summary: string; recommendation: string; nextBestAction: string }> {
    let summary = `Lead ${level === 'hot' ? 'très qualifié' : level === 'warm' ? 'qualifié' : level === 'cold' ? 'à suivre' : 'non qualifié'} (score: ${score}/100). `
    summary += data.company ? `Entreprise: ${data.company}. ` : ''
    summary += data.budget ? `Budget: ${data.budget} MAD. ` : ''
    summary += data.timeline ? `Timeline: ${data.timeline}. ` : ''
    
    let recommendation = ''
    let nextBestAction = ''
    
    switch (level) {
      case 'hot':
        recommendation = 'Contacter immédiatement. Ce prospect est prêt à acheter.'
        nextBestAction = 'Appel téléphonique ou démonstration personnalisée'
        break
      case 'warm':
        recommendation = 'Nurturing recommandé. Ce prospect a du potentiel mais nécessite plus d\'engagement.'
        nextBestAction = 'Envoyer une proposition ou un cas client pertinent'
        break
      case 'cold':
        recommendation = 'Suivre à distance. Ce prospect n\'est pas prêt actuellement.'
        nextBestAction = 'Ajouter à la liste de diffusion newsletter'
        break
      case 'unqualified':
        recommendation = 'Ne pas investir de ressources actuellement.'
        nextBestAction = 'Archiver et recontacter dans 6 mois'
        break
    }
    
    return { summary, recommendation, nextBestAction }
  }

  /**
   * Detect user intent
   */
  private detectIntent(message: string): string {
    const intents: Record<string, RegExp[]> = {
      greeting: [/bonjour/i, /salut/i, /hello/i, /السلام/i, /مرحبا/i],
      pricing: [/prix/i, /tarif/i, /combien/i, /coût/i, /سعر/i],
      features: [/fonction/i, /feature/i, /capacité/i, /possible de/i, /ميزة/i],
      demo: [/démonstration/i, /demo/i, /essayer/i, /test/i, /تجربة/i],
      support: [/aide/i, /support/i, /problème/i, /bug/i, /مساعدة/i],
      contact: [/contacter/i, /appel/i, /rendez-vous/i, /اتصال/i],
    }
    
    for (const [intent, patterns] of Object.entries(intents)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          return intent
        }
      }
    }
    
    return 'inquiry'
  }

  /**
   * Get next question to ask
   */
  private getNextQuestion(data: Partial<ExtractedLeadData>): string | undefined {
    if (!data.name) return 'Pourriez-vous me donner votre nom ?'
    if (!data.company) return 'Quelle est votre entreprise ?'
    if (!data.budget && !data.budgetRange) return 'Avez-vous un budget en tête pour ce projet ?'
    if (data.isDecisionMaker === undefined) return 'Êtes-vous la personne qui prendra la décision ?'
    if (!data.timeline) return 'Dans quel délai souhaitez-vous mettre en place cette solution ?'
    if (!data.needs?.length && !data.projectDescription) return 'Pouvez-vous me décrire vos besoins ?'
    return undefined
  }

  /**
   * Categorize budget amount
   */
  private categorizeBudget(amount: number): 'low' | 'medium' | 'high' {
    if (amount >= this.criteria.budgetThresholds.high) return 'high'
    if (amount >= this.criteria.budgetThresholds.medium) return 'medium'
    return 'low'
  }

  /**
   * Categorize timeline string
   */
  private categorizeTimeline(timeline: string): 'urgent' | 'normal' | 'relaxed' {
    const text = timeline.toLowerCase()
    
    if (/immédiat|rapid|urgent|semaine/i.test(text)) return 'urgent'
    if (/mois|normal|prochain/i.test(text)) return 'normal'
    if (/pas (de |d')?délai|pas pressé|temps|relax/i.test(text)) return 'relaxed'
    
    // Parse numeric timeline
    const daysMatch = text.match(/(\d+)\s*jours?/)
    const weeksMatch = text.match(/(\d+)\s*semaines?/)
    const monthsMatch = text.match(/(\d+)\s*mois/)
    
    if (daysMatch) {
      const days = parseInt(daysMatch[1])
      if (days <= this.criteria.timelineThresholds.urgent) return 'urgent'
      return 'normal'
    }
    
    if (weeksMatch) {
      const weeks = parseInt(weeksMatch[1])
      if (weeks <= 1) return 'urgent'
      return 'normal'
    }
    
    if (monthsMatch) {
      const months = parseInt(monthsMatch[1])
      if (months <= 1) return 'normal'
      return 'relaxed'
    }
    
    return 'normal'
  }
}

// Export singleton instance
export const geminiService = new GeminiService()
