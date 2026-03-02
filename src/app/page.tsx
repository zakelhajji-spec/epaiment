'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, Sparkles, FileText, Link2, Users, Wallet, CheckCircle } from 'lucide-react'
import { MODULES_CONFIG } from '@/lib/modules.config'

type Language = 'fr' | 'ar'

// Translations
const translations = {
  fr: {
    heroTitle: 'Gérez votre',
    heroTitleHighlight: 'facturation',
    heroTitleEnd: 'en toute simplicité',
    heroSubtitle: 'Solution marocaine modulaire de facturation électronique. Payez uniquement pour les fonctionnalités dont vous avez besoin.',
    getStarted: 'Commencer gratuitement',
    login: 'Connexion',
    dgiCompliant: 'Conforme DGI 2026',
    modulesTitle: 'Modules disponibles',
    features: [
      { title: 'Factures conformes', desc: 'Factures électroniques conformes DGI 2026 avec QR code' },
      { title: 'Liens de paiement', desc: 'Générez et partagez des liens de paiement instantanés' },
      { title: 'Gestion TVA', desc: 'Calcul automatique et rapports TVA' },
      { title: 'Clients & Fournisseurs', desc: 'Gestion complète de vos contacts professionnels' },
    ],
    pricing: 'Tarification modulaire',
    pricingDesc: 'Payez uniquement pour ce dont vous avez besoin',
    free: 'Gratuit',
    perMonth: '/mois',
    footer: 'Solution de facturation conforme DGI 2026',
  },
  ar: {
    heroTitle: 'أدر',
    heroTitleHighlight: 'فواتيرك',
    heroTitleEnd: 'بسهولة تامة',
    heroSubtitle: 'حل مغربي معياري للفواتير الإلكترونية. ادفع فقط مقابل الميزات التي تحتاجها.',
    getStarted: 'ابدأ مجاناً',
    login: 'تسجيل الدخول',
    dgiCompliant: 'متوافق مع DGI 2026',
    modulesTitle: 'الوحدات المتاحة',
    features: [
      { title: 'فواتير متوافقة', desc: 'فواتير إلكترونية متوافقة مع DGI 2026 مع رمز QR' },
      { title: 'روابط الدفع', desc: 'أنشئ وشارك روابط الدفع الفورية' },
      { title: 'إدارة ضريبة القيمة المضافة', desc: 'حساب تلقائي وتقارير ضريبة القيمة المضافة' },
      { title: 'العملاء والموردين', desc: 'إدارة كاملة لجهات اتصالك المهنية' },
    ],
    pricing: 'أسعار معيارية',
    pricingDesc: 'ادفع فقط ما تحتاجه',
    free: 'مجاني',
    perMonth: '/شهر',
    footer: 'حل فواتير متوافق مع DGI 2026',
  }
}

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [language, setLanguage] = useState<Language>('fr')

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const t = translations[language]

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 animate-pulse">
            E
          </div>
          <p className="text-gray-500">{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</p>
        </div>
      </div>
    )
  }

  // Don't render landing page if authenticated (will redirect)
  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              E
            </div>
            <span className="text-xl font-bold text-gray-800">Epaiement.ma</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'fr' ? 'ar' : 'fr')}>
              <Globe className="w-5 h-5" />
            </Button>
            <Link href="/auth/login">
              <Button variant="ghost">{t.login}</Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-blue-600 hover:bg-blue-700">{t.getStarted}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 lg:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700">
            <Sparkles className="w-4 h-4 mr-1" />
            {t.dgiCompliant}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {t.heroTitle}{' '}
            <span className="text-blue-600">{t.heroTitleHighlight}</span>
            {language === 'fr' ? ` ${t.heroTitleEnd}` : ` ${t.heroTitleEnd}`}
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {t.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 h-14">
                {t.getStarted}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t.features.length > 0 ? (language === 'fr' ? 'Fonctionnalités' : 'المميزات') : ''}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.features.map((feature, i) => (
              <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {[FileText, Link2, Wallet, Users][i] && 
                      (() => {
                        const Icon = [FileText, Link2, Wallet, Users][i]
                        return <Icon className="w-7 h-7 text-blue-600" />
                      })()
                    }
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">{t.modulesTitle}</h2>
          <p className="text-gray-600 text-center mb-12">{t.pricingDesc}</p>
          <div className="grid md:grid-cols-3 gap-8">
            {Object.entries(MODULES_CONFIG).slice(0, 6).map(([id, mod]) => (
              <Card key={id} className="border-0 shadow-lg hover:shadow-xl transition">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{language === 'ar' ? mod.nameAr : mod.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{language === 'ar' ? mod.descriptionAr : mod.description}</p>
                  <Badge variant={mod.price === 0 ? 'default' : 'outline'} className="text-base">
                    {mod.price === 0 ? t.free : `${mod.price} MAD${t.perMonth}`}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-emerald-500 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {language === 'fr' ? 'Prêt à commencer ?' : 'جاهز للبدء؟'}
          </h2>
          <p className="text-white/90 mb-8">
            {language === 'fr' 
              ? 'Créez votre compte gratuitement et commencez à facturer en quelques minutes.'
              : 'أنشئ حسابك مجاناً وابدأ في إصدار الفواتير في دقائق.'}
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 h-14">
              {t.getStarted}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2025 Epaiement.ma - {t.footer}</p>
        </div>
      </footer>
    </div>
  )
}
