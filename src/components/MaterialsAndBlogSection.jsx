import { useState } from 'react'
import { Download, Clock, ChevronRight, ChevronLeft } from 'lucide-react'
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

export default function MaterialsAndBlogSection({ onOpenDownloadModal, onOpenArticleModal }) {
  const [swiperInstance, setSwiperInstance] = useState(null)
  const [articlesSwiperInstance, setArticlesSwiperInstance] = useState(null)
  const [isMatBeginning, setIsMatBeginning] = useState(true)
  const [isMatEnd, setIsMatEnd] = useState(false)
  const [isArtBeginning, setIsArtBeginning] = useState(true)
  const [isArtEnd, setIsArtEnd] = useState(false)

  const handleMatSwiper = (swiper) => {
    setSwiperInstance(swiper)
    setIsMatBeginning(swiper.isBeginning)
    setIsMatEnd(swiper.isEnd)
  }

  const handleArtSwiper = (swiper) => {
    setArticlesSwiperInstance(swiper)
    setIsArtBeginning(swiper.isBeginning)
    setIsArtEnd(swiper.isEnd)
  }

  return (
    <section id="materiais" className="py-20 bg-[#002B49] bg-pattern-dots-gold border-b border-[#073B63] overflow-hidden relative text-white">
      {/* Subtle ambient light glow */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#073B63]/60 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full relative z-10">
        {/* Header (Constrained Width) */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center mb-14">
          <CascadeRevealTitle className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-[1.08] sm:leading-[1.05]">
            Materiais Gratuitos &amp; Artigos
          </CascadeRevealTitle>
          <FadeInParagraph className="mt-3 text-sm sm:text-base font-sans text-slate-200">
            E-books, cartilhas práticas e reflexões baseadas na neurociência e nas diretrizes educacionais (BNCC e LDB).
          </FadeInParagraph>
        </div>

        {/* Free Downloads Carousel */}
        <div className="mb-16">
          {/* Subheading (Constrained Width) */}
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif font-bold text-white">
              Cartilhas e Guias para Download (PDF)
            </h3>
            <span className="text-xs font-sans text-[#D4AF37] font-semibold hidden sm:inline">
              Acesso 100% gratuito
            </span>
          </div>

          {/* Carousel Container (Bleeding off to the right screen edge, left aligned with centered container) */}
          <FadeInCardGroup cardSelector=".gsap-card" stagger={0.08} className="relative group/mat-carousel w-full pl-4 sm:pl-6 lg:pl-8 xl:pl-[max(2rem,calc((100vw-1440px)/2+2rem))] overflow-visible">
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
                  slidesPerView: 3.5,
                  spaceBetween: 20,
                  slidesOffsetAfter: 36,
                },
                1280: {
                  slidesPerView: 4.5,
                  spaceBetween: 22,
                  slidesOffsetAfter: 48,
                },
                1536: {
                  slidesPerView: 4.5,
                  spaceBetween: 24,
                  slidesOffsetAfter: 64,
                },
              }}
              pagination={{
                el: '.materials-swiper-pagination',
                clickable: true,
              }}
              onSwiper={handleMatSwiper}
              onSlideChange={handleMatSwiper}
              className="pb-4 pt-1 !overflow-visible"
            >
              {siteData.materials.map((item) => (
                <SwiperSlide key={item.id} className="!h-auto flex">
                  <div className="gsap-card bg-white text-[#1E293B] rounded-2xl p-2.5 sm:p-3 border border-white/20 shadow-xl hover:shadow-2xl hover:border-[#D4AF37] transition-all duration-300 flex flex-col justify-between w-full h-full group">
                    <div>
                      {/* Clean Cover Image with tight border spacing */}
                      <div className="relative w-full aspect-16/10 rounded-xl overflow-hidden mb-3 bg-[#002B49]">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>

                      {/* Content Area with refined spacing */}
                      <div className="px-1.5 space-y-1.5">
                        {/* Category & Pages */}
                        <div className="flex items-center justify-between pb-0.5">
                          <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#002B49]">
                            {item.category}
                          </span>
                          <span className="text-[11px] font-sans text-slate-400 font-medium">
                            {item.pages}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h4 className="text-base font-serif font-bold text-[#002B49] leading-snug group-hover:text-[#073B63] transition-colors line-clamp-2">
                          {item.title}
                        </h4>

                        <p className="text-xs font-sans text-slate-600 leading-relaxed line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 px-1.5 pb-0.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-sans text-slate-400 font-medium truncate">
                        {item.downloadCount}
                      </span>

                      <button
                        onClick={() => onOpenDownloadModal(item)}
                        className="pl-3.5 pr-1.5 py-1.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold inline-flex items-center gap-2 transition cursor-pointer shadow-sm shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span>Baixar PDF</span>
                        <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#002B49] flex items-center justify-center">
                          <Download className="w-3 h-3 stroke-[2.5]" />
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
                disabled={isMatBeginning}
                aria-label="Voltar material"
                className={`w-9 h-9 rounded-full flex items-center justify-center border border-[#073B63] bg-[#00182A] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#002B49] hover:border-[#D4AF37] shadow-xs transition ${
                  isMatBeginning ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="materials-swiper-pagination !w-auto flex items-center gap-1.5 px-2" />

              <button
                onClick={() => swiperInstance?.slideNext()}
                disabled={isMatEnd}
                aria-label="Avançar material"
                className={`w-9 h-9 rounded-full flex items-center justify-center border border-[#073B63] bg-[#00182A] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#002B49] hover:border-[#D4AF37] shadow-xs transition ${
                  isMatEnd ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </FadeInCardGroup>
        </div>

        {/* Blog & Academic Articles Carousel */}
        <div>
          {/* Subheading (Constrained Width) */}
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif font-bold text-white">
              Artigos Acadêmicos &amp; Informativos
            </h3>
            <span className="text-xs font-sans text-[#D4AF37] font-semibold hidden sm:inline">
              Publicações regulares
            </span>
          </div>

          {/* Carousel Container (Bleeding off to the right screen edge, left aligned with centered container) */}
          <FadeInCardGroup cardSelector=".gsap-card" stagger={0.08} className="relative group/art-carousel w-full pl-4 sm:pl-6 lg:pl-8 xl:pl-[max(2rem,calc((100vw-1440px)/2+2rem))] overflow-visible">
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
                  slidesPerView: 3.5,
                  spaceBetween: 20,
                  slidesOffsetAfter: 36,
                },
                1280: {
                  slidesPerView: 4.5,
                  spaceBetween: 22,
                  slidesOffsetAfter: 48,
                },
                1536: {
                  slidesPerView: 4.5,
                  spaceBetween: 24,
                  slidesOffsetAfter: 64,
                },
              }}
              pagination={{
                el: '.articles-swiper-pagination',
                clickable: true,
              }}
              onSwiper={handleArtSwiper}
              onSlideChange={handleArtSwiper}
              className="pb-4 pt-1 !overflow-visible"
            >
              {siteData.articles.map((article) => (
                <SwiperSlide key={article.id} className="!h-auto flex">
                  <article className="gsap-card bg-white text-[#1E293B] rounded-2xl p-2.5 sm:p-3 border border-white/20 shadow-xl hover:shadow-2xl hover:border-[#D4AF37] transition-all duration-300 flex flex-col justify-between w-full h-full group">
                    <div>
                      {/* Clean Article Cover Image with tight border spacing */}
                      <div className="relative w-full aspect-16/10 rounded-xl overflow-hidden mb-3 bg-[#002B49]">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>

                      {/* Content Area with refined spacing */}
                      <div className="px-1.5 space-y-1.5">
                        {/* Category & Read Time */}
                        <div className="flex items-center justify-between text-xs font-sans pb-0.5">
                          <span className="font-bold text-[#D4AF37] uppercase text-[11px] tracking-wider">
                            {article.category}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400 text-[11px] font-medium">
                            <Clock className="w-3 h-3 text-[#D4AF37]" />
                            {article.readTime}
                          </span>
                        </div>

                        {/* Title & Excerpt */}
                        <h4 className="text-base font-serif font-bold text-[#002B49] leading-snug group-hover:text-[#073B63] transition-colors line-clamp-2">
                          {article.title}
                        </h4>

                        <p className="text-xs font-sans text-slate-600 leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 px-1.5 pb-0.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-sans text-slate-400 font-medium">{article.date}</span>
                      <button
                        onClick={() => onOpenArticleModal(article)}
                        className="pl-3.5 pr-1.5 py-1.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold inline-flex items-center gap-2 transition cursor-pointer shadow-sm shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span>Ler Artigo</span>
                        <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#002B49] flex items-center justify-center">
                          <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </button>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Bottom Controls */}
            <div className="mt-6 flex items-center justify-center gap-3 pr-4 sm:pr-6 lg:pr-8 xl:pr-[max(2rem,calc((100vw-1440px)/2+2rem))]">
              <button
                onClick={() => articlesSwiperInstance?.slidePrev()}
                disabled={isArtBeginning}
                aria-label="Voltar artigo"
                className={`w-9 h-9 rounded-full flex items-center justify-center border border-[#073B63] bg-[#00182A] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#002B49] hover:border-[#D4AF37] shadow-xs transition ${
                  isArtBeginning ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="articles-swiper-pagination !w-auto flex items-center gap-1.5 px-2" />

              <button
                onClick={() => articlesSwiperInstance?.slideNext()}
                disabled={isArtEnd}
                aria-label="Avançar artigo"
                className={`w-9 h-9 rounded-full flex items-center justify-center border border-[#073B63] bg-[#00182A] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#002B49] hover:border-[#D4AF37] shadow-xs transition ${
                  isArtEnd ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </FadeInCardGroup>
        </div>
      </div>
    </section>
  )
}


