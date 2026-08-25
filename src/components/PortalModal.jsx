import { useState } from 'react'
import {
  X,
  Lock,
  User,
  School,
  GraduationCap,
  Download,
  Calendar,
  FileText,
  ShieldCheck,
  Award,
  ArrowRight,
  LogOut,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getUserDisplayName } from '../utils/userDisplay'

export default function PortalModal({ isOpen, onClose, initialTab = 'patient', onOpenAuth }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const { user, profile, signOut, loginWithDemo } = useAuth()
  const { displayName, initial, fullName } = getUserDisplayName(profile, user)

  if (!isOpen) return null

  const patientReports = [
    {
      id: '1',
      title: 'Relatório de Avaliação Psicopedagógica',
      data: '12/03/2026',
      type: 'Laudo Clínico',
      fileSize: '1.4 MB PDF',
      status: 'Concluído'
    },
    {
      id: '2',
      title: 'Plano de Intervenção Neuropsicopedagógica',
      data: '05/04/2026',
      type: 'Plano de Metas',
      fileSize: '890 KB PDF',
      status: 'Em Andamento'
    },
    {
      id: '3',
      title: 'Evolução de Funções Executivas e Foco - 1º Trimestre',
      data: '20/05/2026',
      type: 'Acompanhamento',
      fileSize: '620 KB PDF',
      status: 'Disponível'
    }
  ]

  const schoolDocuments = [
    {
      id: 's1',
      school: 'Colégio Integrado São José',
      title: 'Diretrizes de Adaptação Curricular (PDI/PEI) - Turma 4º Ano',
      date: '15/06/2026',
      status: 'Validado'
    },
    {
      id: 's2',
      school: 'Escola Municipal de Recreio - MG',
      title: 'Relatório de Consultoria Institucional e Formação Docente',
      date: '28/05/2026',
      status: 'Aprovado'
    }
  ]

  const myCourses = [
    {
      id: 'c1',
      title: 'Neurociência Aplicada à Sala de Aula e Funções Executivas',
      progress: 100,
      certificateReady: true,
      code: 'CR-NEURO-2026-8841'
    },
    {
      id: 'c2',
      title: 'Adaptações Curriculares e PDI/PEI na Prática Escolar (BNCC)',
      progress: 65,
      certificateReady: false,
      code: 'CR-BNCC-2026-9102'
    }
  ]

  const handleDownloadReport = (title) => {
    alert(`Iniciando download seguro com link assinado e criptografia ponta a ponta (AES-256) de:\n"${title}"`)
  }

  const handleOpenAuthTab = (role) => {
    if (onOpenAuth) {
      onOpenAuth(role)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 relative space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#002B49]/5 text-[#002B49] text-xs font-cta font-bold uppercase tracking-wider border border-[#002B49]/10">
            <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
            Plataforma Digital &amp; Portal de Membros (Fase 2)
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#002B49]">
            Área Restrita &amp; Gestão Digital
          </h3>
          <p className="text-xs sm:text-sm font-sans text-slate-600">
            Acesso sigiloso e criptografado para pacientes, famílias, escolas parceiras e alunos de cursos.
          </p>
        </div>

        {/* User Authenticated Banner (if logged in) */}
        {user && profile && (
          <div className="p-4 rounded-2xl bg-[#002B49] text-white flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-[#002B49] font-serif font-bold flex items-center justify-center shrink-0 shadow-xs">
                {initial}
              </div>
              <div>
                <div className="font-serif font-bold text-sm leading-tight text-white">
                  {fullName || displayName}
                </div>
                <div className="text-[11px] font-sans text-slate-300">
                  Perfil: <span className="font-bold text-[#D4AF37]">{profile.tipo_usuario || 'USUÁRIO'}</span>
                  {profile.instituicao_nome ? ` • ${profile.instituicao_nome}` : ''} • {profile.email || user.email}
                </div>
              </div>
            </div>

            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#D4AF37] text-xs font-cta font-bold transition cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('patient')}
            className={`px-4 py-2 rounded-xl text-xs font-cta font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'patient'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Área do Paciente / Família</span>
          </button>

          <button
            onClick={() => setActiveTab('school')}
            className={`px-4 py-2 rounded-xl text-xs font-cta font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'school'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <School className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Escolas Conveniadas</span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-cta font-bold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'courses'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Cursos &amp; Certificados (AVA)</span>
          </button>
        </div>

        {/* Tab 1: Área do Paciente / Família */}
        {activeTab === 'patient' && (
          <div className="space-y-6">
            {!user ? (
              <div className="bg-[#F4F6F8] rounded-3xl p-6 sm:p-8 border border-slate-200 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#002B49]/5 text-[#002B49] flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <h4 className="font-serif font-bold text-lg text-[#002B49]">
                  Acesso com E-mail ou Link Mágico
                </h4>
                <p className="text-xs font-sans text-slate-600 max-w-md mx-auto">
                  Faça login para visualizar laudos, planos de intervenção e histórico de sessões do paciente.
                </p>

                <div className="max-w-sm mx-auto space-y-2.5 pt-2">
                  <button
                    onClick={() => handleOpenAuthTab('PACIENTE')}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#002B49] hover:bg-[#073B63] text-white px-5 py-3 rounded-full font-cta font-bold text-xs transition cursor-pointer shadow-sm hover:scale-[1.01]"
                  >
                    <span>Fazer Login ou Criar Conta</span>
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                  </button>

                  <button
                    onClick={() => loginWithDemo('PACIENTE')}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-full font-cta font-bold text-xs transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Entrar como Paciente (Modo Demo)</span>
                  </button>
                </div>

                <div className="pt-2 text-[11px] font-sans text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Proteção de dados de saúde e menores em total conformidade com a LGPD.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-serif font-bold text-[#002B49] mb-1">
                    Laudos, Relatórios &amp; Prontuário Digital
                  </h4>
                  <p className="text-xs font-sans text-slate-600 mb-4">
                    Acesse abaixo seus laudos e planos de intervenção sigilosos emitidos pelo Prof. Cesar Loureiro.
                  </p>

                  <div className="space-y-3">
                    {patientReports.map((laudo) => (
                      <div
                        key={laudo.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#F4F6F8] rounded-2xl border-l-4 border-[#D4AF37] gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-serif font-bold text-sm text-[#002B49]">{laudo.title}</h5>
                            <span className="text-[10px] font-cta font-bold px-2 py-0.5 rounded bg-white text-[#002B49] border border-slate-200">
                              {laudo.type}
                            </span>
                          </div>
                          <p className="text-xs font-sans text-slate-500 mt-0.5">
                            Data de emissão: <strong>{laudo.data}</strong> • {laudo.fileSize}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDownloadReport(laudo.title)}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#002B49] text-[#D4AF37] text-xs font-cta font-bold rounded-full hover:bg-[#073B63] transition shrink-0 cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar PDF</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next Appointment Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#002B49]" />
                    <div>
                      <div className="text-xs font-serif font-bold text-[#002B49]">Próxima Sessão Agendada:</div>
                      <div className="text-xs font-sans text-slate-600">Quarta-feira, às 14:00 (Presencial em Recreio-MG)</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-cta font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md">
                    Confirmada
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Escolas Conveniadas */}
        {activeTab === 'school' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#002B49]/5 border border-[#002B49]/10">
              <h4 className="font-serif font-bold text-sm text-[#002B49]">
                Canal Institucional B2B para Gestores e Professores
              </h4>
              <p className="text-xs font-sans text-slate-600 mt-1">
                Alinhamento pedagógico, envio e recebimento de relatórios escolares e estruturação de PDI segundo a BNCC.
              </p>
            </div>

            {!user ? (
              <div className="p-6 rounded-3xl bg-[#F4F6F8] border border-slate-200 text-center space-y-3">
                <School className="w-8 h-8 text-[#002B49] mx-auto" />
                <h5 className="font-serif font-bold text-base text-[#002B49]">Acesso da Equipe Pedagógica</h5>
                <p className="text-xs font-sans text-slate-600 max-w-md mx-auto">
                  Entre com as credenciais da sua instituição para acessar os relatórios e PDI/PEI dos alunos conveniados.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleOpenAuthTab('ESCOLA')}
                    className="px-5 py-2.5 rounded-full bg-[#002B49] text-white text-xs font-cta font-bold hover:bg-[#073B63] transition cursor-pointer"
                  >
                    Fazer Login Institucional
                  </button>
                  <button
                    onClick={() => loginWithDemo('ESCOLA')}
                    className="px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-cta font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Demo Escola
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {schoolDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-cta font-bold text-[#D4AF37] uppercase tracking-wider">
                        {doc.school}
                      </span>
                      <h5 className="font-serif font-bold text-sm text-[#002B49] mt-0.5">{doc.title}</h5>
                      <div className="text-xs font-sans text-slate-500">Última atualização: {doc.date}</div>
                    </div>

                    <button
                      onClick={() => handleDownloadReport(doc.title)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#002B49] text-white text-xs font-cta font-bold rounded-full hover:bg-[#073B63] transition shrink-0 cursor-pointer shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Acessar Relatório</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Cursos & Certificados (AVA) */}
        {activeTab === 'courses' && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#002B49] text-white space-y-1">
              <div className="font-serif font-bold text-sm">Ambiente Virtual de Aprendizagem (AVA)</div>
              <div className="text-xs font-sans text-slate-200">
                Acesse suas videoaulas e emita seus certificados de capacitação docente.
              </div>
            </div>

            {!user ? (
              <div className="p-6 rounded-3xl bg-[#F4F6F8] border border-slate-200 text-center space-y-3">
                <GraduationCap className="w-8 h-8 text-[#002B49] mx-auto" />
                <h5 className="font-serif font-bold text-base text-[#002B49]">Área do Aluno Matriculado</h5>
                <p className="text-xs font-sans text-slate-600 max-w-md mx-auto">
                  Acesse suas aulas gravadas, materiais em PDF e emissão de certificados digitais.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleOpenAuthTab('ALUNO')}
                    className="px-5 py-2.5 rounded-full bg-[#D4AF37] text-[#002B49] text-xs font-cta font-bold hover:bg-[#C59E27] transition cursor-pointer"
                  >
                    Acessar com E-mail e Senha
                  </button>
                  <button
                    onClick={() => loginWithDemo('ALUNO')}
                    className="px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-cta font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Demo Aluno AVA
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {myCourses.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-[#F4F6F8] border border-slate-200 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h5 className="font-serif font-bold text-sm text-[#002B49]">{c.title}</h5>
                      <span className="text-xs font-sans text-slate-500 shrink-0">
                        Código: {c.code}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-sans text-slate-600">
                        <span>Progresso do Curso</span>
                        <strong className="text-[#002B49]">{c.progress}%</strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#002B49] to-[#D4AF37]"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs font-sans text-slate-500">
                        {c.progress === 100 ? '✅ 100% Concluído' : '⏳ Em andamento'}
                      </span>

                      {c.certificateReady ? (
                        <button
                          onClick={() => handleDownloadReport(`Certificado Digital - ${c.title}`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#002B49] text-[#D4AF37] text-xs font-cta font-bold hover:bg-[#073B63] transition cursor-pointer shadow-xs"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Baixar Certificado Digital</span>
                        </button>
                      ) : (
                        <span className="text-xs font-sans text-slate-400">
                          Certificado liberado ao atingir 100%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-sans text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Criptografia ponta a ponta (AES-256)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-cta font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
