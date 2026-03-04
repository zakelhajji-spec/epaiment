'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Globe,
  FileText,
  Link2,
  Users,
  Wallet,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  BarChart3,
  MessageSquare,
  CreditCard,
  Building2,
  Menu,
  X,
  Play,
  Star,
  Clock,
  Lock,
  TrendingUp,
  Send,
  QrCode,
  Bell,
  Settings,
  ChevronRight,
  Phone
} from 'lucide-react'
import { MODULES_CONFIG } from '@/lib/modules.config'

type Language = 'fr' | 'ar'

const translations = {
  fr: {
    // Header
    navFeatures: 'Fonctionnalités',
    navPricing: 'Tarifs',
    navAbout: 'À propos',
    login: 'Connexion',
    getStarted: 'Commencer gratuitement',
    
    // Hero
    heroBadge: 'Conforme DGI 2026',
    heroTitle: 'Des liens de paiement',
    heroTitleHighlight: 'en quelques clics',
    heroSubtitle: 'Créez et partagez des pages de paiement professionnelles sans aucun code. Acceptez les paiements par carte, virement ou espèces.',
    heroCTA: 'Créer un lien gratuit',
    heroSecondary: 'Voir la démo',
    heroStat1: '10K+',
    heroStat1Label: 'Factures traitées',
    heroStat2: '99.9%',
    heroStat2Label: 'Disponibilité',
    heroStat3: '24/7',
    heroStat3Label: 'Support',
    
    // Logos
    trustedBy: 'Ils nous font confiance',
    
    // Features
    featuresTitle: 'Tout ce dont vous avez besoin',
    featuresSubtitle: 'Une solution complète pour gérer vos paiements et factures au Maroc',
    features: [
      {
        icon: 'Link2',
        title: 'Liens de paiement instantanés',
        desc: 'Générez des liens de paiement en quelques secondes. Partagez-les par SMS, email ou WhatsApp. Aucun site web requis.'
      },
      {
        icon: 'FileText',
        title: 'Factures conformes DGI',
        desc: 'Factures électroniques 100% conformes aux exigences DGI 2026 avec QR code unique et horodatage automatique.'
      },
      {
        icon: 'CreditCard',
        title: 'Multi-moyens de paiement',
        desc: 'Acceptez les paiements par carte bancaire, virement, ou espèces. Intégration avec les principales banques marocaines.'
      },
      {
        icon: 'Users',
        title: 'Gestion clients complète',
        desc: 'CRM intégré pour gérer vos clients et fournisseurs. Historique des transactions et relances automatiques.'
      },
      {
        icon: 'BarChart3',
        title: 'Rapports analytiques',
        desc: 'Tableaux de bord en temps réel. Suivez vos revenus, TVA et performance commerciale.'
      },
      {
        icon: 'MessageSquare',
        title: 'IA pour WhatsApp',
        desc: 'Assistant IA pour qualifier vos leads et automatiser les conversations sur WhatsApp Business.'
      }
    ],
    
    // How it works
    howItWorksTitle: 'Comment ça marche',
    howItWorksSubtitle: 'Trois étapes simples pour accepter vos premiers paiements',
    steps: [
      {
        number: '01',
        title: 'Créez votre compte',
        desc: 'Inscription gratuite en 2 minutes. Aucune carte bancaire requise.'
      },
      {
        number: '02',
        title: 'Générez un lien',
        desc: 'Définissez le montant, la description et les options de paiement.'
      },
      {
        number: '03',
        title: 'Recevez les paiements',
        desc: 'Partagez le lien et recevez les paiements directement sur votre compte.'
      }
    ],
    
    // Pricing
    pricingTitle: 'Tarification transparente',
    pricingSubtitle: 'Commencez gratuitement, évoluez à votre rythme',
    plans: [
      {
        name: 'Starter',
        price: 'Gratuit',
        period: '',
        features: ['10 factures/mois', 'Liens de paiement illimités', '1 utilisateur', 'Support email'],
        cta: 'Commencer gratuitement',
        popular: false
      },
      {
        name: 'Pro',
        price: '199',
        period: 'MAD/mois',
        features: ['Factures illimitées', 'Multi-utilisateurs', 'Rapports avancés', 'Support prioritaire', 'API complète'],
        cta: 'Essai gratuit 14 jours',
        popular: true
      },
      {
        name: 'Enterprise',
        price: 'Sur mesure',
        period: '',
        features: ['Tout dans Pro', 'Intégrations sur mesure', 'Account manager dédié', 'SLA garanti', 'Formation équipe'],
        cta: 'Nous contacter',
        popular: false
      }
    ],
    
    // Testimonials
    testimonialsTitle: 'Ce que disent nos clients',
    testimonials: [
      {
        quote: "Depuis que j'utilise Epaiement.ma, j'ai réduit de 50% le temps consacré à ma facturation. L'interface est intuitive et les liens de paiement sont un game-changer.",
        author: 'Karim B.',
        role: 'Consultant freelance',
        avatar: 'K'
      },
      {
        quote: "La conformité DGI 2026 était un vrai casse-tête. Epaiement.ma a géré tout ça pour moi. Je recommande à 100%.",
        author: 'Fatima Z.',
        role: 'Gérante de magasin',
        avatar: 'F'
      },
      {
        quote: "Le support client est exceptionnel. Ils m'ont aidé à configurer tout mon système de facturation en moins d'une heure.",
        author: 'Omar T.',
        role: 'Entrepreneur',
        avatar: 'O'
      }
    ],
    
    // CTA
    ctaTitle: 'Prêt à simplifier vos paiements ?',
    ctaSubtitle: 'Rejoignez des milliers d\'entrepreneurs marocains qui font confiance à Epaiement.ma',
    ctaButton: 'Créer mon compte gratuit',
    ctaNote: 'Aucune carte bancaire requise • Configuration en 2 minutes',
    
    // Footer
    footerProduct: 'Produit',
    footerCompany: 'Entreprise',
    footerSupport: 'Support',
    footerLegal: 'Légal',
    footerLinks: {
      product: ['Liens de paiement', 'Facturation', 'CRM', 'Rapports', 'API'],
      company: ['À propos', 'Blog', 'Carrières', 'Presse', 'Partenaires'],
      support: ['Centre d\'aide', 'Documentation', 'Statut', 'Nous contacter'],
      legal: ['Confidentialité', 'CGU', 'Cookies']
    },
    footerCopyright: '© 2025 Epaiement.ma. Tous droits réservés.',
    footerTagline: 'Solution de facturation conforme DGI 2026 pour les entrepreneurs marocains.'
  },
  ar: {
    // Header
    navFeatures: 'المميزات',
    navPricing: 'الأسعار',
    navAbout: 'من نحن',
    login: 'تسجيل الدخول',
    getStarted: 'ابدأ مجاناً',
    
    // Hero
    heroBadge: 'متوافق مع DGI 2026',
    heroTitle: 'روابط دفع',
    heroTitleHighlight: 'في نقرات قليلة',
    heroSubtitle: 'أنشئ وشارك صفحات دفع احترافية بدون أي كود. اقبل الدفع بالبطاقة أو التحويل أو النقد.',
    heroCTA: 'أنشئ رابطاً مجانياً',
    heroSecondary: 'شاهد العرض',
    heroStat1: '+10 آلاف',
    heroStat1Label: 'فاتورة معالجة',
    heroStat2: '99.9%',
    heroStat2Label: 'توفر',
    heroStat3: '24/7',
    heroStat3Label: 'دعم',
    
    // Logos
    trustedBy: 'يثق بنا',
    
    // Features
    featuresTitle: 'كل ما تحتاجه',
    featuresSubtitle: 'حل متكامل لإدارة مدفوعاتك وفواتيرك في المغرب',
    features: [
      {
        icon: 'Link2',
        title: 'روابط دفع فورية',
        desc: 'أنشئ روابط الدفع في ثوانٍ. شاركها عبر SMS أو البريد أو واتساب. لا حاجة لموقع.'
      },
      {
        icon: 'FileText',
        title: 'فواتير متوافقة DGI',
        desc: 'فواتير إلكترونية 100% متوافقة مع متطلبات DGI 2026 مع رمز QR فريد.'
      },
      {
        icon: 'CreditCard',
        title: 'وسائل دفع متعددة',
        desc: 'اقبل الدفع بالبطاقة البنكية أو التحويل أو النقد. تكامل مع البنوك المغربية.'
      },
      {
        icon: 'Users',
        title: 'إدارة كاملة للعملاء',
        desc: 'CRM متكامل لإدارة عملائك ومورديك. سجل المعاملات والمتابعات التلقائية.'
      },
      {
        icon: 'BarChart3',
        title: 'تقارير تحليلية',
        desc: 'لوحات تحكم في الوقت الحقيقي. تابع إيراداتك وضريبة القيمة المضافة.'
      },
      {
        icon: 'MessageSquare',
        title: 'ذكاء اصطناعي لواتساب',
        desc: 'مساعد ذكي لتأهيل العملاء وأتمتة المحادثات على واتساب بيزنس.'
      }
    ],
    
    // How it works
    howItWorksTitle: 'كيف يعمل',
    howItWorksSubtitle: 'ثلاث خطوات بسيطة لقبول مدفوعاتك الأولى',
    steps: [
      {
        number: '01',
        title: 'أنشئ حسابك',
        desc: 'تسجيل مجاني في دقيقتين. لا حاجة لبطاقة بنكية.'
      },
      {
        number: '02',
        title: 'أنشئ رابطاً',
        desc: 'حدد المبلغ والوصف وخيارات الدفع.'
      },
      {
        number: '03',
        title: 'استلم المدفوعات',
        desc: 'شارك الرابط واستلم المدفوعات مباشرة على حسابك.'
      }
    ],
    
    // Pricing
    pricingTitle: 'أسعار شفافة',
    pricingSubtitle: 'ابدأ مجاناً، تطور حسب حاجتك',
    plans: [
      {
        name: 'مبتدئ',
        price: 'مجاني',
        period: '',
        features: ['10 فواتير/شهر', 'روابط دفع غير محدودة', 'مستخدم واحد', 'دعم بالبريد'],
        cta: 'ابدأ مجاناً',
        popular: false
      },
      {
        name: 'احترافي',
        price: '199',
        period: 'درهم/شهر',
        features: ['فواتير غير محدودة', 'متعدد المستخدمين', 'تقارير متقدمة', 'دعم أولوي', 'API كاملة'],
        cta: 'تجربة مجانية 14 يوم',
        popular: true
      },
      {
        name: 'مؤسسات',
        price: 'حسب الطلب',
        period: '',
        features: ['كل ميزات الاحترافي', 'تكاملات مخصصة', 'مدير حساب مخصص', 'SLA مضمون', 'تدريب الفريق'],
        cta: 'اتصل بنا',
        popular: false
      }
    ],
    
    // Testimonials
    testimonialsTitle: 'ماذا يقول عملاؤنا',
    testimonials: [
      {
        quote: "منذ استخدامي لـ Epaiement.ma، خفضت بنسبة 50% الوقت المخصص للفواتير. الواجهة سهلة وروابط الدفع غيرت كل شيء.",
        author: 'كريم ب.',
        role: 'مستشار مستقل',
        avatar: 'K'
      },
      {
        quote: "التوافق مع DGI 2026 كان صداعاً حقيقياً. Epaiement.ma تولى كل شيء لي. أنصح به 100%.",
        author: 'فاطمة ز.',
        role: 'مديرة متجر',
        avatar: 'F'
      },
      {
        quote: "دعم العملاء استثنائي. ساعدوني في إعداد نظام الفواتير كاملاً في أقل من ساعة.",
        author: 'عمر ت.',
        role: 'رائد أعمال',
        avatar: 'O'
      }
    ],
    
    // CTA
    ctaTitle: 'مستعد لتبسيط مدفوعاتك؟',
    ctaSubtitle: 'انضم إلى آلاف رواد الأعمال المغاربة الذين يثقون بـ Epaiement.ma',
    ctaButton: 'أنشئ حسابي المجاني',
    ctaNote: 'لا حاجة لبطاقة بنكية • إعداد في دقيقتين',
    
    // Footer
    footerProduct: 'المنتج',
    footerCompany: 'الشركة',
    footerSupport: 'الدعم',
    footerLegal: 'قانوني',
    footerLinks: {
      product: ['روابط الدفع', 'الفواتير', 'CRM', 'التقارير', 'API'],
      company: ['من نحن', 'المدونة', 'الوظائف', 'الصحافة', 'الشركاء'],
      support: ['مركز المساعدة', 'التوثيق', 'الحالة', 'اتصل بنا'],
      legal: ['الخصوصية', 'شروط الاستخدام', 'الكوكيز']
    },
    footerCopyright: '© 2025 Epaiement.ma. جميع الحقوق محفوظة.',
    footerTagline: 'حل فواتير متوافق مع DGI 2026 لرواد الأعمال المغاربة.'
  }
}

const iconMap: Record<string, any> = {
  Link2, FileText, CreditCard, Users, BarChart3, MessageSquare
}

export default function LandingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [language, setLanguage] = useState<Language>('fr')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const t = translations[language]
  const isRTL = language === 'ar'

  if (status === 'loading') {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)' }}
      >
        <div className="text-center">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 animate-pulse"
            style={{ background: 'linear-gradient(to bottom right, #8b5cf6, #d946ef)' }}
          >
            E
          </div>
          <p className="text-white/70 text-lg">{isRTL ? 'جاري التحميل...' : 'Chargement...'}</p>
        </div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/30">
                E
              </div>
              <span className={`text-xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent ${scrolled ? '' : 'text-white'}`} style={scrolled ? {} : { WebkitBackgroundClip: 'unset', color: 'white' }}>
                Epaiement.ma
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <a href="#features" className={`text-sm font-medium transition-colors hover:text-violet-600 ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                {t.navFeatures}
              </a>
              <a href="#pricing" className={`text-sm font-medium transition-colors hover:text-violet-600 ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                {t.navPricing}
              </a>
              <a href="#testimonials" className={`text-sm font-medium transition-colors hover:text-violet-600 ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
                {t.navAbout}
              </a>
            </div>

            {/* Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLanguage(isRTL ? 'fr' : 'ar')} className={scrolled ? 'text-slate-600' : 'text-white'}>
                <Globe className="w-5 h-5" />
              </Button>
              <Link href="/auth/login">
                <Button variant="ghost" className={scrolled ? 'text-slate-600' : 'text-white'}>
                  {t.login}
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
                  {t.getStarted}
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t shadow-xl">
            <div className="px-4 py-6 space-y-4">
              <a href="#features" className="block text-slate-600 font-medium">{t.navFeatures}</a>
              <a href="#pricing" className="block text-slate-600 font-medium">{t.navPricing}</a>
              <a href="#testimonials" className="block text-slate-600 font-medium">{t.navAbout}</a>
              <hr />
              <div className="flex gap-4">
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full">{t.login}</Button>
                </Link>
                <Link href="/auth/register" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500">{t.getStarted}</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom right, #0f172a, #581c87, #0f172a)' }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        
        {/* Gradient Orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000"
          style={{ backgroundColor: 'rgba(217, 70, 239, 0.2)' }}
        />
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white/90 font-medium">{t.heroBadge}</span>
              <ArrowRight className="w-4 h-4 text-white/50" />
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {t.heroTitle}
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                {t.heroTitleHighlight}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t.heroSubtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/auth/register">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 text-lg px-8 h-14 shadow-2xl shadow-white/20 rounded-xl font-semibold">
                  {t.heroCTA}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 h-14 rounded-xl backdrop-blur-sm">
                <Play className="w-5 h-5 mr-2" />
                {t.heroSecondary}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{t.heroStat1}</div>
                <div className="text-sm text-white/50">{t.heroStat1Label}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{t.heroStat2}</div>
                <div className="text-sm text-white/50">{t.heroStat2Label}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{t.heroStat3}</div>
                <div className="text-sm text-white/50">{t.heroStat3Label}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              {t.featuresTitle}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.features.map((feature, i) => {
              const Icon = iconMap[feature.icon] || Link2
              return (
                <div
                  key={i}
                  className="group bg-white rounded-2xl p-8 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-violet-200/50 transition-all duration-300 hover:-translate-y-1 border border-slate-100"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              {t.howItWorksTitle}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t.howItWorksSubtitle}
            </p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-200 to-transparent transform -translate-y-1/2" />

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {t.steps.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-500/30 relative z-10">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              {t.pricingTitle}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t.pricingSubtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {t.plans.map((plan, i) => (
              <div
                key={i}
                className={`relative bg-white rounded-2xl p-8 ${
                  plan.popular
                    ? 'ring-2 ring-violet-500 shadow-2xl shadow-violet-500/20 scale-105'
                    : 'shadow-lg shadow-slate-200/50 border border-slate-100'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      {isRTL ? 'الأكثر شعبية' : 'Plus populaire'}
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    {plan.period && <span className="text-slate-500">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register">
                  <Button
                    className={`w-full h-12 rounded-xl font-semibold ${
                      plan.popular
                        ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              {t.testimonialsTitle}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {t.testimonials.map((testimonial, i) => (
              <div
                key={i}
                className="bg-slate-50 rounded-2xl p-8 border border-slate-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.author}</div>
                    <div className="text-sm text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            {t.ctaTitle}
          </h2>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            {t.ctaSubtitle}
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-white/90 text-lg px-10 h-14 shadow-2xl shadow-white/20 rounded-xl font-semibold">
              {t.ctaButton}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-white/50 mt-6 text-sm">
            {t.ctaNote}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                  E
                </div>
                <span className="text-xl font-bold text-white">Epaiement.ma</span>
              </div>
              <p className="text-slate-500 mb-6 max-w-xs">
                {t.footerTagline}
              </p>
              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t.footerProduct}</h4>
              <ul className="space-y-3">
                {t.footerLinks.product.map((link, i) => (
                  <li key={i}>
                    <a href="#" className="hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t.footerCompany}</h4>
              <ul className="space-y-3">
                {t.footerLinks.company.map((link, i) => (
                  <li key={i}>
                    <a href="#" className="hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t.footerSupport}</h4>
              <ul className="space-y-3">
                {t.footerLinks.support.map((link, i) => (
                  <li key={i}>
                    <a href="#" className="hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">{t.footerCopyright}</p>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setLanguage(isRTL ? 'fr' : 'ar')} className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Globe className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
