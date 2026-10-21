import { useEffect, useState, useRef } from 'react'
import {
  X,
  Eye,
  Check,
  Plus,
  Trash2,
  Upload,
  Video,
  FileText,
  AlignLeft,
  Clock,
  Award,
  DollarSign,
  Calendar,
  Image as ImageIcon,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Sparkles,
  Link2,
  ExternalLink,
  HelpCircle,
  Layers
} from 'lucide-react'
import CoursePreview from './CoursePreview'
import {
  createAdminCurso,
  updateAdminCurso,
  fetchAdminCursoMaterias,
  saveAdminCursoMaterias,
  uploadCursoPdf,
  uploadCursoCapa,
  deleteCursoCapa,
  generateSlug
} from '../../services/adminService'
import { parseVideoUrl, formatFileSize, compressImage } from '../../utils/courseMedia'

const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop'

export default function CourseEditorModal({
  isOpen,
  curso = null, // se fornecido, estamos editando
  onClose,
  onSaved
}) {
  const [currentStep, setCurrentStep] = useState(1) // 1: Dados do Curso | 2: Matérias e Conteúdos
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingInitial, setLoadingInitial] = useState(false)
  const [saveProgressMsg, setSaveProgressMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Passo 1: Informações Básicas do Curso
  const [cursoData, setCursoData] = useState({
    id: null,
    titulo: '',
    slug: '',
    descricao: '',
    preco: '',
    carga_horaria: '',
    certificado_info: 'Certificado Válido pelo MEC / Extensão',
    thumbnail_url: DEFAULT_COVER,
    data_inicio: 'Janeiro de 2027',
    ativo: true
  })

  // Passo 2: Matérias e Conteúdos
  // Cada matéria: { id, titulo, descricao, conteudos: [ { tipo: 'VIDEO'|'PDF'|'TEXTO', titulo, video_url, pdf_apoio_url, arquivo_nome, conteudo_texto } ] }
  const [materias, setMaterias] = useState([])

  // Upload helpers e mídias pendentes (arquivos locais só vão para o Supabase ao clicar em Salvar/Publicar)
  const [uploadingCapa, setUploadingCapa] = useState(false)
  const [capaPendingFile, setCapaPendingFile] = useState(null)
  const [capaPreviewUrl, setCapaPreviewUrl] = useState('')
  const [capaRemovida, setCapaRemovida] = useState(false)
  const fileCapaRef = useRef(null)

  // Ao abrir o modal, carregar dados se estiver editando ou resetar se for novo
  useEffect(() => {
    if (!isOpen) return

    setCurrentStep(1)
    setIsPreviewOpen(false)
    setErrorMsg('')
    setSaveProgressMsg('')
    setCapaPendingFile(null)
    setCapaPreviewUrl('')
    setCapaRemovida(false)

    if (curso && curso.id) {
      setCursoData({
        id: curso.id,
        titulo: curso.titulo || '',
        slug: curso.slug || '',
        descricao: curso.descricao || '',
        preco: curso.preco !== undefined && curso.preco !== null ? Number(curso.preco).toFixed(2).replace('.', ',') : '',
        carga_horaria: curso.carga_horaria || '',
        certificado_info: curso.certificado_info || 'Certificado Válido pelo MEC / Extensão',
        thumbnail_url: curso.thumbnail_url || DEFAULT_COVER,
        data_inicio: curso.data_inicio || 'Janeiro de 2027',
        ativo: curso.ativo ?? true
      })

      // Buscar matérias existentes do banco
      setLoadingInitial(true)
      fetchAdminCursoMaterias(curso.id)
        .then((mats) => {
          if (mats && mats.length > 0) {
            setMaterias(mats)
          } else {
            // Se o curso antigo não tinha matérias cadastradas, cria 1 matéria de exemplo vazia
            setMaterias([
              {
                titulo: 'Matéria 1: Introdução e Fundamentos',
                descricao: '',
                conteudos: []
              }
            ])
          }
        })
        .catch((err) => {
          console.warn('Erro ao carregar matérias:', err)
          setMaterias([
            {
              titulo: 'Matéria 1: Introdução e Fundamentos',
              descricao: '',
              conteudos: []
            }
          ])
        })
        .finally(() => setLoadingInitial(false))
    } else {
      // Novo Curso
      setCursoData({
        id: crypto.randomUUID(),
        titulo: '',
        slug: '',
        descricao: '',
        preco: '',
        carga_horaria: '',
        certificado_info: 'Certificado Válido pelo MEC / Extensão',
        thumbnail_url: DEFAULT_COVER,
        data_inicio: 'Janeiro de 2027',
        ativo: true
      })
      setMaterias([
        {
          titulo: 'Matéria 1: Introdução e Fundamentos',
          descricao: '',
          conteudos: [
            {
              tipo: 'VIDEO',
              titulo: 'Aula de Apresentação',
              video_url: '',
              pdf_apoio_url: '',
              arquivo_nome: '',
              conteudo_texto: ''
            }
          ]
        }
      ])
    }
  }, [isOpen, curso])

  if (!isOpen) return null

  // Atualizar campo do curso
  const updateCursoField = (field, value) => {
    setCursoData((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'titulo' && !curso) {
        next.slug = generateSlug(value)
      }
      return next
    })
  }

  // Formatação inteligente de Preço (bloqueia letras, ponto vira vírgula, max 2 decimais)
  const handlePrecoChange = (e) => {
    let val = e.target.value
    // Remove qualquer caractere que não seja número, vírgula ou ponto
    val = val.replace(/[^0-9,\.]/g, '')
    // Converte ponto para vírgula
    val = val.replace(/\./g, ',')
    // Permite apenas uma vírgula
    const parts = val.split(',')
    if (parts.length > 2) {
      val = parts[0] + ',' + parts.slice(1).join('')
    }
    // No máximo 2 casas decimais
    if (parts[1] !== undefined && parts[1].length > 2) {
      val = parts[0] + ',' + parts[1].slice(0, 2)
    }
    updateCursoField('preco', val)
  }

  const handlePrecoBlur = () => {
    let val = String(cursoData.preco || '').trim()
    if (!val) {
      return
    }
    if (!val.includes(',')) {
      val = `${val},00`
    } else {
      const [inteiro, decimal] = val.split(',')
      val = `${inteiro || '0'},${(decimal || '').padEnd(2, '0').slice(0, 2)}`
    }
    updateCursoField('preco', val)
  }

  // Formatação inteligente de Carga Horária (apenas números, recebe "horas" no final)
  const handleCargaHorariaChange = (e) => {
    const apenasDigitos = e.target.value.replace(/\D/g, '')
    updateCursoField('carga_horaria', apenasDigitos ? `${apenasDigitos} horas` : '')
  }

  // Preparação da imagem de capa (otimiza no navegador e gera preview local sem enviar ao Supabase)
  const handleSelectCapa = async (file) => {
    if (!file) return
    try {
      setUploadingCapa(true)
      setErrorMsg('')

      // Comprime e converte para WebP no próprio navegador (zero consumo de rede)
      const compressedFile = await compressImage(file)
      setCapaPendingFile(compressedFile)

      if (capaPreviewUrl) {
        URL.revokeObjectURL(capaPreviewUrl)
      }
      const preview = URL.createObjectURL(compressedFile)
      setCapaPreviewUrl(preview)
      setCapaRemovida(false)
    } catch (err) {
      setErrorMsg('Erro ao preparar imagem: ' + err.message)
    } finally {
      setUploadingCapa(false)
    }
  }

  const handleRemoveCapa = () => {
    if (capaPreviewUrl) {
      URL.revokeObjectURL(capaPreviewUrl)
    }
    setCapaPendingFile(null)
    setCapaPreviewUrl('')
    setCapaRemovida(true)
    updateCursoField('thumbnail_url', DEFAULT_COVER)
  }

  // =========================================================================
  // GESTÃO DE MATÉRIAS
  // =========================================================================
  const addMateria = () => {
    setMaterias((prev) => [
      ...prev,
      {
        titulo: `Matéria ${prev.length + 1}: Novo Assunto`,
        descricao: '',
        conteudos: []
      }
    ])
  }

  const removeMateria = (mIndex) => {
    if (materias.length === 1) {
      if (!window.confirm('Deseja realmente remover esta matéria? O curso ficará sem matérias.')) return
    }
    setMaterias((prev) => prev.filter((_, idx) => idx !== mIndex))
  }

  const updateMateria = (mIndex, field, value) => {
    setMaterias((prev) =>
      prev.map((m, idx) => (idx === mIndex ? { ...m, [field]: value } : m))
    )
  }

  const moveMateria = (mIndex, direction) => {
    const targetIndex = mIndex + direction
    if (targetIndex < 0 || targetIndex >= materias.length) return
    setMaterias((prev) => {
      const next = [...prev]
      const temp = next[mIndex]
      next[mIndex] = next[targetIndex]
      next[targetIndex] = temp
      return next
    })
  }

  // =========================================================================
  // GESTÃO DE CONTEÚDOS DENTRO DA MATÉRIA (VÍDEO / PDF / TEXTO)
  // =========================================================================
  const addConteudoToMateria = (mIndex, tipo) => {
    const defaultTitles = {
      VIDEO: 'Vídeo da Aula',
      PDF: 'Apostila em PDF',
      TEXTO: 'Texto e Orientações de Estudo'
    }

    setMaterias((prev) =>
      prev.map((m, idx) => {
        if (idx !== mIndex) return m
        return {
          ...m,
          conteudos: [
            ...(m.conteudos || []),
            {
              tipo,
              titulo: defaultTitles[tipo] || 'Conteúdo',
              video_url: '',
              pdf_apoio_url: '',
              arquivo_nome: '',
              conteudo_texto: ''
            }
          ]
        }
      })
    )
  }

  const removeConteudo = (mIndex, cIndex) => {
    setMaterias((prev) =>
      prev.map((m, idx) => {
        if (idx !== mIndex) return m
        return {
          ...m,
          conteudos: (m.conteudos || []).filter((_, cIdx) => cIdx !== cIndex)
        }
      })
    )
  }

  const updateConteudo = (mIndex, cIndex, field, value) => {
    setMaterias((prev) =>
      prev.map((m, idx) => {
        if (idx !== mIndex) return m
        const nextConteudos = [...(m.conteudos || [])]
        nextConteudos[cIndex] = {
          ...nextConteudos[cIndex],
          [field]: value
        }
        return { ...m, conteudos: nextConteudos }
      })
    )
  }

  // Seleção de PDF local (mantém em memória no navegador sem enviar ao Supabase até o clique em Salvar/Publicar)
  const handleSelectPdfConteudo = (mIndex, cIndex, file) => {
    if (!file) return
    setErrorMsg('')
    const localUrl = URL.createObjectURL(file)

    setMaterias((prev) => {
      const next = [...prev]
      const mat = { ...next[mIndex] }
      const nextConteudos = [...(mat.conteudos || [])]
      const cAtual = nextConteudos[cIndex] || {}

      if (cAtual._localPreviewUrl) {
        URL.revokeObjectURL(cAtual._localPreviewUrl)
      }

      nextConteudos[cIndex] = {
        ...cAtual,
        arquivo_nome: file.name,
        _pendingFile: file,
        _localPreviewUrl: localUrl,
        titulo: (!cAtual.titulo || cAtual.titulo === 'Apostila em PDF')
          ? file.name.replace(/\.pdf$/i, '')
          : cAtual.titulo
      }

      mat.conteudos = nextConteudos
      next[mIndex] = mat
      return next
    })
  }

  const handleRemovePdfConteudo = (mIndex, cIndex) => {
    setMaterias((prev) => {
      const next = [...prev]
      const mat = { ...next[mIndex] }
      const nextConteudos = [...(mat.conteudos || [])]
      const cAtual = nextConteudos[cIndex] || {}

      if (cAtual._localPreviewUrl) {
        URL.revokeObjectURL(cAtual._localPreviewUrl)
      }

      nextConteudos[cIndex] = {
        ...cAtual,
        pdf_apoio_url: '',
        arquivo_nome: '',
        _pendingFile: null,
        _localPreviewUrl: null
      }

      mat.conteudos = nextConteudos
      next[mIndex] = mat
      return next
    })
  }

  // =========================================================================
  // SALVAR NO SUPABASE (SOMENTE AQUI OS ARQUIVOS SÃO ENVIADOS AO STORAGE)
  // =========================================================================
  const handleSave = async (e) => {
    if (e) e.preventDefault()

    if (!cursoData.titulo?.trim()) {
      setErrorMsg('Por favor, digite o Nome do Curso antes de salvar.')
      setCurrentStep(1)
      return
    }

    try {
      setSaving(true)
      setErrorMsg('')

      // 1. Garante ou define o ID definitivo do curso
      const courseId = cursoData.id || crypto.randomUUID()
      let finalThumbnailUrl = (!capaRemovida && cursoData.thumbnail_url) || DEFAULT_COVER

      // Se há imagem de capa pendente selecionada, envia para o bucket 'cursos' agora
      if (capaPendingFile) {
        setSaveProgressMsg('Enviando imagem de capa...')
        finalThumbnailUrl = await uploadCursoCapa(courseId, capaPendingFile)
      } else if (capaRemovida && cursoData.id) {
        // Se removeu a capa personalizada pré-existente
        await deleteCursoCapa(cursoData.id)
        finalThumbnailUrl = DEFAULT_COVER
      }

      setSaveProgressMsg('Gravando dados do curso...')
      const precoNumerico = parseFloat(String(cursoData.preco || '0').replace(/\./g, '').replace(',', '.')) || 0

      const payloadCurso = {
        id: courseId,
        titulo: cursoData.titulo.trim(),
        slug: cursoData.slug ? generateSlug(cursoData.slug) : generateSlug(cursoData.titulo),
        descricao: cursoData.descricao || '',
        preco: precoNumerico,
        carga_horaria: cursoData.carga_horaria || '40 horas',
        certificado_info: cursoData.certificado_info || 'Certificado Válido pelo MEC / Extensão',
        thumbnail_url: finalThumbnailUrl,
        data_inicio: cursoData.data_inicio || 'Janeiro de 2027',
        ativo: cursoData.ativo ?? true
      }

      let cursoSalvo = null
      if (cursoData.id) {
        // Atualiza curso existente
        cursoSalvo = await updateAdminCurso(cursoData.id, payloadCurso)
      } else {
        // Cria novo curso
        cursoSalvo = await createAdminCurso(payloadCurso)
      }

      if (!cursoSalvo?.id) {
        throw new Error('Não foi possível obter a confirmação do curso salvo.')
      }

      // 2. Se houver apostilas em PDF pendentes, faz o upload para o Supabase agora
      const materiasFinais = []
      for (let mi = 0; mi < materias.length; mi++) {
        const mat = materias[mi]
        const conteudosFinais = []

        for (let ci = 0; ci < (mat.conteudos || []).length; ci++) {
          const c = { ...mat.conteudos[ci] }

          if (c._pendingFile) {
            setSaveProgressMsg(`Enviando apostila: ${c.arquivo_nome || 'PDF'}...`)
            const { path, nome } = await uploadCursoPdf(cursoSalvo.id, c._pendingFile)
            c.pdf_apoio_url = path
            c.arquivo_nome = nome
          }

          // Limpa referências locais de memória antes de gravar no banco
          delete c._pendingFile
          delete c._localPreviewUrl

          conteudosFinais.push(c)
        }

        materiasFinais.push({
          ...mat,
          conteudos: conteudosFinais
        })
      }

      // 3. Salva as matérias e conteúdos
      setSaveProgressMsg('Sincronizando matérias, apostilas e vídeos...')
      await saveAdminCursoMaterias(cursoSalvo.id, materiasFinais)

      setSaveProgressMsg('Tudo pronto!')
      if (onSaved) {
        await onSaved(cursoSalvo)
      }
      onClose()
    } catch (err) {
      console.error('Erro ao salvar curso:', err)
      setErrorMsg('Não foi possível salvar: ' + (err.message || 'Erro inesperado'))
    } finally {
      setSaving(false)
      setSaveProgressMsg('')
    }
  }

  // Fechar com aviso de confirmação e limpeza de URLs locais
  const handleRequestClose = () => {
    if (saving) return
    if (window.confirm('Deseja fechar a janela? Dados não salvos serão descartados.')) {
      if (capaPreviewUrl) {
        URL.revokeObjectURL(capaPreviewUrl)
      }
      materias.forEach((m) =>
        (m.conteudos || []).forEach((c) => {
          if (c._localPreviewUrl) URL.revokeObjectURL(c._localPreviewUrl)
        })
      )
      onClose()
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-[#001424]/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-modal-title"
      >
        <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
          
          {/* ========================================================================= */}
          {/* CABEÇALHO SUPERIOR - CORES PREMIUM E IDENTIFICAÇÃO CLARA */}
          {/* ========================================================================= */}
          <div className="bg-[#002B49] text-white px-5 sm:px-8 py-4 sm:py-5 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-cta font-bold uppercase tracking-wider text-[#D4AF37]">
                  Painel do Professor / Administrador
                </span>
                <h2 id="course-modal-title" className="text-xl sm:text-2xl font-heading font-extrabold text-white leading-tight">
                  {cursoData.id ? 'Editar Curso' : 'Cadastrar Novo Curso'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botão de Pré-visualização Sempre Presente */}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#b89528] text-[#002B49] font-cta font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-md"
                title="Veja exatamente como o aluno verá este curso antes de salvar"
              >
                <Eye className="w-4 h-4 text-[#002B49] stroke-[2.5]" />
                <span>Como o Aluno Verá</span>
              </button>

              {/* Botão Fechar */}
              <button
                type="button"
                onClick={handleRequestClose}
                className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* NAVEGAÇÃO ENTRE OS 2 PASSOS (SIMPLES E DIRETA PARA O CLIENTE) */}
          {/* ========================================================================= */}
          <div className="bg-[#F8F6F0] px-5 sm:px-8 py-3 border-b border-[#EAE6DF] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  currentStep === 1
                    ? 'bg-[#002B49] text-white shadow-sm'
                    : 'text-[#002B49] hover:bg-slate-200/70'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                  currentStep === 1 ? 'bg-[#D4AF37] text-[#002B49]' : 'bg-slate-300 text-slate-700'
                }`}>
                  1
                </span>
                <span>Dados do Curso</span>
              </button>

              <ChevronRight className="w-4 h-4 text-slate-400 hidden sm:block" />

              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  currentStep === 2
                    ? 'bg-[#002B49] text-white shadow-sm'
                    : 'text-[#002B49] hover:bg-slate-200/70'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                  currentStep === 2 ? 'bg-[#D4AF37] text-[#002B49]' : 'bg-slate-300 text-slate-700'
                }`}>
                  2
                </span>
                <span>Matérias e Conteúdos ({materias.length})</span>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <HelpCircle className="w-4 h-4 text-[#D4AF37]" />
              <span>Vídeos, apostilas e textos são todos opcionais. Você escolhe!</span>
            </div>
          </div>

          {/* Mensagem de Erro (se houver) */}
          {errorMsg && (
            <div className="bg-rose-50 border-l-4 border-rose-600 p-4 mx-5 sm:mx-8 mt-4 rounded-r-xl flex items-center justify-between gap-3 text-rose-800 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                className="text-rose-600 hover:text-rose-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CORPO DO FORMULÁRIO COM ROLAGEM CONFORTÁVEL */}
          {/* ========================================================================= */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-[#1E293B]">
            {loadingInitial ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-[#002B49] animate-spin mx-auto" />
                <p className="text-base font-bold text-slate-700">Carregando informações do curso e matérias...</p>
              </div>
            ) : currentStep === 1 ? (
              /* ===================================================================== */
              /* PASSO 1: DADOS DO CURSO */
              /* ===================================================================== */
              <div className="space-y-6">
                
                {/* Nome do Curso */}
                <div className="space-y-2">
                  <label className="block text-base sm:text-lg font-bold text-[#002B49]">
                    Nome do Curso <span className="text-rose-600">*</span>
                  </label>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Digite o título principal que os alunos verão na página do site e no portal.
                  </p>
                  <input
                    type="text"
                    required
                    value={cursoData.titulo}
                    onChange={(e) => updateCursoField('titulo', e.target.value)}
                    placeholder="Nome do curso aqui"
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:ring-4 focus:ring-[#002B49]/10 text-base sm:text-lg font-bold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-xs"
                  />
                </div>

                {/* Grid: Preço e Carga Horária */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  {/* Preço */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#002B49] uppercase tracking-wide">
                      <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                      Preço de Investimento (R$)
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-base font-bold text-slate-400 select-none">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cursoData.preco}
                        onChange={handlePrecoChange}
                        onBlur={handlePrecoBlur}
                        placeholder="Valor aqui"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-slate-300 focus:border-[#002B49] text-base font-bold text-[#002B49] placeholder:text-slate-400 placeholder:font-normal focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Carga Horária */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#002B49] uppercase tracking-wide">
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                      Carga Horária
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={String(cursoData.carga_horaria || '').replace(/\D/g, '')}
                        onChange={handleCargaHorariaChange}
                        placeholder="Carga horária aqui"
                        className={`w-full pl-4 ${
                          String(cursoData.carga_horaria || '').replace(/\D/g, '') ? 'pr-16' : 'pr-4'
                        } py-3 rounded-xl bg-white border-2 border-slate-300 focus:border-[#002B49] text-base font-bold text-[#002B49] placeholder:text-slate-400 placeholder:font-normal focus:outline-none shadow-xs`}
                      />
                      {Boolean(String(cursoData.carga_horaria || '').replace(/\D/g, '')) && (
                        <span className="absolute right-4 text-sm font-bold text-slate-400 select-none pointer-events-none">
                          horas
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Imagem de Capa do Curso */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-[#002B49] uppercase tracking-wide">
                        <ImageIcon className="w-4 h-4 text-[#D4AF37]" />
                        Imagem de Capa do Curso
                      </label>
                      <p className="text-xs text-slate-500">
                        Foto de apresentação do curso. Você pode enviar do computador ou usar a imagem padrão.
                      </p>
                    </div>

                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* Visualizador da Capa */}
                    <div className="w-full sm:w-56 h-36 rounded-2xl overflow-hidden bg-slate-200 border-2 border-slate-300 shrink-0 relative group shadow-inner">
                      <img
                        src={capaPreviewUrl || (!capaRemovida && cursoData.thumbnail_url) || DEFAULT_COVER}
                        alt="Capa do curso"
                        className="w-full h-full object-cover"
                      />
                      {uploadingCapa && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                          <span>Otimizando foto...</span>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação da Capa */}
                    <div className="w-full space-y-3">
                      <input
                        ref={fileCapaRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleSelectCapa(file)
                        }}
                      />

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => fileCapaRef.current?.click()}
                          disabled={uploadingCapa}
                          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#002B49] hover:bg-[#073B63] text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
                        >
                          <Upload className="w-4 h-4 text-[#D4AF37]" />
                          <span>
                            {capaPendingFile || (!capaRemovida && cursoData.thumbnail_url && cursoData.thumbnail_url !== DEFAULT_COVER)
                              ? 'Trocar Foto'
                              : 'Escolher Foto do Computador'}
                          </span>
                        </button>

                        {(capaPendingFile || (!capaRemovida && cursoData.thumbnail_url && cursoData.thumbnail_url !== DEFAULT_COVER)) && (
                          <button
                            type="button"
                            onClick={handleRemoveCapa}
                            className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            title="Restaurar capa padrão"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Remover foto</span>
                          </button>
                        )}
                      </div>

                      {capaPendingFile && (
                        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg w-fit">
                          <Check className="w-3.5 h-3.5 text-amber-600" />
                          Foto selecionada (será enviada somente ao publicar o curso)
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Previsão de Início e Certificado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#002B49] uppercase tracking-wide">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Previsão de Início / Turma
                    </label>
                    <input
                      type="text"
                      value={cursoData.data_inicio}
                      onChange={(e) => updateCursoField('data_inicio', e.target.value)}
                      placeholder="Ex: Janeiro de 2027 ou Imediato"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 focus:border-[#002B49] text-sm font-semibold text-[#002B49] focus:outline-none shadow-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#002B49] uppercase tracking-wide">
                      <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Informações do Certificado
                    </label>
                    <input
                      type="text"
                      value={cursoData.certificado_info}
                      onChange={(e) => updateCursoField('certificado_info', e.target.value)}
                      placeholder="Ex: Certificado Válido pelo MEC / Extensão"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border-2 border-slate-300 focus:border-[#002B49] text-sm font-semibold text-[#002B49] focus:outline-none shadow-xs"
                    />
                  </div>
                </div>

                {/* Descrição do Curso */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-[#002B49] uppercase tracking-wide">
                    Descrição e Objetivos do Curso
                  </label>
                  <p className="text-xs text-slate-500">
                    Escreva um resumo convidativo explicando o que os alunos vão aprender neste curso.
                  </p>
                  <textarea
                    rows={4}
                    value={cursoData.descricao}
                    onChange={(e) => updateCursoField('descricao', e.target.value)}
                    placeholder="Neste curso prático, você aprenderá estratégias pedagógicas inovadoras..."
                    className="w-full px-4 py-3 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none transition leading-relaxed"
                  />
                </div>

                {/* Status de Publicação */}
                <div className="p-4 rounded-2xl bg-[#F8F6F0] border border-[#EAE6DF] flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#002B49]">Disponibilidade do Curso</p>
                    <p className="text-xs text-slate-600">
                      {cursoData.ativo
                        ? 'O curso ficará visível imediatamente para os alunos no site.'
                        : 'O curso ficará salvo como rascunho (oculto para os alunos).'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cursoData.ativo}
                      onChange={(e) => updateCursoField('ativo', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-13 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

              </div>
            ) : (
              /* ===================================================================== */
              /* PASSO 2: MATÉRIAS E CONTEÚDOS */
              /* ===================================================================== */
              <div className="space-y-6">
                
                {/* Cabeçalho explicativo do Passo 2 */}
                <div className="p-5 rounded-2xl bg-[#002B49]/5 border border-[#002B49]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-[#002B49]">
                      Matérias do Curso
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                      Organize seu curso em matérias. Em cada matéria você pode adicionar <strong>Vídeos</strong>, <strong>Apostilas em PDF</strong> e <strong>Textos explicativos</strong>. Nada é obrigatório, coloque apenas o que desejar!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addMateria}
                    className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0"
                  >
                    <Plus className="w-5 h-5 text-[#D4AF37]" />
                    <span>Adicionar Nova Matéria</span>
                  </button>
                </div>

                {/* Lista de Matérias */}
                {materias.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-300 rounded-3xl space-y-4 bg-slate-50">
                    <Layers className="w-12 h-12 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-base font-bold text-slate-700">Nenhuma matéria criada ainda</p>
                      <p className="text-xs text-slate-500">Clique no botão abaixo para adicionar a primeira matéria.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addMateria}
                      className="px-6 py-2.5 rounded-full bg-[#002B49] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#D4AF37]" />
                      <span>Criar 1ª Matéria</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {materias.map((materia, mIndex) => (
                      <div
                        key={mIndex}
                        className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden transition hover:border-[#D4AF37]"
                      >
                        {/* Topo da Matéria */}
                        <div className="bg-slate-100/90 px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                            <span className="w-8 h-8 rounded-xl bg-[#002B49] text-[#D4AF37] font-extrabold text-sm flex items-center justify-center shrink-0">
                              {mIndex + 1}
                            </span>
                            <div className="flex-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Nome da Matéria
                              </span>
                              <input
                                type="text"
                                value={materia.titulo}
                                onChange={(e) => updateMateria(mIndex, 'titulo', e.target.value)}
                                placeholder={`Ex: Matéria ${mIndex + 1}: Fundamentos`}
                                className="w-full bg-transparent font-heading font-extrabold text-base sm:text-lg text-[#002B49] focus:bg-white focus:px-3 focus:py-1 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49]/30 transition"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Reordenar Matéria */}
                            <button
                              type="button"
                              onClick={() => moveMateria(mIndex, -1)}
                              disabled={mIndex === 0}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#002B49] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Mover matéria para cima"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMateria(mIndex, 1)}
                              disabled={mIndex === materias.length - 1}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#002B49] hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                              title="Mover matéria para baixo"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* Excluir Matéria */}
                            <button
                              type="button"
                              onClick={() => removeMateria(mIndex)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-1"
                              title="Excluir esta matéria"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Conteúdos da Matéria */}
                        <div className="p-5 sm:p-6 space-y-4">
                          
                          {/* Lista de Conteúdos Existentes nesta Matéria */}
                          {(materia.conteudos || []).length === 0 ? (
                            <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1">
                              <p className="text-sm font-semibold text-slate-600">
                                Esta matéria ainda não possui conteúdos.
                              </p>
                              <p className="text-xs text-slate-500">
                                Escolha abaixo o que deseja adicionar: vídeo, apostila ou texto explicativo.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {(materia.conteudos || []).map((conteudo, cIndex) => {
                                const isVideo = conteudo.tipo === 'VIDEO'
                                const isPdf = conteudo.tipo === 'PDF'
                                const isTexto = conteudo.tipo === 'TEXTO'

                                return (
                                  <div
                                    key={cIndex}
                                    className={`p-4 sm:p-5 rounded-2xl border-2 space-y-3 transition ${
                                      isVideo
                                        ? 'bg-rose-50/40 border-rose-200'
                                        : isPdf
                                        ? 'bg-sky-50/40 border-sky-200'
                                        : 'bg-emerald-50/40 border-emerald-200'
                                    }`}
                                  >
                                    {/* Linha de Cabeçalho do Conteúdo */}
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2.5">
                                        <span
                                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                            isVideo
                                              ? 'bg-rose-600 text-white'
                                              : isPdf
                                              ? 'bg-sky-700 text-white'
                                              : 'bg-emerald-700 text-white'
                                          }`}
                                        >
                                          {isVideo && <Video className="w-3.5 h-3.5" />}
                                          {isPdf && <FileText className="w-3.5 h-3.5" />}
                                          {isTexto && <AlignLeft className="w-3.5 h-3.5" />}
                                          <span>{isVideo ? 'Vídeo' : isPdf ? 'Apostila (PDF)' : 'Texto'}</span>
                                        </span>

                                        <span className="text-xs text-slate-500 font-semibold">
                                          Item {cIndex + 1}
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => removeConteudo(mIndex, cIndex)}
                                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
                                        title="Remover este conteúdo"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Título do Conteúdo */}
                                    <div className="space-y-1">
                                      <label className="text-xs font-bold text-slate-700 uppercase">
                                        Título do Conteúdo
                                      </label>
                                      <input
                                        type="text"
                                        value={conteudo.titulo}
                                        onChange={(e) => updateConteudo(mIndex, cIndex, 'titulo', e.target.value)}
                                        placeholder="Ex: Aula Prática de Alfabetização"
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 font-semibold text-sm text-[#002B49] focus:outline-none focus:border-[#002B49]"
                                      />
                                    </div>

                                    {/* CAMPO ESPECÍFICO: VÍDEO */}
                                    {isVideo && (
                                      <div className="space-y-2 pt-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                                          <Link2 className="w-3.5 h-3.5 text-rose-600" />
                                          Link do Vídeo (YouTube, Vimeo ou Google Drive)
                                        </label>
                                        <input
                                          type="url"
                                          value={conteudo.video_url || ''}
                                          onChange={(e) => updateConteudo(mIndex, cIndex, 'video_url', e.target.value)}
                                          placeholder="https://www.youtube.com/watch?v=... ou Vimeo"
                                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-rose-600 font-mono"
                                        />
                                        {conteudo.video_url && (
                                          <p className="text-[11px] text-emerald-700 font-semibold">
                                            ✓ Link configurado com sucesso.
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* CAMPO ESPECÍFICO: APOSTILA (PDF) */}
                                    {isPdf && (
                                      <div className="space-y-3 pt-1">
                                        <div>
                                          <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                                            <FileText className="w-3.5 h-3.5 text-sky-700" />
                                            Arquivo da Apostila em PDF
                                          </label>
                                          <p className="text-[11px] text-slate-500">
                                            Envie o arquivo PDF da apostila do seu computador (será enviado com segurança ao salvar o curso).
                                          </p>
                                        </div>

                                        {conteudo._pendingFile || conteudo.pdf_apoio_url || conteudo.arquivo_nome ? (
                                          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border ${
                                            conteudo._pendingFile
                                              ? 'bg-amber-50/70 border-amber-200'
                                              : 'bg-sky-50/70 border-sky-200'
                                          }`}>
                                            <div className="flex items-center gap-2.5 min-w-0">
                                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                conteudo._pendingFile
                                                  ? 'bg-amber-100 text-amber-700'
                                                  : 'bg-emerald-100 text-emerald-700'
                                              }`}>
                                                {conteudo._pendingFile ? (
                                                  <FileText className="w-4 h-4" />
                                                ) : (
                                                  <Check className="w-4 h-4" />
                                                )}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">
                                                  {conteudo.arquivo_nome || 'Arquivo PDF anexado'}
                                                </p>
                                                <p className={`text-[11px] font-semibold ${
                                                  conteudo._pendingFile ? 'text-amber-700' : 'text-emerald-700'
                                                }`}>
                                                  {conteudo._pendingFile
                                                    ? 'Arquivo selecionado (será enviado ao publicar)'
                                                    : 'Salvo com segurança no sistema'}
                                                </p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <label className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs cursor-pointer transition shadow-2xs">
                                                <span>Trocar PDF</span>
                                                <input
                                                  type="file"
                                                  accept="application/pdf"
                                                  className="hidden"
                                                  onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleSelectPdfConteudo(mIndex, cIndex, file)
                                                  }}
                                                />
                                              </label>
                                              <button
                                                type="button"
                                                onClick={() => handleRemovePdfConteudo(mIndex, cIndex)}
                                                className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                                                title="Remover arquivo"
                                              >
                                                Remover
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div>
                                            <label className="inline-flex px-4 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs uppercase tracking-wider items-center justify-center gap-2 cursor-pointer transition shadow-xs">
                                              <Upload className="w-4 h-4" />
                                              <span>Selecionar PDF do Computador</span>
                                              <input
                                                type="file"
                                                accept="application/pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0]
                                                  if (file) handleSelectPdfConteudo(mIndex, cIndex, file)
                                                }}
                                              />
                                            </label>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* CAMPO ESPECÍFICO: TEXTO */}
                                    {isTexto && (
                                      <div className="space-y-1 pt-1">
                                        <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                                          <AlignLeft className="w-3.5 h-3.5 text-emerald-700" />
                                          Conteúdo do Texto / Orientações Pedagógicas
                                        </label>
                                        <textarea
                                          rows={4}
                                          value={conteudo.conteudo_texto || ''}
                                          onChange={(e) => updateConteudo(mIndex, cIndex, 'conteudo_texto', e.target.value)}
                                          placeholder="Escreva aqui o artigo, resumo, orientações de estudo, referências bibliográficas..."
                                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-700 leading-relaxed"
                                        />
                                      </div>
                                    )}

                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Botões Rápidos para Adicionar Conteúdo na Matéria */}
                          <div className="pt-2 border-t border-slate-200">
                            <span className="block text-xs font-bold text-slate-600 uppercase mb-2">
                              + Adicionar nesta matéria:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => addConteudoToMateria(mIndex, 'VIDEO')}
                                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition"
                              >
                                <Video className="w-4 h-4 text-rose-600" />
                                <span>+ Vídeo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => addConteudoToMateria(mIndex, 'PDF')}
                                className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition"
                              >
                                <FileText className="w-4 h-4 text-sky-700" />
                                <span>+ Apostila (PDF)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => addConteudoToMateria(mIndex, 'TEXTO')}
                                className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition"
                              >
                                <AlignLeft className="w-4 h-4 text-emerald-700" />
                                <span>+ Texto</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RODAPÉ FIXO DE AÇÕES COM FEEDBACK DE SALVAMENTO */}
          {/* ========================================================================= */}
          <div className="bg-[#F8F6F0] px-5 sm:px-8 py-4 border-t border-[#EAE6DF] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRequestClose}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Cancelar
              </button>

              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl text-slate-700 hover:text-[#002B49] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Voltar aos dados</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Botão de Pré-visualização */}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-100 border-2 border-[#002B49] text-[#002B49] font-cta font-bold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
                title="Pré-visualizar sem salvar"
              >
                <Eye className="w-4 h-4 text-[#D4AF37]" />
                <span>Pré-visualizar</span>
              </button>

              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!cursoData.titulo?.trim()) {
                      setErrorMsg('Por favor, informe o Nome do Curso antes de continuar.')
                      return
                    }
                    setErrorMsg('')
                    setCurrentStep(2)
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white font-cta font-extrabold text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Avançar para Matérias</span>
                  <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-7 py-3 rounded-full bg-[#D4AF37] hover:bg-[#c29e2e] text-[#002B49] font-cta font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#002B49]" />
                      <span>{saveProgressMsg || 'Salvando...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-[#002B49] stroke-[3]" />
                      <span>{cursoData.id ? 'Salvar Alterações' : 'Salvar e Publicar Curso'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* PREVIEW EM TELA CHEIA (COMO O ALUNO VERÁ O CURSO) */}
      {/* ========================================================================= */}
      {isPreviewOpen && (
        <CoursePreview
          curso={{
            ...cursoData,
            thumbnail_url: capaPreviewUrl || (!capaRemovida && cursoData.thumbnail_url) || DEFAULT_COVER
          }}
          materias={materias}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  )
}
