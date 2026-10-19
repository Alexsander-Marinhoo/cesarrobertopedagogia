import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, ChevronLeft, BookOpen, Play, Clock, Sparkles, ArrowRight } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, A11y } from 'swiper/modules'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// Swiper core styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import CascadeRevealTitle from './CascadeRevealTitle'
import FadeInParagraph from './FadeInParagraph'
import FadeInCardGroup from './FadeInCardGroup'
import { siteData } from '../data/content'
import { fetchPublicCourses } from '../services/portalService'
import { isSupabaseConfigured } from '../lib/supabase'
import { ScrollTrigger } from '../utils/gsapConfig'

export default function CoursesSection({ onOpenPortalWithTab }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourseModal, setSelectedCourseModal] = useState(null)
  const [swiperInstance, setSwiperInstance] = useState(null)
  const [isBeginning, setIsBeginning] = useState(true)
  const [isEnd, setIsEnd] = useState(false)

  const handleSwiper = (swiper) => {
    setSwiperInstance(swiper)
    setIsBeginning(swiper.isBeginning)
    setIsEnd(swiper.isEnd)
  }

  useEffect(() => {
    let isMounted = true

    async function loadCourses() {
      if (!isSupabaseConfigured) {
        if (isMounted) {
          setCourses(siteData.courses || [])
          setLoading(false)
        }
        return
      }

      try {
        setLoading(true)
        const dbCourses = await fetchPublicCourses()

        if (isMounted) {
          if (dbCourses && dbCourses.length > 0) {
            const formatted = dbCourses.map((c, idx) => {
              const moduleTitles = (c.modulos || [])
                .filter((m) => m.titulo)
                .map((m) => {
                  const lessonCount = m.aulas?.length || 0
                  return lessonCount > 0 ? `${m.titulo} (${lessonCount} ${lessonCount === 1 ? 'aula' : 'aulas'})` : m.titulo
                })

              const dynamicHighlights = [
                'Videoaulas gravadas com acesso no AVA',
                'Material didático e apostilas complementares',
                c.certificado_info || 'Certificado com verificação autêntica',
                c.carga_horaria ? `Carga horária: ${c.carga_horaria}` : 'Formação intensiva e prática'
              ]

              return {
                id: c.id,
                slug: c.slug,
                title: c.titulo,
                description: c.descricao || 'Formação continuada em neuroeducação, práticas inclusivas e capacitação profissional.',
                price: c.preco && parseFloat(c.preco) > 0
                  ? `R$ ${parseFloat(c.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'Consulte Condições',
                workload: c.carga_horaria || '40 horas',
                certificate: c.certificado_info || 'Certificado Válido pelo MEC / Extensão',
                startDate: c.data_inicio || 'Janeiro de 2027',
                thumbnail_url: c.thumbnail_url || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
                modules: moduleTitles.length > 0 ? moduleTitles : dynamicHighlights,
                rawModulos: c.modulos || [],
                isFeatured: idx === 0
              }
            })
            setCourses(formatted)
          } else {
            setCourses((siteData.courses || []).map((c) => ({ ...c, startDate: c.startDate || 'Janeiro de 2027' })))
          }
        }
      } catch (err) {
        console.warn('Falha ao carregar cursos do Supabase, usando padrão:', err)
        if (isMounted) setCourses((siteData.courses || []).map((c) => ({ ...c, startDate: c.startDate || 'Janeiro de 2027' })))
      } finally {
        if (isMounted) {
          setLoading(false)
          setTimeout(() => ScrollTrigger.refresh(), 100)
        }
      }
    }

    loadCourses()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <SkeletonTheme baseColor="#EDE8DF" highlightColor="#FAF7F2">
      <section id="cursos" className="py-20 bg-[#F4F6F8] bg-pattern-grid border-b border-slate-200 overflow-hidden relative text-[#1E293B]">
        {/* Subtle ambient light glow */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#002B49]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full relative z-10">
          {/* Header (Constrained Width) */}
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-300/80 bg-amber-50/90 text-[#002B49] text-[11px] font-cta font-bold uppercase tracking-wider mb-4 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Próximas Turmas: Início em Janeiro de 2027</span>
            </div>

            <CascadeRevealTitle className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#002B49] leading-[1.08] sm:leading-[1.05]">
              Cursos &amp; Treinamentos Certificados
            </CascadeRevealTitle>

            <FadeInParagraph className="mt-3 text-sm sm:text-base font-sans text-slate-600 max-w-2xl mx-auto">
              Ambiente Virtual de Aprendizagem (AVA) com videoaulas, materiais em PDF e certificados válidos com fundamentação em Neuroeducação e BNCC.
            </FadeInParagraph>
          </div>

          {/* Carousel Subheading & Status */}
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif font-bold text-[#002B49]">
              Formações Docentes &amp; Cursos Disponíveis
            </h3>
            <Link
              to="/cursos-ava"
              className="text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] inline-flex items-center gap-1.5 transition underline sm:no-underline hover:underline"
            >
              <span>Ver Catálogo Completo &amp; AVA ({courses.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Swiper Carousel Container (Bleeding off to the right screen edge, left aligned with centered container) */}
          <FadeInCardGroup cardSelector=".gsap-card" stagger={0.08} className="relative group/courses-carousel w-full pl-4 sm:pl-6 lg:pl-8 xl:pl-[max(2rem,calc((100vw-1440px)/2+2rem))] overflow-visible">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-4 pr-4 sm:pr-6 lg:pr-8 xl:pr-[max(2rem,calc((100vw-1440px)/2+2rem))]">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <Skeleton height={24} width="70%" />
                      <Skeleton count={2} height={14} />
                      <Skeleton height={1} />
                      <Skeleton height={32} width="45%" />
                      <Skeleton height={42} borderRadius={999} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Swiper
                modules={[Navigation, Pagination, A11y]}
                spaceBetween={20}
                slidesPerView={1.15}
                slidesOffsetAfter={20}
                loop={false}
                grabCursor={true}
                breakpoints={{
                  500: {
                    slidesPerView: courses.length < 2 ? 1 : 1.5,
                    spaceBetween: 16,
                    slidesOffsetAfter: 24,
                  },
                  640: {
                    slidesPerView: courses.length < 2 ? 1 : 2.2,
                    spaceBetween: 18,
                    slidesOffsetAfter: 28,
                  },
                  768: {
                    slidesPerView: courses.length < 3 ? Math.min(courses.length, 2) : 2.5,
                    spaceBetween: 20,
                    slidesOffsetAfter: 32,
                  },
                  1024: {
                    slidesPerView: courses.length < 3 ? Math.min(courses.length, 2.5) : 3.2,
                    spaceBetween: 20,
                    slidesOffsetAfter: 36,
                  },
                  1280: {
                    slidesPerView: courses.length < 4 ? Math.min(courses.length, 3) : 3.5,
                    spaceBetween: 22,
                    slidesOffsetAfter: 48,
                  },
                  1536: {
                    slidesPerView: courses.length < 4 ? Math.min(courses.length, 3.2) : 3.5,
                    spaceBetween: 24,
                    slidesOffsetAfter: 64,
                  },
                }}
                pagination={{
                  el: '.courses-swiper-pagination',
                  clickable: true,
                }}
                onSwiper={handleSwiper}
                onSlideChange={handleSwiper}
                className="pb-4 pt-1 !overflow-visible"
              >
                {courses.map((course, idx) => {
                  const isFeatured = course.isFeatured ?? (idx === 0)

                  return (
                    <SwiperSlide key={course.id || idx} className="!h-auto flex">
                      <div
                        className={`gsap-card rounded-[24px] sm:rounded-[28px] transition-all duration-300 flex flex-col w-full h-full group overflow-hidden ${
                          isFeatured
                            ? 'bg-[#002B49] text-white border border-[#073B63] shadow-2xl shadow-[#002B49]/20 hover:border-[#D4AF37]/50'
                            : 'bg-white border border-slate-200/90 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:border-slate-300'
                        }`}
                      >
                        {/* Cover Image — topo sem padding, igual ao card de materiais */}
                        {course.thumbnail_url && (
                          <div className="relative w-full aspect-[16/9] overflow-hidden shrink-0">
                            <img
                              src={course.thumbnail_url}
                              alt={course.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            {/* Gradient sutil no rodapé da imagem para transição suave */}
                            <div className={`absolute inset-x-0 bottom-0 h-8 ${isFeatured ? 'bg-gradient-to-t from-[#002B49] to-transparent' : 'bg-gradient-to-t from-white/30 to-transparent'}`} />
                          </div>
                        )}

                        {/* Conteúdo com padding */}
                        <div className="flex flex-col flex-1 justify-between p-5 sm:p-6">
                          <div>
                            {/* Tag de Início / Turma */}
                            <div className="mb-2.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase tracking-wider ${
                                  isFeatured
                                    ? 'bg-white/15 text-[#D4AF37] border border-[#D4AF37]/30'
                                    : 'bg-[#002B49]/5 text-[#002B49] border border-[#002B49]/15'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                                Início: {course.startDate || 'Janeiro de 2027'}
                              </span>
                            </div>

                            {/* Top: Title & Description */}
                            <div>
                              <h3
                                className={`text-lg sm:text-xl font-serif font-bold leading-snug tracking-tight ${
                                  isFeatured ? 'text-white' : 'text-[#002B49]'
                                }`}
                              >
                                {course.title}
                              </h3>
                              <p
                                className={`text-xs font-sans mt-1.5 leading-relaxed line-clamp-2 min-h-[32px] ${
                                  isFeatured ? 'text-slate-300' : 'text-slate-500'
                                }`}
                              >
                                {course.description}
                              </p>
                            </div>

                            {/* Divider 1 */}
                            <div className={`border-t my-4 ${isFeatured ? 'border-white/15' : 'border-slate-200/90'}`} />

                            {/* Price / Investment Header */}
                            <div>
                              <div
                                className={`text-2xl sm:text-3xl font-serif font-bold tracking-tight ${
                                  isFeatured ? 'text-white' : 'text-[#002B49]'
                                }`}
                              >
                                {course.price}
                              </div>

                              {/* Primary Full-Width CTA Button */}
                              <a
                                href={`https://wa.me/5532987252421?text=${encodeURIComponent(
                                  `Olá, Professor Cesar Loureiro! Gostaria de informações para inscrição na turma de ${course.startDate || 'Janeiro de 2027'} do curso: "${course.title}".`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className={`mt-3.5 w-full py-3 px-4 rounded-full text-xs font-cta font-bold inline-flex items-center justify-center gap-2 transition shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                                  isFeatured
                                    ? 'bg-white hover:bg-[#D4AF37] text-[#002B49] shadow-md'
                                    : 'bg-[#002B49] hover:bg-[#073B63] text-white'
                                }`}
                              >
                                <img src="/whatsapp-icon.svg" alt="WhatsApp" className="w-4 h-4 object-contain" />
                                <span>Garantir Vaga • {course.startDate || 'Inscrições Abertas'}</span>
                              </a>
                            </div>

                            {/* Checkpoints / Modules List */}
                            <div className="space-y-2.5 mt-5">
                              {(course.modules || []).slice(0, 4).map((mod, modIdx) => (
                                <div
                                  key={modIdx}
                                  className={`flex items-center gap-2.5 text-xs font-sans ${
                                    isFeatured ? 'text-slate-200' : 'text-slate-700'
                                  }`}
                                >
                                  <div
                                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                                      isFeatured
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-200/90 text-slate-700'
                                    }`}
                                  >
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </div>
                                  <span className="truncate">{mod}</span>
                                </div>
                              ))}

                              {course.rawModulos && course.rawModulos.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedCourseModal(course)}
                                  className={`text-[11px] font-cta font-bold underline transition cursor-pointer pt-0.5 inline-flex items-center gap-1 ${
                                    isFeatured ? 'text-[#D4AF37] hover:text-white' : 'text-[#002B49] hover:text-[#D4AF37]'
                                  }`}
                                >
                                  <BookOpen className="w-3 h-3" />
                                  <span>Ver matriz curricular</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Bottom Partition & Metadata */}
                          <div>
                            {/* Divider 2 */}
                            <div className={`border-t my-4 ${isFeatured ? 'border-white/15' : 'border-slate-200/90'}`} />

                            <div>
                              <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">
                                Turma &amp; Carga Horária
                              </div>
                              <div
                                className={`text-[11px] font-sans mt-0.5 ${
                                  isFeatured ? 'text-slate-300' : 'text-slate-600'
                                }`}
                              >
                                Início: {course.startDate || 'Janeiro de 2027'} • {course.workload}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  )
                })}
              </Swiper>
            )}

            {/* Bottom Controls */}
            <div className="mt-6 flex items-center justify-center gap-3 pr-4 sm:pr-6 lg:pr-8 xl:pr-[max(2rem,calc((100vw-1440px)/2+2rem))]">
              <button
                type="button"
                onClick={() => swiperInstance?.slidePrev()}
                disabled={isBeginning}
                aria-label="Voltar curso"
                className={`w-9 h-9 rounded-full flex items-center justify-center border border-slate-300 bg-white text-[#002B49] hover:bg-[#002B49] hover:text-[#D4AF37] hover:border-[#002B49] shadow-xs transition ${
                  isBeginning ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="courses-swiper-pagination !w-auto flex items-center gap-1.5 px-2" />

              <button
                type="button"
                onClick={() => swiperInstance?.slideNext()}
                disabled={isEnd}
                aria-label="Avançar curso"
                className={`w-9 h-9 rounded-full flex items-center justify-center border border-slate-300 bg-white text-[#002B49] hover:bg-[#002B49] hover:text-[#D4AF37] hover:border-[#002B49] shadow-xs transition ${
                  isEnd ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Botão abaixo do carrossel quando passar de 10 cards */}
            {courses.length > 10 && (
              <div className="mt-8 text-center pr-4 sm:pr-6 lg:pr-8 xl:pr-[max(2rem,calc((100vw-1440px)/2+2rem))]">
                <Link
                  to="/cursos-ava"
                  className="inline-flex items-center gap-3 px-7 sm:px-9 py-3.5 sm:py-4 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white font-cta font-bold text-xs sm:text-sm shadow-md hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-[#D4AF37]/40 cursor-pointer"
                >
                  <span>Ver Todos os Cursos &amp; AVA ({courses.length} formações)</span>
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#002B49] flex items-center justify-center">
                    <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </Link>
              </div>
            )}
          </FadeInCardGroup>

          {/* Banner Cursos EAD — UniATENEU */}
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <div className="relative overflow-hidden rounded-3xl border border-blue-800/40 shadow-xl bg-[#003580]">
              {/* Glow decorativo */}
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-0">
                {/* Imagem (QR Code) */}
                <div className="shrink-0 w-full md:w-56 lg:w-64 self-stretch">
                  <img
                    src="/cursos/curso-ead.jpeg"
                    alt="Cursos EAD UniATENEU — Aponte o QR Code para acessar"
                    className="w-full h-56 md:h-full object-cover object-top"
                  />
                </div>

                {/* Conteúdo */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center justify-between gap-6 flex-1 p-6 sm:p-8 lg:p-10">
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-cta font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Nota máxima 5 no MEC
                    </div>
                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-white leading-snug">
                      Cursos EAD — UniATENEU
                    </h3>
                    <p className="text-sm font-sans text-blue-200 leading-relaxed max-w-md">
                      Graduação, Pós-graduação, Profissionalizantes e Preparatório para Concurso.
                      Qualidade e diploma igual ao presencial, com cursos reconhecidos pelo MEC.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      {['Graduação', 'Pós-Graduação', 'Técnico', 'Concurso'].map((tag) => (
                        <span key={tag} className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-[10px] font-sans font-semibold text-white/80">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-center gap-3">
                    <div className="bg-white rounded-2xl p-3 shadow-lg">
                      <img
                        src="/cursos/curso-ead.jpeg"
                        alt="QR Code UniATENEU"
                        className="w-24 h-24 object-cover object-bottom rounded-lg"
                      />
                    </div>
                    <p className="text-[11px] font-sans text-blue-200 text-center">
                      Aponte a câmera para<br />acessar a plataforma
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Access AVA Banner (Constrained Width) */}

          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <div className="p-7 sm:p-10 rounded-3xl bg-[#002B49] text-white shadow-lg flex flex-col items-center justify-center text-center gap-5 sm:gap-6 border border-[#073B63] max-w-4xl mx-auto">
              <div className="space-y-2 max-w-2xl mx-auto">
                <div className="font-serif font-bold text-lg sm:text-xl md:text-2xl text-white tracking-tight">
                  Já é aluno matriculado em nossos treinamentos?
                </div>
                <p className="text-xs sm:text-sm font-sans text-slate-200 leading-relaxed max-w-lg mx-auto">
                  Acesse suas videoaulas e emita seus certificados no Ambiente Virtual de Aprendizagem (AVA).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onOpenPortalWithTab('courses')}
                  className="w-full sm:w-auto pl-6 pr-2 py-3 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] text-xs sm:text-sm font-cta font-bold inline-flex items-center justify-center gap-3 transition shrink-0 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Acessar Portal AVA</span>
                  <div className="w-7 h-7 rounded-full bg-[#002B49] text-[#D4AF37] flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </div>
                </button>

                <Link
                  to="/cursos-ava"
                  className="w-full sm:w-auto px-6 py-3 rounded-full border border-white/30 hover:border-white text-white hover:bg-white/10 text-xs sm:text-sm font-cta font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <span>Explorar Catálogo Completo</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Detalhes da Matriz Curricular */}
        {selectedCourseModal && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedCourseModal(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#EAE6DF] space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#EAE6DF] pb-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase bg-[#F8F6F0] text-[#002B49] border border-[#D4AF37]/30">
                    Ambiente Virtual de Aprendizagem (AVA)
                  </span>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#002B49]">
                    {selectedCourseModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Início: <strong className="text-[#002B49]">{selectedCourseModal.startDate || 'Janeiro de 2027'}</strong> • Carga Horária: {selectedCourseModal.workload} • {selectedCourseModal.certificate}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCourseModal(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-cta font-bold uppercase tracking-wider text-slate-400">
                  Conteúdo Programático &amp; Aulas Gravadas
                </h4>

                <div className="space-y-3">
                  {(selectedCourseModal.rawModulos || []).map((mod, idx) => (
                    <div
                      key={mod.id || idx}
                      className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] space-y-2.5"
                    >
                      <div className="flex items-center gap-2 text-xs font-sans font-bold text-[#002B49]">
                        <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                        <span>{mod.titulo || `Módulo ${idx + 1}`}</span>
                      </div>

                      {mod.aulas && mod.aulas.length > 0 ? (
                        <div className="pl-6 space-y-1.5 border-l-2 border-[#EAE6DF]">
                          {mod.aulas.map((aula, aIdx) => (
                            <div key={aula.id || aIdx} className="flex items-center justify-between text-xs font-sans text-slate-600">
                              <span className="flex items-center gap-1.5">
                                <Play className="w-3 h-3 text-[#D4AF37]" />
                                {aula.titulo || `Aula ${aIdx + 1}`}
                              </span>
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {aula.duracao || '15 min'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] font-sans text-slate-500 italic pl-6">
                          Videoaulas gravadas, apostila de apoio em PDF e exercícios práticos.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAE6DF] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-lg font-serif font-bold text-[#002B49]">
                  Investimento: {selectedCourseModal.price}
                </div>

                <a
                  href={`https://wa.me/5532987252421?text=${encodeURIComponent(
                    `Olá, Professor Cesar Loureiro! Gostaria de informações para pré-inscrição na turma de ${selectedCourseModal.startDate || 'Janeiro de 2027'} do curso: "${selectedCourseModal.title}".`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <img src="/whatsapp-icon.svg" alt="WhatsApp" className="w-4 h-4 object-contain" />
                  <span>Garantir Vaga • {selectedCourseModal.startDate || 'Jan/2027'}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </section>
    </SkeletonTheme>
  )
}
