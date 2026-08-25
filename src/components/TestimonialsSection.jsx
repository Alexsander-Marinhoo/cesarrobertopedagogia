import { ShieldCheck, Lock, Award } from 'lucide-react'
import CascadeRevealTitle from './CascadeRevealTitle'
import FadeInParagraph from './FadeInParagraph'
import { siteData } from '../data/content'

export default function TestimonialsSection() {
  const row1 = siteData.testimonials.slice(0, 5)
  const row2 = siteData.testimonials.slice(5, 10)

  // Duplicate for seamless 360 continuous loop
  const row1Repeated = [...row1, ...row1, ...row1, ...row1]
  const row2Repeated = [...row2, ...row2, ...row2, ...row2]

  return (
    <section id="depoimentos" className="py-24 bg-white bg-pattern-dots border-b border-slate-200 overflow-hidden relative">
      {/* Subtle ambient light glow */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#002B49]/2.5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <CascadeRevealTitle className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#002B49] leading-[1.08] sm:leading-[1.05]">
            O que dizem os nossos clientes
          </CascadeRevealTitle>
          <FadeInParagraph className="mt-3 text-sm sm:text-base font-sans text-slate-600 max-w-2xl mx-auto">
            Histórias de famílias, educadores e instituições que transformaram a aprendizagem e superaram desafios com o Prof. Cesar Roberto.
          </FadeInParagraph>
        </div>
      </div>

      {/* Dual Continuous Sliders Container with Gradient Fade Masks */}
      <div className="relative w-full overflow-hidden py-2">
        {/* Left Gradient Fade Mask */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-36 md:w-48 bg-gradient-to-r from-white via-white/90 to-transparent z-10" />

        {/* Right Gradient Fade Mask */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-36 md:w-48 bg-gradient-to-l from-white via-white/90 to-transparent z-10" />

        {/* Track 1: Moving to LEFT */}
        <div className="animate-marquee-left flex gap-5 pb-3">
          {row1Repeated.map((t, idx) => (
            <div
              key={`row1-${idx}`}
              className="w-[300px] sm:w-[350px] shrink-0 bg-white rounded-2xl px-5 py-4 border border-[#002B49]/15 shadow-md shadow-[#002B49]/4 hover:shadow-lg hover:border-[#002B49]/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <p className="text-xs sm:text-[13px] font-sans text-slate-700 leading-snug font-normal line-clamp-3">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200 shrink-0"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <div className="font-serif font-bold text-xs sm:text-[13px] text-[#002B49] truncate">
                    {t.name}
                  </div>
                  <div className="text-[10px] font-cta font-bold uppercase tracking-wider text-slate-500 truncate">
                    {t.role} • {t.city}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Track 2: Moving to RIGHT */}
        <div className="animate-marquee-right flex gap-5 pt-1">
          {row2Repeated.map((t, idx) => (
            <div
              key={`row2-${idx}`}
              className="w-[300px] sm:w-[350px] shrink-0 bg-white rounded-2xl px-5 py-4 border border-[#002B49]/15 shadow-md shadow-[#002B49]/4 hover:shadow-lg hover:border-[#002B49]/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <p className="text-xs sm:text-[13px] font-sans text-slate-700 leading-snug font-normal line-clamp-3">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200 shrink-0"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <div className="font-serif font-bold text-xs sm:text-[13px] text-[#002B49] truncate">
                    {t.name}
                  </div>
                  <div className="text-[10px] font-cta font-bold uppercase tracking-wider text-slate-500 truncate">
                    {t.role} • {t.city}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom Trust Badges Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-14">
        <div className="max-w-4xl mx-auto rounded-3xl sm:rounded-full bg-white border border-[#002B49]/15 shadow-md shadow-[#002B49]/4 p-4 sm:py-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
          
          {/* Trust item 1 */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-center">
            <div className="w-10 h-10 rounded-2xl bg-[#002B49]/10 text-[#002B49] border border-[#002B49]/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.5] text-[#002B49]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-serif font-bold text-[#002B49]">
                Dados Criptografados
              </div>
              <div className="text-[11px] font-sans text-slate-500">
                Proteção LGPD completa
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-slate-200" />

          {/* Trust item 2 */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-center">
            <div className="w-10 h-10 rounded-2xl bg-[#002B49]/10 text-[#002B49] border border-[#002B49]/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 stroke-[2.5] text-[#002B49]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-serif font-bold text-[#002B49]">
                Sigilo Ético Absoluto
              </div>
              <div className="text-[11px] font-sans text-slate-500">
                Código de Ética Profissional
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-slate-200" />

          {/* Trust item 3 */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-center">
            <div className="w-10 h-10 rounded-2xl bg-[#002B49]/10 text-[#002B49] border border-[#002B49]/20 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 stroke-[2.5] text-[#002B49]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-serif font-bold text-[#002B49]">
                Atuação Fundamentada
              </div>
              <div className="text-[11px] font-sans text-slate-500">
                Neurociência e Base MEC
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

