import { Users, School, ChevronRight, Check } from 'lucide-react'
import CascadeRevealTitle from './CascadeRevealTitle'
import FadeInParagraph from './FadeInParagraph'
import FadeInCardGroup from './FadeInCardGroup'

export default function AudienceSegmentation({ onSelectAudience }) {
  return (
    <section id="segmentacao" className="py-20 bg-[#F4F6F8] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <CascadeRevealTitle className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#002B49] leading-[1.08] sm:leading-[1.05]">
            Como posso ajudar você hoje?
          </CascadeRevealTitle>
          <FadeInParagraph className="mt-3 text-sm sm:text-base font-sans text-slate-600">
            Soluções direcionadas tanto para o acompanhamento clínico do seu filho quanto para a capacitação da sua escola.
          </FadeInParagraph>
        </div>

        {/* Dual Compact Cards Grid with Sequential Fade-In */}
        <FadeInCardGroup className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* B2C Card: Famílias & Pais */}
          <div className="gsap-card bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-2xs hover:border-[#002B49] hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              {/* Header Icon + Pill */}
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#F4F6F8] border border-slate-200 flex items-center justify-center text-[#002B49] group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <span className="text-[10px] font-cta font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#D4AF37]/15 text-[#002B49] border border-[#D4AF37]/30">
                  Para Pais &amp; Famílias
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#002B49] tracking-tight leading-snug">
                  Superação de Dificuldades Escolares
                </h3>
                <p className="mt-2 text-xs sm:text-sm font-sans text-slate-600 leading-relaxed">
                  Avaliação diagnóstica, laudos e intervenção neurocognitiva para TDAH, Dislexia e bloqueios de aprendizagem, com acolhimento e plano individualizado.
                </p>
              </div>

              {/* Minimalist Feature Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Avaliação Clínica', 'TDAH & Dislexia', 'Apoio Familiar'].map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] font-sans font-medium text-slate-600 bg-[#F4F6F8] px-2.5 py-1 rounded-lg border border-slate-200/80"
                  >
                    <Check className="w-3 h-3 text-[#D4AF37]" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                onClick={() => onSelectAudience('b2c')}
                className="w-full pl-5 pr-2 py-2.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white font-cta font-bold text-xs sm:text-sm inline-flex items-center justify-between transition cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Agendar Avaliação para Meu Filho</span>
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#002B49] flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>
            </div>
          </div>

          {/* B2B Card: Escolas & Gestores */}
          <div className="gsap-card bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-2xs hover:border-[#002B49] hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              {/* Header Icon + Pill */}
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#F4F6F8] border border-slate-200 flex items-center justify-center text-[#002B49] group-hover:scale-105 transition-transform">
                  <School className="w-5 h-5 text-[#002B49]" />
                </div>
                <span className="text-[10px] font-cta font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#002B49]/10 text-[#002B49] border border-[#002B49]/20">
                  Para Escolas &amp; Educadores
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#002B49] tracking-tight leading-snug">
                  Assessoria Pedagógica &amp; Formação
                </h3>
                <p className="mt-2 text-xs sm:text-sm font-sans text-slate-600 leading-relaxed">
                  Capacitação docente continuada, palestras presenciais e suporte técnico na elaboração e execução do PEI/PDI alinhado à BNCC.
                </p>
              </div>

              {/* Compact Key Highlights */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  'Formação Docente',
                  'BNCC & Inclusão',
                  'Elaboração de PDI'
                ].map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F8FAFC] border border-slate-200 text-xs font-sans font-medium text-slate-700"
                  >
                    <Check className="w-3 h-3 text-[#002B49]" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                onClick={() => onSelectAudience('b2b')}
                className="w-full pl-5 pr-2 py-2.5 rounded-full bg-white hover:bg-[#F4F6F8] text-[#002B49] border-2 border-[#002B49] font-cta font-bold text-xs sm:text-sm inline-flex items-center justify-between transition cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>Solicitar Proposta para Minha Escola</span>
                <div className="w-6 h-6 rounded-full bg-[#002B49] text-white flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>
            </div>
          </div>
        </FadeInCardGroup>
      </div>
    </section>
  )
}
