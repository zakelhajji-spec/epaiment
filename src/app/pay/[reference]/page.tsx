'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, CheckCircle, XCircle, Clock, CreditCard, Copy, Check, Phone, Mail, User } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface PaymentLink {
  id: string
  reference: string
  amount: number
  description: string
  clientName: string | null
  clientEmail: string | null
  clientPhone: string | null
  status: string
  dueDate: string | null
  paymentUrl: string | null
  createdAt: string
  user?: {
    companyName: string | null
    companyPhone: string | null
    companyEmail: string | null
  }
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const reference = params.reference as string
  
  const [link, setLink] = useState<PaymentLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    fetchPaymentLink()
  }, [reference])

  const fetchPaymentLink = async () => {
    try {
      const response = await fetch(`/api/public/payment-link/${reference}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Ce lien de paiement n\'existe pas ou a expiré.')
        } else {
          setError('Erreur lors du chargement du lien de paiement.')
        }
        return
      }
      
      const data = await response.json()
      setLink(data)
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyReference = () => {
    navigator.clipboard.writeText(reference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePayment = async () => {
    if (!link) return
    
    setProcessingPayment(true)
    
    // In production, this would redirect to payment gateway
    // For now, show a message
    alert('Redirection vers la passerelle de paiement...\n\nIntégration CMI/Fatourati requise.')
    setProcessingPayment(false)
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('fr-MA', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: any }> = {
      pending: { variant: 'outline', label: 'En attente', icon: Clock },
      paid: { variant: 'default', label: 'Payé', icon: CheckCircle },
      expired: { variant: 'destructive', label: 'Expiré', icon: XCircle },
      cancelled: { variant: 'secondary', label: 'Annulé', icon: XCircle }
    }
    
    const config = variants[status] || variants.pending
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B3F66] to-[#0D1F33] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B3F66]" />
            <span className="ml-2">Chargement...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B3F66] to-[#0D1F33] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle>Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Already paid
  if (link?.status === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle>Paiement effectué</CardTitle>
            <CardDescription>Ce lien de paiement a déjà été réglé.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-3xl font-bold text-green-600 mb-2">
              {formatAmount(link.amount)}
            </p>
            <p className="text-muted-foreground">{link.description}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Expired or cancelled
  if (link?.status === 'expired' || link?.status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle>Lien {link.status === 'expired' ? 'expiré' : 'annulé'}</CardTitle>
            <CardDescription>
              Ce lien de paiement n'est plus valide.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Veuillez contacter le commerçant pour obtenir un nouveau lien.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Active payment link
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B3F66] to-[#0D1F33] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#1B3F66] rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">É</span>
            </div>
          </div>
          <CardTitle className="text-xl">Lien de paiement</CardTitle>
          <CardDescription>
            {link?.user?.companyName || 'Epaiement.ma'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Amount */}
          <div className="text-center py-4 bg-muted rounded-lg">
            <p className="text-4xl font-bold text-[#1B3F66]">
              {formatAmount(link?.amount || 0)}
            </p>
          </div>
          
          {/* Description */}
          <div>
            <p className="font-medium">{link?.description}</p>
          </div>
          
          <Separator />
          
          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Référence:</span>
              <button 
                onClick={handleCopyReference}
                className="flex items-center gap-1 text-[#1B3F66] hover:underline"
              >
                {reference}
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            
            {link?.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date limite:</span>
                <span>{formatDate(link.dueDate)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Statut:</span>
              {getStatusBadge(link?.status || 'pending')}
            </div>
          </div>
          
          {/* Client info */}
          {link?.clientName && (
            <div className="space-y-2 text-sm">
              <Separator />
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{link.clientName}</span>
              </div>
              {link.clientEmail && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{link.clientEmail}</span>
                </div>
              )}
              {link.clientPhone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{link.clientPhone}</span>
                </div>
              )}
            </div>
          )}
          
          {/* QR Code */}
          <div className="flex justify-center py-4">
            <QRCodeSVG 
              value={`${window.location.origin}/pay/${reference}`}
              size={120}
              level="H"
              includeMargin
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex-col gap-2">
          <Button 
            className="w-full bg-[#1B3F66] hover:bg-[#1B3F66]/90"
            onClick={handlePayment}
            disabled={processingPayment}
          >
            {processingPayment ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Payer maintenant
              </>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Paiement sécurisé par CMI, Fatourati ou CIH Pay
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
