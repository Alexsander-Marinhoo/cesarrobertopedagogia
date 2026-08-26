import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Menu, X, ChevronRight, ArrowLeft } from 'lucide-react'
import { smoothScrollTo } from '../utils/lenis'
import { useAuth } from '../context/AuthContext'
import { getUserDisplayName } from '../utils/userDisplay'

export default function Navbar({ onOpenPortal, onOpenBooking }) {
  const location = useLocation()
  const navigate = useNavigate()
  const isCursosAvaPage = location.pathname.startsWith('/cursos')

  const { user, profile } = useAuth()
  const { displayName, initial, avatarUrl } = getUserDisplayName(profile, user)

  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState(isCursosAvaPage ? 'cursos' : 'inicio')
  const isClickScrollingRef = useRef(false)
  const clickTimeoutRef = useRef(null)

  const navLinks = [
    { name: 'Início', href: '#inicio' },
    { name: 'Sobre Mim', href: '#sobre' },
    { name: 'Serviços', href: '#servicos' },
    { name: 'Cursos & AVA', href: '#cursos' },
    { name: 'Agendamento', href: '#agendamento' },
    { name: 'Depoimentos', href: '#depoimentos' },
    { name: 'Materiais & Blog', href: '#materiais' },
    { name: 'Contato', href: '#contato' },
  ]

  useEffect(() => {
    if (isCursosAvaPage) {
      setActiveSection('cursos')
      const handleScroll = () => {
        setScrolled(window.scrollY > 25)
      }
      window.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll()
      return () => window.removeEventListener('scroll', handleScroll)
    }

    const sectionIds = ['inicio', 'sobre', 'servicos', 'cursos', 'agendamento', 'depoimentos', 'materiais', 'contato']

    const handleScroll = () => {
      setScrolled(window.scrollY > 30)

      if (isClickScrollingRef.current) return

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 90) {
        setActiveSection('contato')
        return
      }

      if (window.scrollY < 160) {
        setActiveSection('inicio')
        return
      }

      const activationPoint = window.innerHeight * 0.35

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i])
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= activationPoint) {
            setActiveSection(sectionIds[i])
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
    }
  }, [isCursosAvaPage])

  const handleNavClick = (e, href) => {
    setIsOpen(false)
    e.preventDefault()

    if (isCursosAvaPage) {
      if (href === '#cursos') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      if (href === '#inicio') {
        navigate('/')
        return
      }
      navigate(`/${href}`)
      return
    }

    if (window.location.pathname !== '/') {
      navigate(`/${href}`)
      return
    }

    const targetId = href.replace('#', '')
    setActiveSection(targetId)

    isClickScrollingRef.current = true
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current)
    clickTimeoutRef.current = setTimeout(() => {
      isClickScrollingRef.current = false
    }, 1300)

    if (href === '#inicio') {
      smoothScrollTo(0, { duration: 1.2 })
    } else {
      smoothScrollTo(href, { offset: -80, duration: 1.2 })
    }
  }

  return (
    <header className="fixed top-0 sm:top-5 left-0 sm:left-1/2 sm:-translate-x-1/2 z-50 w-full sm:w-[96%] max-w-[1320px] pointer-events-none transition-all duration-300">
      <nav
        className={`pointer-events-auto w-full bg-white/95 backdrop-blur-md border-b sm:border border-[#002B49]/20 rounded-none sm:rounded-full py-2 sm:py-2 px-3.5 sm:px-4 lg:px-4 xl:px-5 flex items-center justify-between gap-1.5 lg:gap-2 xl:gap-3 shadow-md sm:shadow-lg shadow-[#002B49]/8 transition-all duration-300 ${
          scrolled ? 'shadow-xl border-[#002B49]/35 sm:scale-[0.995]' : ''
        }`}
      >
        <a
          href="/"
          onClick={(e) => {
            if (isCursosAvaPage) {
              e.preventDefault()
              navigate('/')
            } else {
              handleNavClick(e, '#inicio')
            }
          }}
          className="flex items-center shrink-0 group cursor-pointer pl-0.5 py-0.5"
          title="Ir para a Página Principal"
        >
          <img
            src="/logo.svg"
            alt="Prof. Cesar Roberto Loureiro - Psicopedagogo e Neuropsicopedagogo Clínico"
            className="h-16 min-[400px]:h-18 sm:h-20 md:h-22 lg:h-20 xl:h-24 w-auto max-w-[210px] min-[400px]:max-w-[250px] sm:max-w-[290px] lg:max-w-[280px] xl:max-w-[340px] object-contain transition-transform duration-300 group-hover:scale-105"
            width="340"
            height="68"
            loading="eager"
            fetchPriority="high"
          />
        </a>

        {/* Na página /cursos-ava, removemos os links de seções âncora da home */}
        {isCursosAvaPage ? (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/"
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#002B49]/20 hover:border-[#002B49]/40 text-[#002B49] hover:bg-slate-100/80 text-xs sm:text-sm font-cta font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Página Principal</span>
              <span className="sm:hidden">Início</span>
            </Link>

            {user ? (
              <button
                onClick={() => onOpenPortal('courses')}
                className="group pl-2.5 pr-3 py-1.5 sm:py-2 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white border border-[#D4AF37]/50 font-cta font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition shadow-sm hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer shrink-0"
                title="Abrir meu Portal"
              >
                <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-[#D4AF37] text-[#002B49] text-xs font-black flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <span className="text-white font-bold">Abrir Portal</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            ) : (
              <button
                onClick={() => onOpenPortal('courses')}
                className="group pl-3 sm:pl-4 pr-1.5 sm:pr-2 py-1.5 sm:py-2 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] font-cta font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 sm:gap-2 transition shadow-sm hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer shrink-0"
              >
                <span>Acessar Portal</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#002B49] text-[#D4AF37] flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Links de navegação ancorada (Exclusivo da Página Principal) */}
            <div className="hidden lg:flex items-center justify-center gap-0.5 xl:gap-1 bg-[#002B49]/5 p-1 rounded-full border border-[#002B49]/10">
              {navLinks.map((link) => {
                const targetId = link.href.replace('#', '')
                const isActive = activeSection === targetId

                return (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`px-2.5 xl:px-3.5 py-1.5 rounded-full text-[11px] xl:text-[13px] font-sans font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#002B49] text-white font-bold shadow-xs'
                        : 'text-[#002B49] hover:bg-[#002B49]/10'
                    }`}
                  >
                    {link.name}
                  </a>
                )
              })}
            </div>

            {/* Desktop CTA (Página Principal) */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 shrink-0">
              {user ? (
                <button
                  onClick={() => onOpenPortal('courses')}
                  className="group pl-2.5 pr-3 py-1.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white border border-[#D4AF37]/50 font-cta font-bold text-xs xl:text-sm inline-flex items-center gap-2 transition shadow-sm hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer shrink-0"
                  title="Abrir meu Portal"
                >
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#002B49] text-xs font-black flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <span className="text-white font-bold">Abrir Portal</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              ) : (
                <button
                  onClick={() => onOpenPortal('courses')}
                  className="group pl-3.5 xl:pl-4 pr-1.5 py-1.5 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] font-cta font-bold text-xs xl:text-sm inline-flex items-center gap-2 transition shadow-sm hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap cursor-pointer shrink-0"
                >
                  <span>Acessar Portal</span>
                  <div className="w-6 h-6 rounded-full bg-[#002B49] text-[#D4AF37] flex items-center justify-center group-hover:translate-x-0.5 transition-transform shrink-0">
                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </button>
              )}
            </div>

            {/* Mobile Actions with Hamburger (Página Principal) */}
            <div className="lg:hidden flex items-center gap-1.5 sm:gap-2 shrink-0">
              {user ? (
                <button
                  onClick={() => onOpenPortal('courses')}
                  className="pl-2.5 pr-2.5 sm:pr-3 py-1.5 sm:py-2 rounded-full bg-[#002B49] text-white border border-[#D4AF37]/50 font-cta font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer shrink-0"
                  title="Abrir Portal"
                >
                  <div className="w-5.5 h-5.5 rounded-full bg-[#D4AF37] text-[#002B49] text-[11px] font-black flex items-center justify-center shrink-0 overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <span>Acessar Portal</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenPortal('courses')}
                  className="pl-3 sm:pl-4 pr-1.5 sm:pr-2 py-1.5 sm:py-2 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#00182A] font-cta font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 sm:gap-2 transition shadow-sm active:scale-[0.98] whitespace-nowrap cursor-pointer shrink-0"
                >
                  <span>Acessar Portal</span>
                  <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-[#002B49] text-[#D4AF37] flex items-center justify-center">
                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </button>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 min-[380px]:p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer shrink-0"
                aria-label="Menu"
              >
                {isOpen ? <X className="w-7 h-7 text-[#002B49]" /> : <Menu className="w-7 h-7 text-[#002B49]" />}
              </button>
            </div>
          </>
        )}
      </nav>

      {/* Menu Dropdown Mobile (Apenas na Página Principal) */}
      {!isCursosAvaPage && isOpen && (
        <div className="pointer-events-auto lg:hidden mt-0 w-full bg-white/98 backdrop-blur-md border-b sm:border border-[#002B49]/20 rounded-b-2xl sm:rounded-3xl p-4 space-y-2 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200">
          {navLinks.map((link) => {
            const targetId = link.href.replace('#', '')
            const isActive = activeSection === targetId

            return (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`block px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-sans transition-colors ${isActive
                  ? 'bg-[#002B49] text-white font-bold'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
              >
                {link.name}
              </a>
            )
          })}

          <div className="pt-2 mt-2 border-t border-slate-100 space-y-2">
            {user ? (
              <button
                onClick={() => {
                  setIsOpen(false)
                  onOpenPortal('courses')
                }}
                className="w-full pl-3 pr-3 py-2 rounded-full bg-[#002B49] text-white border border-[#D4AF37]/50 font-cta font-bold text-xs sm:text-sm inline-flex items-center justify-between shadow-sm transition"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#002B49] text-xs font-black flex items-center justify-center shrink-0 overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                  <span>Abrir Portal</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false)
                  onOpenPortal('courses')
                }}
                className="w-full pl-4 pr-2 py-2 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] font-cta font-bold text-xs sm:text-sm inline-flex items-center justify-between shadow-sm transition"
              >
                <span>Acessar Portal</span>
                <div className="w-6 h-6 rounded-full bg-[#002B49] text-[#D4AF37] flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
