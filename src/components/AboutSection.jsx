import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '../utils/gsapConfig'
import CascadeRevealTitle from './CascadeRevealTitle'

export default function AboutSection() {
  const sectionRef = useRef(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Desktop: Fade-in suave com ScrollTrigger
      mm.add('(min-width: 768px)', () => {
        gsap.fromTo(
          '.gsap-about-photo',
          { opacity: 0, y: 24, scale: 0.98 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.gsap-about-photo',
              start: 'top 95%',
              once: true,
              fastScrollEnd: true,
            },
          }
        )

        gsap.fromTo(
          '.gsap-about-paragraph',
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.gsap-about-paragraph',
              start: 'top 95%',
              once: true,
              fastScrollEnd: true,
            },
          }
        )
      })

      // Mobile: Fade-in ágil e leve
      mm.add('(max-width: 767px)', () => {
        gsap.fromTo(
          '.gsap-about-photo',
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.gsap-about-photo',
              start: 'top 96%',
              once: true,
              fastScrollEnd: true,
            },
          }
        )

        gsap.fromTo(
          '.gsap-about-paragraph',
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.gsap-about-paragraph',
              start: 'top 96%',
              once: true,
              fastScrollEnd: true,
            },
          }
        )
      })
    },
    { scope: sectionRef }
  )

  return (
    <section
      id="sobre"
      ref={sectionRef}
      className="py-24 bg-[#F8FAFC] bg-pattern-ambient border-b border-slate-200 relative overflow-hidden font-sans antialiased"
    >
      {/* Decorative ambient flare */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D4AF37]/4 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Profile Photo with GSAP Fade-In */}
          <div className="lg:col-span-5 gsap-about-photo">
            <div className="w-full aspect-[4/5] sm:aspect-[3/4] rounded-3xl overflow-hidden relative bg-[#00182A] shadow-xl shadow-[#002B49]/10">
              <img
                src="/images/cesar-sobre-mim.jpg"
                alt="Prof. Cesar Roberto de Sousa Loureiro - Pedagogo, Psicopedagogo e Neuropsicopedagogo Clínico"
                className="w-full h-full object-cover object-top filter brightness-[1.02]"
              />
              
              {/* Subtle gradient overlay at the bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#00182A]/85 via-transparent to-transparent pointer-events-none" />

              {/* Name & Title Badge */}
              <div className="absolute bottom-5 left-5 right-5 z-10 text-white">
                <div className="font-heading font-bold text-base sm:text-lg text-white leading-tight">
                  Prof. Cesar Roberto Loureiro
                </div>
                <div className="text-[11.5px] font-sans text-slate-200 mt-0.5">
                  Neuropsicopedagogia &amp; Educação Inclusiva
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Cascade Title & Fade-In Paragraph */}
          <div className="lg:col-span-7 space-y-5 text-left">
            <CascadeRevealTitle
              start="top 96%"
              className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#002B49] leading-[1.08] sm:leading-[1.05] tracking-tight"
            >
              Transformando a aprendizagem com ciência, escuta e afeto
            </CascadeRevealTitle>

            <p className="gsap-about-paragraph text-sm sm:text-base font-sans text-slate-600 leading-relaxed">
              Sou o <strong>Prof. Cesar Roberto de Sousa Loureiro</strong>, pedagogo, psicopedagogo e neuropsicopedagogo clínico. Minha atuação é especializada no acolhimento de <strong>crianças, jovens (adolescentes) e adultos</strong>, compreendendo as particularidades de cada fase do neurodesenvolvimento: desde a alfabetização e dificuldades escolares na infância até as funções executivas, foco e organização na adolescência e na vida adulta.
            </p>

            {/* Cards de Faixas Etárias Atendidas */}
            <div className="gsap-about-paragraph grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-[#002B49]/10 shadow-xs hover:border-[#D4AF37]/50 transition-all">
                <div className="text-xs font-serif font-bold text-[#002B49] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Crianças (Infantil)
                </div>
                <div className="text-[11.5px] font-sans text-slate-500 mt-1.5 leading-snug">
                  Alfabetização, TDAH, Dislexia, TEA, discalculia e apoio nas dificuldades escolares.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#002B49]/10 shadow-xs hover:border-[#D4AF37]/50 transition-all">
                <div className="text-xs font-serif font-bold text-[#002B49] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Jovens &amp; Adolescentes
                </div>
                <div className="text-[11.5px] font-sans text-slate-500 mt-1.5 leading-snug">
                  Rotinas de estudo, funções executivas, atenção, ansiedade com provas e vestibulandos.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#002B49]/10 shadow-xs hover:border-[#D4AF37]/50 transition-all">
                <div className="text-xs font-serif font-bold text-[#002B49] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                  Adultos
                </div>
                <div className="text-[11.5px] font-sans text-slate-500 mt-1.5 leading-snug">
                  Foco, memória de trabalho, organização acadêmica/profissional e diagnóstico tardio.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
