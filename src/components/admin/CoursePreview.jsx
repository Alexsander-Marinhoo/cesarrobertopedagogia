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
  AlertCircle,
  CheckCircle2,
  Check,
  Menu,
  ClipboardCheck
} from 'lucide-react'
import { parseVideoUrl, isExternalUrl, getPdfEmbedUrl } from '../../utils/courseMedia'
import { getCursoPdfSignedUrl } from '../../services/adminService'
import TrackedYouTubePlayer from '../TrackedYouTubePlayer'

const DEFAULT_THUMB =
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop'

export const TIPO_META = {
  VIDEO: { label: 'Vídeo', Icon: PlayCircle, color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-200' },
  PDF: { label: 'Apostila (PDF)', Icon: FileText, color: 'text-sky-700', bg: 'bg-sky-50', ring: 'ring-sky-200' },
  TEXTO: { label: 'Texto', Icon: AlignLeft, color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  PROVA: { label: 'Prova', Icon: ClipboardCheck, color: 'text-purple-700', bg: 'bg-purple-50', ring: 'ring-purple-200' }
}

function conteudoVazio(c) {
  if (c.tipo === 'VIDEO') return !c.video_url?.trim()
  if (c.tipo === 'PDF') return !c.pdf_apoio_url?.trim() && !c._pendingFile && !c._localPreviewUrl
  if (c.tipo === 'PROVA') return !c.link_prova?.trim() && !c.video_url?.trim()
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

function formatGoogleFormsUrl(rawUrl) {
  if (!rawUrl) return ''
  let trimmed = rawUrl.trim()
  // Se o usuário colou o link de edição (/edit), troca por /viewform
  if (trimmed.includes('docs.google.com/forms')) {
    trimmed = trimmed.replace(/\/edit(\?.*)?$/i, '/viewform')
    if (!trimmed.includes('embedded=true')) {
      trimmed += (trimmed.includes('?') ? '&' : '?') + 'embedded=true'
    }
  }
  return trimmed
}

function ProvaView({ url, onComplete, isCompleted }) {
  const cleanUrl = (url || '').trim()
  const embedUrl = formatGoogleFormsUrl(cleanUrl)

  if (!cleanUrl) {
    return (
      <EmptyBox
        title="Prova não configurada"
        text="Adicione o link do Google Forms no editor para que a avaliação apareça aqui."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Banner Superior com Orientações e Ações */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-purple-900 to-[#002B49] text-white shadow-lg border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-bold uppercase tracking-wider">
            <ClipboardCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            Avaliação de Conhecimentos
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-100">
            Responda atentamente a todas as questões no formulário abaixo.
          </p>
          <p className="text-xs text-slate-300">
            Caso prefira, você também pode abrir o formulário em tela cheia na nova aba.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <a
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition border border-white/20 cursor-pointer shadow-sm"
          >
            <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
            Abrir em Nova Aba
          </a>

          <button
            type="button"
            onClick={onComplete}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer shadow-md ${
              isCompleted
                ? 'bg-emerald-500 text-white'
                : 'bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isCompleted ? 'Prova Concluída' : 'Marcar como Concluída'}
          </button>
        </div>
      </div>

      {/* Frame Integrado do Google Forms */}
      <div className="w-full min-h-[580px] h-[72vh] rounded-2xl overflow-hidden border border-slate-300 bg-white shadow-xl relative">
        <iframe
          src={embedUrl}
          title="Formulário da Prova"
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        >
          Carregando formulário da prova...
        </iframe>
      </div>

      {/* Confirmação pós-envio */}
      <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="text-xs sm:text-sm text-purple-900 font-medium">
          Após enviar suas respostas no Google Forms acima, confirme aqui para salvar a conclusão.
        </div>
        <button
          type="button"
          onClick={onComplete}
          className="px-5 py-2.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs sm:text-sm font-bold transition shrink-0 cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
          Confirmar Envio da Prova
        </button>
      </div>
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
  onProgress,
  onCompleteCourse
}) {
  const isAluno = modo === 'aluno'
  // selected: null = página de apresentação | { m, c } = conteúdo
  const [selected, setSelected] = useState(null)
  const [openMaterias, setOpenMaterias] = useState(() => new Set(materias.map((_, i) => i)))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
  const isLastContent = totalConteudos > 0 && currentIndex === totalConteudos - 1
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
    setMobileMenuOpen(false)
  }

  // Componente interno reutilizável da lista de matérias (Sidebar no Desktop & Drawer no Mobile)
  const renderMateriasList = () => (
    <>
      <button
        type="button"
        onClick={() => {
          setSelected(null)
          setMobileMenuOpen(false)
        }}
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
                  const concluido = concluidos.has(`${mi}-${ci}`)

                  return (
                    <li key={ci}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected({ m: mi, c: ci })
                          setMobileMenuOpen(false)
                        }}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition cursor-pointer border-l-4 ${
                          active ? 'bg-[#FAF2D8] border-[#D4AF37]' : 'border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <span className="relative shrink-0">
                          <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg}`}>
                            <meta.Icon className={`w-5 h-5 ${meta.color}`} />
                          </span>
                          {concluido && (
                            <span
                              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs ring-2 ring-white"
                              title="Conteúdo concluído"
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                            </span>
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-[#002B49] leading-snug line-clamp-2">
                            {c.titulo || meta.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <span>{meta.label}</span>
                            {concluido && (
                              <span className="text-blue-600 font-bold inline-flex items-center gap-0.5 text-[11px]">
                                · Concluído
                              </span>
                            )}
                            {conteudoVazio(c) && <span className="text-amber-600 font-bold"> · incompleto</span>}
                          </span>
                        </span>

                        {concluido && (
                          <span className="shrink-0 text-blue-600 pl-1" title="Conteúdo concluído">
                            <Check className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )
      })}
    </>
  )

  return (
    <div className="fixed inset-0 z-[70] bg-[#F4F6F8] flex flex-col" data-lenis-prevent>
      {/* Faixa superior: aviso de pré-visualização (admin) ou título do curso (aluno) */}
      <div className={`${isAluno ? 'bg-[#002B49] text-white' : 'bg-[#D4AF37] text-[#002B49]'} px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2.5 sm:gap-3 shadow-md shrink-0`}>
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Botão Hambúrguer Mobile para abrir lista de matérias */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-current transition cursor-pointer shrink-0"
            aria-label="Abrir menu de matérias e aulas"
          >
            <Menu className="w-5 h-5" />
          </button>

          {isAluno ? <BookOpen className="w-5 h-5 shrink-0 text-[#D4AF37]" /> : <Eye className="w-5 h-5 shrink-0" />}
          <p className="text-xs sm:text-base font-bold truncate">
            {isAluno
              ? `${curso?.titulo || 'Curso'} • ${percentualAtual}%`
              : 'Pré-visualização — é assim que o aluno verá o curso.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Atalho mobile para ver matérias */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition cursor-pointer"
          >
            Aulas ({totalConteudos})
          </button>

          <button
            id="preview-close-btn"
            type="button"
            onClick={onClose}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${isAluno ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-[#002B49] hover:bg-[#073B63] text-white'}`}
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">{isAluno ? 'Fechar' : 'Fechar e voltar a editar'}</span>
            <span className="sm:hidden">Sair</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row relative">
        {/* Barra lateral DESKTOP: matérias fixa à esquerda */}
        <aside className="hidden lg:block lg:w-[340px] xl:w-[380px] shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
          {renderMateriasList()}
        </aside>

        {/* DRAWER / GAVETA MOBILE: Abre como modal deslizante quando clica no menu hambúrguer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop escurecido */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Painel lateral da gaveta */}
            <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              <div className="bg-[#002B49] text-white p-4 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                  <span className="font-heading font-extrabold text-sm">Matérias do Curso</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {renderMateriasList()}
              </div>
            </div>
          </div>
        )}

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
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold uppercase tracking-wider text-[#A88319]">
                      Matéria {selected.m + 1} · {materia?.titulo || `Matéria ${selected.m + 1}`}
                    </span>
                    {concluidos.has(chaveAtual) && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shrink-0">
                        <Check className="w-3 h-3 stroke-[3] text-blue-600" />
                        Concluído
                      </span>
                    )}
                  </div>
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
                {conteudo?.tipo === 'PROVA' && (
                  <ProvaView
                    url={conteudo.link_prova || conteudo.video_url}
                    isCompleted={concluidos.has(chaveAtual)}
                    onComplete={marcarConcluido}
                  />
                )}

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
                  {isLastContent ? (
                    <button
                      type="button"
                      disabled={proximoBloqueado}
                      title={proximoBloqueado ? 'Assista pelo menos 90% do vídeo para concluir o curso' : undefined}
                      onClick={() => {
                        marcarConcluido()
                        if (onProgress) onProgress(100)
                        if (onCompleteCourse) {
                          onCompleteCourse()
                        } else {
                          onClose?.()
                        }
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] disabled:opacity-40 disabled:cursor-not-allowed text-[#002B49] text-base font-cta font-bold transition shadow-lg cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#002B49]" />
                      <span>Concluir Curso</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={proximoBloqueado}
                      title={proximoBloqueado ? 'Assista pelo menos 90% do vídeo para continuar' : undefined}
                      onClick={() => goTo(currentIndex + 1)}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#002B49] hover:bg-[#073B63] disabled:opacity-40 disabled:cursor-not-allowed text-white text-base font-bold transition cursor-pointer"
                    >
                      Próximo
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
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
