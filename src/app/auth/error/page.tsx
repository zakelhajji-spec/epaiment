'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

const errorMessages: Record<string, string> = {
  Configuration: 'Erreur de configuration du serveur. Veuillez contacter le support.',
  AccessDenied: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
  Verification: 'La vérification a échoué. Le lien peut avoir expiré.',
  Default: 'Une erreur d\'authentification est survenue.'
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'Default'
  
  const errorMessage = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B3F66] to-[#0D1F33] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">Erreur</CardTitle>
          <CardDescription>
            {errorMessage}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Code d'erreur: {error}
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Link href="/auth/login" className="w-full">
            <Button className="w-full bg-[#1B3F66] hover:bg-[#1B3F66]/90">
              Retour à la connexion
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Accueil
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B3F66] to-[#0D1F33]">
        <div className="text-white">Chargement...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
