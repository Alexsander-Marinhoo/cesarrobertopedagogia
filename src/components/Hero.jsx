import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '../utils/gsapConfig'
import { smoothScrollTo } from '../utils/lenis'

export default function Hero({ onOpenBooking }) {
  const heroRef = useRef(null)
  const num1Ref = useRef(null)
  const num2Ref = useRef(null)
  const num3Ref = useRef(null)
  const num4Ref = useRef(null)

  const handleScrollToServices = (e) => {
    e.preventDefault()
    smoothScrollTo('#servicos', { offset: -70, duration: 1.2 })
  }

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Desktop: Timeline com efeito 3D cascata e reveal orquestrado
      mm.add('(min-width: 768px)', () => {
        const tl = gsap.timeline({ delay: 0.08 })

        const allChars = heroRef.current?.querySelectorAll('.gsap-hero-char')
        if (allChars && allChars.length) {
          tl.fromTo(
            allChars,
            { opacity: 0, y: 18, rotateX: -22, scale: 0.95 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              scale: 1,
              duration: 0.45,
              ease: 'expo.out',
              stagger: 0.012,
            }
          )
        }

        tl.fromTo(
          '.gsap-hero-photo-card',
          { opacity: 0, y: 22, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out' },
          '-=0.35'
        )

        tl.fromTo(
          '.gsap-hero-fade',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out' },
          '-=0.35'
        )
      })

      // Mobile: Timeline rápida e direta sem travamentos
      mm.add('(max-width: 767px)', () => {
        const tl = gsap.timeline({ delay: 0.05 })

        const allChars = heroRef.current?.querySelectorAll('.gsap-hero-char')
        if (allChars && allChars.length) {
          tl.fromTo(
            allChars,
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.35,
              ease: 'power2.out',
              stagger: 0.008,
            }
          )
        }

        tl.fromTo(
          '.gsap-hero-photo-card',
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
          '-=0.25'
        )

        tl.fromTo(
          '.gsap-hero-fade',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' },
          '-=0.25'
        )
      })

      // Métricas: Stagger Fade-in com ativação precoce (start: 'top 96%')
      gsap.fromTo(
        '.gsap-metric-item',
        { opacity: 0, y: 14, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.45,
          stagger: 0.06,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.gsap-metrics-row',
            start: 'top 96%',
            once: true,
            fastScrollEnd: true,
          },
        }
      )

      // Contador de Números Crescente
      const countData = [
        { ref: num1Ref, target: 4, duration: 0.8 },
        { ref: num2Ref, target: 247, duration: 1.1 },
        { ref: num3Ref, target: 823, duration: 1.2 },
        { ref: num4Ref, target: 98, duration: 1.0 },
      ]

      countData.forEach(({ ref, target, duration }) => {
        const counter = { val: 0 }
        gsap.to(counter, {
          val: target,
          duration,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.gsap-metrics-row',
            start: 'top 96%',
            once: true,
            fastScrollEnd: true,
          },
          onUpdate: () => {
            if (ref.current) {
              ref.current.textContent = Math.floor(counter.val)
            }
          },
          onComplete: () => {
            if (ref.current) {
              ref.current.textContent = target
            }
          },
        })
      })
    },
    { scope: heroRef }
  )

  return (
    <section
      id="inicio"
      ref={heroRef}
      className="relative bg-[#F4F1EA] pt-24 sm:pt-32 md:pt-36 lg:pt-40 pb-12 sm:pb-16 lg:pb-20 overflow-visible font-sans antialiased selection:bg-[#D4AF37] selection:text-[#002B49]"
    >
      {/* Container com largura expandida para máxima imponência */}
      <div className="max-w-[1560px] mx-auto px-2.5 sm:px-6 lg:px-10 xl:px-12">

        {/* ========================================================================= */}
        {/* MAIN DARK CARD CONTAINER (Totalmente responsivo: Mobile, Tablet & Desktop) */}
        {/* ========================================================================= */}
        <div className="bg-[#002B49] rounded-[24px] sm:rounded-[36px] md:rounded-[48px] lg:rounded-[64px] pt-8 sm:pt-14 md:pt-16 lg:py-24 xl:py-28 pb-8 sm:pb-12 lg:pb-28 px-3.5 min-[380px]:px-4 sm:px-8 md:px-12 lg:px-20 xl:px-24 relative shadow-2xl overflow-visible min-h-auto lg:min-h-[680px] xl:min-h-[740px] flex items-center">

          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-10 lg:gap-12 xl:gap-16 items-center">

            {/* ===================================================================== */}
            {/* TEXT COLUMN: Centralizado no Mobile/Tablet & Alinhado à Esquerda no Desktop */}
            {/* ===================================================================== */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 md:space-y-8 xl:space-y-10 text-center lg:text-left z-10 lg:pr-6">

              {/* 3-Line Headline com efeito cascata 3D */}
              <h1
                className="text-[32px] min-[370px]:text-[36px] min-[410px]:text-[38px] sm:text-4xl md:text-5xl lg:text-[62px] xl:text-[72px] font-heading font-extrabold text-white leading-[1.08] sm:leading-[1.08] lg:leading-[1.06] tracking-tight select-none"
                style={{ perspective: '800px' }}
              >
                {/* Linha 1: Destrave o */}
                <span className="block overflow-hidden py-0.5">
                  <span className="inline-block whitespace-nowrap">
                    {'Destrave'.split('').map((char, cIdx) => (
                      <span key={cIdx} className="gsap-hero-char inline-block will-change-transform transform-gpu origin-bottom">
                        {char}
                      </span>
                    ))}
                  </span>
                  <span className="inline-block">&nbsp;</span>
                  <span className="inline-block whitespace-nowrap">
                    {'o'.split('').map((char, cIdx) => (
                      <span key={cIdx} className="gsap-hero-char inline-block will-change-transform transform-gpu origin-bottom">
                        {char}
                      </span>
                    ))}
                  </span>
                </span>

                {/* Linha 2: potencial de */}
                <span className="block overflow-hidden py-0.5">
                  <span className="inline-block whitespace-nowrap">
                    {'potencial'.split('').map((char, cIdx) => (
                      <span key={cIdx} className="gsap-hero-char inline-block will-change-transform transform-gpu origin-bottom">
                        {char}
                      </span>
                    ))}
                  </span>
                  <span className="inline-block">&nbsp;</span>
                  <span className="inline-block whitespace-nowrap">
                    {'de'.split('').map((char, cIdx) => (
                      <span key={cIdx} className="gsap-hero-char inline-block will-change-transform transform-gpu origin-bottom">
                        {char}
                      </span>
                    ))}
                  </span>
                </span>

                {/* Linha 3: aprendizagem */}
                <span className="block overflow-hidden py-0.5 text-[#D4AF37]">
                  <span className="inline-block whitespace-nowrap">
                    {'aprendizagem'.split('').map((char, cIdx) => (
                      <span key={cIdx} className="gsap-hero-char inline-block will-change-transform transform-gpu origin-bottom">
                        {char}
                      </span>
                    ))}
                  </span>
                </span>
              </h1>

              {/* Subtitle com efeito fade-in */}
              <p className="gsap-hero-fade text-[13px] min-[380px]:text-[13.5px] sm:text-base md:text-lg font-sans text-slate-300 font-normal leading-relaxed max-w-sm sm:max-w-lg lg:max-w-xl mx-auto lg:mx-0">
                No consultório do <strong>Prof. Cesar Roberto</strong>, transformamos dificuldades escolares em autonomia e confiança com a neuropsicopedagogia clínica.
              </p>

              {/* Linha de Ações: Empilhada no Mobile, Lado a Lado no Tablet e Desktop */}
              <div className="gsap-hero-fade pt-1.5 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 sm:gap-6 md:gap-8 w-full max-w-sm sm:max-w-none mx-auto lg:mx-0">
                {/* Botão Primário Sólido */}
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="w-full sm:w-auto px-7 sm:px-9 py-3.5 sm:py-4 rounded-2xl bg-[#D4AF37] hover:bg-[#C59E27] text-[#00182A] font-cta font-bold text-sm sm:text-base transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-[#D4AF37]/20 text-center"
                >
                  Agendar Consulta
                </button>

                {/* Link Secundário */}
                <a
                  href="#servicos"
                  onClick={handleScrollToServices}
                  className="text-slate-200 hover:text-white font-cta font-semibold text-sm sm:text-base transition-colors duration-200 cursor-pointer text-center py-1"
                >
                  Ver especialidades
                </a>
              </div>

            </div>

            {/* ===================================================================== */}
            {/* PHOTO COLUMN: Card Vertical da Foto */}
            {/* ===================================================================== */}
            <div className="lg:col-span-5 relative z-20 mt-4 sm:mt-6 lg:mt-0 flex justify-center lg:justify-end">
              <div className="gsap-hero-photo-card -mb-24 sm:-mb-32 md:-mb-36 lg:my-0 lg:-mt-32 lg:-mb-32 xl:-mt-40 xl:-mb-40 2xl:-mt-44 2xl:-mb-44 relative rounded-[28px] sm:rounded-[36px] md:rounded-[48px] lg:rounded-[56px] overflow-hidden shadow-2xl bg-[#00182A] border-[4px] sm:border-[6px] border-[#002B49] w-[88%] sm:w-full max-w-[320px] sm:max-w-[420px] md:max-w-[460px] lg:max-w-[500px] xl:max-w-[580px] h-[400px] sm:h-[500px] md:h-[560px] lg:h-[700px] xl:h-[780px]">

                {/* Fotografia Oficial do Professor Cesar Loureiro */}
                <img
                  src="/images/cesar-perfil-casual.jpg"
                  alt="Prof. Cesar Roberto Loureiro - Neuropsicopedagogo Clínico"
                  className="w-full h-full object-cover object-top filter brightness-[1.02]"
                />

                {/* Linhas Orgânicas Onduladas */}
                <svg
                  viewBox="0 0 600 800"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute inset-0 w-full h-full pointer-events-none select-none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M -10 595 C 100 555, 180 445, 290 485 C 390 525, 430 365, 520 415 C 560 435, 590 405, 620 415"
                    stroke="#F4F1EA"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-95"
                  />
                  <path
                    d="M -10 685 C 110 645, 190 525, 300 575 C 400 615, 440 445, 530 495 C 570 515, 600 485, 620 495"
                    stroke="#F4F1EA"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-90"
                  />
                </svg>

                {/* Vinheta suave na base */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#00182A]/35 via-transparent to-transparent pointer-events-none" />

              </div>
            </div>

          </div>

          {/* Indicador de Mouse Scroll Down (Visível no Desktop) */}
          <div className="hidden lg:block absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none">
            <div className="w-6 h-10 rounded-full border-2 border-slate-300/40 flex items-start justify-center p-1.5 shadow-sm bg-[#002B49]/80 backdrop-blur-xs">
              <div className="w-1.5 h-2.5 rounded-full bg-[#D4AF37] animate-bounce" />
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* STATS METRICS ROW (Com Contador Crescente de Números) */}
        {/* ========================================================================= */}
        <div className="gsap-metrics-row pt-28 sm:pt-36 md:pt-40 lg:pt-16 xl:pt-18 pb-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 items-center justify-center max-w-5xl mx-auto text-center">

            {/* Métrica 1: Anos de Experiência */}
            <div className="gsap-metric-item space-y-1 select-none">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-extrabold text-[#002B49] tracking-tight">
                <span ref={num1Ref}>0</span><span className="text-[#D4AF37] font-sans font-bold text-xl sm:text-2xl md:text-3xl align-top ml-0.5">+</span>
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs font-cta font-bold uppercase tracking-widest text-slate-600">
                Anos de Experiência
              </div>
            </div>

            {/* Métrica 2: Alunos & Pacientes */}
            <div className="gsap-metric-item space-y-1 select-none">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-extrabold text-[#002B49] tracking-tight">
                <span ref={num2Ref}>0</span><span className="text-[#D4AF37] font-sans font-bold text-xl sm:text-2xl md:text-3xl align-top ml-0.5">+</span>
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs font-cta font-bold uppercase tracking-widest text-slate-600">
                Alunos &amp; Pacientes
              </div>
            </div>

            {/* Métrica 3: Horas de Aula / Atendimento */}
            <div className="gsap-metric-item space-y-1 select-none">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-extrabold text-[#002B49] tracking-tight">
                <span ref={num3Ref}>0</span><span className="text-[#D4AF37] font-sans font-bold text-xl sm:text-2xl md:text-3xl align-top ml-0.5">+</span>
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs font-cta font-bold uppercase tracking-widest text-slate-600">
                Horas de Atendimento
              </div>
            </div>

            {/* Métrica 4: Foco em Resultados / Satisfação */}
            <div className="gsap-metric-item space-y-1 select-none">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-extrabold text-[#002B49] tracking-tight">
                <span ref={num4Ref}>0</span><span className="text-[#D4AF37] font-sans font-bold text-xl sm:text-2xl md:text-3xl align-top ml-0.5">%</span>
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs font-cta font-bold uppercase tracking-widest text-slate-600">
                Evolução &amp; Satisfação
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
