# 📊 Epaiement.ma - Analyse Complète des Modules

## Vue d'Ensemble du Projet

| Métrique | Valeur |
|----------|--------|
| **Modules Totaux** | 18 |
| **Modules Actifs** | 16 |
| **Modules En Développement** | 2 (Inventaire) |
| **Lignes de Code (Dashboard)** | ~1,072 |
| **Routes API** | 25+ |
| **Composants UI** | 50+ |

---

## 🏗️ Architecture Actuelle

```
/src
├── /app
│   ├── /dashboard          → Page principale (1,072 lignes)
│   ├── /pay/[reference]    → Page de paiement publique
│   ├── /auth               → Authentification
│   └── /api                → 25+ routes API
├── /components
│   ├── /shared             → Sidebar, Header, Toast, CompanyForm
│   ├── /pricing            → ModulePricing, ModuleGroupPricing
│   └── /ui                 → 50+ composants shadcn/ui
├── /lib
│   ├── security.ts         → Chiffrement, CSRF, Rate limiting
│   ├── pdf-generator.ts    → Génération PDF
│   ├── modules.config.ts   → Configuration des 18 modules
│   └── api/client.ts       → Client API
├── /modules
│   ├── /ai-lead-qualifier  → Module AI WhatsApp + Gemini
│   └── /integrations       → Passerelles de paiement
└── /prisma
    └── schema.prisma       → 12 modèles de données
```

---

## 📋 Analyse Détaillée par Module

### 1. 🏠 MODULE: Dashboard (Tableau de Bord)

**Statut:** ✅ Actif | **Priorité:** Haute

#### Problèmes Identifiés

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Métriques calculées côté client uniquement | Moyenne | Performance |
| 2 | Pas de graphiques d'évolution temporelle | Haute | UX |
| 3 | Absence de données en temps réel | Moyenne | UX |
| 4 | Pas de notifications push | Basse | Engagement |

#### Recommandations

```typescript
// 1. Ajouter endpoint API pour métriques calculées
// /api/reports/metrics
export async function GET() {
  const metrics = await prisma.$queryRaw`
    SELECT 
      SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as revenue,
      COUNT(CASE WHEN status = 'sent' THEN 1 END) as pending,
      ...
    FROM invoices
    WHERE userId = $1
  `
  return NextResponse.json(metrics)
}

// 2. Implémenter Server-Sent Events pour temps réel
// /api/events
export async function GET() {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Push updates every 30 seconds
    }
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } })
}
```

#### Améliorations UX Suggérées

- [ ] Ajouter graphique linéaire évolution CA (Chart.js)
- [ ] Heatmap des paiements par jour/heure
- [ ] Widget rappel échéances proches
- [ ] Indicateur performance vs mois précédent

---

### 2. 📄 MODULE: Factures (Invoices)

**Statut:** ✅ Actif | **Priorité:** Critique

#### Problèmes Identifiés

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Pas de QR code DGI 2026 intégré | **Critique** | Conformité |
| 2 | Signature numérique manquante | **Critique** | Conformité |
| 3 | Items stockés en JSON string | Moyenne | Performance |
| 4 | Pas de validation ICE client | Haute | Qualité |
| 5 | Numérotation non séquentielle garantie | Haute | Légal |

#### Code à Corriger

```typescript
// ❌ Actuel - Items en JSON string
items: JSON.stringify(items)

// ✅ Recommandé - Table séparée
model InvoiceItem {
  id          String   @id @default(cuid())
  invoiceId   String
  description String
  quantity    Float
  unitPrice   Float
  tvaRate     Float
  total       Float
  
  invoice Invoice @relation(fields: [invoiceId], references: [id])
}
```

#### Implémentation QR Code DGI 2026

```typescript
// /lib/dgi-qrcode.ts
import QRCode from 'qrcode'

interface DGIQRData {
  ice: string           // ICE entreprise
  if: string            // Identifiant Fiscal
  invoiceNumber: string // Numéro facture
  date: string          // Date émission
  totalTT: number       // Total TTC
  totalTVA: number      // Total TVA
  signature: string     // Signature électronique
}

export async function generateDGIQRCode(data: DGIQRData): Promise<string> {
  // Format DGI 2026 standardisé
  const qrString = [
    data.ice,
    data.if,
    data.invoiceNumber,
    data.date,
    data.totalTT.toFixed(2),
    data.totalTVA.toFixed(2),
    data.signature
  ].join('|')
  
  return QRCode.toDataURL(qrString, {
    errorCorrectionLevel: 'M',
    type: 'image/png'
  })
}
```

#### Workflow à Implémenter

```
Création Facture
      ↓
Validation Données
      ↓
Génération Numéro Séquentiel
      ↓
Calcul TVA par Taux
      ↓
Génération QR Code DGI
      ↓
Signature Électronique
      ↓
Stockage + Audit Log
      ↓
Envoi Email Client
```

---

### 3. 🔗 MODULE: Liens de Paiement (Payment Links)

**Statut:** ✅ Actif | **Priorité:** Haute

#### Problèmes Identifiés

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Redirection paiement non implémentée | **Critique** | Fonctionnel |
| 2 | Pas de webhook CIH Pay | Haute | Intégration |
| 3 | Expiration automatique manquante | Moyenne | UX |
| 4 | Pas de rappels automatiques | Moyenne | Engagement |

#### Implémentation Redirection Paiement

```typescript
// /app/pay/[reference]/page.tsx - À corriger
const handlePayment = async () => {
  if (!link) return
  
  setProcessingPayment(true)
  
  // ✅ Implémenter: Appel API pour initier paiement
  const response = await fetch('/api/payment/initiate', {
    method: 'POST',
    body: JSON.stringify({
      reference: link.reference,
      amount: link.amount,
      gateway: 'cmi' // ou 'cih_pay'
    })
  })
  
  const { paymentUrl } = await response.json()
  
  // Rediriger vers la passerelle
  window.location.href = paymentUrl
}
```

#### API Initiation Paiement

```typescript
// /api/payment/initiate/route.ts
import { createHmac } from 'crypto'

export async function POST(request: NextRequest) {
  const { reference, amount, gateway } = await request.json()
  
  if (gateway === 'cmi') {
    // Construction requête CMI
    const params = {
      clientid: process.env.CMI_MERCHANT_ID!,
      oid: reference,
      amount: (amount * 100).toFixed(2), // En centimes
      currency: '504', // MAD
      okUrl: `${process.env.NEXTAUTH_URL}/pay/${reference}/success`,
      failUrl: `${process.env.NEXTAUTH_URL}/pay/${reference}/failed`,
      lang: 'fr',
      // ... autres paramètres CMI
    }
    
    // Génération signature
    const hash = generateCMISignature(params)
    
    return NextResponse.json({
      paymentUrl: 'https://payment.cmi.co.ma/fim/est3Dgate',
      method: 'POST',
      params: { ...params, hash }
    })
  }
  
  if (gateway === 'cih_pay') {
    // Implémentation CIH Pay
    const response = await fetch('https://api.cihpay.ma/v2/payment/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CIH_PAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        merchantTransactionId: reference,
        amount: amount,
        currency: 'MAD',
        successUrl: `${process.env.NEXTAUTH_URL}/pay/${reference}/success`,
        failureUrl: `${process.env.NEXTAUTH_URL}/pay/${reference}/failed`
      })
    })
    
    const data = await response.json()
    return NextResponse.json({
      paymentUrl: data.paymentUrl
    })
  }
}

function generateCMISignature(params: Record<string, string>): string {
  const sortedParams = Object.keys(params)
    .filter(k => params[k])
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join(':')
  
  return createHmac('sha256', process.env.CMI_STORE_KEY!)
    .update(sortedParams)
    .digest('hex')
    .toUpperCase()
}
```

#### Tâches Cron pour Expiration

```typescript
// /api/cron/expire-links/route.ts
// À appeler via cron job externe (Vercel Cron, node-cron, etc.)

export async function GET(request: NextRequest) {
  // Vérifier secret cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const now = new Date()
  
  // Expirer les liens dépassés
  const expired = await prisma.paymentLink.updateMany({
    where: {
      status: 'pending',
      expiresAt: { lt: now }
    },
    data: { status: 'expired' }
  })
  
  // Envoyer rappels (24h avant expiration)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const toRemind = await prisma.paymentLink.findMany({
    where: {
      status: 'pending',
      expiresAt: { lt: tomorrow, gt: now }
    }
  })
  
  for (const link of toRemind) {
    // Envoyer email/SMS de rappel
    await sendReminderNotification(link)
  }
  
  return NextResponse.json({ expired: expired.count, reminded: toRemind.length })
}
```

---

### 4. 👥 MODULE: Clients

**Statut:** ✅ Actif | **Priorité:** Haute

#### Problèmes Identifiés

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Pas de validation ICE via API | Haute | Qualité |
| 2 | Pas d'historique paginé | Basse | Performance |
| 3 | Recherche insensible à la casse manquante | Basse | UX |

#### Implémentation Validation ICE

```typescript
// /lib/ice-validator.ts
export async function validateICE(ice: string): Promise<{
  valid: boolean
  company?: {
    name: string
    legalForm: string
    address: string
  }
  error?: string
}> {
  try {
    // API ANPME (si disponible) ou validation locale
    const response = await fetch(
      `https://api.anpme.ma/entreprise/${ice}`,
      { headers: { 'Authorization': `Bearer ${process.env.ANPME_API_KEY}` } }
    )
    
    if (!response.ok) {
      return { valid: false, error: 'ICE non trouvé' }
    }
    
    const data = await response.json()
    return { valid: true, company: data }
  } catch {
    // Fallback: validation format local
    const isValid = /^\d{15}$/.test(ice)
    return { valid: isValid, error: isValid ? undefined : 'Format ICE invalide' }
  }
}
```

---

### 5. 💳 MODULE: Passerelles de Paiement (Gateways)

**Statut:** ⚠️ Partiel | **Priorité:** **Critique**

#### Problèmes Identifiés

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Configuration non persistée en BDD | **Critique** | Données |
| 2 | Webhook CIH Pay manquant | **Critique** | Intégration |
| 3 | Webhook Fatourati manquant | Haute | Intégration |
| 4 | Pas de test de connexion | Moyenne | UX |

#### Schéma Base de Données pour Gateways

```prisma
// Ajouter au schema.prisma
model PaymentGateway {
  id          String   @id @default(cuid())
  userId      String
  
  gatewayId   String   // 'cmi', 'cih_pay', 'fatourati'
  enabled     Boolean  @default(false)
  testMode    Boolean  @default(true)
  
  // Configuration chiffrée
  configEnc   String   // JSON chiffré avec AES-256-GCM
  
  // Statistiques
  totalPayments Int    @default(0)
  totalAmount   Float  @default(0)
  lastUsedAt    DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId, gatewayId])
}
```

#### Webhook CIH Pay à Créer

```typescript
// /api/webhooks/cih-pay/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Vérifier signature CIH Pay
    const signature = request.headers.get('x-cih-signature')
    const expectedSig = generateCIHSignature(body, process.env.CIH_PAY_SECRET!)
    
    if (signature !== expectedSig) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    const { 
      merchantTransactionId,
      transactionId,
      status,
      amount,
      currency 
    } = body
    
    if (status === 'SUCCESS') {
      await prisma.paymentLink.update({
        where: { reference: merchantTransactionId },
        data: {
          status: 'paid',
          paidAt: new Date(),
          gatewayPaymentId: transactionId,
          gatewayFee: amount * 0.018 // 1.8% CIH Pay
        }
      })
      
      // Notifier l'utilisateur
      // Créer audit log
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[CIH Pay Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

### 6. 📊 MODULE: Rapports (Reports)

**Statut:** ⚠️ Basique | **Priorité:** Haute

#### Problèmes Identifiés

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Pas d'export Excel/PDF | Haute | Fonctionnel |
| 2 | Graphiques manquants | Haute | UX |
| 3 | Pas de comparaison périodes | Moyenne | Analyse |
| 4 | Rapport TVA trimestriel manquant | Haute | Conformité |

#### Implémentation Rapport TVA

```typescript
// /api/reports/tva/route.ts
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const startDate = new Date(searchParams.get('start') || '')
  const endDate = new Date(searchParams.get('end') || '')
  
  // TVA Collectée (Factures émises)
  const tvaCollected = await prisma.invoice.aggregate({
    where: {
      userId: session.user.id,
      status: 'paid',
      paidAt: { gte: startDate, lte: endDate }
    },
    _sum: { tvaAmount: true }
  })
  
  // TVA Déductible (Dépenses)
  const tvaDeductible = await prisma.expense.aggregate({
    where: {
      userId: session.user.id,
      date: { gte: startDate, lte: endDate }
    },
    _sum: { tvaAmount: true }
  })
  
  // Détail par taux
  const byRate = await prisma.$queryRaw`
    SELECT 
      i.tva_rate,
      SUM(i.quantity * i.unit_price * i.tva_rate / 100) as tva_amount
    FROM invoice_items i
    JOIN invoices inv ON i.invoice_id = inv.id
    WHERE inv.user_id = $1 
      AND inv.status = 'paid'
      AND inv.paid_at BETWEEN $2 AND $3
    GROUP BY i.tva_rate
    ORDER BY i.tva_rate
  `
  
  return NextResponse.json({
    period: { start: startDate, end: endDate },
    tvaCollected: tvaCollected._sum.tvaAmount || 0,
    tvaDeductible: tvaDeductible._sum.tvaAmount || 0,
    tvaDue: (tvaCollected._sum.tvaAmount || 0) - (tvaDeductible._sum.tvaAmount || 0),
    byRate,
    generatedAt: new Date()
  })
}
```

---

### 7. 🤖 MODULE: AI Lead Qualifier

**Statut:** ✅ Actif | **Priorité:** Moyenne

#### Problèmes Identifiés

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Conversations non persistées | Haute | Données |
| 2 | Rate limiting Gemini manquant | Moyenne | Coût |
| 3 | Pas de fallback si IA indisponible | Moyenne | Fiabilité |

#### Améliorations Suggérées

```typescript
// 1. Persister conversations
model AIConversation {
  id            String   @id @default(cuid())
  userId        String
  leadId        String?
  phoneNumber   String
  status        String   @default("active")
  messages      AIConversationMessage[]
  qualification String?  // hot, warm, cold
  extractedData String?  // JSON
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model AIConversationMessage {
  id             String   @id @default(cuid())
  conversationId String
  role           String   // user, assistant
  content        String
  createdAt      DateTime @default(now())
  
  conversation AIConversation @relation(fields: [conversationId], references: [id])
}

// 2. Rate Limiter pour Gemini
const geminiLimiter = new RateLimiter({
  tokensPerMinute: 60,
  tokensPerDay: 1000
})

// 3. Fallback local
async function getAIResponse(message: string): Promise<string> {
  if (!geminiLimiter.canConsume()) {
    // Fallback: réponse basique locale
    return getFallbackResponse(message)
  }
  
  try {
    return await geminiService.generate(message)
  } catch {
    return getFallbackResponse(message)
  }
}
```

---

### 8. 📦 MODULE: Stock/Inventaire

**Statut:** ⚠️ Incomplet | **Priorité:** Moyenne

#### Problèmes Identifiés

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Mouvements stock non implémentés | **Critique** | Fonctionnel |
| 2 | Alertes stock bas manquantes | Haute | UX |
| 3 | Pas d'intégration factures | Haute | Workflow |

#### Implémentation Mouvements Stock

```prisma
model StockMovement {
  id          String   @id @default(cuid())
  productId   String
  type        String   // in, out, adjustment
  quantity    Float
  reason      String?
  reference   String?  // Invoice ID, etc.
  unitCost    Float?
  
  createdAt   DateTime @default(now())
  
  product Product @relation(fields: [productId], references: [id])
}

// Mise à jour automatique du stock
// À appeler lors de la facturation
async function updateStockOnInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true }
  })
  
  for (const item of invoice.items) {
    if (item.productId) {
      // Créer mouvement sortie
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          reason: 'Facture',
          reference: invoiceId
        }
      })
      
      // Mettre à jour stock produit
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      })
      
      // Vérifier alerte stock bas
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })
      if (product.stock <= product.minStock) {
        await sendLowStockAlert(product)
      }
    }
  }
}
```

---

### 9. 👨‍💼 MODULE: Équipe (Team)

**Statut:** ⚠️ Partiel | **Priorité:** Moyenne

#### Problèmes Identifiés

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Invitations non envoyées | Haute | Fonctionnel |
| 2 | Permissions non implémentées | Haute | Sécurité |
| 3 | Pas de multi-tenancy | Moyenne | Architecture |

#### Système de Permissions

```typescript
// /lib/permissions.ts
export const PERMISSIONS = {
  // Invoices
  invoices_read: 'invoices:read',
  invoices_write: 'invoices:write',
  invoices_delete: 'invoices:delete',
  
  // Clients
  clients_read: 'clients:read',
  clients_write: 'clients:write',
  
  // Reports
  reports_read: 'reports:read',
  reports_export: 'reports:export',
  
  // Settings
  settings_read: 'settings:read',
  settings_write: 'settings:write',
  
  // Team
  team_manage: 'team:manage',
}

export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  accountant: [
    PERMISSIONS.invoices_read,
    PERMISSIONS.invoices_write,
    PERMISSIONS.clients_read,
    PERMISSIONS.clients_write,
    PERMISSIONS.reports_read,
  ],
  viewer: [
    PERMISSIONS.invoices_read,
    PERMISSIONS.clients_read,
    PERMISSIONS.reports_read,
  ]
}

// Middleware de vérification
export function hasPermission(userRole: string, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false
}
```

---

### 10. 🔑 MODULE: Clés API

**Statut:** ⚠️ Partiel | **Priorité:** Moyenne

#### Problèmes Identifiés

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Clés non persistées | **Critique** | Données |
| 2 | Pas de tracking d'utilisation | Haute | Analytics |
| 3 | Rate limiting API manquant | Haute | Sécurité |

#### Implémentation Complète

```prisma
model ApiKey {
  id          String   @id @default(cuid())
  userId      String
  key         String   @unique
  name        String
  permissions String   // JSON array
  lastUsedAt  DateTime?
  usageCount  Int      @default(0)
  expiresAt   DateTime?
  revoked     Boolean  @default(false)
  
  createdAt DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 🔒 Problèmes Transversaux

### Sécurité

| Problème | Solution |
|----------|----------|
| CSRF sur API POST | ✅ Déjà implémenté |
| Rate limiting | ⚠️ Partiel - Étendre à toutes les routes |
| Validation input | ❌ Ajouter Zod sur toutes les routes |
| Audit logs | ⚠️ Partiel - Étendre à tous les modules |

### Performance

| Problème | Solution |
|----------|----------|
| N+1 queries | Utiliser `include` Prisma systématiquement |
| Pas de pagination | Ajouter offset/limit sur toutes les listes |
| Pas de cache | Implémenter Redis pour métriques |

### UX

| Problème | Solution |
|----------|----------|
| Pas de mode hors ligne | PWA avec Service Worker |
| Notifications navigateur | Web Push API |
| États de chargement | Skeleton loaders |

---

## 📋 Plan d'Action Prioritaire

### Phase 1: Critique (Semaine 1-2)

1. **[ ] Implémenter QR Code DGI 2026** - Conformité légale
2. **[ ] Persister configuration gateways** - Paiements fonctionnels
3. **[ ] Créer webhook CIH Pay** - Intégration paiement
4. **[ ] Implémenter redirection paiement** - UX client

### Phase 2: Haute Priorité (Semaine 3-4)

1. **[ ] Validation ICE clients**
2. **[ ] Export rapports Excel/PDF**
3. **[ ] Système de permissions équipe**
4. **[ ] Persister clés API**

### Phase 3: Améliorations (Semaine 5-6)

1. **[ ] Graphiques dashboard**
2. **[ ] Alertes stock bas**
3. **[ ] Rappels automatiques échéances**
4. **[ ] Test de connexion gateways**

---

## 🎯 Recommandations d'Architecture

### 1. Migration vers Architecture Modulaire

```
/src/modules/
├── /core
│   ├── /invoices
│   │   ├── /api
│   │   ├── /components
│   │   ├── /hooks
│   │   └── /types
│   └── /payment-links
├── /crm
│   ├── /clients
│   └── /leads
└── /integrations
    ├── /gateways
    └── /api-keys
```

### 2. Ajouter Couche de Validation

```typescript
// /lib/validations/invoice.ts
import { z } from 'zod'

export const createInvoiceSchema = z.object({
  clientId: z.string().cuid(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().positive(),
    tvaRate: z.enum(['0', '7', '10', '14', '20'])
  })).min(1),
  dueDate: z.string().datetime(),
  notes: z.string().optional()
})
```

### 3. Implémenter Repository Pattern

```typescript
// /lib/repositories/invoice.repository.ts
export class InvoiceRepository {
  async create(data: CreateInvoiceDTO) { ... }
  async findById(id: string) { ... }
  async findByUser(userId: string, filters: InvoiceFilters) { ... }
  async updateStatus(id: string, status: InvoiceStatus) { ... }
}
```

---

## 📈 Métriques de Qualité Cibles

| Métrique | Actuel | Cible |
|----------|--------|-------|
| Couverture tests | ~0% | 70% |
| Linting errors | ? | 0 |
| TypeScript strict | Partiel | 100% |
| Performance Lighthouse | ? | 90+ |
| Accessibilité WCAG | ? | AA |

---

*Document généré le: $(new Date().toLocaleDateString('fr-MA'))*
*Version: 1.0*
