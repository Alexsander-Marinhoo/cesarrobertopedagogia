import { Link } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { smoothScrollTo } from '../utils/lenis'

export default function Footer({ onOpenPrivacy: _onOpenPrivacy }) {
  const scrollToTop = () => {
    smoothScrollTo(0, { duration: 1.4 })
  }

  const handleLinkClick = (e, href) => {
    if (window.location.pathname !== '/') {
      window.location.href = `/${href}`
      return
    }
    e.preventDefault()
    if (href === '#inicio') {
      smoothScrollTo(0, { duration: 1.2 })
    } else {
      smoothScrollTo(href, { offset: -75, duration: 1.2 })
    }
  }

  return (
    <footer className="bg-[#00182A] text-white font-sans antialiased border-t border-[#073B63] selection:bg-[#D4AF37] selection:text-[#002B49]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* ========================================================================= */}
        {/* SEÇÃO SUPERIOR: Grid em 3 Colunas (Explorar / Institucional / Contato) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-16 lg:gap-24 pt-16 sm:pt-20 pb-16 sm:pb-20">
          
          {/* Coluna 1: Explorar */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm sm:text-base text-[#D4AF37]">
              Explorar
            </h4>
            <ul className="space-y-2.5 text-sm sm:text-base font-sans">
              <li>
                <a
                  href="#inicio"
                  onClick={(e) => handleLinkClick(e, '#inicio')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer block"
                >
                  Início
                </a>
              </li>
              <li>
                <a
                  href="#sobre"
                  onClick={(e) => handleLinkClick(e, '#sobre')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer block"
                >
                  Sobre Mim
                </a>
              </li>
              <li>
                <a
                  href="#servicos"
                  onClick={(e) => handleLinkClick(e, '#servicos')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer block"
                >
                  Serviços Clínicos
                </a>
              </li>
              <li>
                <a
                  href="#cursos"
                  onClick={(e) => handleLinkClick(e, '#cursos')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer block"
                >
                  Cursos &amp; AVA
                </a>
              </li>
              <li>
                <a
                  href="#materiais"
                  onClick={(e) => handleLinkClick(e, '#materiais')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer block"
                >
                  Materiais &amp; Artigos
                </a>
              </li>
            </ul>
          </div>

          {/* Coluna 2: Institucional */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm sm:text-base text-[#D4AF37]">
              Institucional
            </h4>
            <ul className="space-y-2.5 text-sm sm:text-base font-sans">
              <li>
                <a
                  href="#servicos"
                  onClick={(e) => handleLinkClick(e, '#servicos')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer block"
                >
                  Psicopedagogia Clínica
                </a>
              </li>
              <li>
                <Link
                  to="/portal"
                  className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer block"
                >
                  Assessoria Escolar (B2B)
                </Link>
              </li>
              <li>
                <a
                  href="#depoimentos"
                  onClick={(e) => handleLinkClick(e, '#depoimentos')}
                  className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer block"
                >
                  Depoimentos de Famílias
                </a>
              </li>
              <li>
                <Link
                  to="/termos"
                  className="text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer block"
                >
                  Termos &amp; Privacidade (LGPD)
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Contato & Atendimento */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm sm:text-base text-[#D4AF37]">
              Contato &amp; Atendimento
            </h4>
            <div className="space-y-2.5 text-sm sm:text-base font-sans text-slate-300">
              <div>
                <a
                  href="mailto:consultoriaacademicacr@gmail.com"
                  className="hover:text-white transition-colors duration-200 block break-all"
                >
                  consultoriaacademicacr@gmail.com
                </a>
              </div>
              <div>
                <a
                  href="https://wa.me/5532998470152"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-200 block font-medium"
                >
                  +55 (32) 99847-0152 (WhatsApp)
                </a>
              </div>
              <div className="text-slate-400 pt-0.5 text-xs sm:text-sm">
                Rua Soldado Darcy Ferreira, 135 - Alto do Asilo
                <br />
                Recreio • Minas Gerais — CEP 36.740-000
              </div>
              <div className="text-xs text-[#D4AF37] font-medium pt-1">
                Presencial e On-line • 08h às 12h e 14h às 18h
              </div>
            </div>
          </div>

        </div>

        {/* Linha Divisória Sutil */}
        <div className="border-b border-[#073B63]/60" />

        {/* ========================================================================= */}
        {/* BARRA INFERIOR: Metadados na Fonte Padrão & Botão de Rolagem ao Topo */}
        {/* ========================================================================= */}
        <div className="py-8 sm:py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-slate-400">
          
          {/* Metadados e Copyright */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} Prof. Cesar Roberto de Sousa Loureiro. Todos os direitos reservados.</span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <a
              href="https://www.instagram.com/alexsander.code/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-[#D4AF37] transition-colors inline-flex items-center gap-1 group"
            >
              <span>Desenvolvido por</span>
              <strong className="text-slate-300 group-hover:text-[#D4AF37] font-semibold">
                Alex.Code
              </strong>
            </a>
          </div>

          {/* Botão de Rolagem ao Topo */}
          <button
            onClick={scrollToTop}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#002B49] border border-[#073B63] hover:border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#002B49] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm shrink-0"
            aria-label="Voltar ao topo da página"
            title="Voltar ao topo"
          >
            <ArrowUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2]" />
          </button>

        </div>

      </div>
    </footer>
  )
}
