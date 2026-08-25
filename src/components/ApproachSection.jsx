import { ChevronRight } from 'lucide-react'
import CascadeRevealTitle from './CascadeRevealTitle'
import FadeInParagraph from './FadeInParagraph'
import FadeInCardGroup from './FadeInCardGroup'

export default function ApproachSection({ onSelectServiceById }) {
  const pillars = [
    {
      step: '01',
      title: 'Avaliação & Diagnóstico',
      description:
        'Mapeamento criterioso das rotas cognitivas e pedagógicas para identificar a origem dos entraves escolares e fundamentar o laudo técnico.',
      serviceId: 'psicopedagogico',
      linkText: 'Ver avaliação clínica'
    },
    {
      step: '02',
      title: 'Estimulação Neurocognitiva',
      description:
        'Treinamento direcionado de foco, funções executivas, memória de trabalho e autorregulação para TDAH, Dislexia e neurodesenvolvimento.',
      serviceId: 'neuropsicopedagogico',
      linkText: 'Ver intervenção neural'
    },
    {
      step: '03',
      title: 'Integração com a Escola',
      description:
        'Ponte contínua com a equipe docente para implementação de adaptações curriculares, elaboração do PDI/PEI e suporte prático.',
      serviceId: 'consultoria-escolas',
      linkText: 'Ver assessoria escolar'
    }
  ]

  return (
    <section className="py-20 bg-[#F8FAFC] border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <CascadeRevealTitle className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#002B49] leading-[1.08] sm:leading-[1.05]">
            Três pilares para o desenvolvimento pleno
          </CascadeRevealTitle>
          <FadeInParagraph className="mt-3 text-sm sm:text-base font-sans text-slate-600">
            Uma metodologia estruturada que conecta diagnóstico preciso, estímulo cognitivo e alinhamento escolar.
          </FadeInParagraph>
        </div>

        {/* 3 Ultra-Minimalist Cards with Sequential Fade-In */}
        <FadeInCardGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.step}
              className="gsap-card bg-white rounded-2xl p-7 sm:p-8 border border-slate-200 shadow-2xs hover:border-[#002B49] hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* Step Number */}
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-serif font-bold text-slate-300 group-hover:text-[#002B49] transition-colors">
                    {pillar.step}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#002B49] tracking-tight leading-snug">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm font-sans text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              {/* Action Link */}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  onClick={() => onSelectServiceById(pillar.serviceId)}
                  className="text-xs font-cta font-bold text-[#002B49] group-hover:text-[#073B63] inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>{pillar.linkText}</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5] text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </FadeInCardGroup>
      </div>
    </section>
  )
}


