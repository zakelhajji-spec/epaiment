'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Eye, EyeOff, User, Building, Hash, Check, X, ArrowLeft, Shield } from 'lucide-react'

function RegisterForm() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    companyIce: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: 'Au moins 8 caractères' },
    { met: /[A-Z]/.test(formData.password), text: 'Au moins une majuscule' },
    { met: /[a-z]/.test(formData.password), text: 'Au moins une minuscule' },
    { met: /[0-9]/.test(formData.password), text: 'Au moins un chiffre' }
  ]

  const isPasswordValid = passwordRequirements.every(r => r.met)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (!isPasswordValid) {
      setError('Le mot de passe ne répond pas aux exigences')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          companyName: formData.companyName,
          companyIce: formData.companyIce
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'inscription')
        setIsLoading(false)
        return
      }

      router.push('/auth/login?registered=true')
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gradient Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl animate-pulse" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-violet-500/30">
              E
            </div>
            <span className="text-2xl font-bold text-white">Epaiement.ma</span>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Commencez
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              gratuitement
            </span>
          </h1>

          <p className="text-lg text-white/70 mb-8 max-w-md">
            Inscrivez-vous en 2 minutes et commencez à facturer dès aujourd'hui.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {[
              'Essai gratuit 14 jours',
              'Aucune carte bancaire requise',
              'Support inclus'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Back to Home - Mobile */}
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          {/* Logo - Mobile Only */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-violet-500/30">
              E
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              Epaiement.ma
            </span>
          </Link>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Créer un compte</h2>
            <p className="text-slate-500">
              Inscrivez-vous pour commencer
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-11 h-12 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-11 h-12 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Entreprise (optionnel)</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="companyName"
                    name="companyName"
                    placeholder="Entreprise SARL"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="pl-11 h-12 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyIce">ICE (optionnel)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="companyIce"
                    name="companyIce"
                    placeholder="000000000000000"
                    value={formData.companyIce}
                    onChange={handleChange}
                    className="pl-11 h-12 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                    maxLength={15}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-11 pr-11 h-12 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password requirements */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className={`flex items-center text-xs ${req.met ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {req.met ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <X className="h-3.5 w-3.5 mr-1.5" />}
                    {req.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-11 h-12 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>

            <p className="text-center text-slate-500">
              Déjà inscrit?{' '}
              <Link href="/auth/login" className="text-violet-600 hover:text-violet-700 font-semibold">
                Se connecter
              </Link>
            </p>

            <p className="text-xs text-center text-slate-400">
              En vous inscrivant, vous acceptez nos{' '}
              <Link href="/terms" className="underline hover:text-slate-600">conditions d'utilisation</Link>
              {' '}et notre{' '}
              <Link href="/privacy" className="underline hover:text-slate-600">politique de confidentialité</Link>
            </p>
          </form>

          {/* Back to Home - Desktop */}
          <div className="hidden lg:block mt-8 pt-6 border-t">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl animate-pulse shadow-lg shadow-violet-500/30">
          E
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
