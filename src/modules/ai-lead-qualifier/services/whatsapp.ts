/**
 * WhatsApp Business API Service
 * Handles WhatsApp messaging integration for lead qualification
 */

import type {
  WhatsAppConfig,
  WhatsAppMessage,
  WhatsAppWebhookEvent,
  WhatsAppWebhookMessage,
} from '../types'

export class WhatsAppService {
  private config: WhatsAppConfig | null = null
  private baseUrl = 'https://graph.facebook.com/v18.0'

  /**
   * Initialize WhatsApp service with configuration
   */
  initialize(config: WhatsAppConfig): void {
    this.config = config
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, text: string): Promise<WhatsAppMessage | null> {
    if (!this.config) {
      throw new Error('WhatsApp service not initialized')
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace(/\D/g, ''), // Remove non-digits
            type: 'text',
            text: {
              preview_url: false,
              body: text,
            },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error('WhatsApp API error:', error)
        throw new Error(`WhatsApp API error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        id: data.messages?.[0]?.id || '',
        from: this.config.phoneNumberId,
        to: to,
        text: text,
        type: 'text',
        timestamp: new Date().toISOString(),
        status: 'sent',
        direction: 'outbound',
      }
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error)
      return null
    }
  }

  /**
   * Send an interactive button message
   */
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>
  ): Promise<WhatsAppMessage | null> {
    if (!this.config) {
      throw new Error('WhatsApp service not initialized')
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace(/\D/g, ''),
            type: 'interactive',
            interactive: {
              type: 'button',
              body: {
                text: bodyText,
              },
              action: {
                buttons: buttons.map(btn => ({
                  type: 'reply',
                  reply: {
                    id: btn.id,
                    title: btn.title.substring(0, 20), // Max 20 chars
                  },
                })),
              },
            },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error('WhatsApp API error:', error)
        throw new Error(`WhatsApp API error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        id: data.messages?.[0]?.id || '',
        from: this.config.phoneNumberId,
        to: to,
        text: bodyText,
        type: 'interactive',
        timestamp: new Date().toISOString(),
        status: 'sent',
        direction: 'outbound',
      }
    } catch (error) {
      console.error('Failed to send WhatsApp button message:', error)
      return null
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'fr',
    components?: Array<{
      type: string
      parameters: Array<{ type: string; text?: string }>
    }>
  ): Promise<WhatsAppMessage | null> {
    if (!this.config) {
      throw new Error('WhatsApp service not initialized')
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to.replace(/\D/g, ''),
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: languageCode,
              },
              components: components || [],
            },
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error('WhatsApp API error:', error)
        throw new Error(`WhatsApp API error: ${response.status}`)
      }

      const data = await response.json()
      
      return {
        id: data.messages?.[0]?.id || '',
        from: this.config.phoneNumberId,
        to: to,
        text: `Template: ${templateName}`,
        type: 'template',
        timestamp: new Date().toISOString(),
        status: 'sent',
        direction: 'outbound',
      }
    } catch (error) {
      console.error('Failed to send WhatsApp template message:', error)
      return null
    }
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    if (!this.config) {
      return false
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
          }),
        }
      )

      return response.ok
    } catch (error) {
      console.error('Failed to mark message as read:', error)
      return false
    }
  }

  /**
   * Parse incoming webhook event
   */
  parseWebhookEvent(event: WhatsAppWebhookEvent): Array<{
    phoneNumber: string
    message: WhatsAppWebhookMessage
    messageId: string
    timestamp: string
  }> {
    const messages: Array<{
      phoneNumber: string
      message: WhatsAppWebhookMessage
      messageId: string
      timestamp: string
    }> = []

    for (const entry of event.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field === 'messages' && change.value.messages) {
          for (const msg of change.value.messages) {
            messages.push({
              phoneNumber: msg.from,
              message: msg,
              messageId: msg.id,
              timestamp: msg.timestamp,
            })
          }
        }
      }
    }

    return messages
  }

  /**
   * Verify webhook challenge
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (!this.config) {
      return null
    }

    if (mode === 'subscribe' && token === this.config.webhookVerifyToken) {
      return challenge
    }

    return null
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('212')) {
      return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)} ${cleaned.substring(10)}`
    }
    return `+${cleaned}`
  }

  /**
   * Get WhatsApp link for phone number
   */
  getWhatsAppLink(phone: string, message?: string): string {
    const cleaned = phone.replace(/\D/g, '')
    const baseUrl = 'https://wa.me/'
    const url = new URL(baseUrl + cleaned)
    if (message) {
      url.searchParams.set('text', message)
    }
    return url.toString()
  }

  /**
   * Send qualification notification to team
   */
  async notifyTeam(
    teamPhoneNumbers: string[],
    leadInfo: {
      name?: string
      company?: string
      phone: string
      qualificationLevel: string
      score: number
      summary: string
    }
  ): Promise<void> {
    const message = `🔔 Nouveau lead qualifié!

Nom: ${leadInfo.name || 'Non spécifié'}
Entreprise: ${leadInfo.company || 'Non spécifiée'}
Téléphone: ${leadInfo.phone}
Niveau: ${leadInfo.qualificationLevel.toUpperCase()}
Score: ${leadInfo.score}/100

${leadInfo.summary}

Contactez ce prospect rapidement!`

    for (const phoneNumber of teamPhoneNumbers) {
      await this.sendTextMessage(phoneNumber, message)
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService()
