'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Brain, MessageCircle, Settings, Users, TrendingUp, AlertCircle,
  CheckCircle, Clock, Zap, Send, RefreshCw, Flame, Snowflake,
  Eye, Phone, Building2, Calendar, DollarSign, UserCheck, Target
} from 'lucide-react'
import type { Language } from '@/lib/modules/types'
import type { 
  LeadConversation, 
  AILeadQualifierStats,
  GeminiConfig,
  WhatsAppConfig,
  ConversationMessage,
  QualificationLevel
} from '../types'

interface AILeadQualifierDashboardProps {
  language: Language
}

// Mock data for demo
const mockConversations: LeadConversation[] = [
  {
    id: '1',
    leadId: 'l1',
    phoneNumber: '+212612345678',
    contactName: 'Ahmed Benali',
    status: 'qualified',
    qualificationScore: 85,
    qualificationLevel: 'hot',
    messages: [
      { id: 'm1', conversationId: '1', role: 'assistant', content: 'Bonjour! Je suis l\'assistant Epaiement.ma. Comment puis-je vous aider?', timestamp: new Date().toISOString() },
      { id: 'm2', conversationId: '1', role: 'user', content: 'Bonjour, je cherche une solution de facturation pour mon entreprise', timestamp: new Date().toISOString() },
      { id: 'm3', conversationId: '1', role: 'assistant', content: 'Excellent! Pouvez-vous me donner le nom de votre entreprise?', timestamp: new Date().toISOString() },
      { id: 'm4', conversationId: '1', role: 'user', content: 'Tech Solutions SARL', timestamp: new Date().toISOString() },
      { id: 'm5', conversationId: '1', role: 'assistant', content: 'Parfait! Avez-vous un budget en tête pour cette solution?', timestamp: new Date().toISOString() },
      { id: 'm6', conversationId: '1', role: 'user', content: 'Je pense autour de 15000 MAD par an', timestamp: new Date().toISOString() },
    ],
    extractedData: {
      name: 'Ahmed Benali',
      company: 'Tech Solutions SARL',
      budget: 15000,
      budgetRange: 'medium',
      isDecisionMaker: true,
      timeline: 'dans 2 semaines',
      timelineCategory: 'normal',
      needs: ['solution de facturation'],
    },
    aiSummary: 'Lead très qualifié avec budget confirmé et timeline courte. Prêt à acheter.',
    nextAction: 'Appel téléphonique pour démonstration',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
  },
  {
    id: '2',
    leadId: 'l2',
    phoneNumber: '+212698765432',
    contactName: 'Fatima Zahra',
    status: 'in_progress',
    qualificationScore: 45,
    qualificationLevel: 'warm',
    messages: [
      { id: 'm7', conversationId: '2', role: 'assistant', content: 'Bonjour! Comment puis-je vous aider?', timestamp: new Date().toISOString() },
      { id: 'm8', conversationId: '2', role: 'user', content: 'Je voudrais des informations sur vos tarifs', timestamp: new Date().toISOString() },
    ],
    extractedData: {
      name: 'Fatima Zahra',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
  },
]

const mockStats: AILeadQualifierStats = {
  totalConversations: 47,
  activeConversations: 12,
  qualifiedLeads: 28,
  disqualifiedLeads: 5,
  convertedLeads: 8,
  conversionRate: 17,
  averageQualificationScore: 68,
  averageConversationLength: 6,
  leadsByLevel: {
    hot: 8,
    warm: 15,
    cold: 5,
    unqualified: 5,
  },
  responseTime: {
    average: 2.3,
    median: 1.8,
  },
  dailyConversations: [],
}

export function AILeadQualifierDashboard({ language }: AILeadQualifierDashboardProps) {
  const [activeTab, setActiveTab] = useState('conversations')
  const [conversations, setConversations] = useState<LeadConversation[]>(mockConversations)
  const [stats, setStats] = useState<AILeadQualifierStats>(mockStats)
  const [selectedConversation, setSelectedConversation] = useState<LeadConversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Config states
  const [geminiConfig, setGeminiConfig] = useState<Partial<GeminiConfig>>({
    enabled: true,
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 1024,
  })
  const [whatsappConfig, setWhatsappConfig] = useState<Partial<WhatsAppConfig>>({
    enabled: true,
    testMode: true,
  })

  const t = (fr: string, ar: string) => language === 'ar' ? ar : fr

  const getLevelColor = (level: QualificationLevel) => {
    switch (level) {
      case 'hot': return 'bg-red-100 text-red-700 border-red-200'
      case 'warm': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'cold': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'unqualified': return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getLevelIcon = (level: QualificationLevel) => {
    switch (level) {
      case 'hot': return <Flame className="w-4 h-4" />
      case 'warm': return <TrendingUp className="w-4 h-4" />
      case 'cold': return <Snowflake className="w-4 h-4" />
      case 'unqualified': return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge variant="outline" className="bg-blue-50">{t('Nouveau', 'جديد')}</Badge>
      case 'in_progress': return <Badge variant="outline" className="bg-yellow-50">{t('En cours', 'قيد التقدم')}</Badge>
      case 'qualified': return <Badge variant="outline" className="bg-green-50">{t('Qualifié', 'مؤهل')}</Badge>
      case 'disqualified': return <Badge variant="outline" className="bg-red-50">{t('Non qualifié', 'غير مؤهل')}</Badge>
      case 'converted': return <Badge variant="outline" className="bg-emerald-50">{t('Converti', 'محول')}</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return
    
    setLoading(true)
    // In real app, this would call the API
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      conversationId: selectedConversation.id,
      role: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
    }
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        conversationId: selectedConversation.id,
        role: 'assistant',
        content: 'Merci pour votre message! Un conseiller vous contactera bientôt.',
        timestamp: new Date().toISOString(),
      }
      
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMessage, aiResponse]
      } : null)
      setNewMessage('')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-7 h-7 text-purple-600" />
            {t('AI Lead Qualifier', 'مؤهل العملاء AI')}
          </h1>
          <p className="text-gray-500 mt-1">
            {t('Qualifiez vos prospects automatiquement avec l\'IA', 'أهّل عملاءك المحتملين تلقائياً بالذكاء الاصطناعي')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <Zap className="w-3 h-3 mr-1" />
            Gemini AI
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <MessageCircle className="w-3 h-3 mr-1" />
            WhatsApp
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('Conversations', 'المحادثات')}</p>
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('Actives', 'النشطة')}</p>
                <p className="text-2xl font-bold">{stats.activeConversations}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('Qualifiés', 'المؤهلين')}</p>
                <p className="text-2xl font-bold text-green-600">{stats.qualifiedLeads}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('Taux conversion', 'معدل التحويل')}</p>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('Score moyen', 'المتوسط')}</p>
                <p className="text-2xl font-bold">{stats.averageQualificationScore}</p>
              </div>
              <Target className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads by Level */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-700">{stats.leadsByLevel.hot}</p>
            <p className="text-sm text-red-600">{t('Hot', 'ساخن')}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-700">{stats.leadsByLevel.warm}</p>
            <p className="text-sm text-orange-600">{t('Warm', 'دافئ')}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <Snowflake className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-700">{stats.leadsByLevel.cold}</p>
            <p className="text-sm text-blue-600">{t('Cold', 'بارد')}</p>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-700">{stats.leadsByLevel.unqualified}</p>
            <p className="text-sm text-gray-600">{t('Non qualifié', 'غير مؤهل')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations">
            <MessageCircle className="w-4 h-4 mr-2" />
            {t('Conversations', 'المحادثات')}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            {t('Configuration', 'الإعدادات')}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('Analyse', 'التحليل')}
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Conversation List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">{t('Conversations', 'المحادثات')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>{t('Aucune conversation', 'لا توجد محادثات')}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {conversations.map(conv => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                            selectedConversation?.id === conv.id ? 'bg-purple-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {conv.contactName || conv.phoneNumber}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {conv.extractedData.company}
                                </p>
                              </div>
                            </div>
                            <Badge className={getLevelColor(conv.qualificationLevel)}>
                              {getLevelIcon(conv.qualificationLevel)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400 truncate flex-1 mr-2">
                              {conv.messages[conv.messages.length - 1]?.content.substring(0, 50)}...
                            </p>
                            <span className="text-xs text-gray-400">
                              {conv.qualificationScore}%
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Conversation Detail */}
            <Card className="lg:col-span-2">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {selectedConversation.contactName || selectedConversation.phoneNumber}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-3 h-3" />
                            {selectedConversation.phoneNumber}
                            {selectedConversation.extractedData.company && (
                              <>
                                <span className="mx-1">•</span>
                                <Building2 className="w-3 h-3" />
                                {selectedConversation.extractedData.company}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedConversation.status)}
                        <Badge className={getLevelColor(selectedConversation.qualificationLevel)}>
                          {getLevelIcon(selectedConversation.qualificationLevel)}
                          <span className="ml-1 capitalize">{selectedConversation.qualificationLevel}</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {/* Messages */}
                  <CardContent className="p-0">
                    <ScrollArea className="h-[350px] p-4">
                      <div className="space-y-4">
                        {selectedConversation.messages.map(msg => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                msg.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : msg.role === 'assistant'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-MA' : 'fr-MA', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {/* Message Input */}
                    <div className="border-t p-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('Écrire un message...', 'اكتب رسالة...')}
                          value={newMessage}
                          onChange={e => setNewMessage(e.target.value)}
                          onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} disabled={loading}>
                          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* Qualification Info */}
                  {selectedConversation.aiSummary && (
                    <div className="border-t p-4 bg-gray-50">
                      <div className="grid grid-cols-4 gap-4 mb-3">
                        <div className="text-center">
                          <DollarSign className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">{t('Budget', 'الميزانية')}</p>
                          <p className="font-medium">
                            {selectedConversation.extractedData.budget 
                              ? `${selectedConversation.extractedData.budget} MAD`
                              : '-'}
                          </p>
                        </div>
                        <div className="text-center">
                          <Calendar className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">{t('Timeline', 'الجدول الزمني')}</p>
                          <p className="font-medium text-sm">
                            {selectedConversation.extractedData.timeline || '-'}
                          </p>
                        </div>
                        <div className="text-center">
                          <UserCheck className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">{t('Décisionnaire', 'صانع القرار')}</p>
                          <p className="font-medium">
                            {selectedConversation.extractedData.isDecisionMaker === true 
                              ? t('Oui', 'نعم') 
                              : selectedConversation.extractedData.isDecisionMaker === false
                              ? t('Non', 'لا')
                              : '-'}
                          </p>
                        </div>
                        <div className="text-center">
                          <Target className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                          <p className="text-xs text-gray-500">{t('Score', 'النتيجة')}</p>
                          <p className="font-bold text-purple-600">{selectedConversation.qualificationScore}%</p>
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border">
                        <p className="text-sm font-medium mb-1">{t('Résumé IA', 'ملخص AI')}</p>
                        <p className="text-sm text-gray-600">{selectedConversation.aiSummary}</p>
                        {selectedConversation.nextAction && (
                          <p className="text-sm text-purple-600 mt-2">
                            <strong>{t('Action suggérée:', 'الإجراء المقترح:')}</strong> {selectedConversation.nextAction}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <CardContent className="h-[500px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>{t('Sélectionnez une conversation', 'اختر محادثة')}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Gemini AI Config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  {t('Configuration Gemini AI', 'إعدادات Gemini AI')}
                </CardTitle>
                <CardDescription>
                  {t('Configurez l\'IA pour la qualification des leads', 'تكوين الذكاء الاصطناعي لتأهيل العملاء المحتملين')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t('Activer Gemini AI', 'تفعيل Gemini AI')}</Label>
                  <Switch
                    checked={geminiConfig.enabled}
                    onCheckedChange={v => setGeminiConfig(prev => ({ ...prev, enabled: v }))}
                  />
                </div>
                
                <div>
                  <Label>{t('Clé API Gemini', 'مفتاح API Gemini')}</Label>
                  <Input
                    type="password"
                    placeholder="AIza..."
                    value={geminiConfig.apiKey || ''}
                    onChange={e => setGeminiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>{t('Modèle', 'النموذج')}</Label>
                  <Select
                    value={geminiConfig.model}
                    onValueChange={v => setGeminiConfig(prev => ({ ...prev, model: v as any }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash (Rapide)</SelectItem>
                      <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Avancé)</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro (Standard)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>{t('Température', 'درجة الحرارة')}: {geminiConfig.temperature}</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={geminiConfig.temperature}
                    onChange={e => setGeminiConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('Plus bas = plus déterministe, Plus haut = plus créatif', 'أقل = أكثر تحديداً، أعلى = أكثر إبداعاً')}
                  </p>
                </div>
                
                <div>
                  <Label>{t('Prompt système', 'موجه النظام')}</Label>
                  <Textarea
                    rows={4}
                    placeholder={t('Instructions pour l\'IA...', 'تعليمات للذكاء الاصطناعي...')}
                    value={geminiConfig.systemPrompt || ''}
                    onChange={e => setGeminiConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                  />
                </div>
                
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  {t('Enregistrer configuration Gemini', 'حفظ إعدادات Gemini')}
                </Button>
              </CardContent>
            </Card>

            {/* WhatsApp Config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  {t('Configuration WhatsApp', 'إعدادات واتساب')}
                </CardTitle>
                <CardDescription>
                  {t('Connectez WhatsApp Business API', 'ربط واتساب للأعمال API')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t('Activer WhatsApp', 'تفعيل واتساب')}</Label>
                  <Switch
                    checked={whatsappConfig.enabled}
                    onCheckedChange={v => setWhatsappConfig(prev => ({ ...prev, enabled: v }))}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <Label className="font-medium">{t('Mode test', 'وضع الاختبار')}</Label>
                    <p className="text-xs text-gray-500">{t('Sans envoyer de vrais messages', 'بدون إرسال رسائل حقيقية')}</p>
                  </div>
                  <Switch
                    checked={whatsappConfig.testMode}
                    onCheckedChange={v => setWhatsappConfig(prev => ({ ...prev, testMode: v }))}
                  />
                </div>
                
                <div>
                  <Label>{t('Phone Number ID', 'معرف رقم الهاتف')}</Label>
                  <Input
                    placeholder="123456789012345"
                    value={whatsappConfig.phoneNumberId || ''}
                    onChange={e => setWhatsappConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>{t('Business Account ID', 'معرف حساب الأعمال')}</Label>
                  <Input
                    placeholder="123456789012345"
                    value={whatsappConfig.businessAccountId || ''}
                    onChange={e => setWhatsappConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>{t('Access Token', 'رمز الوصول')}</Label>
                  <Input
                    type="password"
                    placeholder="EAA..."
                    value={whatsappConfig.accessToken || ''}
                    onChange={e => setWhatsappConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>{t('Webhook Verify Token', 'رمز التحقق من Webhook')}</Label>
                  <Input
                    type="password"
                    placeholder="your_verify_token"
                    value={whatsappConfig.webhookVerifyToken || ''}
                    onChange={e => setWhatsappConfig(prev => ({ ...prev, webhookVerifyToken: e.target.value }))}
                  />
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">{t('URL Webhook', 'رابط Webhook')}</Label>
                  <code className="block text-xs mt-1 text-purple-600">
                    {typeof window !== 'undefined' ? window.location.origin : ''}/api/ai-qualifier/webhook
                  </code>
                </div>
                
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  {t('Enregistrer configuration WhatsApp', 'حفظ إعدادات واتساب')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('Performance de qualification', 'أداء التأهيل')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('Temps de réponse moyen', 'متوسط وقت الاستجابة')}</span>
                    <span className="font-bold">{stats.responseTime.average}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('Longueur moyenne des conversations', 'متوسط طول المحادثات')}</span>
                    <span className="font-bold">{stats.averageConversationLength} {t('messages', 'رسائل')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('Score de qualification moyen', 'متوسط درجة التأهيل')}</span>
                    <span className="font-bold">{stats.averageQualificationScore}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('Conversion des leads', 'تحويل العملاء المحتملين')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('Total leads qualifiés', 'إجمالي العملاء المؤهلين')}</span>
                    <span className="font-bold text-green-600">{stats.qualifiedLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('Leads convertis en clients', 'العملاء المحولون')}</span>
                    <span className="font-bold text-blue-600">{stats.convertedLeads}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('Taux de conversion', 'معدل التحويل')}</span>
                    <span className="font-bold text-purple-600">{stats.conversionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AILeadQualifierDashboard
