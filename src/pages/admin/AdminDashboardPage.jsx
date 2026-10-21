import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  FileText,
  Calendar,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  MessageCircle,
  LogOut,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  X,
  Building2,
  Edit,
  Check,
  UploadCloud,
  Download
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { translateAuthError } from '../../utils/authErrors'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import {
  fetchAdminDashboardStats,
  fetchAdminUsers,
  fetchAdminProntuarios,
  createAdminProntuario,
  deleteAdminProntuario,
  fetchAdminRelatoriosEscolares,
  createAdminRelatorioEscolar,
  deleteAdminRelatorioEscolar,
  fetchAdminAgendamentos,
  updateAdminAgendamentoStatus,
  createAdminAgendamento,
  fetchAdminMatriculas,
  createAdminMatricula,
  updateAdminMatricula,
  deleteAdminMatricula,
  fetchAdminCursos,
  createAdminCurso,
  updateAdminCurso,
  deleteAdminCurso,
  fetchAdminCursoMaterias,
  generateSlug,
  uploadAdminLaudo,
  getAdminLaudoUrl
} from '../../services/adminService'
import CourseEditorModal from '../../components/admin/CourseEditorModal'
import CoursePreview from '../../components/admin/CoursePreview'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user, profile, signInWithPassword, signOut, loginWithDemo, loading: authLoading } = useAuth()

  // Tab State
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'users' | 'prontuarios' | 'relatorios' | 'agendamentos' | 'cursos' | 'matriculas'

  // Admin Auth Gate State
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  // Data States
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPacientes: 0,
    totalLaudos: 0,
    totalRelatoriosEscolares: 0,
    agendamentosPendentes: 0,
    totalMatriculas: 0,
    totalCursos: 0
  })
  const [usersList, setUsersList] = useState([])
  const [prontuariosList, setProntuariosList] = useState([])
  const [relatoriosEscolaresList, setRelatoriosEscolaresList] = useState([])
  const [agendamentosList, setAgendamentosList] = useState([])
  const [matriculasList, setMatriculasList] = useState([])
  const [cursosList, setCursosList] = useState([])

  // Search & Filter
  const [userSearch, setUserSearch] = useState('')
  const [userTypeFilter, setUserTypeFilter] = useState('ALL') // 'ALL' | 'PACIENTE' | 'ALUNO' | 'ESCOLA'
  const [relatorioSearch, setRelatorioSearch] = useState('')
  const [relatorioTypeFilter, setRelatorioTypeFilter] = useState('ALL') // 'ALL' | 'PDI_PEI' | 'RELATORIO_DEVOLUTIVA' | 'ORIENTACAO_DOCENTE' | 'PLANO_AEE'
  const [agendamentoTypeFilter, setAgendamentoTypeFilter] = useState('ALL') // 'ALL' | 'PACIENTE' | 'ESCOLA'

  // Modals
  const [showNewProntuarioModal, setShowNewProntuarioModal] = useState(false)
  const [showNewRelatorioModal, setShowNewRelatorioModal] = useState(false)
  const [showNewAgendamentoModal, setShowNewAgendamentoModal] = useState(false)
  const [showNewMatriculaModal, setShowNewMatriculaModal] = useState(false)
  const [showNewCursoModal, setShowNewCursoModal] = useState(false)
  const [editingCurso, setEditingCurso] = useState(null)
  const [previewCurso, setPreviewCurso] = useState(null)
  const [previewMaterias, setPreviewMaterias] = useState([])
  const [selectedProntuarioPreview, setSelectedProntuarioPreview] = useState(null)
  const [selectedRelatorioPreview, setSelectedRelatorioPreview] = useState(null)
  const [notification, setNotification] = useState('')

  // Form States
  const [prontuarioForm, setProntuarioForm] = useState({
    paciente_id: '',
    data_sessao: new Date().toISOString().split('T')[0],
    tipo_registro: 'AVALIACAO_NEUROCOGNITIVA',
    observacoes_clinicas: '',
    hipoteses_diagnosticas: '',
    plano_intervencao: '',
    arquivo_nome: '',
    arquivo_laudo_url: ''
  })
  const [laudoPendingFile, setLaudoPendingFile] = useState(null)
  const [laudoUploading, setLaudoUploading] = useState(false)
  const [showManualUrlInput, setShowManualUrlInput] = useState(false)

  const [relatorioForm, setRelatorioForm] = useState({
    escola_id: '',
    aluno_nome: '',
    titulo: '',
    tipo_documento: 'PDI_PEI',
    descricao: '',
    arquivo_nome: '',
    arquivo_url: ''
  })

  const [agendamentoForm, setAgendamentoForm] = useState({
    usuario_id: '',
    modalidade: 'PRESENCIAL',
    servico: 'Sessão de Intervenção Neuropsicopedagógica',
    data_hora: '',
    status: 'CONFIRMADO',
    observacoes: ''
  })

  const [matriculaForm, setMatriculaForm] = useState({
    usuario_id: '',
    curso_id: '',
    progresso: 0,
    certificado_emitido: false
  })

  const [cursoForm, setCursoForm] = useState({
    titulo: '',
    slug: '',
    descricao: '',
    preco: '',
    carga_horaria: '40 horas',
    certificado_info: 'Certificado Válido pelo MEC / Extensão',
    thumbnail_url: '',
    ativo: true,
    data_inicio: 'Janeiro de 2027',
    modulo_titulo: 'Módulo 1: Fundamentos e Metodologias Práticas',
    aula_titulo: 'Aula 1: Introdução e Diretrizes',
    aula_video_url: '',
    aula_pdf_url: ''
  })

  // Load All Admin Data
  const loadAllData = async () => {
    setLoading(true)
    try {
      const [
        statsData,
        usersData,
        prontuariosData,
        relatoriosData,
        agendamentosData,
        matriculasData,
        cursosData
      ] = await Promise.all([
        fetchAdminDashboardStats(),
        fetchAdminUsers(),
        fetchAdminProntuarios(),
        fetchAdminRelatoriosEscolares(),
        fetchAdminAgendamentos(),
        fetchAdminMatriculas(),
        fetchAdminCursos()
      ])

      setStats(statsData)
      setUsersList(usersData)
      setProntuariosList(prontuariosData)
      setRelatoriosEscolaresList(relatoriosData)
      setAgendamentosList(agendamentosData)
      setMatriculasList(matriculasData)
      setCursosList(cursosData)
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadAllData()
    }
  }, [user])

  // Toast Notification Auto-clear
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(''), 4000)
      return () => clearTimeout(t)
    }
  }, [notification])

  // Admin Login Handler
  const handleAdminLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const res = await signInWithPassword(adminEmail.trim(), adminPassword)
      const userProf = res?.profile || profile
      if (userProf && userProf.tipo_usuario !== 'ADMIN') {
        await signOut()
        setLoginError('Acesso não autorizado. Esta conta não possui privilégios de administrador.')
        return
      }
      await loadAllData()
    } catch (err) {
      setLoginError(translateAuthError(err))
    } finally {
      setLoginLoading(false)
    }
  }

  const handleSelectLaudoFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      alert('O arquivo selecionado excede o limite máximo permitido de 50 MB.')
      return
    }

    setLaudoPendingFile(file)
    setProntuarioForm((prev) => ({
      ...prev,
      arquivo_nome: prev.arquivo_nome && prev.arquivo_nome.trim() !== '' ? prev.arquivo_nome : file.name
    }))
  }

  // Create Prontuário Handler
  const handleCreateProntuario = async (e) => {
    e.preventDefault()
    if (!prontuarioForm.paciente_id) {
      alert('Selecione o paciente.')
      return
    }

    if (!laudoPendingFile && !prontuarioForm.arquivo_laudo_url) {
      alert('Selecione um arquivo de laudo do seu computador para salvar no bucket "laudos".')
      return
    }

    try {
      setLaudoUploading(true)
      let finalArquivoUrl = prontuarioForm.arquivo_laudo_url
      let finalArquivoNome = prontuarioForm.arquivo_nome.trim()

      // Se há um arquivo selecionado do computador, faz o upload para o bucket 'laudos'
      if (laudoPendingFile) {
        const uploadRes = await uploadAdminLaudo(prontuarioForm.paciente_id, laudoPendingFile)
        finalArquivoUrl = uploadRes.path
        if (!finalArquivoNome) {
          finalArquivoNome = laudoPendingFile.name
        }
      }

      await createAdminProntuario({
        ...prontuarioForm,
        arquivo_nome: finalArquivoNome || 'Laudo Clínico Oficial.pdf',
        arquivo_laudo_url: finalArquivoUrl || ''
      })

      setNotification(`Laudo salvo e anexado com sucesso ao bucket "laudos"!`)
      setShowNewProntuarioModal(false)
      setLaudoPendingFile(null)
      setShowManualUrlInput(false)
      setProntuarioForm({
        paciente_id: '',
        data_sessao: new Date().toISOString().split('T')[0],
        tipo_registro: 'AVALIACAO_NEUROCOGNITIVA',
        observacoes_clinicas: '',
        hipoteses_diagnosticas: '',
        plano_intervencao: '',
        arquivo_nome: '',
        arquivo_laudo_url: ''
      })
      await loadAllData()
    } catch (err) {
      alert('Erro ao registrar e salvar laudo: ' + (err.message || err))
    } finally {
      setLaudoUploading(false)
    }
  }

  // Delete Prontuário Handler
  const handleDeleteProntuario = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este registro do prontuário?')) {
      await deleteAdminProntuario(id)
      setNotification('Registro de prontuário excluído.')
      await loadAllData()
    }
  }

  // Create Relatório Escolar / PDI Handler
  const handleCreateRelatorioEscolar = async (e) => {
    e.preventDefault()
    if (!relatorioForm.escola_id) {
      alert('Por favor, selecione a escola conveniada de destino.')
      return
    }
    if (!relatorioForm.aluno_nome?.trim()) {
      alert('Por favor, informe o nome do aluno encaminhado.')
      return
    }

    try {
      await createAdminRelatorioEscolar({
        ...relatorioForm,
        titulo: relatorioForm.titulo || `Parecer Pedagógico - ${relatorioForm.aluno_nome}`,
        arquivo_nome: relatorioForm.arquivo_nome || `Parecer_${relatorioForm.aluno_nome.replace(/\s+/g, '_')}.pdf`,
        arquivo_url: relatorioForm.arquivo_url || 'relatorios-escolas/parecer.pdf'
      })
      setNotification('Parecer/PDI emitido com sucesso e enviado ao portal da escola!')
      setShowNewRelatorioModal(false)
      setRelatorioForm({
        escola_id: '',
        aluno_nome: '',
        titulo: '',
        tipo_documento: 'PDI_PEI',
        descricao: '',
        arquivo_nome: '',
        arquivo_url: ''
      })
      await loadAllData()
    } catch (err) {
      alert('Erro ao registrar relatório escolar: ' + err.message)
    }
  }

  // Delete Relatório Escolar Handler
  const handleDeleteRelatorioEscolar = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este relatório pedagógico / PDI?')) {
      await deleteAdminRelatorioEscolar(id)
      setNotification('Relatório pedagógico removido com sucesso.')
      await loadAllData()
    }
  }

  // Update Appointment Status Handler
  const handleUpdateAgendamento = async (id, newStatus) => {
    try {
      await updateAdminAgendamentoStatus(id, newStatus)
      setNotification(`Status do atendimento atualizado para ${newStatus}.`)
      await loadAllData()
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message)
    }
  }

  // Create Agendamento Handler
  const handleCreateAgendamento = async (e) => {
    e.preventDefault()
    if (!agendamentoForm.usuario_id || !agendamentoForm.data_hora) {
      alert('Preencha o paciente e o horário do atendimento.')
      return
    }

    try {
      await createAdminAgendamento(agendamentoForm)
      setNotification('Atendimento agendado com sucesso!')
      setShowNewAgendamentoModal(false)
      setAgendamentoForm({
        usuario_id: '',
        modalidade: 'PRESENCIAL',
        servico: 'Sessão de Intervenção Neuropsicopedagógica',
        data_hora: '',
        status: 'CONFIRMADO',
        observacoes: ''
      })
      await loadAllData()
    } catch (err) {
      alert('Erro ao agendar: ' + err.message)
    }
  }

  // Create Matrícula Handler
  const handleCreateMatricula = async (e) => {
    e.preventDefault()
    if (!matriculaForm.usuario_id || !matriculaForm.curso_id) {
      alert('Selecione o aluno e o curso desejado.')
      return
    }

    try {
      await createAdminMatricula(matriculaForm)
      setNotification('Matrícula liberada com sucesso para o aluno!')
      setShowNewMatriculaModal(false)
      setMatriculaForm({
        usuario_id: '',
        curso_id: '',
        progresso: 0,
        certificado_emitido: false
      })
      await loadAllData()
    } catch (err) {
      alert('Erro ao liberar matrícula: ' + err.message)
    }
  }

  // Update Matrícula Handler
  const handleUpdateMatricula = async (id, progresso, certificado_emitido) => {
    try {
      await updateAdminMatricula(id, { progresso, certificado_emitido })
      setNotification('Progresso e status da matrícula atualizados!')
      await loadAllData()
    } catch (err) {
      alert('Erro ao atualizar matrícula: ' + err.message)
    }
  }

  // Delete Matrícula Handler
  const handleDeleteMatricula = async (id) => {
    if (window.confirm('Tem certeza que deseja remover esta matrícula?')) {
      await deleteAdminMatricula(id)
      setNotification('Matrícula removida do sistema.')
      await loadAllData()
    }
  }

  // Course Handlers (Create, Edit, Delete, Toggle Active)
  const handleSaveCurso = async (e) => {
    e.preventDefault()
    if (!cursoForm.titulo?.trim()) {
      alert('Por favor, informe o título do curso.')
      return
    }

    try {
      if (editingCurso) {
        await updateAdminCurso(editingCurso.id, {
          titulo: cursoForm.titulo,
          slug: cursoForm.slug,
          descricao: cursoForm.descricao,
          preco: cursoForm.preco,
          carga_horaria: cursoForm.carga_horaria,
          certificado_info: cursoForm.certificado_info,
          thumbnail_url: cursoForm.thumbnail_url,
          ativo: cursoForm.ativo,
          data_inicio: cursoForm.data_inicio || 'Janeiro de 2027'
        })
        setNotification('Curso atualizado com sucesso no catálogo!')
      } else {
        const payload = {
          titulo: cursoForm.titulo,
          slug: cursoForm.slug,
          descricao: cursoForm.descricao,
          preco: cursoForm.preco,
          carga_horaria: cursoForm.carga_horaria,
          certificado_info: cursoForm.certificado_info,
          thumbnail_url: cursoForm.thumbnail_url,
          ativo: cursoForm.ativo,
          data_inicio: cursoForm.data_inicio || 'Janeiro de 2027',
          modulos: cursoForm.modulo_titulo ? [
            {
              titulo: cursoForm.modulo_titulo,
              aulas: cursoForm.aula_titulo ? [
                {
                  titulo: cursoForm.aula_titulo,
                  duracao: '20 min',
                  video_url: cursoForm.aula_video_url || '',
                  pdf_apoio_url: cursoForm.aula_pdf_url || ''
                }
              ] : []
            }
          ] : []
        }
        await createAdminCurso(payload)
        setNotification('Novo curso criado com sucesso!')
      }

      setShowNewCursoModal(false)
      setEditingCurso(null)
      setCursoForm({
        titulo: '',
        slug: '',
        descricao: '',
        preco: '',
        carga_horaria: '40 horas',
        certificado_info: 'Certificado Válido pelo MEC / Extensão',
        thumbnail_url: '',
        ativo: true,
        data_inicio: 'Janeiro de 2027',
        modulo_titulo: 'Módulo 1: Fundamentos e Metodologias Práticas',
        aula_titulo: 'Aula 1: Introdução e Diretrizes',
        aula_video_url: '',
        aula_pdf_url: ''
      })
      await loadAllData()
    } catch (err) {
      alert('Erro ao salvar curso: ' + err.message)
    }
  }

  const handleEditCurso = (curso) => {
    setEditingCurso(curso)
    setShowNewCursoModal(true)
  }

  const handleOpenPreviewFromCard = async (curso) => {
    try {
      const mats = await fetchAdminCursoMaterias(curso.id)
      setPreviewCurso(curso)
      setPreviewMaterias(mats || [])
    } catch (err) {
      console.warn('Erro ao carregar pré-visualização:', err)
      setPreviewCurso(curso)
      setPreviewMaterias([])
    }
  }

  const handleDeleteCurso = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este curso? Todas as aulas e matrículas vinculadas serão afetadas.')) {
      await deleteAdminCurso(id)
      setNotification('Curso removido do sistema.')
      await loadAllData()
    }
  }

  const handleToggleCursoAtivo = async (curso) => {
    try {
      await updateAdminCurso(curso.id, { ...curso, ativo: !curso.ativo })
      setNotification(`Status do curso alterado para ${!curso.ativo ? 'Ativo (Publicado)' : 'Inativo (Oculto)'}.`)
      await loadAllData()
    } catch (err) {
      alert('Erro ao alterar status do curso: ' + err.message)
    }
  }

  // Filter Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.nome_completo || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.telefone || '').includes(userSearch)
    const matchesType = userTypeFilter === 'ALL' || u.tipo_usuario === userTypeFilter
    return matchesSearch && matchesType
  })

  const isAuthorizedAdmin = Boolean(user && profile && profile.tipo_usuario === 'ADMIN')

  // --------------------------------------------------------------------------
  // TELA DE AUTENTICAÇÃO ADMINISTRATIVA (CASO NÃO AUTENTICADO OU NÃO-ADMIN)
  // --------------------------------------------------------------------------
  if (!isAuthorizedAdmin && !authLoading) {
    const displayedError = loginError || (user && profile && profile.tipo_usuario !== 'ADMIN' ? 'Esta conta não possui privilégios de acesso ao Painel Administrativo.' : '')

    return (
      <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-3 sm:p-5 lg:p-6 font-sans antialiased text-[#1E293B] selection:bg-[#D4AF37] selection:text-[#002B49]">
        <div className="w-full max-w-[1680px] bg-[#F4F6F8] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-12 items-center">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Official Logo Covering the Frame (Apenas Desktop) */}
          {/* ========================================================================= */}
          <div className="hidden lg:flex lg:col-span-7 xl:col-span-7 relative w-full h-[720px] xl:h-[780px] rounded-[32px] overflow-hidden shadow-xl items-center justify-center p-10 lg:p-14 bg-white border border-slate-200">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full h-full flex items-center justify-center cursor-pointer p-2"
              aria-label="Voltar para a página inicial"
            >
              <img
                src="/logo.svg"
                alt="Logo Oficial Prof. Cesar Roberto Loureiro"
                className="w-full h-full max-w-[620px] max-h-[620px] object-contain"
              />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Admin Login Form (High Contrast Blue Card) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 xl:col-span-5 w-full max-w-md xl:max-w-lg mx-auto p-6 sm:p-8 rounded-[28px] sm:rounded-[36px] bg-[#002B49] border-2 border-[#002B49] text-white shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-white">
                Painel Administrativo
              </h1>
              <p className="text-xs sm:text-sm font-sans text-slate-200">
                Acesso exclusivo para o Prof. Cesar Roberto Loureiro e coordenação técnica.
              </p>
            </div>

            {/* Subtle Divider Line */}
            <div className="border-b border-white/15 pt-1" />

            {/* Feedback Error Message */}
            {displayedError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs font-sans animate-in fade-in">
                {displayedError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4 pt-1">
              
              {/* EMAIL Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-cta font-bold uppercase tracking-wider text-white block">
                  E-MAIL DE ADMINISTRADOR
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* PASSWORD Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-cta font-bold uppercase tracking-wider text-white block">
                  SENHA DE ACESSO
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full pl-4 pr-11 py-3.5 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                  />
                  
                  {/* Show/Hide Password Eye Button */}
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#002B49] transition cursor-pointer p-1"
                    aria-label={showAdminPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showAdminPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-4 rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] font-cta font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.01] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#002B49] border-t-transparent rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    <>
                      <span>Entrar no Painel</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Back to site */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-xs font-sans text-slate-300 hover:text-white transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar à página inicial</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // DASHBOARD ADMINISTRATIVO COMPLETO (LOGADO)
  // --------------------------------------------------------------------------
  return (
    <SkeletonTheme baseColor="#EBE7DE" highlightColor="#FAF7F2">
      <div className="min-h-screen bg-[#FDFBF7] font-sans antialiased text-[#1E293B] selection:bg-[#D4AF37] selection:text-[#002B49] flex flex-col justify-between">
      
      {/* ========================================================================= */}
      {/* TOP ADMIN NAVBAR (DESKTOP + MOBILE INTEGRATION) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EAE6DF] transition-all">
        
        {/* Top Main Row */}
        <div className="px-3.5 sm:px-6 lg:px-10 xl:px-12 py-2 sm:py-2.5 flex items-center justify-between gap-3">
          
          {/* Left: Official Logo */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="flex items-center group cursor-pointer focus:outline-none"
            >
              <img
                src="/logo.svg"
                alt="Logo Prof. Cesar Loureiro"
                className="h-14 sm:h-16 lg:h-18 w-auto max-w-[200px] sm:max-w-[250px] lg:max-w-[300px] object-contain group-hover:scale-105 transition-transform"
              />
            </button>
          </div>

          {/* Center: Admin Tabs (Visible on Desktop >= lg) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 bg-[#F1EDE5] p-1.5 rounded-full border border-[#E3DDD3] shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/60'
              }`}
            >
              Visão Geral
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/60'
              }`}
            >
              Usuários ({usersList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prontuarios')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'prontuarios'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/60'
              }`}
            >
              Laudos ({prontuariosList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('relatorios')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'relatorios'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/60'
              }`}
            >
              Pareceres &amp; PDIs ({relatoriosEscolaresList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('agendamentos')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'agendamentos'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/60'
              }`}
            >
              Agenda ({agendamentosList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cursos')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'cursos'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/60'
              }`}
            >
              Cursos ({cursosList.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matriculas')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'matriculas'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/60'
              }`}
            >
              Matrículas ({matriculasList.length})
            </button>
          </div>

          {/* Right: Badge, Refresh & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Admin Badge */}
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#002B49] text-[#D4AF37] text-[10px] font-cta font-bold uppercase tracking-wider border border-[#D4AF37]/30 shadow-2xs">
              <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
              <span>Coordenação</span>
            </span>

            {/* Refresh Live Data */}
            <button
              type="button"
              onClick={loadAllData}
              title="Atualizar dados do Supabase"
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-[#EAE6DF] text-xs font-cta font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Clock className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#D4AF37]' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={async () => {
                await signOut()
                navigate('/', { replace: true })
              }}
              className="px-3 sm:px-4 py-1.5 rounded-full bg-white hover:bg-rose-50 text-rose-700 border border-[#EAE6DF] text-xs font-cta font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>

          </div>

        </div>

        {/* Mobile & Tablet Sub-Navbar Tabs (Visible on < lg) com espaçamento no topo */}
        <div className="lg:hidden w-full bg-[#FAF8F5] border-t border-[#E8E2D8] px-3.5 sm:px-6 pt-3.5 pb-3 sm:pt-4 sm:pb-3.5 overflow-x-auto no-scrollbar shadow-2xs">
          <div className="flex items-center gap-2 min-w-max">
            
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs ${
                activeTab === 'overview'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'bg-[#F1EDE5] text-slate-700 hover:bg-white hover:text-[#002B49]'
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${activeTab === 'overview' ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
              <span>Geral</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-2 rounded-xl text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs ${
                activeTab === 'users'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'bg-[#F1EDE5] text-slate-700 hover:bg-white hover:text-[#002B49]'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === 'users' ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
              <span>Usuários ({usersList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prontuarios')}
              className={`px-3.5 py-2 rounded-xl text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs ${
                activeTab === 'prontuarios'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'bg-[#F1EDE5] text-slate-700 hover:bg-white hover:text-[#002B49]'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${activeTab === 'prontuarios' ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
              <span>Laudos ({prontuariosList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('relatorios')}
              className={`px-3.5 py-2 rounded-xl text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs ${
                activeTab === 'relatorios'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'bg-[#F1EDE5] text-slate-700 hover:bg-white hover:text-[#002B49]'
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 ${activeTab === 'relatorios' ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
              <span>Pareceres ({relatoriosEscolaresList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('agendamentos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs ${
                activeTab === 'agendamentos'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'bg-[#F1EDE5] text-slate-700 hover:bg-white hover:text-[#002B49]'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${activeTab === 'agendamentos' ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
              <span>Agenda ({agendamentosList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cursos')}
              className={`px-3.5 py-2 rounded-xl text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs ${
                activeTab === 'cursos'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'bg-[#F1EDE5] text-slate-700 hover:bg-white hover:text-[#002B49]'
              }`}
            >
              <GraduationCap className={`w-3.5 h-3.5 ${activeTab === 'cursos' ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
              <span>Cursos ({cursosList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matriculas')}
              className={`px-3.5 py-2 rounded-xl text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs ${
                activeTab === 'matriculas'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'bg-[#F1EDE5] text-slate-700 hover:bg-white hover:text-[#002B49]'
              }`}
            >
              <Award className={`w-3.5 h-3.5 ${activeTab === 'matriculas' ? 'text-[#D4AF37]' : 'text-slate-500'}`} />
              <span>Matrículas ({matriculasList.length})</span>
            </button>

          </div>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* NOTIFICATION TOAST */}
      {/* ========================================================================= */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-[#002B49] text-white shadow-xl flex items-center gap-3 border border-[#D4AF37]/40 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-sans font-medium">{notification}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN ADMIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="max-w-7xl mx-auto w-full px-3.5 sm:px-6 lg:px-10 xl:px-12 py-5 sm:py-8 flex-1 space-y-6 sm:space-y-8">
        
        {/* ========================================================================= */}
        {/* ABA 1: VISÃO GERAL (DASHBOARD STATS & QUICK ACTIONS) */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            
            {/* Greeting Header & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                  Painel de Controle do Consultório
                </h1>
                <p className="text-xs sm:text-sm font-sans text-slate-600">
                  Gerenciamento em tempo real de pacientes, laudos clínicos, consultas e cursos de formação.
                </p>
              </div>

              {/* Quick Action Buttons (Horizontal scroll on phone, wrap on tablet/desktop) */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowNewProntuarioModal(true)}
                  className="px-3.5 sm:px-4 py-2 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Emitir Laudo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowNewRelatorioModal(true)}
                  className="px-3.5 sm:px-4 py-2 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap border border-[#D4AF37]/30 shrink-0"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Parecer / PDI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowNewAgendamentoModal(true)}
                  className="px-3.5 sm:px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] text-xs font-cta font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Agendar Horário</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingCurso(null)
                    setCursoForm({
                      titulo: '',
                      slug: '',
                      descricao: '',
                      preco: '',
                      carga_horaria: '40 horas',
                      certificado_info: 'Certificado Válido pelo MEC / Extensão',
                      thumbnail_url: '',
                      ativo: true,
                      modulo_titulo: 'Módulo 1: Fundamentos e Metodologias Práticas',
                      aula_titulo: 'Aula 1: Introdução e Diretrizes',
                      aula_video_url: '',
                      aula_pdf_url: ''
                    })
                    setShowNewCursoModal(true)
                  }}
                  className="px-3.5 sm:px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cta font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Criar Curso</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowNewMatriculaModal(true)}
                  className="px-3.5 sm:px-4 py-2 rounded-full bg-white hover:bg-[#F8F6F0] text-[#002B49] border border-[#EAE6DF] text-xs font-cta font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-[#002B49]" />
                  <span>Liberar Matrícula</span>
                </button>
              </div>
            </div>

            {/* 5 Primary KPI Cards (Balanced Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              
              {/* Card 1: Pacientes & Escolas */}
              <div
                onClick={() => setActiveTab('users')}
                className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 sm:space-y-4 group"
              >
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton circle width={36} height={36} />
                    <div>
                      <Skeleton width={48} height={24} borderRadius={6} />
                      <div className="mt-1">
                        <Skeleton width={100} height={12} borderRadius={4} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F8F6F0] text-[#002B49] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] transition-all flex items-center justify-center">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                        {stats.totalPacientes}
                      </div>
                      <div className="text-[11px] sm:text-xs font-sans text-slate-500 font-medium mt-0.5">
                        Pacientes &amp; Escolas
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2.5 sm:pt-3 border-t border-[#F1EDE5] flex items-center justify-between text-xs font-cta font-bold text-[#002B49] group-hover:text-[#073B63]">
                  <span>Consultar</span>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F8F6F0] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] text-[#002B49] flex items-center justify-center transition-all">
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 2: Laudos Clínicos */}
              <div
                onClick={() => setActiveTab('prontuarios')}
                className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 sm:space-y-4 group"
              >
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton circle width={36} height={36} />
                    <div>
                      <Skeleton width={48} height={24} borderRadius={6} />
                      <div className="mt-1">
                        <Skeleton width={90} height={12} borderRadius={4} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F8F6F0] text-[#002B49] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] transition-all flex items-center justify-center">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                        {stats.totalLaudos}
                      </div>
                      <div className="text-[11px] sm:text-xs font-sans text-slate-500 font-medium mt-0.5">
                        Laudos Clínicos
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2.5 sm:pt-3 border-t border-[#F1EDE5] flex items-center justify-between text-xs font-cta font-bold text-[#002B49] group-hover:text-[#073B63]">
                  <span>Consultar</span>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F8F6F0] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] text-[#002B49] flex items-center justify-center transition-all">
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 3: Pareceres & PDIs Escolares */}
              <div
                onClick={() => setActiveTab('relatorios')}
                className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 sm:space-y-4 group"
              >
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton circle width={36} height={36} />
                    <div>
                      <Skeleton width={48} height={24} borderRadius={6} />
                      <div className="mt-1">
                        <Skeleton width={100} height={12} borderRadius={4} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F8F6F0] text-[#002B49] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] transition-all flex items-center justify-center">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                        {relatoriosEscolaresList.length}
                      </div>
                      <div className="text-[11px] sm:text-xs font-sans text-slate-500 font-medium mt-0.5">
                        Pareceres &amp; PDIs
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2.5 sm:pt-3 border-t border-[#F1EDE5] flex items-center justify-between text-xs font-cta font-bold text-[#002B49] group-hover:text-[#073B63]">
                  <span>Consultar</span>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F8F6F0] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] text-[#002B49] flex items-center justify-center transition-all">
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 4: Solicitações Pendentes */}
              <div
                onClick={() => setActiveTab('agendamentos')}
                className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 sm:space-y-4 group"
              >
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton circle width={36} height={36} />
                    <div>
                      <Skeleton width={48} height={24} borderRadius={6} />
                      <div className="mt-1">
                        <Skeleton width={95} height={12} borderRadius={4} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F8F6F0] text-[#002B49] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] transition-all flex items-center justify-center">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                        {agendamentosList.filter(a => a.status === 'PENDENTE').length}
                      </div>
                      <div className="text-[11px] sm:text-xs font-sans text-slate-500 font-medium mt-0.5">
                        Agenda Pendente
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2.5 sm:pt-3 border-t border-[#F1EDE5] flex items-center justify-between text-xs font-cta font-bold text-[#002B49] group-hover:text-[#073B63]">
                  <span>Consultar</span>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F8F6F0] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] text-[#002B49] flex items-center justify-center transition-all">
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Card 5: Cursos & Matrículas */}
              <div
                onClick={() => setActiveTab('matriculas')}
                className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs hover:border-[#D4AF37] hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 sm:space-y-4 group col-span-2 sm:col-span-1"
              >
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton circle width={36} height={36} />
                    <div>
                      <Skeleton width={48} height={24} borderRadius={6} />
                      <div className="mt-1">
                        <Skeleton width={110} height={12} borderRadius={4} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F8F6F0] text-[#002B49] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] transition-all flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                        {stats.totalMatriculas}
                      </div>
                      <div className="text-[11px] sm:text-xs font-sans text-slate-500 font-medium mt-0.5">
                        Alunos Matriculados
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2.5 sm:pt-3 border-t border-[#F1EDE5] flex items-center justify-between text-xs font-cta font-bold text-[#002B49] group-hover:text-[#073B63]">
                  <span>Consultar</span>
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#F8F6F0] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] text-[#002B49] flex items-center justify-center transition-all">
                    <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>

            </div>

            {/* Three Column Layout: Recent Appointments, Clinical Reports, and School Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Box 1: Recent Appointments */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3 sm:pb-4">
                    <div>
                      <h3 className="font-heading font-bold text-sm sm:text-base text-[#002B49]">
                        Próximos Atendimentos
                      </h3>
                      <p className="text-[10px] sm:text-[11px] font-sans text-slate-500">
                        Consultório &amp; Consultorias
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('agendamentos')}
                      className="text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] transition cursor-pointer"
                    >
                      Ver agenda →
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-2.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-3 sm:p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <Skeleton width={120} height={14} borderRadius={4} />
                            <Skeleton width={65} height={18} borderRadius={12} />
                          </div>
                          <Skeleton width={160} height={12} borderRadius={4} />
                          <Skeleton width={90} height={10} borderRadius={4} />
                        </div>
                      ))}
                    </div>
                  ) : agendamentosList.length > 0 ? (
                    <div className="space-y-2 sm:space-y-2.5">
                      {agendamentosList.slice(0, 3).map((ag) => (
                        <div
                          key={ag.id}
                          className="p-3 sm:p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] flex items-center justify-between gap-2.5"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-heading font-bold text-xs text-[#002B49] truncate">
                              {ag.usuario?.instituicao_nome || ag.usuario?.nome_completo || 'Paciente'}
                            </div>
                            <div className="text-[11px] font-sans text-slate-600 truncate">
                              {ag.servico}
                            </div>
                            <div className="text-[10px] font-sans text-slate-400">
                              {new Date(ag.data_hora).toLocaleDateString('pt-BR')} às {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[9px] font-cta font-bold uppercase shrink-0 ${
                              ag.status === 'CONFIRMADO'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : ag.status === 'PENDENTE'
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ag.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs font-sans text-slate-500">
                      Nenhum atendimento agendado no momento.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewAgendamentoModal(true)}
                  className="w-full py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#EAE6DF] text-[#002B49] text-xs font-cta font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Agendar Horário</span>
                </button>
              </div>

              {/* Box 2: Recent Clinical Reports */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3 sm:pb-4">
                    <div>
                      <h3 className="font-heading font-bold text-sm sm:text-base text-[#002B49]">
                        Laudos Clínicos Recentes
                      </h3>
                      <p className="text-[10px] sm:text-[11px] font-sans text-slate-500">
                        Prontuários de pacientes (B2C)
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('prontuarios')}
                      className="text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] transition cursor-pointer"
                    >
                      Ver todos →
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-2.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-3 sm:p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <Skeleton width={130} height={14} borderRadius={4} />
                            <Skeleton width={20} height={20} borderRadius={6} />
                          </div>
                          <Skeleton width={180} height={12} borderRadius={4} />
                          <Skeleton width={80} height={10} borderRadius={4} />
                        </div>
                      ))}
                    </div>
                  ) : prontuariosList.length > 0 ? (
                    <div className="space-y-2 sm:space-y-2.5">
                      {prontuariosList.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="p-3 sm:p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] flex items-center justify-between gap-2.5"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-heading font-bold text-xs text-[#002B49] truncate">
                              {p.paciente?.nome_completo || 'Paciente'}
                            </div>
                            <div className="text-[11px] font-sans text-slate-600 truncate">
                              {p.arquivo_nome}
                            </div>
                            <div className="text-[10px] font-sans text-slate-400">
                              {new Date(p.data_sessao || p.criado_em).toLocaleDateString('pt-BR')}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProntuarioPreview(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#002B49] hover:bg-white transition cursor-pointer shrink-0"
                            title="Ver detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs font-sans text-slate-500">
                      Nenhum laudo clínico emitido ainda.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewProntuarioModal(true)}
                  className="w-full py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#EAE6DF] text-[#002B49] text-xs font-cta font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Emitir Novo Laudo</span>
                </button>
              </div>

              {/* Box 3: Recent School Reports & PDIs */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3 sm:pb-4">
                    <div>
                      <h3 className="font-heading font-bold text-sm sm:text-base text-[#002B49]">
                        Pareceres &amp; PDIs Escolares
                      </h3>
                      <p className="text-[10px] sm:text-[11px] font-sans text-slate-500">
                        Documentos institucionais (B2B)
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('relatorios')}
                      className="text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] transition cursor-pointer"
                    >
                      Ver todos →
                    </button>
                  </div>

                  {loading ? (
                    <div className="space-y-2.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="p-3 sm:p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <Skeleton width={140} height={14} borderRadius={4} />
                            <Skeleton width={20} height={20} borderRadius={6} />
                          </div>
                          <Skeleton width={190} height={12} borderRadius={4} />
                          <Skeleton width={80} height={10} borderRadius={4} />
                        </div>
                      ))}
                    </div>
                  ) : relatoriosEscolaresList.length > 0 ? (
                    <div className="space-y-2 sm:space-y-2.5">
                      {relatoriosEscolaresList.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          className="p-3 sm:p-3.5 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] flex items-center justify-between gap-2.5"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-heading font-bold text-xs text-[#002B49] truncate">
                              {r.escola?.instituicao_nome || r.escola?.nome_completo || 'Escola'}
                            </div>
                            <div className="text-[11px] font-sans text-slate-600 truncate">
                              Aluno: <strong>{r.aluno_nome}</strong> • {r.titulo}
                            </div>
                            <div className="text-[10px] font-sans text-slate-400">
                              {new Date(r.criado_em).toLocaleDateString('pt-BR')}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedRelatorioPreview(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#002B49] hover:bg-white transition cursor-pointer shrink-0"
                            title="Ver parecer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs font-sans text-slate-500">
                      Nenhum parecer escolar emitido ainda.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewRelatorioModal(true)}
                  className="w-full py-2.5 rounded-xl bg-[#F8F6F0] hover:bg-[#EAE6DF] text-[#002B49] text-xs font-cta font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Emitir Parecer / PDI</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: PACIENTES & ALUNOS */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#002B49]">
                  Pacientes, Alunos &amp; Escolas
                </h2>
                <p className="text-xs sm:text-sm font-sans text-slate-600">
                  Base unificada de usuários cadastrados no portal ({filteredUsers.length} encontrados).
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                <div className="relative flex-1 sm:w-72">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Buscar por nome, email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-500 focus:outline-none shadow-2xs transition"
                  />
                </div>

                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-xs sm:text-sm font-bold text-[#002B49] focus:outline-none shadow-2xs transition cursor-pointer"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="PACIENTE">Pacientes</option>
                  <option value="ALUNO">Alunos de Cursos</option>
                  <option value="ESCOLA">Escolas Conveniadas</option>
                </select>
              </div>
            </div>

            {/* Mobile Cards View (< sm) */}
            <div className="sm:hidden space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <Skeleton width={130} height={16} borderRadius={4} />
                      <Skeleton width={70} height={20} borderRadius={10} />
                    </div>
                    <Skeleton width={180} height={12} borderRadius={4} />
                    <div className="pt-2 border-t border-[#EAE6DF] flex gap-2">
                      <Skeleton width={75} height={28} borderRadius={14} />
                      <Skeleton width={75} height={28} borderRadius={14} />
                    </div>
                  </div>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-[#002B49]">
                          {u.nome_completo || 'Sem nome informado'}
                        </h4>
                        <div className="text-xs text-slate-500 font-sans">{u.email}</div>
                        {u.telefone && (
                          <div className="text-[11px] text-slate-400 font-sans mt-0.5">{u.telefone}</div>
                        )}
                      </div>

                      <span className="px-2 py-0.5 rounded-full text-[9px] font-cta font-bold uppercase bg-slate-100 text-slate-700 shrink-0">
                        {u.tipo_usuario || 'PACIENTE'}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-1">
                      Cadastrado em: {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="pt-2.5 border-t border-[#F1EDE5] flex flex-wrap items-center gap-1.5">
                      {u.tipo_usuario === 'ESCOLA' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setRelatorioForm((prev) => ({ ...prev, escola_id: u.id }))
                            setShowNewRelatorioModal(true)
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#002B49] text-white text-[11px] font-cta font-bold transition flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3 text-[#D4AF37]" />
                          <span>+ Parecer / PDI</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setProntuarioForm((prev) => ({ ...prev, paciente_id: u.id }))
                            setShowNewProntuarioModal(true)
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#002B49] text-white text-[11px] font-cta font-bold transition flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-[#D4AF37]" />
                          <span>+ Laudo</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setMatriculaForm((prev) => ({ ...prev, usuario_id: u.id }))
                          setShowNewMatriculaModal(true)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#002B49] text-[11px] font-cta font-bold transition flex items-center gap-1"
                      >
                        <GraduationCap className="w-3 h-3" />
                        <span>+ Curso</span>
                      </button>

                      {u.telefone && (
                        <button
                          type="button"
                          onClick={() => {
                            const cleanPhone = u.telefone.replace(/\D/g, '')
                            window.open(`https://wa.me/55${cleanPhone}`, '_blank')
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] font-cta font-bold transition inline-flex items-center gap-1 border border-emerald-200/60"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-white border border-[#EAE6DF] text-center text-xs text-slate-500">
                  Nenhum usuário encontrado com os filtros selecionados.
                </div>
              )}
            </div>

            {/* Desktop & Tablet Table (>= sm) */}
            <div className="hidden sm:block bg-white rounded-3xl border border-[#EAE6DF] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#F8F6F0] border-b border-[#EAE6DF] text-[#002B49] font-cta font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-4 px-6">Nome Completo</th>
                      <th className="py-4 px-6">Tipo</th>
                      <th className="py-4 px-6">Contato</th>
                      <th className="py-4 px-6">Data de Cadastro</th>
                      <th className="py-4 px-6 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE6DF]">
                    {loading ? (
                      [1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-[#FDFBF7] transition">
                          <td className="py-4 px-6">
                            <Skeleton width={160} height={16} borderRadius={4} />
                          </td>
                          <td className="py-4 px-6">
                            <Skeleton width={80} height={20} borderRadius={10} />
                          </td>
                          <td className="py-4 px-6 space-y-1">
                            <Skeleton width={180} height={14} borderRadius={4} />
                            <Skeleton width={100} height={12} borderRadius={4} />
                          </td>
                          <td className="py-4 px-6">
                            <Skeleton width={80} height={14} borderRadius={4} />
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <Skeleton width={75} height={26} borderRadius={13} inline />
                            <Skeleton width={65} height={26} borderRadius={13} inline />
                          </td>
                        </tr>
                      ))
                    ) : filteredUsers.length > 0 ? (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-[#FDFBF7] transition">
                          <td className="py-4 px-6 font-bold text-[#002B49]">
                            {u.nome_completo || 'Sem nome informado'}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase bg-slate-100 text-slate-700">
                              {u.tipo_usuario || 'PACIENTE'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-600 space-y-0.5">
                            <div>{u.email}</div>
                            {u.telefone && <div className="text-[11px] text-slate-400">{u.telefone}</div>}
                          </td>
                          <td className="py-4 px-6 text-slate-500">
                            {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            {u.tipo_usuario === 'ESCOLA' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setRelatorioForm((prev) => ({ ...prev, escola_id: u.id }))
                                  setShowNewRelatorioModal(true)
                                }}
                                className="px-3 py-1.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-[11px] font-cta font-bold transition cursor-pointer"
                                title="Emitir parecer pedagógico ou PDI para esta escola"
                              >
                                + Parecer / PDI
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setProntuarioForm((prev) => ({ ...prev, paciente_id: u.id }))
                                  setShowNewProntuarioModal(true)
                                }}
                                className="px-3 py-1.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-[11px] font-cta font-bold transition cursor-pointer"
                                title="Emitir laudo para este paciente"
                              >
                                + Laudo
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setMatriculaForm((prev) => ({ ...prev, usuario_id: u.id }))
                                setShowNewMatriculaModal(true)
                              }}
                              className="px-3 py-1.5 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] text-[11px] font-cta font-bold transition cursor-pointer"
                              title="Liberar curso para este usuário"
                            >
                              + Curso
                            </button>

                            {u.telefone && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cleanPhone = u.telefone.replace(/\D/g, '')
                                  window.open(`https://wa.me/55${cleanPhone}`, '_blank')
                                }}
                                className="px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-cta font-bold transition cursor-pointer inline-flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-500">
                          Nenhum usuário encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: PRONTUÁRIOS & LAUDOS */}
        {/* ========================================================================= */}
        {activeTab === 'prontuarios' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#002B49]">
                  Prontuários &amp; Documentos Clínicos
                </h2>
                <p className="text-xs sm:text-sm font-sans text-slate-600">
                  Emissão de laudos de avaliação neuropsicopedagógica, pareceres técnicos e PDIs.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewProntuarioModal(true)}
                className="px-4 sm:px-5 py-2.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xs w-full sm:w-auto shrink-0"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Emitir Novo Laudo</span>
              </button>
            </div>

            {/* List of Reports */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton width={120} height={20} borderRadius={10} />
                      <Skeleton width={75} height={14} borderRadius={4} />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton width={180} height={20} borderRadius={6} />
                      <Skeleton width={140} height={14} borderRadius={4} />
                    </div>
                    <Skeleton count={2} height={14} borderRadius={4} />
                    <div className="pt-3 border-t border-[#EAE6DF] flex justify-between">
                      <Skeleton width={90} height={16} borderRadius={6} />
                      <Skeleton width={60} height={16} borderRadius={6} />
                    </div>
                  </div>
                ))}
              </div>
            ) : prontuariosList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {prontuariosList.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase bg-[#F8F6F0] text-[#002B49] border border-[#EAE6DF]">
                          {p.tipo_registro?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-sans text-slate-500">
                          {new Date(p.data_sessao || p.criado_em).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#002B49]">
                          {p.paciente?.nome_completo || 'Paciente'}
                        </h3>
                        <p className="text-xs font-sans text-slate-500">
                          {p.arquivo_nome}
                        </p>
                      </div>

                      {p.observacoes_clinicas && (
                        <p className="text-xs font-sans text-slate-600 line-clamp-3 bg-[#FDFBF7] p-3 rounded-2xl border border-[#EAE6DF] italic">
                          "{p.observacoes_clinicas}"
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#EAE6DF] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProntuarioPreview(p)}
                        className="text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver detalhes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProntuario(p.id)}
                        className="text-xs font-cta font-bold text-rose-600 hover:text-rose-800 transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] text-center space-y-4">
                <FileText className="w-10 h-10 text-[#D4AF37] mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#002B49]">Nenhum laudo emitido ainda</h3>
                  <p className="text-xs font-sans text-slate-500">Clique em "Emitir Novo Laudo" para registrar o primeiro documento clínico.</p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3.1: PARECERES & PDIS ESCOLARES (B2B) */}
        {/* ========================================================================= */}
        {activeTab === 'relatorios' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase tracking-wider bg-[#F8F6F0] text-[#002B49] border border-[#D4AF37]/40">
                    Módulo Institucional (B2B)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#002B49]">
                  Pareceres Pedagógicos &amp; PDIs Escolares
                </h2>
                <p className="text-xs sm:text-sm font-sans text-slate-600">
                  Emissão de Planos de Desenvolvimento Individual (PDI/PEI), pareceres técnicos e adequações curriculares (BNCC) para as escolas conveniadas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewRelatorioModal(true)}
                className="px-4 sm:px-5 py-2.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xs w-full sm:w-auto shrink-0"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Emitir Parecer / PDI</span>
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={relatorioSearch}
                  onChange={(e) => setRelatorioSearch(e.target.value)}
                  placeholder="Buscar por aluno, escola..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-500 focus:outline-none shadow-2xs transition"
                />
              </div>

              <select
                value={relatorioTypeFilter}
                onChange={(e) => setRelatorioTypeFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-xs sm:text-sm font-bold text-[#002B49] focus:outline-none shadow-2xs transition cursor-pointer"
              >
                <option value="ALL">Todos os Tipos de Documento</option>
                <option value="PDI_PEI">Plano de Desenvolvimento Individual (PDI / PEI)</option>
                <option value="RELATORIO_DEVOLUTIVA">Parecer Pedagógico &amp; Devolutiva</option>
                <option value="ORIENTACAO_DOCENTE">Orientações para Professores</option>
                <option value="PLANO_AEE">Adaptação Curricular &amp; AEE (BNCC)</option>
              </select>
            </div>

            {/* List of School Reports */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <Skeleton width={140} height={20} borderRadius={10} />
                      <Skeleton width={75} height={14} borderRadius={4} />
                    </div>
                    <div className="space-y-1.5">
                      <Skeleton width={130} height={14} borderRadius={4} />
                      <Skeleton width={200} height={20} borderRadius={6} />
                      <Skeleton width={150} height={14} borderRadius={4} />
                    </div>
                    <Skeleton count={2} height={14} borderRadius={4} />
                    <div className="pt-3 border-t border-[#EAE6DF] flex justify-between">
                      <Skeleton width={110} height={16} borderRadius={6} />
                      <Skeleton width={60} height={16} borderRadius={6} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (() => {
              const filteredRelatorios = relatoriosEscolaresList.filter((r) => {
                const matchesSearch =
                  (r.aluno_nome || '').toLowerCase().includes(relatorioSearch.toLowerCase()) ||
                  (r.titulo || '').toLowerCase().includes(relatorioSearch.toLowerCase()) ||
                  (r.escola?.instituicao_nome || '').toLowerCase().includes(relatorioSearch.toLowerCase()) ||
                  (r.escola?.nome_completo || '').toLowerCase().includes(relatorioSearch.toLowerCase())
                const matchesType = relatorioTypeFilter === 'ALL' || r.tipo_documento === relatorioTypeFilter
                return matchesSearch && matchesType
              })

              return filteredRelatorios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {filteredRelatorios.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs space-y-4 flex flex-col justify-between hover:border-[#D4AF37]/50 transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase bg-[#F8F6F0] text-[#002B49] border border-[#EAE6DF]">
                            {r.tipo_documento === 'PDI_PEI'
                              ? 'Plano de Desenv. Individual (PDI)'
                              : r.tipo_documento === 'RELATORIO_DEVOLUTIVA'
                              ? 'Parecer & Devolutiva'
                              : r.tipo_documento === 'ORIENTACAO_DOCENTE'
                              ? 'Orientações Docentes'
                              : r.tipo_documento === 'PLANO_AEE'
                              ? 'Adaptação BNCC & AEE'
                              : r.tipo_documento?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-sans text-slate-500">
                            {new Date(r.criado_em).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-sans font-bold text-[#002B49]">
                            <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>{r.escola?.instituicao_nome || r.escola?.nome_completo || 'Escola Conveniada'}</span>
                          </div>
                          <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#002B49] mt-1">
                            {r.titulo || `Parecer Pedagógico - ${r.aluno_nome}`}
                          </h3>
                          <p className="text-xs font-sans text-slate-500 font-medium">
                            Educando: <strong className="text-slate-800">{r.aluno_nome}</strong>
                          </p>
                        </div>

                        {r.descricao && (
                          <p className="text-xs font-sans text-slate-600 line-clamp-3 bg-[#FDFBF7] p-3 rounded-2xl border border-[#EAE6DF] italic">
                            "{r.descricao}"
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#EAE6DF] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRelatorioPreview(r)}
                          className="text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver parecer completo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRelatorioEscolar(r.id)}
                          className="text-xs font-cta font-bold text-rose-600 hover:text-rose-800 transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] text-center space-y-4">
                  <Building2 className="w-10 h-10 text-[#D4AF37] mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#002B49]">Nenhum parecer escolar emitido ainda</h3>
                    <p className="text-xs font-sans text-slate-500">
                      Clique em "Emitir Parecer / PDI" para cadastrar o primeiro documento ou planejamento institucional.
                    </p>
                  </div>
                </div>
              )
            })()}

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 4: AGENDA & CONSULTÓRIO (CLÍNICA & ESCOLAS) */}
        {/* ========================================================================= */}
        {activeTab === 'agendamentos' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#002B49]">
                  Agenda do Consultório &amp; Consultorias
                </h2>
                <p className="text-xs sm:text-sm font-sans text-slate-600">
                  Gestão de sessões clínicas individuais e reuniões de alinhamento com escolas conveniadas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewAgendamentoModal(true)}
                className="px-4 sm:px-5 py-2.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xs w-full sm:w-auto shrink-0"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Novo Horário</span>
              </button>
            </div>

            {/* Filter Tabs for Agendamentos (Scrollable on mobile) */}
            <div className="overflow-x-auto no-scrollbar pb-2 border-b border-[#EAE6DF]">
              <div className="flex items-center gap-1.5 min-w-max">
                <button
                  type="button"
                  onClick={() => setAgendamentoTypeFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer shrink-0 ${
                    agendamentoTypeFilter === 'ALL'
                      ? 'bg-[#002B49] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-[#002B49] border border-[#EAE6DF]'
                  }`}
                >
                  Todos ({agendamentosList.length})
                </button>

                <button
                  type="button"
                  onClick={() => setAgendamentoTypeFilter('PENDENTE')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    agendamentoTypeFilter === 'PENDENTE'
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Pendentes ({agendamentosList.filter((a) => a.status === 'PENDENTE').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAgendamentoTypeFilter('CONFIRMADO')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    agendamentoTypeFilter === 'CONFIRMADO'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Confirmados ({agendamentosList.filter((a) => a.status === 'CONFIRMADO').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAgendamentoTypeFilter('CONCLUIDO')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    agendamentoTypeFilter === 'CONCLUIDO'
                      ? 'bg-blue-800 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Concluídos ({agendamentosList.filter((a) => a.status === 'CONCLUIDO').length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAgendamentoTypeFilter('PACIENTE')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer shrink-0 ${
                    agendamentoTypeFilter === 'PACIENTE'
                      ? 'bg-[#002B49] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-[#002B49] border border-[#EAE6DF]'
                  }`}
                >
                  Pacientes ({agendamentosList.filter((a) => a.usuario?.tipo_usuario !== 'ESCOLA').length})
                </button>

                <button
                  type="button"
                  onClick={() => setAgendamentoTypeFilter('ESCOLA')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-cta font-bold transition cursor-pointer shrink-0 ${
                    agendamentoTypeFilter === 'ESCOLA'
                      ? 'bg-[#002B49] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:text-[#002B49] border border-[#EAE6DF]'
                  }`}
                >
                  Escolas ({agendamentosList.filter((a) => a.usuario?.tipo_usuario === 'ESCOLA').length})
                </button>
              </div>
            </div>

            {/* Appointments List */}
            {loading ? (
              <div className="space-y-3 sm:space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2.5 flex-1">
                      <div className="flex items-center gap-2">
                        <Skeleton width={90} height={20} borderRadius={10} />
                        <Skeleton width={110} height={20} borderRadius={10} />
                        <Skeleton width={70} height={14} borderRadius={4} />
                      </div>
                      <Skeleton width={200} height={20} borderRadius={6} />
                      <Skeleton width={160} height={14} borderRadius={4} />
                      <Skeleton width={220} height={14} borderRadius={4} />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton width={80} height={32} borderRadius={16} />
                      <Skeleton width={80} height={32} borderRadius={16} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (() => {
              const filteredAgendamentos = agendamentosList.filter((a) => {
                if (agendamentoTypeFilter === 'PENDENTE') {
                  return a.status === 'PENDENTE'
                }
                if (agendamentoTypeFilter === 'CONFIRMADO') {
                  return a.status === 'CONFIRMADO'
                }
                if (agendamentoTypeFilter === 'CONCLUIDO') {
                  return a.status === 'CONCLUIDO'
                }
                if (agendamentoTypeFilter === 'PACIENTE') {
                  return a.usuario?.tipo_usuario !== 'ESCOLA'
                }
                if (agendamentoTypeFilter === 'ESCOLA') {
                  return a.usuario?.tipo_usuario === 'ESCOLA'
                }
                return true
              })

              return filteredAgendamentos.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {filteredAgendamentos.map((ag) => (
                    <div
                      key={ag.id}
                      className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 hover:border-[#D4AF37]/50 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase ${
                              ag.status === 'CONFIRMADO'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : ag.status === 'CONCLUIDO'
                                ? 'bg-blue-50 text-blue-800'
                                : ag.status === 'CANCELADO'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-amber-50 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {ag.status}
                          </span>

                          {ag.usuario?.tipo_usuario === 'ESCOLA' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase bg-[#F8F6F0] text-[#002B49] border border-[#D4AF37]/40 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-[#D4AF37]" />
                              <span>Escola Conveniada</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase bg-slate-100 text-slate-700">
                              Paciente
                            </span>
                          )}

                          <span className="text-xs font-sans text-slate-500">
                            {ag.modalidade || 'PRESENCIAL'}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#002B49]">
                            {ag.usuario?.instituicao_nome || ag.usuario?.nome_completo || 'Solicitante'}
                          </h3>
                          <p className="text-xs font-sans text-slate-600 font-medium">
                            {ag.servico}
                          </p>
                        </div>

                        <div className="text-xs font-sans text-slate-500 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                          <span>
                            {new Date(ag.data_hora).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} às {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {ag.observacoes && (
                          <p className="text-xs font-sans text-slate-500 italic bg-[#FDFBF7] p-2.5 rounded-xl border border-[#EAE6DF] max-w-xl">
                            "{ag.observacoes}"
                          </p>
                        )}
                      </div>

                      {/* Quick Status Buttons */}
                      <div className="pt-2 sm:pt-0 border-t lg:border-t-0 border-[#F1EDE5] flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
                        {ag.status !== 'CONFIRMADO' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateAgendamento(ag.id, 'CONFIRMADO')}
                            className="px-3 py-1.5 rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-cta font-bold transition cursor-pointer"
                          >
                            Confirmar
                          </button>
                        )}

                        {ag.status !== 'CONCLUIDO' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateAgendamento(ag.id, 'CONCLUIDO')}
                            className="px-3 py-1.5 rounded-xl sm:rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold transition cursor-pointer"
                          >
                            Concluir
                          </button>
                        )}

                        {ag.status !== 'CANCELADO' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateAgendamento(ag.id, 'CANCELADO')}
                            className="px-3 py-1.5 rounded-xl sm:rounded-full text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-cta font-bold transition cursor-pointer border border-rose-200"
                          >
                            Cancelar
                          </button>
                        )}

                        {ag.usuario?.telefone && (
                          <button
                            type="button"
                            onClick={() => {
                              const cleanPhone = ag.usuario.telefone.replace(/\D/g, '')
                              const isSchool = ag.usuario.tipo_usuario === 'ESCOLA'
                              const msg = isSchool
                                ? `Olá equipe da ${ag.usuario.instituicao_nome || ag.usuario.nome_completo}! Aqui é o Prof. Cesar Loureiro. Gostaria de confirmar nossa reunião/consultoria pedagógica.`
                                : `Olá ${ag.usuario.nome_completo}! Aqui é o Prof. Cesar Loureiro. Gostaria de confirmar nossa sessão de atendimento.`
                              window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
                            }}
                            className="px-3 py-1.5 rounded-xl sm:rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1 border border-emerald-200/60"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] text-center space-y-4">
                  <Calendar className="w-10 h-10 text-[#D4AF37] mx-auto" />
                  <div className="space-y-1">
                    <h3 className="font-heading font-bold text-base sm:text-lg text-[#002B49]">Nenhum agendamento encontrado</h3>
                    <p className="text-xs font-sans text-slate-500">Clique em "Novo Horário" para registrar um atendimento na agenda.</p>
                  </div>
                </div>
              )
            })()}

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 5: CATÁLOGO DE CURSOS (CRIAR E GERENCIAR NO SUPABASE) */}
        {/* ========================================================================= */}
        {activeTab === 'cursos' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#002B49]">
                  Catálogo de Cursos &amp; Formações (AVA)
                </h2>
                <p className="text-xs sm:text-sm font-sans text-slate-600">
                  Gerenciamento e publicação de cursos, módulos, videoaulas e certificados integrados ao Supabase.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingCurso(null)
                  setShowNewCursoModal(true)
                }}
                className="px-4 sm:px-5 py-2.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cta font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xs w-full sm:w-auto shrink-0"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Criar Novo Curso</span>
              </button>
            </div>

            {/* Courses Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-[#EAE6DF] shadow-xs overflow-hidden"
                  >
                    <Skeleton height={160} borderRadius={0} />
                    <div className="p-4 sm:p-6 space-y-4">
                      <div className="space-y-2">
                        <Skeleton width={180} height={22} borderRadius={6} />
                        <Skeleton count={2} height={14} borderRadius={4} />
                      </div>
                      <div className="space-y-2 pt-2 border-t border-[#F1EDE5]">
                        <div className="flex justify-between">
                          <Skeleton width={70} height={14} borderRadius={4} />
                          <Skeleton width={60} height={14} borderRadius={4} />
                        </div>
                        <Skeleton height={30} borderRadius={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : cursosList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {cursosList.map((curso) => {
                  const enrolledCount = matriculasList.filter((m) => m.curso_id === curso.id).length

                  return (
                    <div
                      key={curso.id}
                      className="bg-white rounded-2xl sm:rounded-3xl border border-[#EAE6DF] shadow-xs hover:shadow-md hover:border-[#D4AF37] transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Top Banner / Thumbnail */}
                      <div className="relative h-36 sm:h-44 bg-[#002B49] overflow-hidden">
                        <img
                          src={curso.thumbnail_url || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop'}
                          alt={curso.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#00182A] via-transparent to-black/30" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 sm:top-3.5 sm:left-3.5 sm:right-3.5 flex items-center justify-between">
                          <span
                            className={`px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-cta font-bold uppercase tracking-wider shadow-xs ${
                              curso.ativo
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-700/90 text-slate-200 backdrop-blur-xs'
                            }`}
                          >
                            {curso.ativo ? '● Publicado' : '○ Rascunho'}
                          </span>

                          <span className="px-2.5 sm:px-3 py-1 rounded-full bg-[#002B49]/90 text-[#D4AF37] text-xs font-serif font-bold backdrop-blur-xs border border-[#D4AF37]/30 shadow-xs">
                            R$ {parseFloat(curso.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Bottom Thumbnail Overlay */}
                        <div className="absolute bottom-2.5 left-3 right-3">
                          <span className="text-[10px] font-sans text-slate-300 font-mono">
                            /{curso.slug}
                          </span>
                        </div>
                      </div>

                      {/* Course Body Info */}
                      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5 sm:space-y-2">
                          <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#002B49] leading-snug line-clamp-2">
                            {curso.titulo}
                          </h3>
                          <p className="text-xs font-sans text-slate-600 line-clamp-3 leading-relaxed">
                            {curso.descricao || 'Sem descrição cadastrada para este treinamento.'}
                          </p>
                        </div>

                        {/* Metadata Pills */}
                        <div className="space-y-2 pt-2 border-t border-[#F1EDE5]">
                          <div className="flex items-center justify-between text-xs font-sans text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                              {curso.carga_horaria || '40 horas'}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium text-[#002B49]">
                              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                              {enrolledCount} {enrolledCount === 1 ? 'aluno' : 'alunos'}
                            </span>
                          </div>

                          <div className="text-[10px] sm:text-[11px] font-sans text-slate-500 bg-[#F8F6F0] p-2 sm:p-2.5 rounded-xl border border-[#EAE6DF] flex items-center gap-2">
                            <Award className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                            <span className="truncate">{curso.certificado_info || 'Certificado Válido pelo MEC'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Course Card Actions Footer */}
                      <div className="p-3 sm:p-4 bg-[#FDFBF7] border-t border-[#EAE6DF] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPreviewFromCard(curso)}
                            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Pré-visualizar como o aluno vê"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>Prévia</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditCurso(curso)}
                            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-[#002B49] border border-[#EAE6DF] text-xs font-cta font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Editar informações do curso"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleCursoAtivo(curso)}
                            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-cta font-bold transition cursor-pointer flex items-center gap-1 ${
                              curso.ativo
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                            title={curso.ativo ? 'Ocultar curso' : 'Publicar curso'}
                          >
                            {curso.ativo ? 'Pausar' : 'Publicar'}
                          </button>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setMatriculaForm({
                                usuario_id: '',
                                curso_id: curso.id,
                                progresso: 0,
                                certificado_emitido: false
                              })
                              setShowNewMatriculaModal(true)
                            }}
                            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold transition cursor-pointer shadow-2xs"
                            title="Liberar acesso para novo aluno"
                          >
                            + Aluno
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCurso(curso.id)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Excluir curso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] text-center space-y-4">
                <GraduationCap className="w-12 h-12 text-[#D4AF37] mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#002B49]">Nenhum curso cadastrado no catálogo</h3>
                  <p className="text-xs font-sans text-slate-500 max-w-md mx-auto">
                    Crie o primeiro treinamento para disponibilizar no Ambiente Virtual de Aprendizagem (AVA).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCurso(null)
                    setShowNewCursoModal(true)
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold uppercase tracking-wider transition inline-flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>Criar Primeiro Curso</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 6: MATRÍCULAS & ALUNOS */}
        {/* ========================================================================= */}
        {activeTab === 'matriculas' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-[#002B49]">
                  Matrículas &amp; Acessos Ativos
                </h2>
                <p className="text-xs sm:text-sm font-sans text-slate-600">
                  Liberação manual de acessos após negociação via WhatsApp e emissão de certificados.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewMatriculaModal(true)}
                className="px-4 sm:px-5 py-2.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xs w-full sm:w-auto shrink-0"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" />
                <span>Liberar Nova Matrícula</span>
              </button>
            </div>

            {/* Mobile Cards for Matrículas (< sm) */}
            <div className="sm:hidden space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
                    <Skeleton width={140} height={16} borderRadius={4} />
                    <Skeleton width={180} height={14} borderRadius={4} />
                    <Skeleton height={24} borderRadius={12} />
                  </div>
                ))
              ) : matriculasList.length > 0 ? (
                matriculasList.map((m) => (
                  <div key={m.id} className="p-4 rounded-2xl bg-white border border-[#EAE6DF] shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-[#002B49]">
                          {m.usuario?.nome_completo || 'Aluno'}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-sans">{m.usuario?.email}</div>
                        <div className="text-xs font-medium text-[#002B49] mt-1">{m.curso?.titulo || 'Curso'}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMatricula(m.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Remover matrícula"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Progresso</span>
                        <span className="font-bold text-[#002B49]">{m.progresso || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#EAE6DF] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            (m.progresso || 0) === 100
                              ? 'bg-emerald-500'
                              : (m.progresso || 0) >= 50
                              ? 'bg-[#D4AF37]'
                              : 'bg-[#002B49]'
                          }`}
                          style={{ width: `${Math.min(Math.max(m.progresso || 0, 0), 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#F1EDE5] flex items-center justify-between">
                      {m.certificado_emitido ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-cta font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ✅ Certificado Emitido
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdateMatricula(m.id, m.progresso || 0, true)}
                          className="px-3 py-1 rounded-full text-[10px] font-cta font-bold uppercase bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                        >
                          Emitir Certificado
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-2xl bg-white border border-[#EAE6DF] text-center text-xs text-slate-500">
                  Nenhuma matrícula registrada ainda.
                </div>
              )}
            </div>

            {/* Desktop & Tablet Enrollments Table (>= sm) */}
            <div className="hidden sm:block bg-white rounded-3xl border border-[#EAE6DF] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-[#F8F6F0] border-b border-[#EAE6DF] text-[#002B49] font-cta font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-4 px-6">Aluno</th>
                      <th className="py-4 px-6">Curso Matriculado</th>
                      <th className="py-4 px-6">Progresso</th>
                      <th className="py-4 px-6">Certificado</th>
                      <th className="py-4 px-6 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE6DF]">
                    {loading ? (
                      [1, 2, 3, 4].map((i) => (
                        <tr key={i} className="hover:bg-[#FDFBF7] transition">
                          <td className="py-4 px-6 space-y-1">
                            <Skeleton width={140} height={16} borderRadius={4} />
                            <Skeleton width={180} height={12} borderRadius={4} />
                          </td>
                          <td className="py-4 px-6">
                            <Skeleton width={160} height={16} borderRadius={4} />
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Skeleton width={30} height={14} borderRadius={4} />
                              <Skeleton width={100} height={10} borderRadius={5} />
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Skeleton width={110} height={20} borderRadius={10} />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Skeleton width={20} height={20} borderRadius={4} inline />
                          </td>
                        </tr>
                      ))
                    ) : matriculasList.length > 0 ? (
                      matriculasList.map((m) => (
                        <tr key={m.id} className="hover:bg-[#FDFBF7] transition">
                          <td className="py-4 px-6">
                            <div className="font-bold text-[#002B49]">
                              {m.usuario?.nome_completo || 'Aluno'}
                            </div>
                            <div className="text-[11px] text-slate-400">{m.usuario?.email}</div>
                          </td>
                          <td className="py-4 px-6 font-medium text-[#002B49]">
                            {m.curso?.titulo || 'Curso'}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-[#002B49] w-9 text-xs">{m.progresso || 0}%</span>
                              <div className="w-24 sm:w-28 h-2.5 bg-[#EAE6DF] rounded-full overflow-hidden shrink-0">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    (m.progresso || 0) === 100
                                      ? 'bg-emerald-500'
                                      : (m.progresso || 0) >= 50
                                      ? 'bg-[#D4AF37]'
                                      : 'bg-[#002B49]'
                                  }`}
                                  style={{ width: `${Math.min(Math.max(m.progresso || 0, 0), 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {m.certificado_emitido ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                ✅ {m.codigo_certificado || 'Emitido'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleUpdateMatricula(m.id, m.progresso || 0, true)}
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 cursor-pointer"
                              >
                                Emitir Certificado
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteMatricula(m.id)}
                              className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1"
                              title="Remover matrícula"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-500">
                          Nenhuma matrícula registrada ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL: EMITIR NOVO LAUDO / PRONTUÁRIO */}
      {/* ========================================================================= */}
      {showNewProntuarioModal && (
        <div className="fixed inset-0 z-50 bg-[#00182A]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div className="w-full max-w-2xl bg-[#002B49] rounded-2xl sm:rounded-3xl border-2 border-[#002B49] text-white shadow-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/15 pb-3 sm:pb-4">
              <div className="space-y-0.5">
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white">
                  Emitir Laudo / Registro Clínico
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-200">
                  O documento será anexado com sigilo ao prontuário do paciente.
                </p>
              </div>
              <button
                onClick={() => setShowNewProntuarioModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProntuario} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Paciente *
                  </label>
                  <select
                    required
                    value={prontuarioForm.paciente_id}
                    onChange={(e) => setProntuarioForm((prev) => ({ ...prev, paciente_id: e.target.value }))}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] focus:outline-none transition cursor-pointer"
                  >
                    <option value="">Selecione o paciente...</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nome_completo || u.email} ({u.tipo_usuario || 'PACIENTE'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Tipo de Registro *
                  </label>
                  <select
                    value={prontuarioForm.tipo_registro}
                    onChange={(e) => setProntuarioForm((prev) => ({ ...prev, tipo_registro: e.target.value }))}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] focus:outline-none transition cursor-pointer"
                  >
                    <option value="AVALIACAO_NEUROCOGNITIVA">Avaliação Neurocognitiva</option>
                    <option value="PARECER_TECNICO">Parecer Técnico Pedagógico</option>
                    <option value="PDI">Plano de Desenvolvimento Individual (PDI)</option>
                    <option value="EVOLUCAO_CLINICA">Registro de Evolução Clínica</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                  Título / Nome do Arquivo *
                </label>
                <input
                  type="text"
                  required
                  value={prontuarioForm.arquivo_nome}
                  onChange={(e) => setProntuarioForm((prev) => ({ ...prev, arquivo_nome: e.target.value }))}
                  placeholder="Ex: Relatório de Avaliação Neuropsicopedagógica 2026.pdf"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition"
                />
              </div>

              {/* UPLOAD DE ARQUIVO DO COMPUTADOR (BUCKET 'laudos') */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Arquivo do Laudo (Bucket Supabase 'laudos') *
                  </label>
                  {laudoPendingFile && (
                    <span className="text-[11px] font-sans text-[#D4AF37] font-semibold">
                      {(laudoPendingFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  )}
                </div>

                {laudoPendingFile ? (
                  <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#00182A] border-2 border-[#D4AF37] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#002B49] flex items-center justify-center shrink-0 shadow font-bold">
                        <FileText className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-white truncate">
                          {laudoPendingFile.name}
                        </p>
                        <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Arquivo selecionado para envio ao bucket <strong>'laudos'</strong></span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <label className="px-3 py-1.5 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs cursor-pointer transition">
                        <span>Trocar Arquivo</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={handleSelectLaudoFile}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setLaudoPendingFile(null)}
                        className="px-2.5 py-1.5 rounded-lg sm:rounded-xl text-rose-300 hover:text-white hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer"
                        title="Remover arquivo selecionado"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#D4AF37]/60 hover:border-[#D4AF37] bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl p-5 text-center cursor-pointer transition group">
                      <div className="w-12 h-12 rounded-2xl bg-[#00182A] border border-white/15 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform mb-2.5 shadow-inner">
                        <UploadCloud className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-white">
                        Clique para escolher o arquivo do seu computador
                      </p>
                      <p className="text-[11px] text-slate-300 mt-1">
                        PDF, Word (.docx) ou imagens escaneadas (até 50 MB)
                      </p>
                      <span className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Armazenamento seguro no bucket 'laudos'
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleSelectLaudoFile}
                      />
                    </label>

                    {/* Opção secundária: Link Externo ou URL manual */}
                    <div className="pt-2 text-right">
                      {!showManualUrlInput ? (
                        <button
                          type="button"
                          onClick={() => setShowManualUrlInput(true)}
                          className="text-[11px] text-slate-400 hover:text-[#D4AF37] underline transition cursor-pointer"
                        >
                          Ou vincular por link/URL externa
                        </button>
                      ) : (
                        <div className="space-y-1 text-left pt-1">
                          <label className="block text-[11px] font-bold text-slate-300 uppercase">
                            Link Externo / URL Direta do Laudo
                          </label>
                          <input
                            type="text"
                            value={prontuarioForm.arquivo_laudo_url}
                            onChange={(e) => setProntuarioForm((prev) => ({ ...prev, arquivo_laudo_url: e.target.value }))}
                            placeholder="https://..."
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                  Observações Clínicas &amp; Análise
                </label>
                <textarea
                  rows={3}
                  value={prontuarioForm.observacoes_clinicas}
                  onChange={(e) => setProntuarioForm((prev) => ({ ...prev, observacoes_clinicas: e.target.value }))}
                  placeholder="Descreva as observações de atenção, raciocínio, memória e comportamento..."
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                  Plano de Intervenção Pedagógica
                </label>
                <textarea
                  rows={2}
                  value={prontuarioForm.plano_intervencao}
                  onChange={(e) => setProntuarioForm((prev) => ({ ...prev, plano_intervencao: e.target.value }))}
                  placeholder="Estratégias de mediação, rotina de estudos e orientações para família e escola..."
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/15">
                <button
                  type="button"
                  disabled={laudoUploading}
                  onClick={() => {
                    setShowNewProntuarioModal(false)
                    setLaudoPendingFile(null)
                    setShowManualUrlInput(false)
                  }}
                  className="px-5 py-2.5 rounded-xl sm:rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-cta font-bold cursor-pointer text-center transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={laudoUploading}
                  className="px-6 py-2.5 rounded-xl sm:rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] text-xs font-cta font-extrabold uppercase tracking-wider transition cursor-pointer shadow-lg hover:shadow-xl text-center disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {laudoUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#002B49] border-t-transparent rounded-full animate-spin" />
                      <span>Enviando para o bucket 'laudos'...</span>
                    </>
                  ) : (
                    <span>Salvar e Emitir Laudo</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EMITIR NOVO PARECER PEDAGÓGICO / PDI ESCOLAR (B2B) */}
      {/* ========================================================================= */}
      {showNewRelatorioModal && (
        <div className="fixed inset-0 z-50 bg-[#00182A]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div className="w-full max-w-2xl bg-[#002B49] rounded-2xl sm:rounded-3xl border-2 border-[#002B49] text-white shadow-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/15 pb-3 sm:pb-4">
              <div className="space-y-0.5">
                <span className="text-xs font-cta font-bold uppercase tracking-wider text-[#D4AF37]">
                  Módulo de Parceria Escolar (B2B)
                </span>
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white">
                  Emitir Parecer Pedagógico / PDI Escolar
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-200">
                  O documento será vinculado à escola parceira e alimentará o portal e o alinhamento BNCC.
                </p>
              </div>
              <button
                onClick={() => setShowNewRelatorioModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRelatorioEscolar} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Escola Conveniada de Destino *
                  </label>
                  <select
                    required
                    value={relatorioForm.escola_id}
                    onChange={(e) => setRelatorioForm((prev) => ({ ...prev, escola_id: e.target.value }))}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] focus:outline-none transition cursor-pointer"
                  >
                    <option value="">Selecione a escola...</option>
                    {usersList
                      .filter((u) => u.tipo_usuario === 'ESCOLA')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.instituicao_nome || u.nome_completo} ({u.email})
                        </option>
                      ))}
                    {usersList
                      .filter((u) => u.tipo_usuario !== 'ESCOLA')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nome_completo || u.email} ({u.tipo_usuario || 'PACIENTE'})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Nome do Aluno Encaminhado *
                  </label>
                  <input
                    type="text"
                    required
                    value={relatorioForm.aluno_nome}
                    onChange={(e) => setRelatorioForm((prev) => ({ ...prev, aluno_nome: e.target.value }))}
                    placeholder="Ex: Enzo Gabriel da Silva"
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Tipo de Documento *
                  </label>
                  <select
                    value={relatorioForm.tipo_documento}
                    onChange={(e) => setRelatorioForm((prev) => ({ ...prev, tipo_documento: e.target.value }))}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] focus:outline-none transition cursor-pointer"
                  >
                    <option value="PDI_PEI">Plano de Desenvolvimento Individual (PDI / PEI)</option>
                    <option value="RELATORIO_DEVOLUTIVA">Parecer Pedagógico &amp; Devolutiva Institucional</option>
                    <option value="ORIENTACAO_DOCENTE">Orientações de Manejo para Professores</option>
                    <option value="PLANO_AEE">Adaptação Curricular &amp; Atendimento Especializado (AEE)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Título do Parecer / PDI
                  </label>
                  <input
                    type="text"
                    value={relatorioForm.titulo}
                    onChange={(e) => setRelatorioForm((prev) => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex: PDI 2026 - Adaptações Curriculares"
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                  Parecer Pedagógico &amp; Diretrizes de Sala de Aula (BNCC) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={relatorioForm.descricao}
                  onChange={(e) => setRelatorioForm((prev) => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descreva detalhadamente a avaliação diagnóstica, as adaptações curriculares recomendadas..."
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Nome do Arquivo PDF
                  </label>
                  <input
                    type="text"
                    value={relatorioForm.arquivo_nome}
                    onChange={(e) => setRelatorioForm((prev) => ({ ...prev, arquivo_nome: e.target.value }))}
                    placeholder="Ex: PDI_Institucional_Enzo_2026.pdf"
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Link / Caminho do Arquivo
                  </label>
                  <input
                    type="text"
                    value={relatorioForm.arquivo_url}
                    onChange={(e) => setRelatorioForm((prev) => ({ ...prev, arquivo_url: e.target.value }))}
                    placeholder="relatorios-escolas/pdi-2026.pdf ou https://..."
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/15">
                <button
                  type="button"
                  onClick={() => setShowNewRelatorioModal(false)}
                  className="px-5 py-2.5 rounded-xl sm:rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-cta font-bold cursor-pointer text-center transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl sm:rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] text-xs font-cta font-extrabold uppercase tracking-wider transition cursor-pointer shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-center"
                >
                  <Building2 className="w-4 h-4 text-[#002B49]" />
                  <span>Emitir Parecer / PDI</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO AGENDAMENTO DE HORÁRIO (CLÍNICA OU CONSULTORIA ESCOLAR) */}
      {/* ========================================================================= */}
      {showNewAgendamentoModal && (
        <div className="fixed inset-0 z-50 bg-[#00182A]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div className="w-full max-w-lg bg-[#002B49] rounded-2xl sm:rounded-3xl border-2 border-[#002B49] text-white shadow-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/15 pb-3 sm:pb-4">
              <div className="space-y-0.5">
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white">
                  Agendar Atendimento / Consultoria
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-200">
                  Cadastrar sessão clínica ou reunião institucional na agenda.
                </p>
              </div>
              <button
                onClick={() => setShowNewAgendamentoModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgendamento} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                  Paciente ou Escola *
                </label>
                <select
                  required
                  value={agendamentoForm.usuario_id}
                  onChange={(e) => {
                    const selectedId = e.target.value
                    const selUser = usersList.find((u) => u.id === selectedId)
                    const defaultService =
                      selUser?.tipo_usuario === 'ESCOLA'
                        ? 'Consultoria de Adequação Curricular & Inclusão (BNCC)'
                        : 'Sessão de Intervenção Neuropsicopedagógica'
                    setAgendamentoForm((prev) => ({
                      ...prev,
                      usuario_id: selectedId,
                      servico: defaultService
                    }))
                  }}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] focus:outline-none transition cursor-pointer"
                >
                  <option value="">Selecione o solicitante...</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.instituicao_nome || u.nome_completo || u.email} ({u.tipo_usuario || 'PACIENTE'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Modalidade
                  </label>
                  <select
                    value={agendamentoForm.modalidade}
                    onChange={(e) => setAgendamentoForm((prev) => ({ ...prev, modalidade: e.target.value }))}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] focus:outline-none transition cursor-pointer"
                  >
                    <option value="PRESENCIAL">Presencial (Consultório / Escola)</option>
                    <option value="ONLINE">Atendimento / Reunião Online</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                    Data e Horário *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={agendamentoForm.data_hora}
                    onChange={(e) => setAgendamentoForm((prev) => ({ ...prev, data_hora: e.target.value }))}
                    className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-bold text-[#002B49] focus:outline-none transition cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                  Serviço / Objetivo *
                </label>
                <input
                  type="text"
                  required
                  value={agendamentoForm.servico}
                  onChange={(e) => setAgendamentoForm((prev) => ({ ...prev, servico: e.target.value }))}
                  placeholder="Ex: Sessão de Intervenção ou Consultoria Pedagógica"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition"
                />

                {/* Quick Service Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'Consultoria Pedagógica BNCC',
                    'Reunião sobre Aluno Encaminhado',
                    'Intervenção Neuropsicopedagógica',
                    'Avaliação Neurocognitiva',
                    'Oficina / Capacitação Docente'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setAgendamentoForm((prev) => ({ ...prev, servico: sug }))}
                      className="px-2.5 py-1 rounded-lg bg-[#001F35] hover:bg-[#D4AF37] hover:text-[#002B49] border border-white/20 text-[10.5px] font-sans font-bold text-slate-200 transition cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={agendamentoForm.observacoes}
                  onChange={(e) => setAgendamentoForm((prev) => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Instruções para o atendimento ou pauta da reunião..."
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/15">
                <button
                  type="button"
                  onClick={() => setShowNewAgendamentoModal(false)}
                  className="px-5 py-2.5 rounded-xl sm:rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-cta font-bold cursor-pointer text-center transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl sm:rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] text-xs font-cta font-extrabold uppercase tracking-wider transition cursor-pointer shadow-lg hover:shadow-xl text-center"
                >
                  Confirmar Agendamento
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NOVO MODAL: CRIAR / EDITAR CURSO NO CATÁLOGO (COM MATÉRIAS E PREVIEW) */}
      {/* ========================================================================= */}
      {showNewCursoModal && (
        <CourseEditorModal
          isOpen={showNewCursoModal}
          curso={editingCurso}
          onClose={() => {
            setShowNewCursoModal(false)
            setEditingCurso(null)
          }}
          onSaved={async () => {
            setNotification(editingCurso ? 'Curso atualizado com sucesso!' : 'Novo curso cadastrado com sucesso!')
            await loadAllData()
          }}
        />
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DIRETO DO CARD */}
      {previewCurso && (
        <CoursePreview
          curso={previewCurso}
          materias={previewMaterias}
          onClose={() => {
            setPreviewCurso(null)
            setPreviewMaterias([])
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: LIBERAR NOVA MATRÍCULA EM CURSO */}
      {/* ========================================================================= */}
      {showNewMatriculaModal && (
        <div className="fixed inset-0 z-50 bg-[#00182A]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div className="w-full max-w-lg bg-[#002B49] rounded-2xl sm:rounded-3xl border-2 border-[#002B49] text-white shadow-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/15 pb-3 sm:pb-4">
              <div className="space-y-0.5">
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white">
                  Liberar Acesso a Curso (AVA)
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-200">
                  Libere o curso para o aluno após a negociação no WhatsApp.
                </p>
              </div>
              <button
                onClick={() => setShowNewMatriculaModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatricula} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                  Aluno *
                </label>
                <select
                  required
                  value={matriculaForm.usuario_id}
                  onChange={(e) => setMatriculaForm((prev) => ({ ...prev, usuario_id: e.target.value }))}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] focus:outline-none transition cursor-pointer"
                >
                  <option value="">Selecione o aluno...</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome_completo || u.email} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs sm:text-sm font-bold text-white uppercase tracking-wide">
                  Curso *
                </label>
                <select
                  required
                  value={matriculaForm.curso_id}
                  onChange={(e) => setMatriculaForm((prev) => ({ ...prev, curso_id: e.target.value }))}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] focus:outline-none transition cursor-pointer"
                >
                  <option value="">Selecione o curso...</option>
                  {cursosList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titulo} ({c.carga_horaria})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/15">
                <button
                  type="button"
                  onClick={() => setShowNewMatriculaModal(false)}
                  className="px-5 py-2.5 rounded-xl sm:rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-cta font-bold cursor-pointer text-center transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl sm:rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] text-xs font-cta font-extrabold uppercase tracking-wider transition cursor-pointer shadow-lg hover:shadow-xl text-center"
                >
                  Liberar Matrícula
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRÉ-VISUALIZAÇÃO DE LAUDO */}
      {/* ========================================================================= */}
      {selectedProntuarioPreview && (
        <div className="fixed inset-0 z-50 bg-[#00182A]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl border border-[#EAE6DF] shadow-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3 sm:pb-4">
              <div>
                <span className="text-[10px] font-cta font-bold uppercase tracking-wider text-[#D4AF37]">
                  Registro Clínico Oficial
                </span>
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#002B49]">
                  {selectedProntuarioPreview.arquivo_nome}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProntuarioPreview(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] space-y-1">
                <div className="text-[10px] font-cta font-bold uppercase text-slate-400">Paciente</div>
                <div className="font-heading font-bold text-sm sm:text-base text-[#002B49]">{selectedProntuarioPreview.paciente?.nome_completo}</div>
                <div className="text-xs text-slate-500">{selectedProntuarioPreview.paciente?.email}</div>
              </div>

              {selectedProntuarioPreview.observacoes_clinicas && (
                <div className="space-y-1">
                  <div className="text-xs font-cta font-bold uppercase tracking-wider text-[#002B49]">Observações Clínicas:</div>
                  <p className="text-xs font-sans text-slate-700 bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 leading-relaxed">
                    {selectedProntuarioPreview.observacoes_clinicas}
                  </p>
                </div>
              )}

              {selectedProntuarioPreview.plano_intervencao && (
                <div className="space-y-1">
                  <div className="text-xs font-cta font-bold uppercase tracking-wider text-[#002B49]">Plano de Intervenção:</div>
                  <p className="text-xs font-sans text-slate-700 bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 leading-relaxed">
                    {selectedProntuarioPreview.plano_intervencao}
                  </p>
                </div>
              )}

              {selectedProntuarioPreview.arquivo_laudo_url && (
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/70 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#002B49] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-xs">
                      <FileText className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-cta font-bold uppercase tracking-wider text-amber-800">
                        Documento Anexado no Bucket 'laudos'
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">
                        {selectedProntuarioPreview.arquivo_nome || 'Arquivo do Laudo'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const url = await getAdminLaudoUrl(selectedProntuarioPreview.arquivo_laudo_url)
                      if (url) {
                        window.open(url, '_blank')
                      } else {
                        alert('Não foi possível gerar link para este arquivo.')
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold transition shadow-xs shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Abrir / Baixar Arquivo</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 sm:pt-4 border-t border-[#EAE6DF]">
              <button
                onClick={() => setSelectedProntuarioPreview(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl sm:rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-cta font-bold text-center"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRÉ-VISUALIZAÇÃO DE PARECER / PDI ESCOLAR */}
      {/* ========================================================================= */}
      {selectedRelatorioPreview && (
        <div className="fixed inset-0 z-50 bg-[#00182A]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
          <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl border border-[#EAE6DF] shadow-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#EAE6DF] pb-3 sm:pb-4">
              <div>
                <span className="text-[10px] font-cta font-bold uppercase tracking-wider text-[#D4AF37]">
                  Documento Pedagógico Institucional (B2B)
                </span>
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#002B49]">
                  {selectedRelatorioPreview.titulo || `Parecer Pedagógico - ${selectedRelatorioPreview.aluno_nome}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRelatorioPreview(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] space-y-1">
                  <div className="text-[10px] font-cta font-bold uppercase text-slate-400">Escola Conveniada</div>
                  <div className="font-heading font-bold text-sm sm:text-base text-[#002B49]">
                    {selectedRelatorioPreview.escola?.instituicao_nome || selectedRelatorioPreview.escola?.nome_completo}
                  </div>
                  <div className="text-xs text-slate-500">{selectedRelatorioPreview.escola?.email}</div>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] space-y-1">
                  <div className="text-[10px] font-cta font-bold uppercase text-slate-400">Educando Atendido</div>
                  <div className="font-heading font-bold text-sm sm:text-base text-[#002B49]">{selectedRelatorioPreview.aluno_nome}</div>
                  <div className="text-xs text-slate-500">
                    Tipo: {selectedRelatorioPreview.tipo_documento?.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {selectedRelatorioPreview.descricao && (
                <div className="space-y-1">
                  <div className="text-xs font-cta font-bold uppercase tracking-wider text-[#002B49]">
                    Parecer Pedagógico &amp; Diretrizes Curriculares (BNCC):
                  </div>
                  <p className="text-xs font-sans text-slate-700 bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 leading-relaxed whitespace-pre-line">
                    {selectedRelatorioPreview.descricao}
                  </p>
                </div>
              )}

              {selectedRelatorioPreview.arquivo_nome && (
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F8F6F0] border border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#D4AF37] shrink-0" />
                    <div>
                      <div className="text-xs font-heading font-bold text-[#002B49]">{selectedRelatorioPreview.arquivo_nome}</div>
                      <div className="text-[10px] text-slate-500">Documento PDF oficial anexado ao portal</div>
                    </div>
                  </div>

                  {selectedRelatorioPreview.arquivo_url && (
                    <a
                      href={selectedRelatorioPreview.arquivo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold transition text-center"
                    >
                      Abrir PDF
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 sm:pt-4 border-t border-[#EAE6DF]">
              <button
                onClick={() => setSelectedRelatorioPreview(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl sm:rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-cta font-bold cursor-pointer text-center"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FLOATING BACK BUTTON */}
      {/* ========================================================================= */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-white hover:bg-[#FAF8F5] text-[#002B49] hover:text-[#D4AF37] border border-[#E3DDD3] shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer focus:outline-none"
        title="Voltar ao Site Institucional"
        aria-label="Voltar ao Site Institucional"
      >
        <ArrowLeft className="w-5 h-5 text-[#002B49] group-hover:text-[#D4AF37] group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Footer */}
      <footer className="py-4 text-center text-xs font-sans text-slate-400 border-t border-[#EAE6DF]">
        Prof. Cesar Roberto Loureiro • Painel de Gestão Clínica e Educacional Exclusivo
      </footer>

      </div>
    </SkeletonTheme>
  )
}
