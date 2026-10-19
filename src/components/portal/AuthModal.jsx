import { useState } from 'react'
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  School,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { translateAuthError } from '../../utils/authErrors'
import { formatPhoneNumber } from '../../utils/phoneFormatter'

export default function AuthModal({ isOpen, onClose, initialRole = 'PACIENTE', initialTab = 'login', onAuthSuccess }) {
  const {
    signInWithPassword,
    signUp,
    signInWithMagicLink,
    resetPassword,
    loginWithDemo,
    isConfigured
  } = useAuth()

  const [selectedRole, setSelectedRole] = useState(initialRole)
  const [activeTab, setActiveTab] = useState(initialTab) // 'login' | 'signup' | 'magic' | 'recovery'
  const [prevInitialRole, setPrevInitialRole] = useState(initialRole)
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab)

  if (initialRole !== prevInitialRole) {
    setPrevInitialRole(initialRole)
    setSelectedRole(initialRole)
  }

  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab)
    setActiveTab(initialTab)
  }

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    password: '',
    telefone: '',
    instituicao_nome: '',
    documento: ''
  })

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const formattedValue = name === 'telefone' ? formatPhoneNumber(value) : value
    setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    setErrorMsg('')
  }

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (activeTab === 'login') {
        if (!formData.email || !formData.password) {
          throw new Error('Preencha seu e-mail e senha.')
        }
        await signInWithPassword(formData.email, formData.password)
        setSuccessMsg('Login realizado com sucesso!')
        setTimeout(() => {
          onClose()
          if (onAuthSuccess) onAuthSuccess(selectedRole)
        }, 600)
      } else if (activeTab === 'signup') {
        if (!formData.nome_completo || !formData.email || !formData.password) {
          throw new Error('Preencha todos os campos obrigatórios.')
        }
        await signUp(formData.email, formData.password, {
          nome_completo: formData.nome_completo,
          telefone: formData.telefone,
          tipo_usuario: selectedRole,
          instituicao_nome: formData.instituicao_nome,
          documento: formData.documento
        })
        setSuccessMsg('Cadastro realizado! Verifique seu e-mail para confirmação.')
      } else if (activeTab === 'magic') {
        if (!formData.email) {
          throw new Error('Informe seu e-mail para receber o link de acesso.')
        }
        await signInWithMagicLink(formData.email)
        setSuccessMsg('Link mágico enviado para sua caixa de entrada!')
      } else if (activeTab === 'recovery') {
        if (!formData.email) {
          throw new Error('Informe seu e-mail para redefinir sua senha.')
        }
        await resetPassword(formData.email)
        setSuccessMsg('Instruções de redefinição de senha enviadas por e-mail.')
      }
    } catch (err) {
      setErrorMsg(translateAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  // Quick Demo Login Handler
  const handleQuickDemo = (role) => {
    loginWithDemo(role)
    setSuccessMsg(`Acesso de Demonstração liberado como perfil ${role}!`)
    setTimeout(() => {
      onClose()
      if (onAuthSuccess) onAuthSuccess(role)
    }, 600)
  }

  const roleConfigs = [
    {
      id: 'PACIENTE',
      title: 'Paciente / Família',
      subtitle: 'Laudos, prontuário & consultas',
      icon: User
    },
    {
      id: 'ESCOLA',
      title: 'Escola Parceira',
      subtitle: 'Relatórios B2B e PDI/PEI',
      icon: School
    },
    {
      id: 'ALUNO',
      title: 'Aluno AVA',
      subtitle: 'Cursos e certificados',
      icon: GraduationCap
    },
    {
      id: 'ADMIN',
      title: 'Profissional',
      subtitle: 'Painel Prof. Cesar Loureiro',
      icon: Lock
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-[#002B49] rounded-[32px] sm:rounded-[36px] shadow-2xl border-2 border-[#002B49] text-white overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-6 sm:p-7 bg-[#002B49] text-white relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-[11px] font-cta font-bold uppercase tracking-wider text-[#D4AF37] mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Área Restrita &amp; Portal de Membros</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
            Acesso à Plataforma Digital
          </h3>
          <p className="text-xs font-sans text-slate-200 mt-1">
            Ambiente seguro com criptografia e conformidade rigorosa com a LGPD.
          </p>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
            {roleConfigs.map((r) => {
              const Icon = r.icon
              const isSelected = selectedRole === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-2.5 rounded-2xl text-left transition border-2 cursor-pointer flex flex-col justify-between min-h-[76px] ${
                    isSelected
                      ? 'bg-[#D4AF37] text-[#002B49] border-[#D4AF37] shadow-sm font-bold'
                      : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/20'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#002B49]' : 'text-[#D4AF37]'}`} />
                  <div>
                    <div className="text-xs leading-tight">{r.title}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Modal Body & Forms */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5 bg-[#002B49] text-white">
          
          {/* Sub Navigation Modes (Login / Cadastro / Link Mágico / Recuperação) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#001F35] border-2 border-white/20 text-xs font-cta font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${
                activeTab === 'login'
                  ? 'bg-[#D4AF37] text-[#002B49] shadow-xs font-black'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${
                activeTab === 'signup'
                  ? 'bg-[#D4AF37] text-[#002B49] shadow-xs font-black'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Criar Conta
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('magic')}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer text-center ${
                activeTab === 'magic'
                  ? 'bg-[#D4AF37] text-[#002B49] shadow-xs font-black'
                  : 'text-slate-200 hover:text-white'
              }`}
            >
              Link Mágico
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs font-sans flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 text-xs font-sans flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Field: Full Name (Signup only) */}
            {activeTab === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="nome_completo"
                    required
                    value={formData.nome_completo}
                    onChange={handleInputChange}
                    placeholder="Ex: Mariana Silveira"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Field: School / Institution (Signup + Escola only) */}
            {activeTab === 'signup' && selectedRole === 'ESCOLA' && (
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                  Nome da Instituição Escolar *
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="instituicao_nome"
                    required
                    value={formData.instituicao_nome}
                    onChange={handleInputChange}
                    placeholder="Ex: Colégio Primeiros Passos"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Field: E-mail */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                E-mail de Acesso *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>

            {/* Field: Phone (Signup only) */}
            {activeTab === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                  Telefone / WhatsApp com DDD
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    placeholder="(32) 98725-2421"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Field: Password (Login & Signup) */}
            {(activeTab === 'login' || activeTab === 'signup') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                    Senha de Segurança *
                  </label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('recovery')}
                      className="text-xs font-sans font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-sm font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] font-cta font-extrabold text-sm inline-flex items-center justify-center gap-2.5 transition shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              <span>
                {loading
                  ? 'Processando...'
                  : activeTab === 'login'
                  ? `Acessar como ${roleConfigs.find((r) => r.id === selectedRole)?.title}`
                  : activeTab === 'signup'
                  ? 'Finalizar Cadastro Seguro'
                  : activeTab === 'magic'
                  ? 'Enviar Link de Acesso sem Senha'
                  : 'Enviar Instruções de Recuperação'}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>

          {/* Quick Demo Access Bar (One-click Testing of Phase 2 Dashboards) */}
          <div className="pt-4 border-t border-white/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-cta font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Modo Demonstração (Testar Telas da Fase 2):
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('PACIENTE')}
                className="px-2.5 py-2 rounded-xl bg-[#001F35] border border-white/20 hover:bg-[#D4AF37] hover:text-[#002B49] text-white text-[11px] font-cta font-bold transition text-center cursor-pointer"
              >
                Demo Paciente
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('ESCOLA')}
                className="px-2.5 py-2 rounded-xl bg-[#001F35] border border-white/20 hover:bg-[#D4AF37] hover:text-[#002B49] text-white text-[11px] font-cta font-bold transition text-center cursor-pointer"
              >
                Demo Escola
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('ALUNO')}
                className="px-2.5 py-2 rounded-xl bg-[#001F35] border border-white/20 hover:bg-[#D4AF37] hover:text-[#002B49] text-white text-[11px] font-cta font-bold transition text-center cursor-pointer"
              >
                Demo Aluno AVA
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="px-2.5 py-2 rounded-xl bg-[#D4AF37] text-[#002B49] hover:bg-[#c49f2b] text-[11px] font-cta font-bold transition text-center cursor-pointer"
              >
                Demo Prof. Cesar
              </button>
            </div>

            {!isConfigured && (
              <p className="text-[11px] font-sans text-slate-400 mt-2 text-center">
                Configure suas chaves no arquivo <code>.env</code> para habilitar persistência real no Supabase.
              </p>
            )}
          </div>

          {/* LGPD Security Badge */}
          <div className="text-[11px] font-sans text-slate-300 flex items-center justify-center gap-1.5 pt-1 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Dados criptografados de ponta a ponta (AES-256) em conformidade com a LGPD.</span>
          </div>

        </div>
      </div>
    </div>
  )
}
