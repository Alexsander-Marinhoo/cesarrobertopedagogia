import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Check,
  Search,
  Award
} from 'lucide-react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { siteData } from '../data/content'
import { fetchPublicCourses } from '../services/portalService'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function CoursesAvaPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Scroll to top on mount and set page title
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Cursos & Ambiente Virtual de Aprendizagem (AVA) | Prof. Cesar Roberto'
  }, [])

  // Load courses from Supabase or fallback to siteData.courses
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
        console.warn('Falha ao carregar cursos, usando catálogo padrão:', err)
        if (isMounted) setCourses((siteData.courses || []).map((c) => ({ ...c, startDate: c.startDate || 'Janeiro de 2027' })))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadCourses()
    return () => {
      isMounted = false
    }
  }, [])

  // Filter and search courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      return (
        searchQuery.trim() === '' ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.modules && c.modules.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    })
  }, [courses, searchQuery])

  const handleOpenPortal = () => {
    if (user) {
      navigate('/portal/paciente')
    } else {
      navigate('/login')
    }
  }

  return (
    <SkeletonTheme baseColor="#EDE8DF" highlightColor="#FAF7F2">
      <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] font-sans antialiased selection:bg-[#D4AF37] selection:text-[#002B49] flex flex-col justify-between">
        
        {/* Global Institutional Floating Navbar adapted for Cursos & AVA */}
        <Navbar onOpenPortal={handleOpenPortal} />

        {/* ========================================================================= */}
        {/* HERO SECTION - CATALOG & AVA */}
        {/* ========================================================================= */}
        <section className="bg-[#002B49] text-white pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 relative overflow-hidden">
          {/* Subtle glow flares */}
          <div className="absolute top-0 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#073B63]/40 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-sans text-slate-300 mb-6">
              <Link to="/" className="hover:text-white transition">Início</Link>
              <span>/</span>
              <span className="text-[#D4AF37] font-semibold">Cursos &amp; AVA</span>
            </div>

            <div className="max-w-3xl space-y-4 text-center sm:text-left">
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white leading-tight tracking-tight">
                Cursos, Especializações &amp; Ambiente Virtual (AVA)
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base font-sans text-slate-300 leading-relaxed max-w-2xl">
                Capacitações continuadas em Neurociência Aplicada à Educação, Adaptações Curriculares (BNCC/PDI) e Intervenção Psicopedagógica ministradas pelo <strong>Prof. Cesar Roberto Loureiro</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SEARCH BAR */}
        {/* ========================================================================= */}
        <section className="bg-white border-b border-slate-200 py-5 sticky top-[72px] sm:top-[90px] z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar curso por tema ou palavra-chave..."
                className="w-full pl-9 pr-4 py-2.5 rounded-full bg-slate-50 border-2 border-slate-300 hover:border-slate-400 text-xs sm:text-sm font-sans focus:outline-none focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-[#002B49] font-semibold transition shadow-2xs"
              />
            </div>

            <span className="text-xs font-sans font-semibold text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs shrink-0 hidden sm:inline-flex">
              {filteredCourses.length} formação(ões) disponível(is)
            </span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* ALL COURSES GRID */}
        {/* ========================================================================= */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#002B49]">
                Catálogo Completo de Cursos
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-500 mt-1">
                Turmas confirmadas com cronograma planejado e início em Janeiro de 2027.
              </p>
            </div>

            <span className="text-xs font-sans font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
              {filteredCourses.length} curso(s) encontrado(s)
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl p-6 bg-white border border-slate-200 shadow-sm space-y-4"
                >
                  <Skeleton height={26} width="75%" />
                  <Skeleton count={2} height={14} />
                  <Skeleton height={1} />
                  <Skeleton height={32} width="40%" />
                  <Skeleton height={42} borderRadius={999} />
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-serif font-bold text-[#002B49]">Nenhum curso encontrado</h3>
              <p className="text-xs sm:text-sm font-sans text-slate-500 mt-1 max-w-md mx-auto">
                Não encontramos nenhuma formação com os termos pesquisados. Tente limpar o filtro de busca.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-4 px-5 py-2 rounded-full bg-[#002B49] text-white text-xs font-cta font-bold hover:bg-[#073B63] transition"
              >
                Limpar Busca
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredCourses.map((course, idx) => (
                <div
                  key={course.id || idx}
                  className="bg-white rounded-[28px] p-6 sm:p-7 border border-[#002B49]/15 shadow-md shadow-[#002B49]/4 hover:shadow-xl hover:border-[#002B49]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Badge de Início 2027 */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase tracking-wider bg-[#002B49]/5 text-[#002B49] border border-[#002B49]/15">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                        Início: {course.startDate || 'Janeiro de 2027'}
                      </span>

                      <span className="text-[11px] font-sans font-medium text-slate-500">
                        {course.workload}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-[#002B49] leading-snug group-hover:text-[#073B63] transition">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs font-sans text-slate-600 mt-2 leading-relaxed line-clamp-3">
                      {course.description}
                    </p>

                    {/* Divider */}
                    <div className="border-t border-slate-100 my-4" />

                    {/* Investment / Price */}
                    <div>
                      <div className="text-2xl font-serif font-bold text-[#002B49]">
                        {course.price}
                      </div>

                      {/* WhatsApp CTA Button */}
                      <a
                        href={`https://wa.me/5532998470152?text=${encodeURIComponent(
                          `Olá, Professor Cesar Loureiro! Gostaria de informações para inscrição na turma de ${course.startDate || 'Janeiro de 2027'} do curso: "${course.title}".`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 w-full py-3 px-4 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold inline-flex items-center justify-center gap-2 transition shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                      >
                        <img src="/whatsapp-icon.svg" alt="WhatsApp" className="w-4 h-4 object-contain" />
                        <span>Garantir Vaga • Jan/2027</span>
                      </a>
                    </div>

                    {/* Modules Checklist */}
                    <div className="space-y-2 mt-5">
                      <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">
                        Ementa &amp; Conteúdo Programático:
                      </div>
                      {(course.modules || []).slice(0, 4).map((mod, mIdx) => (
                        <div key={mIdx} className="flex items-center gap-2 text-xs font-sans text-slate-700">
                          <div className="w-4 h-4 rounded-full bg-[#D4AF37]/20 text-[#002B49] flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="truncate">{mod}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>{course.certificate}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* ========================================================================= */}
        {/* INSTITUTIONAL FOOTER */}
        {/* ========================================================================= */}
        <Footer />
      </div>
    </SkeletonTheme>
  )
}
