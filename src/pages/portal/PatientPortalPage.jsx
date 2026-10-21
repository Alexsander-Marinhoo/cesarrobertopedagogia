import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Calendar,
  Download,
  Clock,
  CheckCircle2,
  ArrowLeft,
  LogOut,
  TrendingUp,
  MapPin,
  X,
  Eye,
  Award,
  Users,
  Send,
  Sparkles,
  FileCheck,
  GraduationCap,
  BookOpen,
  Play,
  Check,
  Printer,
  ExternalLink,
  ChevronRight,
  FileText,
  ShieldCheck,
  Settings,
  User,
  Building2,
  Briefcase,
  BookMarked,
  MessageCircle,
  FolderDown,
  Inbox,
  CalendarDays,
  Sparkle,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import { getUserDisplayName } from '../../utils/userDisplay'
import ProfileSettingsModal from '../../components/portal/ProfileSettingsModal'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import {
  fetchPatientPortalData,
  fetchSchoolPortalData,
  createAppointmentRequest,
  cancelUserAppointment,
  getSecureDownloadUrl,
  fetchCursoMaterias,
  fetchCursosTotalConteudos,
  updateCourseProgress,
  fetchBookedSlotsForDate
} from '../../services/portalService'
import CoursePreview from '../../components/admin/CoursePreview'
import CertificateModal from '../../components/portal/CertificateModal'

export default function PatientPortalPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const isLoggingOutRef = useRef(false)

  // Redireciona para /login caso o usuário não esteja logado
  useEffect(() => {
    if (isLoggingOutRef.current) return
    if (!authLoading && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, authLoading, navigate])

  const { displayName, initial, fullName, avatarUrl } = getUserDisplayName(profile, user)
  const rawType = profile?.tipo_usuario || user?.user_metadata?.tipo_usuario || ''
  const isSchool = rawType === 'ESCOLA' || location.pathname.includes('/escola')

  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'laudos' | 'evolucao' | 'cursos' | 'sessoes'
  const [selectedLaudoPreview, setSelectedLaudoPreview] = useState(null)
  const [selectedCertificate, setSelectedCertificate] = useState(null)
  const [selectedCourseLesson, setSelectedCourseLesson] = useState(null)
  const [courseMaterias, setCourseMaterias] = useState(null) // null = carregando
  const [courseLoadError, setCourseLoadError] = useState('')
  const [courseTotals, setCourseTotals] = useState({}) // { [cursoId]: total de conteúdos }
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [notification, setNotification] = useState('')

  // Supabase Live Data State
  const [dbLoading, setDbLoading] = useState(true)
  const [dbData, setDbData] = useState({
    isLive: false,
    laudos: [],
    agendamentos: [],
    matriculas: [],
    relatorios: [],
    cursos: []
  })

  const loadSupabaseData = async () => {
    if (!user?.id) return
    setDbLoading(true)
    try {
      if (isSchool) {
        const res = await fetchSchoolPortalData(user.id)
        setDbData((prev) => ({ ...prev, ...res }))
      } else {
        const res = await fetchPatientPortalData(user.id)
        setDbData((prev) => ({ ...prev, ...res }))
      }
    } catch (err) {
      console.error('Erro ao buscar dados do Supabase:', err)
    } finally {
      setDbLoading(false)
    }
  }

  useEffect(() => {
    loadSupabaseData()
  }, [user?.id, isSchool])

  // Total real de conteúdos de cada curso matriculado (para "X de Y aulas")
  const matriculaCursoIds = dbData.matriculas.map((m) => m.curso_id).join(',')
  useEffect(() => {
    const ids = matriculaCursoIds ? matriculaCursoIds.split(',') : []
    if (ids.length === 0) return
    let active = true
    fetchCursosTotalConteudos(ids).then((totals) => {
      if (active) setCourseTotals(totals)
    })
    return () => {
      active = false
    }
  }, [matriculaCursoIds])

  const handleLogout = async () => {
    try {
      isLoggingOutRef.current = true
      await signOut()
      navigate('/', { replace: true })
    } catch {
      navigate('/', { replace: true })
    }
  }

  // Formulário de Reagendamento / Contato
  const getTodayLocalDate = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const todayISO = getTodayLocalDate()

  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00'
  ]

  // Helper para checar se a data é fim de semana (sábado ou domingo)
  const isWeekend = (dateStr) => {
    if (!dateStr) return false
    const parts = dateStr.split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) return false
    const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    const day = d.getDay()
    return day === 0 || day === 6
  }

  // Helper para checar se o horário já passou para a data selecionada
  const isSlotPast = (slot, dateStr) => {
    if (!dateStr || !slot) return false
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = slot.split(':').map(Number)
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) return false
    const slotDate = new Date(year, month - 1, day, hours, minutes, 0)
    return slotDate.getTime() <= Date.now()
  }

  const [rescheduleForm, setRescheduleForm] = useState({
    motivo: isSchool
      ? 'Consultoria de Adequação Curricular (BNCC & Inclusão)'
      : 'Sessão de Estimulação Cognitiva',
    dataSugerida: '',
    horarioSugerido: '',
    observacoes: ''
  })
  const [rescheduleDateError, setRescheduleDateError] = useState('')
  const [rescheduleSubmitted, setRescheduleSubmitted] = useState(false)
  const [rescheduleWhatsappUrl, setRescheduleWhatsappUrl] = useState('')
  const [portalBookedSlots, setPortalBookedSlots] = useState([])

  // Busca horários ocupados no Supabase quando a data mudar
  useEffect(() => {
    let isMounted = true
    async function loadPortalSlots() {
      if (!rescheduleForm.dataSugerida || isWeekend(rescheduleForm.dataSugerida)) {
        setPortalBookedSlots([])
        setRescheduleForm((prev) => ({ ...prev, horarioSugerido: '' }))
        return
      }
      try {
        const booked = await fetchBookedSlotsForDate(rescheduleForm.dataSugerida)
        if (isMounted) {
          setPortalBookedSlots(booked)
          const isCurrentPast = isSlotPast(rescheduleForm.horarioSugerido, rescheduleForm.dataSugerida)
          if (booked.includes(rescheduleForm.horarioSugerido) || isCurrentPast || !rescheduleForm.horarioSugerido) {
            const firstFree = timeSlots.find((s) => !booked.includes(s) && !isSlotPast(s, rescheduleForm.dataSugerida))
            setRescheduleForm((prev) => ({ ...prev, horarioSugerido: firstFree || '' }))
          }
        }
      } catch (err) {
        console.warn('Erro ao verificar horários:', err)
      }
    }
    loadPortalSlots()
    return () => { isMounted = false }
  }, [rescheduleForm.dataSugerida])

  // --------------------------------------------------------------------------
  // DADOS ESPECÍFICOS: PACIENTE (B2C) vs ESCOLA (B2B)
  // --------------------------------------------------------------------------
  const patientData = {
    nome: profile?.nome_completo || user?.user_metadata?.nome_completo || displayName || 'Paciente',
    idade: profile?.idade || user?.user_metadata?.idade || 'Não informada',
    responsavel: profile?.nome_responsavel || user?.user_metadata?.nome_responsavel || 'Não informado',
    telefone: profile?.telefone || user?.user_metadata?.telefone || 'Não informado'
  }

  const schoolData = {
    nome: profile?.instituicao_nome || profile?.nome_completo || user?.user_metadata?.instituicao_nome || displayName || 'Instituição Conveniada',
    gestor: profile?.nome_completo || user?.user_metadata?.nome_completo || 'Coordenação Pedagógica',
    telefone: profile?.telefone || user?.user_metadata?.telefone || 'Não informado'
  }

  // 1. Próxima Sessão / Reunião Institucional
  const activeAppointments = dbData.agendamentos.filter((a) => a.status !== 'CANCELADO')
  const nextSession = activeAppointments.length > 0 ? {
    data: new Date(activeAppointments[0].data_hora).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
    horario: new Date(activeAppointments[0].data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    modalidade: activeAppointments[0].modalidade === 'ONLINE'
      ? (isSchool ? 'Sala Virtual de Alinhamento Institucional' : 'Teleatendimento Online')
      : (isSchool ? 'Presencial na Escola / Consultório' : 'Consultório Recreio - MG (Rua Teixeira da Silva, 42)'),
    local: activeAppointments[0].modalidade === 'ONLINE'
      ? (isSchool ? 'Link de Reunião Google Meet / Teams' : 'Sala Virtual de Atendimento')
      : (isSchool ? 'Na Sede da Instituição de Ensino' : 'Consultório Recreio - MG (Rua Teixeira da Silva, 42)'),
    tipo: activeAppointments[0].servico || (isSchool ? 'Consultoria de Adequação Curricular e Inclusão' : 'Sessão de Acompanhamento Neuropsicopedagógico'),
    status: activeAppointments[0].status === 'CONFIRMADO' ? 'Confirmado' : 'Em Análise'
  } : null

  // 2. Histórico de Sessões / Reuniões Realizadas
  const patientSessionsHistory = dbData.agendamentos.map((ag) => ({
    id: ag.id,
    data: new Date(ag.data_hora).toLocaleDateString('pt-BR'),
    horario: new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    tipo: ag.servico || (isSchool ? 'Consultoria / Alinhamento Institucional' : 'Sessão de Estimulação / Avaliação'),
    rawStatus: ag.status,
    status: ag.status === 'CONCLUIDO' ? 'Realizada' : (ag.status === 'CONFIRMADO' ? 'Confirmada' : (ag.status === 'CANCELADO' ? 'Cancelado' : 'Pendente')),
    resumo: ag.observacoes || (isSchool ? 'Alinhamento registrado na ata de parceria institucional.' : 'Atendimento registrado no prontuário do consultório.')
  }))

  // 3. Documentos: Laudos Clínicos (B2C) ou Relatórios & PDIs Escolares (B2B)
  const documentsList = isSchool
    ? (dbData.relatorios.length > 0
        ? dbData.relatorios.map((r) => ({
            id: r.id,
            titulo: r.titulo || `${r.tipo_relatorio?.replace(/_/g, ' ') || 'Parecer Pedagógico'} • ${r.aluno_nome || 'Turma'}`,
            tipo: r.tipo_relatorio?.replace(/_/g, ' ') || 'Parecer Pedagógico',
            aluno: r.aluno_nome || 'Aluno Encaminhado',
            turma: r.turma_serie || 'Ensino Fundamental',
            dataEmissao: new Date(r.criado_em || Date.now()).toLocaleDateString('pt-BR'),
            tamanho: 'PDF Institucional Assinado',
            arquivo_url: r.arquivo_pdf_url || r.arquivo_laudo_url,
            imagem: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop',
            resumo: r.conteudo_parecer || 'Parecer pedagógico e diretrizes inclusivas emitidas pelo Prof. Cesar Roberto de Sousa Loureiro.',
            pontosChave: [
              r.orientacoes_docentes || 'Adaptações metodológicas e estratégias de acolhimento e foco em sala de aula.',
              'Alinhamento com as diretrizes e competências da BNCC.'
            ]
          }))
        : []
      )
    : dbData.laudos.map((l) => ({
        id: l.id,
        titulo: l.arquivo_nome || `Relatório de Avaliação Neuropsicopedagógica`,
        tipo: l.tipo_registro?.replace(/_/g, ' ') || 'Documento Clínico',
        dataEmissao: new Date(l.data_sessao || l.criado_em).toLocaleDateString('pt-BR'),
        tamanho: 'PDF Oficial Assinado',
        arquivo_url: l.arquivo_laudo_url,
        imagem: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop',
        resumo: l.observacoes_clinicas || l.hipoteses_diagnosticas || 'Documento elaborado pelo Prof. Cesar Roberto de Sousa Loureiro.',
        pontosChave: [
          l.plano_intervencao || 'Diretrizes pedagógicas e plano de desenvolvimento individual.',
          'Orientações práticas para o dia a dia da família e escola.'
        ]
      }))

  // 4. Linha do Tempo Reativa ao Supabase (Pacientes: Prontuários | Escolas: Relatórios Pedagógicos / PDIs)
  const schoolTimeline = dbData.relatorios.length > 0
    ? dbData.relatorios.map((r, idx) => ({
        etapa: `${idx + 1}. ${r.titulo || r.tipo_documento?.replace(/_/g, ' ') || 'Alinhamento Pedagógico'}`,
        data: new Date(r.criado_em || Date.now()).toLocaleDateString('pt-BR'),
        status: 'Concluído',
        detalhes: r.descricao || r.conteudo_parecer || (r.aluno_nome ? `Planejamento e parecer pedagógico referente ao educando ${r.aluno_nome}.` : 'Registro pedagógico institucional.'),
        observacaoProfCesar: r.orientacoes_docentes || 'Diretrizes pedagógicas e adaptações curriculares registradas conforme a BNCC.'
      }))
    : []

  const patientTimeline = dbData.laudos.length > 0
    ? dbData.laudos.map((l, idx) => ({
        etapa: `${idx + 1}. ${l.arquivo_nome || l.tipo_registro?.replace(/_/g, ' ') || 'Registro Clínico'}`,
        data: new Date(l.data_sessao || l.criado_em).toLocaleDateString('pt-BR'),
        status: 'Concluído',
        detalhes: l.observacoes_clinicas || l.hipoteses_diagnosticas || 'Registro clínico anexado ao prontuário do paciente.',
        observacaoProfCesar: l.plano_intervencao || 'Estratégias pedagógicas e orientações de desenvolvimento.'
      }))
    : []

  const activeTimeline = isSchool ? schoolTimeline : patientTimeline

  // 5. Cursos e Matrículas Reais no Supabase
  const enrolledCourses = dbData.matriculas.map((m) => {
    const cursoInfo = m.curso || {}
    const totalAulas = courseTotals[m.curso_id] || 0
    return {
      id: m.id,
      cursoId: m.curso_id,
      titulo: cursoInfo.titulo || (isSchool ? 'Capacitação Docente & Inclusão na Prática' : 'Formação Continuada'),
      instrutor: 'Prof. Cesar Roberto Loureiro',
      cargaHoraria: cursoInfo.carga_horaria || '30 horas',
      progresso: m.progresso || 0,
      aulasConcluidas: Math.round(((m.progresso || 0) / 100) * totalAulas),
      totalAulas,
      status: m.progresso === 100 ? 'Concluído' : 'Em Andamento',
      categoria: isSchool ? 'Formação Docente & BNCC' : 'Educação & Neurociência',
      imagem: cursoInfo.miniatura_url || cursoInfo.thumbnail_url || (isSchool
        ? 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop'),
      descricao: cursoInfo.descricao || (isSchool
        ? 'Curso prático para professores e gestores: estratégias de inclusão, manejo em sala de aula e adequações da BNCC.'
        : 'Curso prático focado em neuroeducação e adaptações pedagógicas.'),
      certificado: m.certificado_emitido ? {
        codigo: m.codigo_certificado || `CERT-${m.id.substring(0, 8).toUpperCase()}`,
        dataEmissao: m.data_conclusao ? new Date(m.data_conclusao).toLocaleDateString('pt-BR') : 'Data de Emissão',
        carga: cursoInfo.carga_horaria || '30 Horas',
        livro: 'Livro de Extensão Vol. 04 / Registro Oficial',
        aluno: displayName,
        curso: cursoInfo.titulo || 'Formação Continuada'
      } : null
    }
  })

  // Handlers
  const handleDownloadLaudo = async (doc) => {
    setDownloadingId(doc.id)
    try {
      const bucketName = isSchool ? 'relatorios-escolas' : 'laudos-privados'
      const signedUrl = await getSecureDownloadUrl(bucketName, doc.arquivo_url)

      if (signedUrl) {
        window.open(signedUrl, '_blank')
        setDownloadingId(null)
        setNotification(`Download de "${doc.titulo}" iniciado com sucesso!`)
        return
      }

      setTimeout(() => {
        setNotification(`Download de "${doc.titulo}" concluído.`)
        setDownloadingId(null)
      }, 700)
    } catch {
      setNotification(`Download iniciado para ${doc.titulo}`)
      setDownloadingId(null)
    }
  }

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) {
      return
    }
    try {
      const success = await cancelUserAppointment(appointmentId)
      if (success) {
        setNotification('Agendamento cancelado com sucesso!')
        await loadSupabaseData()
      } else {
        alert('Não foi possível cancelar o agendamento no momento.')
      }
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err)
      alert('Erro ao cancelar agendamento.')
    }
  }

  // Abre o curso com as matérias e conteúdos reais cadastrados no painel admin
  const handleOpenCourseModal = async (curso) => {
    setCourseLoadError('')
    setCourseMaterias(null)
    setSelectedCourseLesson(curso)
    try {
      const materias = await fetchCursoMaterias(curso.cursoId)
      setCourseMaterias(materias)
    } catch (err) {
      console.warn('Aviso ao carregar matérias do curso:', err)
      setCourseLoadError('Não foi possível carregar as aulas deste curso. Tente novamente em instantes.')
      setCourseMaterias([])
    }
  }

  const handleCloseCourse = () => {
    setSelectedCourseLesson(null)
    setCourseMaterias(null)
    setCourseLoadError('')
  }

  // Salva o progresso (0-100) do aluno na matrícula e atualiza os cards sem recarregar a página
  const handleCourseProgress = async (percent) => {
    const cursoId = selectedCourseLesson?.cursoId
    if (!user?.id || !cursoId) return
    const saved = await updateCourseProgress(user.id, cursoId, percent)
    if (!saved) return
    setDbData((prev) => ({
      ...prev,
      matriculas: prev.matriculas.map((m) =>
        m.curso_id === cursoId ? { ...m, progresso: Math.max(m.progresso || 0, percent) } : m
      )
    }))
    if (percent >= 100) {
      setNotification('Parabéns! Curso concluído. Seu certificado foi liberado.')
      await loadSupabaseData()
    }
  }

  const handleRescheduleDateChange = (e) => {
    const val = e.target.value
    setRescheduleDateError('')

    if (!val) {
      setRescheduleForm((prev) => ({ ...prev, dataSugerida: '', horarioSugerido: '' }))
      return
    }

    if (isWeekend(val)) {
      setRescheduleDateError('Atendimentos ocorrem exclusivamente de Segunda a Sexta-feira (08h às 12h e 14h às 18h). Por favor, escolha um dia útil.')
      setRescheduleForm((prev) => ({ ...prev, dataSugerida: val, horarioSugerido: '' }))
      return
    }

    // Se o dia selecionado for hoje, verifica se todos os horários já passaram
    const allPast = timeSlots.every((s) => isSlotPast(s, val))
    if (allPast) {
      setRescheduleDateError('Todos os horários de atendimento para a data de hoje já foram encerrados. Por favor, selecione um próximo dia útil.')
    }

    setRescheduleForm((prev) => ({ ...prev, dataSugerida: val }))
  }

  const handleSubmitReschedule = async (e) => {
    e.preventDefault()

    if (!rescheduleForm.dataSugerida) {
      setRescheduleDateError('Por favor, selecione uma data válida (segunda a sexta-feira).')
      return
    }

    const parts = rescheduleForm.dataSugerida.split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) {
      setRescheduleDateError('Data inválida. Por favor, selecione uma data válida.')
      return
    }

    const [year, month, day] = parts
    const pickedDate = new Date(year, month - 1, day, 12, 0, 0)
    if (pickedDate.getDay() === 0 || pickedDate.getDay() === 6) {
      setRescheduleDateError('Atendimentos ocorrem exclusivamente de Segunda a Sexta-feira. Por favor, escolha um dia útil.')
      return
    }

    if (!rescheduleForm.horarioSugerido) {
      alert('Por favor, selecione um dos horários disponíveis.')
      return
    }

    if (isSlotPast(rescheduleForm.horarioSugerido, rescheduleForm.dataSugerida)) {
      alert('O horário selecionado já foi ultrapassado para o dia de hoje. Por favor, escolha um horário futuro disponível.')
      return
    }

    if (portalBookedSlots.includes(rescheduleForm.horarioSugerido)) {
      alert('Este horário já se encontra reservado para este dia. Por favor, escolha outro horário disponível.')
      return
    }

    const [hour, minute] = rescheduleForm.horarioSugerido.split(':').map(Number)
    const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    const weekdayName = pickedDate.toLocaleDateString('pt-BR', { weekday: 'long' })
    const finalISO = new Date(year, month - 1, day, hour || 9, minute || 0, 0).toISOString()

    if (user?.id) {
      await createAppointmentRequest(user.id, {
        modalidade: isSchool ? 'PRESENCIAL' : 'PRESENCIAL',
        servico: rescheduleForm.motivo,
        data_hora: finalISO,
        observacoes: `${rescheduleForm.observacoes || ''} | Data: ${formattedDate} às ${rescheduleForm.horarioSugerido}`
      })
      await loadSupabaseData()
    }

    setNotification(
      isSchool
        ? 'Solicitação de consultoria salva no sistema com sucesso!'
        : 'Solicitação de agendamento salva no sistema com sucesso!'
    )

    const msg = isSchool
      ? `Olá Prof. Cesar! Aqui é da equipe gestora da ${schoolData.nome} (${user?.email}).\n\n*Solicitação de Consultoria / Alinhamento Institucional:*\n• Pauta/Serviço: ${rescheduleForm.motivo}\n• Data: ${formattedDate} (${weekdayName})\n• Horário: ${rescheduleForm.horarioSugerido}\n• Detalhes: ${rescheduleForm.observacoes || 'Nenhum'}`
      : `Olá Prof. Cesar! Aqui é ${patientData.nome} (${user?.email}).\n\n*Solicitação de Atendimento:*\n• Assunto: ${rescheduleForm.motivo}\n• Data: ${formattedDate} (${weekdayName})\n• Horário: ${rescheduleForm.horarioSugerido}\n• Mensagem: ${rescheduleForm.observacoes || 'Nenhuma'}`

    const finalWhatsappUrl = `https://wa.me/5532987252421?text=${encodeURIComponent(msg)}`
    setRescheduleWhatsappUrl(finalWhatsappUrl)
    setRescheduleSubmitted(true)
  }

  return (
    <SkeletonTheme baseColor="#EDE8DF" highlightColor="#FAF7F2">
      <div className="min-h-screen bg-[#FDFBF7] font-sans antialiased text-[#1E293B] selection:bg-[#D4AF37] selection:text-[#002B49] flex flex-col justify-between">
      
      {/* ========================================================================= */}
      {/* TOP CLEAN MINIMALIST NAVBAR & RESPONSIVE TAB BAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 w-full bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EAE6DF]">
        <div className="px-3.5 sm:px-6 lg:px-12 py-3 sm:py-3.5 flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Logo Maior e Elegante */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center shrink-0 group cursor-pointer focus:outline-none"
              title="Voltar à Página Inicial"
            >
              <img
                src="/logo.svg"
                alt="Logo Prof. Cesar Loureiro"
                className="h-14 sm:h-16 lg:h-18 w-auto max-w-[200px] sm:max-w-[250px] lg:max-w-[300px] object-contain group-hover:scale-105 transition-transform"
              />
            </button>
          </div>

          {/* Desktop Center: Dynamic Tabs for Paciente (B2C) vs Escola (B2B) */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#F1EDE5] p-1.5 rounded-full border border-[#E3DDD3] shadow-2xs">
            
            {/* Tab 1: Visão Geral / Institucional */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-full text-xs font-cta font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-[#002B49] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/50'
              }`}
            >
              {isSchool ? 'Visão Institucional' : 'Visão Geral'}
            </button>

            {/* Tab 2: Documentos / Pareceres */}
            <button
              type="button"
              onClick={() => setActiveTab('laudos')}
              className={`px-4 py-2 rounded-full text-xs font-cta font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'laudos'
                  ? 'bg-[#002B49] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/50'
              }`}
            >
              {isSchool
                ? `Pareceres & PDIs (${documentsList.length})`
                : `Documentos & Laudos (${documentsList.length})`}
            </button>

            {/* Tab 3: Jornada / Alinhamento BNCC */}
            <button
              type="button"
              onClick={() => setActiveTab('evolucao')}
              className={`px-4 py-2 rounded-full text-xs font-cta font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'evolucao'
                  ? 'bg-[#002B49] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/50'
              }`}
            >
              {isSchool ? 'Alinhamento Pedagógico (BNCC)' : 'Jornada do Estudante'}
            </button>

            {/* Tab 4: Capacitação Docente / Cursos */}
            <button
              type="button"
              onClick={() => setActiveTab('cursos')}
              className={`px-4 py-2 rounded-full text-xs font-cta font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'cursos'
                  ? 'bg-[#002B49] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/50'
              }`}
            >
              {isSchool
                ? `Capacitação Docente (${enrolledCourses.length})`
                : `Cursos & Estudos (${enrolledCourses.length})`}
            </button>

            {/* Tab 5: Consultorias / Encontros */}
            <button
              type="button"
              onClick={() => setActiveTab('sessoes')}
              className={`px-4 py-2 rounded-full text-xs font-cta font-semibold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'sessoes'
                  ? 'bg-[#002B49] text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-[#002B49] hover:bg-white/50'
              }`}
            >
              {isSchool
                ? `Consultorias & Reuniões (${patientSessionsHistory.length})`
                : `Nossos Encontros (${patientSessionsHistory.length})`}
            </button>
          </div>

          {/* Right: Perfil & Sair (Com texto sempre visível) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="group pl-2 pr-3 sm:pl-2.5 sm:pr-4 py-1.5 sm:py-2 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white border border-[#D4AF37]/50 font-cta font-bold text-xs sm:text-sm inline-flex items-center gap-2 sm:gap-2.5 transition shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
              title={isSchool ? 'Configurações da Escola e Contato Institucional' : 'Configurações do Perfil do Aluno e Responsável'}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#D4AF37] text-[#002B49] text-xs font-black flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>
              <span className="text-white font-bold text-xs sm:text-sm whitespace-nowrap">
                <span className="sm:hidden">{isSchool ? 'Escola' : 'Perfil'}</span>
                <span className="hidden sm:inline">{isSchool ? 'Perfil Institucional' : 'Configurar Perfil'}</span>
              </span>
              <div className="hidden sm:flex w-5 h-5 rounded-full bg-white/10 items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
                <Settings className="w-3.5 h-3.5 text-[#D4AF37] group-hover:rotate-90 transition-transform duration-300 shrink-0" />
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-[#E3DDD3] hover:border-rose-200 text-xs font-cta font-bold transition cursor-pointer shadow-2xs shrink-0"
              title="Sair da conta"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="text-xs font-cta font-bold">Sair</span>
            </button>
          </div>

        </div>

        {/* Mobile & Tablet Secondary Horizontal Scroller for Tabs (Com distância/padding confortável do topo) */}
        <div className="lg:hidden px-3.5 sm:px-6 pt-3.5 pb-3 sm:pt-4 sm:pb-3.5 border-t border-[#EAE6DF] bg-[#FAF8F5]/80 overflow-x-auto no-scrollbar flex items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-full text-xs font-cta font-semibold transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
              activeTab === 'dashboard'
                ? 'bg-[#002B49] text-white font-bold shadow-xs'
                : 'bg-[#F1EDE5] text-slate-700 hover:text-[#002B49]'
            }`}
          >
            {isSchool ? 'Visão Institucional' : 'Visão Geral'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('laudos')}
            className={`px-4 py-2 rounded-full text-xs font-cta font-semibold transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
              activeTab === 'laudos'
                ? 'bg-[#002B49] text-white font-bold shadow-xs'
                : 'bg-[#F1EDE5] text-slate-700 hover:text-[#002B49]'
            }`}
          >
            {isSchool
              ? `Pareceres & PDIs (${documentsList.length})`
              : `Documentos (${documentsList.length})`}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evolucao')}
            className={`px-4 py-2 rounded-full text-xs font-cta font-semibold transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
              activeTab === 'evolucao'
                ? 'bg-[#002B49] text-white font-bold shadow-xs'
                : 'bg-[#F1EDE5] text-slate-700 hover:text-[#002B49]'
            }`}
          >
            {isSchool ? 'BNCC & Inclusão' : 'Jornada'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cursos')}
            className={`px-4 py-2 rounded-full text-xs font-cta font-semibold transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
              activeTab === 'cursos'
                ? 'bg-[#002B49] text-white font-bold shadow-xs'
                : 'bg-[#F1EDE5] text-slate-700 hover:text-[#002B49]'
            }`}
          >
            {isSchool
              ? `Capacitação (${enrolledCourses.length})`
              : `Cursos (${enrolledCourses.length})`}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sessoes')}
            className={`px-4 py-2 rounded-full text-xs font-cta font-semibold transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
              activeTab === 'sessoes'
                ? 'bg-[#002B49] text-white font-bold shadow-xs'
                : 'bg-[#F1EDE5] text-slate-700 hover:text-[#002B49]'
            }`}
          >
            {isSchool
              ? `Consultorias (${patientSessionsHistory.length})`
              : `Encontros (${patientSessionsHistory.length})`}
          </button>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER: FULL WIDTH MINIMALIST EDITORIAL CONTENT */}
      {/* ========================================================================= */}
      <main className="w-full max-w-6xl xl:max-w-7xl mx-auto p-3.5 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 flex-1">
        
        {/* Notification Toast */}
        {notification && (
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs font-sans flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification('')}
              className="text-[#166534] hover:text-[#14532d] p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 1: VISÃO GERAL (DASHBOARD) */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 sm:space-y-8">
            
            {/* Editorial Hero Banner (Customizado para Paciente vs Escola) */}
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#002B49] text-white shadow-xl grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="p-5 sm:p-8 lg:p-10 lg:col-span-7 space-y-3.5 sm:space-y-4 z-10">
                
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-heading font-extrabold text-white leading-tight">
                  {isSchool
                    ? `Olá, ${displayName}. Gestão Pedagógica & Formação Continuada.`
                    : `Olá, ${displayName}. Bem-vindo ao seu espaço de desenvolvimento.`}
                </h1>

                <p className="text-xs sm:text-sm font-sans text-slate-300 leading-relaxed max-w-xl">
                  {isSchool ? (
                    'Canal exclusivo de alinhamento com o Prof. Cesar Roberto Loureiro: acesse pareceres pedagógicos, planos de intervenção curricular (BNCC), capacitação do corpo docente e agende consultorias escolares.'
                  ) : (
                    <>
                      Aqui você acompanha o progresso de <strong className="text-white font-bold">{patientData.nome}</strong>, visualiza laudos emitidos pelo <strong className="text-white font-bold">Prof. Cesar Roberto Loureiro</strong> e gerencia seus horários e estudos.
                    </>
                  )}
                </p>

                <div className="pt-2 flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('laudos')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] font-cta font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer text-center"
                  >
                    {isSchool
                      ? `Ver Pareceres & PDIs (${documentsList.length})`
                      : `Ver Documentos (${documentsList.length})`}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('sessoes')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-cta font-bold text-xs uppercase tracking-wider transition border border-white/20 cursor-pointer text-center"
                  >
                    {nextSession
                      ? (isSchool ? 'Ver Próxima Consultoria' : 'Ver Próximo Encontro')
                      : (isSchool ? 'Solicitar Consultoria Pedagógica' : 'Solicitar Atendimento')}
                  </button>
                </div>
              </div>

              {/* Imagem Editorial */}
              <div className="lg:col-span-5 h-44 sm:h-56 lg:h-full relative overflow-hidden">
                <img
                  src={isSchool
                    ? 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop'
                    : 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop'}
                  alt={isSchool ? 'Formação docente e consultoria pedagógica' : 'Aprendizado e neuroeducação'}
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop' }}
                  className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#002B49] via-transparent to-transparent" />
              </div>
            </div>

            {/* Próximo Encontro / Reunião Institucional */}
            {dbLoading ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2.5 flex-1">
                  <Skeleton width={180} height={14} borderRadius={4} />
                  <Skeleton width={260} height={24} borderRadius={6} />
                  <Skeleton width={190} height={14} borderRadius={4} />
                </div>
                <Skeleton width={170} height={44} borderRadius={22} />
              </div>
            ) : nextSession ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="text-xs font-cta font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    <span>{isSchool ? 'Próxima Consultoria / Reunião Pedagógica' : 'Próximo Encontro Confirmado'}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-[#002B49]">
                    {nextSession.data} às {nextSession.horario}
                  </h3>
                  <p className="text-xs sm:text-sm font-sans text-slate-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span>{nextSession.local} • {nextSession.tipo}</span>
                  </p>
                </div>

                <a
                  href={`https://wa.me/5532987252421?text=${encodeURIComponent(
                    isSchool
                      ? `Olá Prof. Cesar! Aqui é da equipe da ${schoolData.nome}. Gostaria de confirmar nossa reunião/consultoria do dia ${nextSession.data}.`
                      : `Olá Prof. Cesar! Aqui é ${patientData.nome}. Gostaria de confirmar o nosso encontro de ${nextSession.data}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white font-cta font-bold text-xs uppercase tracking-wider transition shrink-0 text-center shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isSchool ? 'Alinhar Pauta no WhatsApp' : 'Confirmar no WhatsApp'}</span>
                </a>
              </div>
            ) : (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE6DF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="text-xs font-cta font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-[#D4AF37]" />
                    <span>{isSchool ? 'Nenhuma consultoria agendada no momento' : 'Nenhum atendimento agendado no momento'}</span>
                  </div>
                  <h3 className="text-xl font-heading font-extrabold text-[#002B49]">
                    {isSchool
                      ? 'Deseja agendar uma consultoria pedagógica ou reunião com a coordenação?'
                      : 'Deseja agendar sua primeira consulta ou sessão de avaliação?'}
                  </h3>
                  <p className="text-xs sm:text-sm font-sans text-slate-600">
                    {isSchool
                      ? 'Você pode solicitar um horário para alinhamento de casos inclusivos, planejamento de PDIs ou treinamento docente com o Prof. Cesar.'
                      : 'Você pode solicitar um dia e horário diretamente pelo formulário da plataforma ou falando pelo WhatsApp do consultório.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('sessoes')}
                  className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] font-cta font-bold text-xs uppercase tracking-wider transition shrink-0 text-center shadow-xs cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{isSchool ? 'Solicitar Consultoria' : 'Solicitar Agendamento'}</span>
                </button>
              </div>
            )}

            {/* 3 Cartões Editoriais Adaptados ao Perfil */}
            {dbLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs">
                    <Skeleton height={176} borderRadius={0} />
                    <div className="p-5 sm:p-6 space-y-3">
                      <Skeleton width={180} height={22} borderRadius={6} />
                      <Skeleton count={2} height={14} borderRadius={4} />
                      <div className="pt-2">
                        <Skeleton width={120} height={14} borderRadius={4} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Cartão 1: Laudos ou Pareceres Escolares */}
                <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group">
                  <div className="h-40 sm:h-44 overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop"
                      alt={isSchool ? 'Pareceres pedagógicos e PDIs' : 'Documentos e laudos'}
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop' }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] sm:text-[11px] font-cta font-bold text-[#002B49]">
                      {documentsList.length} {isSchool ? 'Parecer(es)' : 'Documento(s)'}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#002B49]">
                        {isSchool ? 'Pareceres & PDIs Escolares' : 'Documentos & Laudos'}
                      </h3>
                      <p className="text-xs font-sans text-slate-600 leading-relaxed">
                        {isSchool
                          ? (documentsList.length > 0
                              ? `${documentsList.length} parecer(es) pedagógico(s) e plano(s) de intervenção disponíveis para download.`
                              : 'Acesse os planos de desenvolvimento individual e relatórios de alunos encaminhados.')
                          : (documentsList.length > 0
                              ? `${documentsList.length} parecer(es) e laudo(s) clínico(s) emitido(s) prontos para download.`
                              : 'Nenhum documento emitido para este perfil ainda.')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('laudos')}
                      className="pt-3 text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isSchool ? 'Ver relatórios da escola' : 'Abrir documentos'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Cartão 2: Jornada / Alinhamento BNCC */}
                <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group">
                  <div className="h-40 sm:h-44 overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop"
                      alt={isSchool ? 'Alinhamento pedagógico BNCC' : 'Jornada do estudante'}
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop' }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] sm:text-[11px] font-cta font-bold text-[#002B49]">
                      {activeTimeline.length > 0
                        ? (isSchool ? `${activeTimeline.length} Etapa(s)` : `Fase ${activeTimeline.length} • Ativa`)
                        : (isSchool ? 'Aguardando Início' : 'Fase 1 • Inicial')}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#002B49]">
                        {isSchool ? 'Alinhamento Pedagógico & Inclusão' : 'Jornada do Estudante'}
                      </h3>
                      <p className="text-xs font-sans text-slate-600 leading-relaxed">
                        {isSchool
                          ? (activeTimeline.length > 0
                              ? 'Acompanhe as diretrizes e etapas pedagógicas registradas pelo Prof. Cesar para sua escola.'
                              : 'Nenhum alinhamento realizado ainda. Solicite uma consultoria inicial para iniciar o plano pedagógico.')
                          : (activeTimeline.length > 0
                              ? 'Acompanhe as etapas do processo terapêutico e orientações do Prof. Cesar.'
                              : 'Acompanhe o status e as etapas de evolução após as sessões no consultório.')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('evolucao')}
                      className="pt-3 text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isSchool ? 'Ver diretrizes institucionais' : 'Ver linha do tempo'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Cartão 3: Formações / Capacitação Docente */}
                <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group md:col-span-2 lg:col-span-1">
                  <div className="h-40 sm:h-44 overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop"
                      alt={isSchool ? 'Capacitação docente e certificação' : 'Cursos e formações'}
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop' }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] sm:text-[11px] font-cta font-bold text-[#002B49]">
                      {enrolledCourses.length} {isSchool ? 'Treinamento(s)' : 'Curso(s) Ativo(s)'}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#002B49]">
                        {isSchool ? 'Capacitação Docente & Cursos' : 'Cursos & Estudos'}
                      </h3>
                      <p className="text-xs font-sans text-slate-600 leading-relaxed">
                        {isSchool
                          ? 'Ambiente de formação continuada para os professores da escola com emissão de certificados digitais.'
                          : 'Acesse videoaulas, apostilas e certificados de extensão emitidos pelo Prof. Cesar.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('cursos')}
                      className="pt-3 text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isSchool ? 'Acessar área de capacitação' : 'Ver cursos disponíveis'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: DOCUMENTOS & LAUDOS / PARECERES ESCOLARES */}
        {/* ========================================================================= */}
        {activeTab === 'laudos' && (
          <div className="space-y-6">
            
            <div className="space-y-2">
              <h2 className="text-xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                {isSchool
                  ? 'Pareceres Pedagógicos & Planos de Desenvolvimento Individual (PDI)'
                  : 'Documentos & Laudos Clínicos'}
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-600 max-w-2xl leading-relaxed">
                {isSchool
                  ? 'Relatórios institucionais, diagnósticos de alunos encaminhados, adequações metodológicas da BNCC e orientações para a equipe pedagógica.'
                  : 'Relatórios, laudos diagnósticos e planejamentos pedagógicos emitidos no prontuário oficial do paciente.'}
              </p>
            </div>

            {dbLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs"
                  >
                    <Skeleton height={192} borderRadius={0} />
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="space-y-2">
                        <Skeleton width={140} height={12} borderRadius={4} />
                        <Skeleton width={200} height={20} borderRadius={6} />
                        <Skeleton count={2} height={14} borderRadius={4} />
                      </div>
                      <div className="pt-2 border-t border-[#EAE6DF] flex justify-between items-center">
                        <Skeleton width={90} height={16} borderRadius={4} />
                        <Skeleton width={100} height={36} borderRadius={18} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : documentsList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {documentsList.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="h-44 sm:h-48 overflow-hidden relative">
                      <img
                        src={doc.imagem}
                        alt={doc.titulo}
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop' }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#002B49]/90 text-white text-[10px] font-cta font-bold uppercase">
                        {doc.tipo}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="text-[11px] font-sans text-slate-500 font-medium">
                          Emitido em {doc.dataEmissao} • {doc.tamanho}
                        </div>

                        <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#002B49] leading-snug">
                          {doc.titulo}
                        </h3>

                        <p className="text-xs font-sans text-slate-600 leading-relaxed">
                          {doc.resumo}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#EAE6DF] flex flex-col min-[420px]:flex-row items-stretch min-[420px]:items-center justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedLaudoPreview(doc)}
                          className="text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] transition inline-flex items-center justify-center gap-1 cursor-pointer py-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver detalhes</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadLaudo(doc)}
                          disabled={downloadingId === doc.id}
                          className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] font-cta font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 text-center"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingId === doc.id ? 'Baixando...' : 'Baixar PDF'}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] text-center space-y-4 shadow-xs">
                <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-[#F8F6F0] border border-[#EAE6DF] flex items-center justify-center mx-auto text-[#002B49]">
                  {isSchool ? (
                    <Building2 className="w-7 sm:w-8 h-7 sm:h-8 text-[#D4AF37]" />
                  ) : (
                    <Inbox className="w-7 sm:w-8 h-7 sm:h-8 text-[#D4AF37]" />
                  )}
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="font-heading font-extrabold text-lg sm:text-xl text-[#002B49]">
                    {isSchool
                      ? 'Nenhum relatório ou parecer emitido para esta escola ainda'
                      : 'Nenhum documento emitido para este perfil ainda'}
                  </h3>
                  <p className="text-xs sm:text-sm font-sans text-slate-600 leading-relaxed">
                    {isSchool
                      ? `Assim que o Prof. Cesar Roberto elaborar os relatórios pedagógicos, PDIs ou pareceres de alunos encaminhados pela ${schoolData.nome}, os arquivos assinados estarão disponíveis aqui.`
                      : `Assim que o Prof. Cesar Roberto Loureiro emitir sua avaliação neuropsicopedagógica, parecer ou PDI, o arquivo em PDF assinado aparecerá aqui automaticamente.`}
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: JORNADA DO ESTUDANTE / ALINHAMENTO PEDAGÓGICO BNCC */}
        {/* ========================================================================= */}
        {activeTab === 'evolucao' && (
          <div className="space-y-6">
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                {isSchool
                  ? 'Plano de Alinhamento Pedagógico & Inclusão Escolar (BNCC)'
                  : `A Jornada de Desenvolvimento de ${patientData.nome}`}
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-600 max-w-2xl leading-relaxed">
                {isSchool
                  ? 'Acompanhe as etapas do trabalho integrado de assessoria psicopedagógica e adequação curricular para a equipe docente.'
                  : 'Acompanhe o status das etapas do processo de atendimento psicopedagógico.'}
              </p>
            </div>

            {dbLoading ? (
              <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#EAE6DF] shadow-xs space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Skeleton width={80} height={14} borderRadius={4} />
                      <Skeleton width={70} height={18} borderRadius={9} />
                    </div>
                    <Skeleton width={220} height={20} borderRadius={6} />
                    <Skeleton width="85%" height={14} borderRadius={4} />
                    <Skeleton height={52} borderRadius={16} />
                  </div>
                ))}
              </div>
            ) : activeTimeline.length > 0 ? (
              <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#EAE6DF] shadow-xs space-y-8">
                <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-2 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E3DDD3]">
                  {activeTimeline.map((step, idx) => (
                    <div key={idx} className="relative space-y-2">
                      
                      <div
                        className={`absolute -left-6 sm:-left-10 top-0.5 w-5 sm:w-7 h-5 sm:h-7 rounded-full border-2 flex items-center justify-center ${
                          step.status === 'Concluído'
                            ? 'bg-[#002B49] border-[#D4AF37] text-white'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        {step.status === 'Concluído' ? (
                          <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-sans text-slate-500">{step.data}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase bg-emerald-50 text-emerald-800">
                            {step.status}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-heading font-extrabold text-[#002B49]">
                          {step.etapa}
                        </h3>

                        <p className="text-xs sm:text-sm font-sans text-slate-700 leading-relaxed max-w-3xl">
                          {step.detalhes}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#F8F6F0] text-xs font-sans text-[#002B49] border border-[#EAE6DF] space-y-1 max-w-3xl">
                        <div className="text-[10px] font-cta font-bold uppercase tracking-wider text-[#64748B]">
                          {isSchool ? 'Orientação Pedagógica / Consultoria:' : 'Observação do Consultório:'}
                        </div>
                        <p className="italic leading-relaxed">"{step.observacaoProfCesar}"</p>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#EAE6DF] text-center space-y-5 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#F8F6F0] border border-[#EAE6DF] flex items-center justify-center mx-auto text-[#002B49]">
                  <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="font-heading font-extrabold text-xl text-[#002B49]">
                    {isSchool
                      ? 'Nenhum alinhamento pedagógico registrado ainda'
                      : 'Nenhum registro de evolução registrado ainda'}
                  </h3>
                  <p className="text-xs sm:text-sm font-sans text-slate-600 leading-relaxed">
                    {isSchool
                      ? `As etapas de consultoria institucional, adequação curricular (BNCC) e relatórios de alunos encaminhados pela ${schoolData.nome} serão registradas aqui conforme forem realizadas pelo Prof. Cesar Roberto.`
                      : `A jornada de desenvolvimento e os marcos pedagógicos de ${patientData.nome} serão registrados aqui conforme as sessões de avaliação e intervenção forem realizadas no consultório.`}
                  </p>
                </div>

                {isSchool && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('sessoes')}
                      className="px-6 py-2.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white font-cta font-bold text-xs uppercase tracking-wider transition inline-flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-[#D4AF37]" />
                      <span>Solicitar Primeiro Alinhamento Pedagógico</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 4: CURSOS & CAPACITAÇÃO DOCENTE */}
        {/* ========================================================================= */}
        {activeTab === 'cursos' && (
          <div className="space-y-6">
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                {isSchool
                  ? 'Ambiente de Formação Continuada & Capacitação Docente'
                  : 'Cursos & Materiais de Formação'}
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-600 max-w-2xl leading-relaxed">
                {isSchool
                  ? 'Treinamentos em neuroeducação, manejo inclusivo em sala e diretrizes da BNCC para qualificação da equipe escolar com emissão de certificados oficiais de horas.'
                  : 'Capacitações ministradas pelo Prof. Cesar Roberto com videoaulas gravadas, apostilas práticas e emissão de certificados digitais.'}
              </p>
            </div>

            {dbLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] overflow-hidden shadow-xs">
                    <Skeleton height={176} borderRadius={0} />
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="space-y-2">
                        <Skeleton width={110} height={12} borderRadius={4} />
                        <Skeleton width={190} height={20} borderRadius={6} />
                        <Skeleton count={2} height={14} borderRadius={4} />
                        <div className="space-y-1 pt-2">
                          <div className="flex justify-between">
                            <Skeleton width={80} height={12} borderRadius={4} />
                            <Skeleton width={30} height={12} borderRadius={4} />
                          </div>
                          <Skeleton height={8} borderRadius={4} />
                        </div>
                      </div>
                      <div className="pt-2 border-t border-[#EAE6DF] flex justify-between items-center">
                        <Skeleton width={80} height={14} borderRadius={4} />
                        <Skeleton width={90} height={32} borderRadius={16} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : enrolledCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {enrolledCourses.map((curso) => (
                  <div
                    key={curso.id}
                    onClick={() => handleOpenCourseModal(curso)}
                    className="group rounded-2xl sm:rounded-3xl bg-white border border-[#EAE6DF] hover:border-[#D4AF37]/60 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1"
                  >
                    <div className="h-44 overflow-hidden relative">
                      <img
                        src={curso.imagem}
                        alt={curso.titulo}
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop' }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-cta font-bold text-[#002B49] uppercase">
                        {curso.categoria}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="text-[11px] font-sans text-slate-500">
                          Carga Horária: {curso.cargaHoraria}
                        </div>

                        <h3 className="text-base font-heading font-extrabold text-[#002B49] group-hover:text-[#073B63] transition-colors leading-snug">
                          {curso.titulo}
                        </h3>

                        <p className="text-xs font-sans text-slate-600 leading-relaxed line-clamp-2">
                          {curso.descricao}
                        </p>

                        <div className="space-y-1 pt-2">
                          <div className="flex justify-between text-xs font-sans">
                            <span className="text-slate-500">{curso.aulasConcluidas} de {curso.totalAulas} aulas</span>
                            <span className="font-bold text-[#002B49]">{curso.progresso}%</span>
                          </div>
                          <div className="w-full bg-[#EAE6DF] rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
                              style={{ width: `${curso.progresso}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#EAE6DF] flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenCourseModal(curso)
                          }}
                          className="text-xs font-cta font-bold text-[#002B49] hover:text-[#D4AF37] transition inline-flex items-center justify-center gap-1 cursor-pointer py-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Ver módulos</span>
                        </button>

                        {curso.certificado ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCertificate(curso.certificado)
                            }}
                            className="px-4 py-2 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] font-cta font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs text-center"
                          >
                            Ver Certificado
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenCourseModal(curso)
                            }}
                            className="px-4 py-2 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white font-cta font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-xs text-center"
                          >
                            Assistir Aulas
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#EAE6DF] text-center space-y-6 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-[#F8F6F0] border border-[#EAE6DF] flex items-center justify-center mx-auto text-[#002B49]">
                  <GraduationCap className="w-8 h-8 text-[#D4AF37]" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="font-heading font-extrabold text-xl text-[#002B49]">
                    {isSchool
                      ? 'Nenhum treinamento de equipe ativo no momento'
                      : 'Nenhum curso matriculado no momento'}
                  </h3>
                  <p className="text-xs sm:text-sm font-sans text-slate-600 leading-relaxed">
                    {isSchool
                      ? `Sua instituição pode solicitar a liberação de cursos de formação continuada para os professores da escola ou agendar oficinas pedagógicas presenciais e online.`
                      : 'Você ainda não possui matrículas ativas em cursos. Para se matricular em um treinamento de Neurociência ou Adaptações Curriculares (BNCC), fale com o Prof. Cesar.'}
                  </p>
                </div>

                <a
                  href={`https://wa.me/5532987252421?text=${encodeURIComponent(
                    isSchool
                      ? `Olá Prof. Cesar! Aqui é da equipe gestora da ${schoolData.nome}. Gostaríamos de informações sobre os cursos de capacitação docente e oficinas pedagógicas para nossos professores.`
                      : `Olá Prof. Cesar! Aqui é ${patientData.nome} (${user?.email}). Gostaria de informações sobre a matrícula nos seus cursos de formação.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white font-cta font-bold text-xs uppercase tracking-wider transition inline-flex items-center gap-2 shadow-xs"
                >
                  <MessageCircle className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isSchool ? 'Contratar Capacitação Docente no WhatsApp' : 'Conhecer Cursos pelo WhatsApp'}</span>
                </a>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 5: NOSSOS ENCONTROS / CONSULTORIAS & REUNIÕES INSTITUCIONAIS */}
        {/* ========================================================================= */}
        {activeTab === 'sessoes' && (
          <div className="space-y-6">
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                {isSchool
                  ? 'Consultorias Pedagógicas & Reuniões Institucionais'
                  : 'Nossos Encontros & Conversas'}
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-600 max-w-2xl leading-relaxed">
                {isSchool
                  ? 'Histórico de alinhamentos realizados com a coordenação/direção e canal direto para agendamento de novas reuniões ou treinamentos.'
                  : 'Histórico de sessões realizadas no consultório e canal direto para agendamento.'}
              </p>
            </div>

            {/* Histórico Recente de Atendimentos / Reuniões */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EAE6DF] shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-extrabold text-[#002B49]">
                  {isSchool ? 'Histórico de Reuniões & Consultorias' : 'Histórico de Atendimentos no Prontuário'}
                </h3>
                <span className="text-xs font-sans text-slate-500">
                  {patientSessionsHistory.length} {isSchool ? 'reunião(ões) registrada(s)' : 'encontro(s) registrado(s)'}
                </span>
              </div>

              {dbLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <Skeleton width={100} height={16} borderRadius={4} />
                        <Skeleton width={70} height={18} borderRadius={9} />
                      </div>
                      <Skeleton width={160} height={14} borderRadius={4} />
                      <Skeleton width="85%" height={12} borderRadius={4} />
                    </div>
                  ))}
                </div>
              ) : patientSessionsHistory.length > 0 ? (
                <div className="space-y-3">
                  {patientSessionsHistory.map((sessao) => (
                    <div
                      key={sessao.id}
                      className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#D4AF37]/50 transition"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-[#002B49]">{sessao.data}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-cta font-bold uppercase ${
                              sessao.rawStatus === 'CONFIRMADO'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : sessao.rawStatus === 'CONCLUIDO'
                                ? 'bg-blue-50 text-blue-800'
                                : sessao.rawStatus === 'CANCELADO'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {sessao.status}
                          </span>
                          {sessao.horario && (
                            <span className="text-xs font-sans text-slate-500">
                              às {sessao.horario}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-sans text-[#002B49] font-semibold">{sessao.tipo}</div>
                        <p className="text-xs font-sans text-slate-600 leading-relaxed">{sessao.resumo}</p>
                      </div>

                      {/* Botão de Cancelar (disponível para pendentes ou confirmados) */}
                      {sessao.rawStatus !== 'CANCELADO' && sessao.rawStatus !== 'CONCLUIDO' && (
                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(sessao.id)}
                            className="px-3.5 py-1.5 rounded-full text-xs font-cta font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#FDFBF7] border border-[#EAE6DF] text-center space-y-2">
                  <p className="text-xs sm:text-sm font-sans text-slate-600">
                    {isSchool
                      ? 'Nenhuma consultoria anterior registrada para esta instituição ainda.'
                      : 'Nenhuma sessão anterior registrada para este paciente ainda.'}
                  </p>
                </div>
              )}
            </div>

            {/* Formulário de Agendamento Adaptado de Alto Contraste */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#002B49] border-2 border-[#002B49] text-white shadow-xl space-y-5">
              {rescheduleSubmitted ? (
                <div className="text-center py-6 space-y-5 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                  </div>

                  <div className="space-y-2 max-w-md mx-auto">
                    <h4 className="text-2xl font-serif font-bold text-white">
                      Solicitação Registrada!
                    </h4>
                    <p className="text-sm font-sans text-slate-200 leading-relaxed">
                      Sua solicitação foi salva no sistema com sucesso. Para confirmar o atendimento com prioridade, clique no botão abaixo para enviar os detalhes pelo WhatsApp ao Prof. Cesar Roberto.
                    </p>
                  </div>

                  {rescheduleWhatsappUrl && (
                    <div className="pt-2">
                      <a
                        href={rescheduleWhatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-cta font-bold text-sm shadow-md transition hover:scale-105"
                      >
                        <img src="/whatsapp-icon.svg" alt="WhatsApp" className="w-5 h-5 object-contain" />
                        <span>Confirmar no WhatsApp</span>
                      </a>
                    </div>
                  )}

                  <div className="pt-4 border-t border-white/20 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setRescheduleSubmitted(false)}
                      className="text-xs font-cta font-bold text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      ← Fazer outra solicitação
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <h3 className="text-xl font-heading font-extrabold text-white">
                      {isSchool
                        ? 'Solicitar Consultoria ou Reunião com o Prof. Cesar Roberto'
                        : 'Solicitar Agendamento com o Prof. Cesar Roberto'}
                    </h3>
                    <p className="text-xs sm:text-sm font-sans text-slate-200">
                      {isSchool
                        ? 'Envie a sugestão de data e a pauta da reunião. A solicitação será salva no sistema e encaminhada para alinhamento.'
                        : 'Envie sua preferência de dia e horário. A solicitação será salva no sistema e encaminhada para confirmação.'}
                    </p>
                  </div>

                  <form onSubmit={handleSubmitReschedule} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                          {isSchool ? 'PAUTA / TIPO DE CONSULTORIA' : 'ASSUNTO / SERVIÇO'}
                        </label>
                        <select
                          value={rescheduleForm.motivo}
                          onChange={(e) => setRescheduleForm({ ...rescheduleForm, motivo: e.target.value })}
                          className="w-full px-4 py-3.5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] focus:outline-none transition cursor-pointer"
                        >
                          {isSchool ? (
                            <>
                              <option value="Consultoria de Adequação Curricular (BNCC & Inclusão)">Consultoria de Adequação Curricular (BNCC & Inclusão)</option>
                              <option value="Reunião de Alinhamento sobre Aluno Encaminhado">Reunião de Alinhamento sobre Aluno Encaminhado</option>
                              <option value="Oficina / Palestra de Capacitação para Professores">Oficina / Palestra de Capacitação para Professores</option>
                              <option value="Visita Técnica e Observação Pedagógica em Sala">Visita Técnica e Observação Pedagógica em Sala</option>
                              <option value="Alinhamento Institucional com Coordenação / Direção">Alinhamento Institucional com Coordenação / Direção</option>
                            </>
                          ) : (
                            <>
                              <option value="Primeira Avaliação Neuropsicopedagógica">Primeira Avaliação Neuropsicopedagógica</option>
                              <option value="Sessão de Estimulação Cognitiva">Sessão de Estimulação Cognitiva</option>
                              <option value="Conversa de Alinhamento com a Família">Conversa de Alinhamento com a Família</option>
                              <option value="Remarcar dia ou horário da sessão">Remarcar dia ou horário da sessão</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                          {isSchool ? 'DIA DA CONSULTORIA (SEGUNDA A SEXTA)' : 'DIA DA SESSÃO (SEGUNDA A SEXTA)'}
                        </label>
                        <input
                          type="date"
                          required
                          min={todayISO}
                          value={rescheduleForm.dataSugerida}
                          onChange={handleRescheduleDateChange}
                          className="w-full px-4 py-3.5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-bold text-[#002B49] focus:outline-none transition cursor-pointer"
                        />
                        {rescheduleDateError && (
                          <p className="text-xs sm:text-sm text-rose-300 font-sans font-bold mt-1.5 flex items-center gap-1 p-2 rounded-xl bg-rose-950/80 border border-rose-500">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>{rescheduleDateError}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Interactive Time Slots Grid */}
                    {rescheduleForm.dataSugerida && !isWeekend(rescheduleForm.dataSugerida) ? (
                      <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300 p-4 rounded-2xl bg-[#001F35] border-2 border-white/20">
                        <div className="flex items-center justify-between">
                          <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                            Horário de Preferência *
                          </label>
                          {portalBookedSlots.length > 0 && (
                            <span className="text-xs text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500 font-bold">
                              {portalBookedSlots.length} reservado(s)
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                          {timeSlots.map((slot) => {
                            const isBooked = portalBookedSlots.includes(slot)
                            const isPast = isSlotPast(slot, rescheduleForm.dataSugerida)
                            const isUnavailable = isBooked || isPast
                            const isSelected = rescheduleForm.horarioSugerido === slot && !isUnavailable

                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isUnavailable}
                                onClick={() => !isUnavailable && setRescheduleForm((prev) => ({ ...prev, horarioSugerido: slot }))}
                                title={
                                  isPast
                                    ? `Horário ${slot} já ultrapassado para a data de hoje`
                                    : isBooked
                                    ? `Horário ${slot} indisponível nesta data`
                                    : `Selecionar ${slot}`
                                }
                                className={`py-3 px-3 rounded-xl text-sm font-sans transition text-center ${
                                  isUnavailable
                                    ? 'bg-[#001524] text-slate-500 border border-white/10 cursor-not-allowed opacity-50 line-through select-none'
                                    : isSelected
                                    ? 'bg-[#D4AF37] text-[#002B49] font-black border-2 border-[#D4AF37] shadow-md ring-2 ring-white cursor-pointer'
                                    : 'bg-white text-[#002B49] font-bold border-2 border-slate-300 hover:bg-slate-100 hover:border-slate-400 cursor-pointer shadow-2xs'
                                }`}
                              >
                                {slot}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl sm:rounded-2xl bg-[#001F35] border-2 border-dashed border-white/30 text-center">
                        <p className="text-xs sm:text-sm font-sans font-medium text-slate-300 flex items-center justify-center gap-2">
                          <CalendarDays className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          <span>Selecione um dia útil acima para visualizar os horários disponíveis.</span>
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                        {isSchool ? 'DETALHES DA PAUTA / OBSERVAÇÕES DA COORDENAÇÃO' : 'MENSAGEM / OBSERVAÇÕES'}
                      </label>
                      <textarea
                        rows={3}
                        placeholder={isSchool ? 'Descreva brevemente os objetivos da reunião ou consultoria...' : 'Escreva sua mensagem com tranquilidade...'}
                        value={rescheduleForm.observacoes}
                        onChange={(e) => setRescheduleForm({ ...rescheduleForm, observacoes: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl sm:rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] font-cta font-extrabold text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <Send className="w-4 h-4 text-[#002B49] stroke-[2.5]" />
                      <span>{isSchool ? 'Enviar Solicitação de Consultoria' : 'Enviar Solicitação de Agendamento'}</span>
                    </button>
                  </form>
                </>
              )}
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: PRÉ-VISUALIZAÇÃO DE LAUDO / PARECER ESCOLAR */}
      {/* ========================================================================= */}
      {selectedLaudoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-slate-300 space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-[#002B49] text-white text-[10px] font-cta font-bold uppercase">
                  {selectedLaudoPreview.tipo}
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[#002B49]">
                  {selectedLaudoPreview.titulo}
                </h3>
                <p className="text-xs sm:text-sm font-sans text-slate-600 font-medium">
                  Emitido em {selectedLaudoPreview.dataEmissao} • Prof. Cesar Roberto Loureiro
                </p>
              </div>

              <button
                onClick={() => setSelectedLaudoPreview(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#002B49]">
                {isSchool ? 'Parecer & Diretrizes Pedagógicas' : 'Resumo do Documento'}
              </div>
              <p className="text-xs sm:text-sm font-sans text-slate-800 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border-2 border-slate-300">
                {selectedLaudoPreview.resumo}
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#002B49]">
                {isSchool ? 'Orientações para Sala de Aula' : 'Pontos de Atenção'}
              </div>
              <div className="space-y-2">
                {selectedLaudoPreview.pontosChave?.map((ponto, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-100 text-xs sm:text-sm font-sans font-semibold text-[#002B49] flex items-start gap-2.5 border-2 border-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                    <span>{ponto}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={() => setSelectedLaudoPreview(null)}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-cta font-bold cursor-pointer text-center"
              >
                Fechar
              </button>

              <button
                onClick={() => {
                  handleDownloadLaudo(selectedLaudoPreview)
                  setSelectedLaudoPreview(null)
                }}
                className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] text-[#002B49] text-xs font-cta font-bold uppercase tracking-wider transition shadow-sm cursor-pointer text-center"
              >
                Baixar Documento em PDF
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CERTIFICADO DIGITAL OFICIAL */}
      {/* ========================================================================= */}
      {selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GRADE DE AULAS & PLAYER */}
      {/* ========================================================================= */}
      {selectedCourseLesson && courseMaterias === null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#00182A]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-2xl text-[#002B49] font-bold">
            <div className="w-5 h-5 border-2 border-[#002B49] border-t-transparent rounded-full animate-spin" />
            Carregando aulas do curso...
          </div>
        </div>
      )}

      {selectedCourseLesson && courseMaterias !== null && (
        <>
          {courseLoadError && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] rounded-xl bg-rose-600 text-white text-sm font-bold px-5 py-3 shadow-xl">
              {courseLoadError}
            </div>
          )}
          <CoursePreview
            modo="aluno"
            curso={{
              titulo: selectedCourseLesson.titulo,
              descricao: selectedCourseLesson.descricao,
              thumbnail_url: selectedCourseLesson.imagem,
              carga_horaria: selectedCourseLesson.cargaHoraria,
              certificado_info: selectedCourseLesson.certificado ? 'Certificado emitido' : ''
            }}
            materias={courseMaterias}
            initialProgress={selectedCourseLesson.progresso || 0}
            onProgress={handleCourseProgress}
            onCompleteCourse={async () => {
              await handleCourseProgress(100)
              handleCloseCourse()
              // Se já temos os dados do certificado montados para este curso, abre o modal de certificado
              if (selectedCourseLesson.certificado) {
                setSelectedCertificate(selectedCourseLesson.certificado)
              } else {
                setSelectedCertificate({
                  codigo: `CERT-${new Date().getFullYear()}-CR-${Math.floor(1000 + Math.random() * 9000)}`,
                  dataEmissao: new Date().toLocaleDateString('pt-BR'),
                  carga: selectedCourseLesson.cargaHoraria || '120 horas',
                  livro: 'Livro de Extensão Vol. 04 / Registro Oficial',
                  aluno: displayName,
                  curso: selectedCourseLesson.titulo
                })
              }
            }}
            onClose={handleCloseCourse}
          />
        </>
      )}

      {/* ========================================================================= */}
      {/* FLOATING CIRCULAR BACK BUTTON (CANTO INFERIOR ESQUERDO) */}
      {/* ========================================================================= */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white hover:bg-[#FAF8F5] text-[#002B49] hover:text-[#D4AF37] border border-[#E3DDD3] shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer focus:outline-none"
        title="Voltar à Página Principal"
        aria-label="Voltar à Página Principal"
      >
        <ArrowLeft className="w-5 h-5 text-[#002B49] group-hover:text-[#D4AF37] group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* ========================================================================= */}
      {/* MODAL 4: GERENCIADOR DE PERFIL & CONFIGURAÇÕES */}
      {/* ========================================================================= */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onLogout={handleLogout}
      />

      </div>
    </SkeletonTheme>
  )
}
