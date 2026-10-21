import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  PlayCircle,
  FileText,
  AlignLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Award,
  BookOpen,
  Eye,
  ExternalLink,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { parseVideoUrl, isExternalUrl, getPdfEmbedUrl } from '../../utils/courseMedia'
import { getCursoPdfSignedUrl } from '../../services/adminService'
import TrackedYouTubePlayer from '../TrackedYouTubePlayer'

const DEFAULT_THUMB =
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop'

export const TIPO_META = {
  VIDEO: { label: 'Vídeo', Icon: PlayCircle, color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-200' },
  PDF: { label: 'Apostila (PDF)', Icon: FileText, color: 'text-sky-700', bg: 'bg-sky-50', ring: 'ring-sky-200' },
  TEXTO: { label: 'Texto', Icon: AlignLeft, color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200' }
}

function conteudoVazio(c) {
  if (c.tipo === 'VIDEO') return !c.video_url?.trim()
  if (c.tipo === 'PDF') return !c.pdf_apoio_url?.trim() && !c._pendingFile && !c._localPreviewUrl
  return !c.conteudo_texto?.trim()
}

function VideoView({ url, onComplete, alreadyCompleted }) {
  const video = parseVideoUrl(url)
  if (!video) {
    return (
      <EmptyBox
        title="Vídeo não reconhecido"
        text="Cole um link do YouTube, Vimeo ou Google Drive para o vídeo aparecer aqui."
      />
    )
  }
  if (video.provider === 'youtube' && video.videoId) {
    return (
      <TrackedYouTubePlayer
        key={video.videoId}
        videoId={video.videoId}
        threshold={0.9}
        startCompleted={alreadyCompleted}
        onComplete={onComplete}
      />
    )
  }
  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl">
      {video.provider === 'arquivo' ? (
        <video src={video.embedUrl} controls className="w-full h-full" />
      ) : (
        <iframe
          src={video.embedUrl}
          title="Vídeo da aula"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      )}
    </div>
  )
}

function PdfView({ value, nome, localUrl }) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function resolve() {
      setLoading(true)
      if (localUrl) {
        setUrl(localUrl)
      } else if (!value) {
        setUrl(null)
      } else if (isExternalUrl(value)) {
        setUrl(getPdfEmbedUrl(value))
      } else {
        const signed = await getCursoPdfSignedUrl(value)
        if (active) setUrl(signed)
      }
      if (active) setLoading(false)
    }
    resolve()
    return () => {
      active = false
    }
  }, [value, localUrl])

  if (loading) {
    return (
      <div className="w-full h-[60vh] rounded-2xl bg-slate-100 flex items-center justify-center gap-3 text-slate-600">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-base font-semibold">Carregando apostila...</span>
      </div>
    )
  }

  if (!url) {
    return <EmptyBox title="Apostila não encontrada" text="Envie o arquivo PDF da apostila para visualizar." />
  }

  return (
    <div className="space-y-3">
      <div className="w-full h-[60vh] min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-lg">
        <iframe src={url} title={nome || 'Apostila'} className="w-full h-full" />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-sm font-bold transition"
      >
        <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
        Abrir apostila em tela cheia
      </a>
    </div>
  )
}

function EmptyBox({ title, text }) {
  return (
    <div className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center space-y-2">
      <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
      <p className="text-lg font-bold text-[#002B49]">{title}</p>
      <p className="text-base text-slate-600">{text}</p>
    </div>
  )
}

/**
 * Visualizador do curso (matérias, vídeos, apostilas e textos).
 * - modo 'preview' (admin): funciona com os dados do formulário, sem salvar/publicar.
 * - modo 'aluno': mesmo layout, com progresso retomado e reportado via onProgress (0-100).
 */
export default function CoursePreview({
  curso,
  materias = [],
  onClose,
  modo = 'preview',
  initialProgress = 0,
  onProgress
}) {
  const isAluno = modo === 'aluno'
  // selected: null = página de apresentação | { m, c } = conteúdo
  const [selected, setSelected] = useState(null)
  const [openMaterias, setOpenMaterias] = useState(() => new Set(materias.map((_, i) => i)))
  // Conteúdos concluídos (chave "matéria-conteúdo"): vídeos que atingiram 90% e textos/PDFs já abertos.
  // No modo aluno, retoma do progresso salvo (os primeiros N conteúdos, na ordem do curso).
  const [concluidos, setConcluidos] = useState(() => {
    const set = new Set()
    if (!isAluno || !initialProgress) return set
    const keys = []
    materias.forEach((m, mi) => (m.conteudos || []).forEach((_, ci) => keys.push(`${mi}-${ci}`)))
    const n = Math.round((initialProgress / 100) * keys.length)
    keys.slice(0, n).forEach((k) => set.add(k))
    return set
  })

  // Lista "achatada" para navegação anterior/próximo
  const flat = useMemo(() => {
    const list = []
    materias.forEach((m, mi) => (m.conteudos || []).forEach((c, ci) => list.push({ m: mi, c: ci })))
    return list
  }, [materias])

  const totalConteudos = flat.length
  const currentIndex = selected ? flat.findIndex((f) => f.m === selected.m && f.c === selected.c) : -1
  const materia = selected ? materias[selected.m] : null
  const conteudo = selected ? materia?.conteudos?.[selected.c] : null

  const chaveAtual = selected ? `${selected.m}-${selected.c}` : null
  // Só vídeos do YouTube podem ser medidos; os demais não bloqueiam a navegação
  const exigeMeta = conteudo?.tipo === 'VIDEO' && parseVideoUrl(conteudo.video_url)?.provider === 'youtube'
  const proximoBloqueado = exigeMeta && !concluidos.has(chaveAtual)
  const marcarConcluido = () => {
    if (!chaveAtual) return
    setConcluidos((prev) => (prev.has(chaveAtual) ? prev : new Set(prev).add(chaveAtual)))
  }

  // Textos e PDFs contam como concluídos assim que são abertos (não há como medir leitura)
  useEffect(() => {
    if (!chaveAtual || !conteudo || exigeMeta) return
    setConcluidos((prev) => (prev.has(chaveAtual) ? prev : new Set(prev).add(chaveAtual)))
  }, [chaveAtual, conteudo, exigeMeta])

  // Reporta o progresso (somente se aumentou) para ser salvo
  const percentualAtual = totalConteudos ? Math.round((concluidos.size / totalConteudos) * 100) : 0
  const ultimoEnviadoRef = useRef(initialProgress)
  useEffect(() => {
    if (!isAluno || !onProgress) return
    if (percentualAtual > ultimoEnviadoRef.current) {
      ultimoEnviadoRef.current = percentualAtual
      onProgress(percentualAtual)
    }
  }, [isAluno, onProgress, percentualAtual])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const toggleMateria = (i) =>
    setOpenMaterias((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })

  const goTo = (idx) => {
    if (idx < 0) return setSelected(null)
    if (idx >= flat.length) return
    setSelected(flat[idx])
    setOpenMaterias((prev) => new Set(prev).add(flat[idx].m))
  }

  return (
    <div className="fixed inset-0 z-[70] bg-[#F4F6F8] flex flex-col" data-lenis-prevent>
      {/* Faixa superior: aviso de pré-visualização (admin) ou título do curso (aluno) */}
      <div className={`${isAluno ? 'bg-[#002B49] text-white' : 'bg-[#D4AF37] text-[#002B49]'} px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-md`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {isAluno ? <BookOpen className="w-5 h-5 shrink-0 text-[#D4AF37]" /> : <Eye className="w-5 h-5 shrink-0" />}
          <p className="text-sm sm:text-base font-bold truncate">
            {isAluno
              ? `${curso?.titulo || 'Curso'} • ${percentualAtual}% concluído`
              : 'Pré-visualização — é assim que o aluno verá o curso. Nada foi publicado.'}
          </p>
        </div>
        <button
          id="preview-close-btn"
          type="button"
          onClick={onClose}
          className={`shrink-0 inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-bold transition cursor-pointer ${isAluno ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-[#002B49] hover:bg-[#073B63] text-white'}`}
        >
          <X className="w-4 h-4" />
          <span>{isAluno ? 'Fechar' : 'Fechar e voltar a editar'}</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Barra lateral: matérias */}
        <aside className="lg:w-[340px] xl:w-[380px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto max-h-[40vh] lg:max-h-none">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={`w-full text-left p-5 border-b border-slate-100 transition cursor-pointer ${
              !selected ? 'bg-[#002B49] text-white' : 'hover:bg-slate-50 text-[#002B49]'
            }`}
          >
            <span className={`text-xs font-bold uppercase tracking-wider ${!selected ? 'text-[#D4AF37]' : 'text-slate-500'}`}>
              Apresentação
            </span>
            <p className="font-heading font-extrabold text-base leading-snug line-clamp-2">
              {curso?.titulo || 'Curso sem título'}
            </p>
            <p className={`text-sm mt-1 ${!selected ? 'text-slate-200' : 'text-slate-500'}`}>
              {materias.length} {materias.length === 1 ? 'matéria' : 'matérias'} · {totalConteudos}{' '}
              {totalConteudos === 1 ? 'conteúdo' : 'conteúdos'}
            </p>
          </button>

          {materias.length === 0 && (
            <p className="p-5 text-base text-slate-500">Nenhuma matéria adicionada ainda.</p>
          )}

          {materias.map((m, mi) => {
            const open = openMaterias.has(mi)
            return (
              <div key={mi} className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleMateria(mi)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 transition cursor-pointer text-left"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#A88319]">Matéria {mi + 1}</span>
                    <p className="font-bold text-[#002B49] text-base leading-snug">{m.titulo || `Matéria ${mi + 1}`}</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>

                {open && (
                  <ul className="pb-2">
                    {(m.conteudos || []).length === 0 && (
                      <li className="px-5 py-2 text-sm text-slate-400">Sem conteúdos nesta matéria.</li>
                    )}
                    {(m.conteudos || []).map((c, ci) => {
                      const meta = TIPO_META[c.tipo] || TIPO_META.TEXTO
                      const active = selected?.m === mi && selected?.c === ci
                      return (
                        <li key={ci}>
                          <button
                            type="button"
                            onClick={() => setSelected({ m: mi, c: ci })}
                            className={`w-full flex items-center gap-3 px-5 py-3 text-left transition cursor-pointer border-l-4 ${
                              active ? 'bg-[#FAF2D8] border-[#D4AF37]' : 'border-transparent hover:bg-slate-50'
                            }`}
                          >
                            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                              <meta.Icon className={`w-5 h-5 ${meta.color}`} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#002B49] leading-snug line-clamp-2">
                                {c.titulo || meta.label}
                              </span>
                              <span className="block text-xs text-slate-500">
                                {meta.label}
                                {conteudoVazio(c) && <span className="text-amber-600 font-bold"> · incompleto</span>}
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </aside>

        {/* Área principal */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6">
            {!selected ? (
              <>
                <div className="relative rounded-3xl overflow-hidden shadow-xl bg-[#002B49]">
                  <img
                    src={curso?.thumbnail_url || DEFAULT_THUMB}
                    alt={curso?.titulo || 'Capa do curso'}
                    className="w-full h-56 sm:h-72 object-cover opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#00182A] via-[#00182A]/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 space-y-2">
                    <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-white leading-tight">
                      {curso?.titulo || 'Curso sem título'}
                    </h1>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoPill Icon={Clock} label="Carga horária" value={curso?.carga_horaria || '—'} />
                  <InfoPill Icon={BookOpen} label="Matérias" value={String(materias.length)} />
                </div>

                {curso?.descricao ? (
                  <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-2">
                    <h2 className="text-lg font-heading font-extrabold text-[#002B49]">Sobre o curso</h2>
                    <p className="text-base leading-relaxed text-slate-700 whitespace-pre-line">{curso.descricao}</p>
                  </section>
                ) : null}

                {curso?.certificado_info ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#FDFBF3] border border-[#EAD9A0] text-[#002B49]">
                    <Award className="w-6 h-6 text-[#D4AF37] shrink-0" />
                    <span className="text-base font-semibold">{curso.certificado_info}</span>
                  </div>
                ) : null}

                {totalConteudos > 0 && (
                  <button
                    type="button"
                    onClick={() => goTo(0)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-base font-bold transition shadow-lg cursor-pointer"
                  >
                    <PlayCircle className="w-5 h-5 text-[#D4AF37]" />
                    Começar o curso
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="text-sm font-bold uppercase tracking-wider text-[#A88319]">
                    Matéria {selected.m + 1} · {materia?.titulo || `Matéria ${selected.m + 1}`}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#002B49] leading-tight">
                    {conteudo?.titulo || TIPO_META[conteudo?.tipo]?.label}
                  </h1>
                  {selected.c === 0 && materia?.descricao ? (
                    <p className="text-base text-slate-600 pt-1">{materia.descricao}</p>
                  ) : null}
                </div>

                {conteudo?.tipo === 'VIDEO' && (
                  <VideoView
                    url={conteudo.video_url}
                    alreadyCompleted={concluidos.has(chaveAtual)}
                    onComplete={marcarConcluido}
                  />
                )}
                {conteudo?.tipo === 'PDF' && (
                  <PdfView
                    value={conteudo.pdf_apoio_url}
                    nome={conteudo.arquivo_nome}
                    localUrl={conteudo._localPreviewUrl}
                  />
                )}
                {conteudo?.tipo === 'TEXTO' &&
                  (conteudo.conteudo_texto?.trim() ? (
                    <article className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-8">
                      <p className="text-lg leading-relaxed text-slate-800 whitespace-pre-line">{conteudo.conteudo_texto}</p>
                    </article>
                  ) : (
                    <EmptyBox title="Texto vazio" text="Escreva o texto desta parte no editor." />
                  ))}

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => goTo(currentIndex - 1)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-[#002B49] text-base font-bold transition cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Anterior
                  </button>
                  <span className="hidden sm:block text-sm text-slate-500 font-semibold">
                    {currentIndex + 1} de {totalConteudos}
                  </span>
                  <button
                    type="button"
                    disabled={currentIndex >= totalConteudos - 1 || proximoBloqueado}
                    title={proximoBloqueado ? 'Assista pelo menos 90% do vídeo para continuar' : undefined}
                    onClick={() => goTo(currentIndex + 1)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#002B49] hover:bg-[#073B63] disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-bold transition cursor-pointer"
                  >
                    Próximo
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function InfoPill({ Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200">
      <span className="w-11 h-11 rounded-xl bg-[#FAF2D8] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[#A88319]" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-base font-bold text-[#002B49] truncate">{value}</p>
      </div>
    </div>
  )
}
