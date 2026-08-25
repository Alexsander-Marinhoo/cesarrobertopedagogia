import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, X } from 'lucide-react'

export default function CookieBanner({ onOpenPrivacy: _onOpenPrivacy }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if consent was already given
    const consent = localStorage.getItem('cesar_lgpd_consent')
    if (!consent) {
      // Small delay for smooth entry animation
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem('cesar_lgpd_consent', JSON.stringify({
      status: 'accepted',
      timestamp: new Date().toISOString()
    }))
    setIsVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cesar_lgpd_consent', JSON.stringify({
      status: 'essential_only',
      timestamp: new Date().toISOString()
    }))
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#002B49] text-white p-5 sm:p-6 rounded-3xl shadow-2xl border border-[#073B63] space-y-4 relative overflow-hidden backdrop-blur-md">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#D4AF37]/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#002B49] flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs font-cta font-bold tracking-wider uppercase text-[#D4AF37]">
                Privacidade &amp; Segurança SSL
              </div>
              <div className="text-sm font-serif font-bold text-white">
                Conformidade LGPD
              </div>
            </div>
          </div>

          <button
            onClick={handleDecline}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            aria-label="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-sans text-slate-300 leading-relaxed">
          Utilizamos cookies e criptografia SSL (HTTPS) para garantir navegação segura, sigilo ético e proteção aos dados de navegação conforme a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>.
        </p>

        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <button
            onClick={handleAcceptAll}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] text-xs font-cta font-bold transition shadow-sm cursor-pointer text-center"
          >
            Aceitar Todos
          </button>

          <Link
            to="/termos"
            onClick={() => setIsVisible(false)}
            className="w-full sm:w-auto py-2.5 px-3.5 rounded-full border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white text-xs font-cta font-bold transition cursor-pointer text-center"
          >
            Ver Detalhes
          </Link>
        </div>
      </div>
    </div>
  )
}
