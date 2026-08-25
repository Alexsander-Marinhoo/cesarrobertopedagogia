import { useState } from 'react'
import {
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, A11y } from 'swiper/modules'
import CascadeRevealTitle from './CascadeRevealTitle'
import FadeInParagraph from './FadeInParagraph'
import FadeInCardGroup from './FadeInCardGroup'

// Swiper core styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import { siteData } from '../data/content'

export default function ServicesSection({ onSelectService, onOpenBookingWithService }) {
  const [filter, setFilter] = useState('all')
  const [swiperInstance, setSwiperInstance] = useState(null)
  const [isBeginning, setIsBeginning] = useState(true)
  const [isEnd, setIsEnd] = useState(false)



  const filteredServices = siteData.services.filter((s) => {
    if (filter === 'clinical') return s.id === 'psicopedagogico' || s.id === 'neuropsicopedagogico' || s.id === 'apoio-pedagogico'
    if (filter === 'b2b') return s.id === 'consultoria-escolas'
    return true
  })

  const handleSwiper = (swiper) => {
    setSwiperInstance(swiper)
    setIsBeginning(swiper.isBeginning)
    setIsEnd(swiper.isEnd)
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    if (swiperInstance && !swiperInstance.destroyed) {
      swiperInstance.slideTo(0, 300)
    }
  }

  return (
    <section id="servicos" className="py-20 bg-white bg-pattern-grid border-b border-slate-200 overflow-hidden relative">
      {/* Subtle ambient light glow */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#002B49]/2.5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header Container (Constrained Width) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <CascadeRevealTitle className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#002B49] leading-[1.08] sm:leading-[1.05]">
            Atuação Clínica e Educacional Completa
          </CascadeRevealTitle>
          <FadeInParagraph className="mt-3 text-sm sm:text-base font-sans text-slate-600">
            Metodologias individualizadas para diagnosticar, estimular e apoiar alunos, famílias e escolas.
          </FadeInParagraph>

          {/* Filter Pills */}
          <div className="mt-6 sm:mt-8 inline-flex items-center p-1 sm:p-1.5 rounded-full bg-[#F4F6F8] border border-slate-200 max-w-full">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-2.5 min-[380px]:px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10.5px] min-[380px]:text-[11.5px] sm:text-xs font-cta font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-[#002B49] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#002B49]'
              }`}
            >
              Todos os Serviços
            </button>
            <button
              onClick={() => handleFilterChange('clinical')}
              className={`px-2.5 min-[380px]:px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10.5px] min-[380px]:text-[11.5px] sm:text-xs font-cta font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'clinical'
                  ? 'bg-[#002B49] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#002B49]'
              }`}
            >
              Para Famílias (B2C)
            </button>
            <button
              onClick={() => handleFilterChange('b2b')}
              className={`px-2.5 min-[380px]:px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-[10.5px] min-[380px]:text-[11.5px] sm:text-xs font-cta font-bold transition cursor-pointer whitespace-nowrap ${
                filter === 'b2b'
                  ? 'bg-[#002B49] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#002B49]'
              }`}
            >
              Para Escolas (B2B)
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Container (Bleeding off to the right screen edge, left aligned with centered container) */}
      <FadeInCardGroup cardSelector=".gsap-card" stagger={0.08} className="relative group/services-carousel w-full pl-4 sm:pl-6 lg:pl-8 xl:pl-[max(2rem,calc((100vw-1440px)/2+2rem))] overflow-visible">
        {/* Swiper Carousel */}
        <Swiper
          modules={[Navigation, Pagination, A11y]}
          spaceBetween={20}
          slidesPerView={1.2}
          slidesOffsetAfter={20}
          loop={false}
          grabCursor={true}
          breakpoints={{
            500: {
              slidesPerView: 1.6,
              spaceBetween: 16,
              slidesOffsetAfter: 24,
            },
            640: {
              slidesPerView: 2.3,
              spaceBetween: 18,
              slidesOffsetAfter: 28,
            },
            768: {
              slidesPerView: 2.8,
              spaceBetween: 20,
              slidesOffsetAfter: 32,
            },
            1024: {
              slidesPerView: 3.2,
              spaceBetween: 20,
              slidesOffsetAfter: 36,
            },
            1280: {
              slidesPerView: 3.5,
              spaceBetween: 24,
              slidesOffsetAfter: 48,
            },
            1536: {
              slidesPerView: 3.5,
              spaceBetween: 24,
              slidesOffsetAfter: 64,
            },
          }}
          pagination={{
            el: '.services-swiper-pagination',
            clickable: true,
          }}
          onSwiper={handleSwiper}
          onSlideChange={handleSwiper}
          className="pb-4 pt-1 !overflow-visible"
        >
          {filteredServices.map((service) => (
            <SwiperSlide key={service.id} className="!h-auto flex">
              <div className="gsap-card bg-white text-[#1E293B] rounded-2xl p-5 sm:p-6 border border-[#002B49]/15 shadow-md shadow-[#002B49]/4 hover:border-[#002B49]/50 hover:shadow-xl hover:shadow-[#002B49]/8 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group w-full h-full">
                <div className="space-y-3">
                  {/* Title */}
                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-[#002B49] tracking-tight leading-snug">
                      {service.title}
                    </h3>
                    <p className="text-xs font-sans text-slate-600 mt-2 leading-relaxed line-clamp-3">
                      {service.shortDesc}
                    </p>
                  </div>

                  {/* Modality Tag Pill */}
                  <div className="pt-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-medium text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                      {service.modality}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 mt-4 border-t border-slate-200/80">
                  <button
                    onClick={() => onOpenBookingWithService(service.id)}
                    className="w-full pl-4 pr-1.5 py-2 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs sm:text-sm font-cta font-bold inline-flex items-center justify-between transition cursor-pointer shadow-sm hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Agendar Atendimento</span>
                    <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#002B49] flex items-center justify-center">
                      <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Bottom Controls */}
        <div className="mt-6 flex items-center justify-center gap-3 pr-4 sm:pr-6 lg:pr-8 xl:pr-[max(2rem,calc((100vw-1440px)/2+2rem))]">
          <button
            onClick={() => swiperInstance?.slidePrev()}
            disabled={isBeginning}
            aria-label="Voltar serviço"
            className={`w-9 h-9 rounded-full flex items-center justify-center border border-slate-300 bg-white text-[#002B49] hover:bg-[#002B49] hover:text-white hover:border-[#002B49] shadow-xs transition ${
              isBeginning ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="services-swiper-pagination !w-auto flex items-center gap-1.5 px-2" />

          <button
            onClick={() => swiperInstance?.slideNext()}
            disabled={isEnd}
            aria-label="Avançar serviço"
            className={`w-9 h-9 rounded-full flex items-center justify-center border border-slate-300 bg-white text-[#002B49] hover:bg-[#002B49] hover:text-white hover:border-[#002B49] shadow-xs transition ${
              isEnd ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </FadeInCardGroup>
    </section>
  )
}
