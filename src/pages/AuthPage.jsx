import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import gsap from 'gsap'
import { useAuth } from '../context/AuthContext'
import { translateAuthError } from '../utils/authErrors'

export default function AuthPage({ initialRole: _initialRole = 'PACIENTE' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const containerRef = useRef(null)
  const formRef = useRef(null)

  const {
    user,
    profile,
    loading: authLoading,
    signInWithPassword,
    signOut,
    signUp,
    resetPassword,
    updateUserPassword
  } = useAuth()

  // Evita o redirect automático enquanto o envio do formulário de login está em andamento
  const submittingRef = useRef(false)

  // Verifica se o usuário está na rota de recuperação de senha
  const isRecovery = location.pathname.includes('redefinir-senha') || location.hash.includes('type=recovery')

  // Se já estiver logado (e não estiver redefinindo senha), redireciona automaticamente para o portal correspondente
  useEffect(() => {
    if (!authLoading && user && !isRecovery && !submittingRef.current) {
      if (profile?.tipo_usuario === 'ADMIN') {
        navigate('/admin', { replace: true })
      } else if (profile?.tipo_usuario === 'ESCOLA') {
        navigate('/portal/escola', { replace: true })
      } else {
        navigate('/portal/paciente', { replace: true })
      }
    }
  }, [user, profile, authLoading, navigate, isRecovery])

  // Single Source of Truth: derive mode from URL (/login vs /cadastro vs /redefinir-senha)
  const mode = isRecovery ? 'recovery' : location.pathname.includes('cadastro') ? 'signup' : 'login'
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeLgpd, setAgreeLgpd] = useState(false)
  const [userType, setUserType] = useState('ALUNO') // 'ALUNO' | 'ESCOLA'
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    password: '',
    confirmPassword: '',
    instituicao_nome: ''
  })

  // GSAP Page Entrance Animation (Fast & Snappy)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })

      // Entrada ágil e rápida
      tl.fromTo(
        '.gsap-photo',
        { opacity: 0, scale: 0.98, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.4 }
      )
        .fromTo(
          '.gsap-brand',
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: 0.25 },
          '-=0.3'
        )
        .fromTo(
          '.gsap-switcher',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.25 },
          '-=0.25'
        )
        .fromTo(
          '.gsap-header',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.25 },
          '-=0.2'
        )
        .fromTo(
          '.gsap-field',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.22, stagger: 0.035 },
          '-=0.2'
        )
        .fromTo(
          '.gsap-action',
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.2 },
          '-=0.15'
        )
    }, containerRef)

    return () => ctx.revert()
  }, [])

  // Transição fluida e ágil com GSAP ao alternar tipo de conta (Aluno vs Escola) ou Modo (Entrar vs Criar conta)
  useEffect(() => {
    if (containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.gsap-header',
          { opacity: 0.5, y: 6 },
          { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
        )

        gsap.fromTo(
          '.gsap-field',
          { opacity: 0.4, y: 8 },
          { opacity: 1, y: 0, duration: 0.22, stagger: 0.03, ease: 'power2.out' }
        )
      }, containerRef)

      return () => ctx.revert()
    }
  }, [userType, mode])

  // Evaluate Password Strength & Specific Requirements
  const passwordStrength = useMemo(() => {
    const pass = formData.password || ''
    const checks = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      num: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass)
    }

    const metCount = [checks.length, checks.upper, checks.lower, checks.num, checks.special].filter(Boolean).length

    if (!pass) {
      return { score: 0, label: '', color: 'text-slate-400', barColor: 'bg-[#CBD5E1]', checks, isComplete: false }
    }
    if (metCount <= 1) {
      return { score: 1, label: 'Fraca', color: 'text-rose-600', barColor: 'bg-rose-500', checks, isComplete: false }
    }
    if (metCount === 2 || metCount === 3) {
      return { score: 2, label: 'Razoável', color: 'text-amber-500', barColor: 'bg-amber-500', checks, isComplete: false }
    }
    if (metCount === 4) {
      return { score: 3, label: 'Boa', color: 'text-[#D4AF37]', barColor: 'bg-[#D4AF37]', checks, isComplete: false }
    }
    return { score: 4, label: 'Forte', color: 'text-emerald-600', barColor: 'bg-emerald-500', checks, isComplete: true }
  }, [formData.password])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrorMsg('')
  }

  const handleModeChange = (newMode) => {
    setErrorMsg('')
    setSuccessMsg('')
    if (newMode === 'login') {
      navigate('/login')
    } else {
      navigate('/cadastro')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    submittingRef.current = true

    try {
      if (mode === 'recovery') {
        if (!formData.password || !formData.confirmPassword) {
          throw new Error('Por favor, preencha a nova senha e a confirmação.')
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem. Por favor, digite a mesma senha nos dois campos.')
        }
        const { checks } = passwordStrength
        if (!checks.length || !checks.upper || !checks.lower || !checks.num || !checks.special) {
          throw new Error('A senha deve conter no mínimo 8 caracteres, com pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.')
        }
        await updateUserPassword(formData.password)
        setSuccessMsg('Senha redefinida com sucesso! Redirecionando para o login...')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      } else if (mode === 'login') {
        if (!formData.email || !formData.password) {
          throw new Error('Por favor, informe seu e-mail e sua senha.')
        }
        const res = await signInWithPassword(formData.email, formData.password)
        const userProf = res?.profile || profile
        if (userProf?.tipo_usuario === 'ADMIN') {
          await signOut()
          setFormData((prev) => ({ ...prev, password: '' }))
          setErrorMsg('Esta é a área de acesso de alunos e escolas. Contas administrativas não podem entrar por aqui: use o acesso restrito em /admin.')
          return
        }
        setSuccessMsg('Login realizado com sucesso! Redirecionando...')
        setTimeout(() => {
          if (userProf?.tipo_usuario === 'ESCOLA') {
            navigate('/portal/escola')
          } else {
            navigate('/portal/paciente')
          }
        }, 600)
      } else {
        if (!formData.nome_completo || !formData.email || !formData.password) {
          throw new Error('Por favor, preencha todos os campos.')
        }

        if (!agreeTerms) {
          throw new Error('É obrigatório aceitar os Termos de Uso & Privacidade para criar sua conta.')
        }

        if (!agreeLgpd) {
          throw new Error('É obrigatório autorizar o tratamento de dados pessoais conforme a LGPD para criar sua conta.')
        }

        // Validate password security requirements (8 digits, 1 upper, 1 lower, 1 number, 1 special)
        const { checks } = passwordStrength
        if (!checks.length || !checks.upper || !checks.lower || !checks.num || !checks.special) {
          throw new Error('A senha deve conter no mínimo 8 caracteres, com pelo menos: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.')
        }

        if (userType === 'ESCOLA' && !formData.instituicao_nome?.trim()) {
          throw new Error('Por favor, informe o nome da sua escola ou instituição de ensino.')
        }

        await signUp(formData.email, formData.password, {
          nome_completo: formData.nome_completo,
          tipo_usuario: userType,
          instituicao_nome: userType === 'ESCOLA' ? formData.instituicao_nome.trim() : ''
        })
        setShowEmailConfirmModal(true)
      }
    } catch (err) {
      setErrorMsg(translateAuthError(err))
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrorMsg('Digite seu e-mail no campo acima para redefinir a senha.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(formData.email)
      setSuccessMsg('Instruções para redefinição de senha foram enviadas ao seu e-mail.')
    } catch (err) {
      setErrorMsg(translateAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#F4F6F8] flex items-center justify-center p-3 sm:p-5 lg:p-6 font-sans antialiased text-[#1E293B] selection:bg-[#D4AF37] selection:text-[#002B49]"
    >
      <div className="w-full max-w-[1680px] bg-[#F4F6F8] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 xl:gap-12 items-center">
        
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Official Logo Covering the Entire Frame (Hidden on Mobile) */}
        {/* ========================================================================= */}
        <div className="gsap-photo hidden lg:flex lg:col-span-7 xl:col-span-7 relative w-full h-[720px] xl:h-[780px] rounded-[32px] overflow-hidden shadow-xl items-center justify-center p-6 sm:p-10 lg:p-14 bg-white border border-slate-200">
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
        {/* RIGHT COLUMN: High-Contrast Brand Palette & Typography Auth Form Card */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 xl:col-span-5 w-full max-w-md xl:max-w-lg mx-auto bg-[#002B49] rounded-3xl p-6 sm:p-8 md:p-10 border-2 border-[#002B49] shadow-2xl shadow-[#002B49]/30 text-white space-y-6">
          
          {/* Top Switcher Buttons (Above Title - Oculto em modo recovery) */}
          {mode !== 'recovery' && (
            <div className="gsap-switcher inline-flex items-center gap-2 p-1.5 rounded-full bg-[#001F35] border-2 border-white/20">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`py-2 px-6 rounded-full text-xs font-cta transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#D4AF37] text-[#002B49] shadow-xs font-black'
                    : 'text-slate-200 hover:text-white font-bold'
                }`}
              >
                Entrar
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`py-2 px-6 rounded-full text-xs font-cta transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#D4AF37] text-[#002B49] shadow-xs font-black'
                    : 'text-slate-200 hover:text-white font-bold'
                }`}
              >
                Criar conta
              </button>
            </div>
          )}

          {/* Heading and Subtitle */}
          <div className="gsap-header space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight text-white">
              {mode === 'recovery' ? 'Redefinir Senha' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </h1>
            <p className="text-xs sm:text-sm font-sans text-slate-200">
              {mode === 'recovery'
                ? 'Digite sua nova senha segura para recuperar o acesso à sua conta.'
                : mode === 'login'
                  ? 'Que bom ver você de volta por aqui! Acesse sua área restrita.'
                  : userType === 'ESCOLA'
                    ? 'Cadastre sua instituição para acompanhar relatórios pedagógicos e diretrizes de PDI.'
                    : 'Crie seu acesso e comece a acompanhar sua jornada de aprendizagem.'}
            </p>
          </div>

          {/* Subtle Divider Line */}
          <div className="border-b border-white/15 pt-1" />

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs sm:text-sm font-sans font-semibold animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500 text-emerald-200 text-xs sm:text-sm font-sans font-semibold animate-in fade-in">
              {successMsg}
            </div>
          )}

          {/* Form with Staggered GSAP Entrance */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-1">
            
            {/* Profile Type Toggle (Sign up only) */}
            {mode === 'signup' && (
              <div className="gsap-field space-y-2">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                  TIPO DE CONTA
                </label>
                <div className="p-1.5 rounded-2xl bg-[#001F35] grid grid-cols-2 gap-1.5 border-2 border-white/20">
                  <button
                    type="button"
                    onClick={() => setUserType('ALUNO')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-cta font-bold transition flex items-center justify-center cursor-pointer ${
                      userType === 'ALUNO'
                        ? 'bg-[#D4AF37] text-[#002B49] shadow-sm font-black'
                        : 'bg-transparent text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>Aluno / Paciente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType('ESCOLA')}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-cta font-bold transition flex items-center justify-center cursor-pointer ${
                      userType === 'ESCOLA'
                        ? 'bg-[#D4AF37] text-[#002B49] shadow-sm font-black'
                        : 'bg-transparent text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>Escola / Instituição</span>
                  </button>
                </div>
              </div>
            )}

            {/* NAME Field (Sign up only) */}
            {mode === 'signup' && (
              <div className="gsap-field space-y-1.5">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                  {userType === 'ESCOLA' ? 'NOME DO RESPONSÁVEL / COORDENADOR' : 'NOME COMPLETO'}
                </label>
                <input
                  type="text"
                  name="nome_completo"
                  required
                  value={formData.nome_completo}
                  onChange={handleInputChange}
                  placeholder={userType === 'ESCOLA' ? 'Ex: Profª Cláudia Mendes' : 'Seu nome completo'}
                  className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                />
              </div>
            )}

            {/* ESCOLA NAME Field (Escola only) */}
            {mode === 'signup' && userType === 'ESCOLA' && (
              <div className="gsap-field space-y-1.5 animate-in fade-in duration-200">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                  NOME DA ESCOLA / INSTITUIÇÃO *
                </label>
                <input
                  type="text"
                  name="instituicao_nome"
                  required
                  value={formData.instituicao_nome}
                  onChange={handleInputChange}
                  placeholder="Ex: Colégio Primeiros Passos"
                  className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                />
              </div>
            )}

            {/* EMAIL Field (Oculto em modo de recuperação de senha) */}
            {mode !== 'recovery' && (
              <div className="gsap-field space-y-1.5">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                  E-MAIL
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Seu endereço de e-mail"
                  className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                />
              </div>
            )}

            {/* PASSWORD Field with Eye Toggle and Strength Meter */}
            <div className="gsap-field space-y-1.5">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                {mode === 'recovery' ? 'NOVA SENHA' : 'SENHA'}
              </label>
              
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={mode === 'recovery' ? 'Crie uma nova senha' : 'Sua senha'}
                  minLength={mode === 'login' ? 6 : 8}
                  className="w-full pl-4 pr-11 py-3.5 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                />
                
                {/* Show/Hide Password Eye Button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#002B49] transition cursor-pointer p-1"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Strength Meter (Exibido no Cadastro e na Recuperação de Senha) */}
              {(mode === 'signup' || mode === 'recovery') && formData.password && (
                <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    {/* 4 Segmented Strength Bars */}
                    <div className="flex-1 grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            passwordStrength.score >= level
                              ? passwordStrength.barColor
                              : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Status Label on the Right */}
                    <span className={`text-[11px] font-sans font-bold uppercase tracking-wider ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-1 text-[11px] font-sans text-slate-300">
                    <div className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.length ? 'text-white font-semibold' : ''}`}>
                      {passwordStrength.checks.length ? (
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 stroke-[3]" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>No mínimo 8 caracteres</span>
                    </div>

                    <div className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.upper ? 'text-white font-semibold' : ''}`}>
                      {passwordStrength.checks.upper ? (
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 stroke-[3]" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>1 letra maiúscula</span>
                    </div>

                    <div className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.lower ? 'text-white font-semibold' : ''}`}>
                      {passwordStrength.checks.lower ? (
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 stroke-[3]" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>1 letra minúscula</span>
                    </div>

                    <div className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.num ? 'text-white font-semibold' : ''}`}>
                      {passwordStrength.checks.num ? (
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 stroke-[3]" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>1 número</span>
                    </div>

                    <div className={`flex items-center gap-1.5 sm:col-span-2 transition-colors ${passwordStrength.checks.special ? 'text-white font-semibold' : ''}`}>
                      {passwordStrength.checks.special ? (
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 stroke-[3]" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span>1 caractere especial (!@#$%&amp;*)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CONFIRM PASSWORD Field (Recovery only) */}
            {mode === 'recovery' && (
              <div className="gsap-field space-y-1.5">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                  CONFIRMAR NOVA SENHA
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Digite a nova senha novamente"
                  className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                />
              </div>
            )}

            {/* FORGOT PASSWORD? (Login only, right aligned) */}
            {mode === 'login' && (
              <div className="gsap-field flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-cta font-bold uppercase tracking-wider text-[#D4AF37] hover:underline transition cursor-pointer"
                >
                  ESQUECEU A SENHA?
                </button>
              </div>
            )}

            {/* Mandatory Terms & LGPD Checkboxes (Criar conta apenas) */}
            {mode === 'signup' && (
              <div className="space-y-2.5 pt-2">
                {/* 1. Termos de Uso */}
                <div className="gsap-field flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    className={`w-4 h-4 rounded-full border transition shrink-0 cursor-pointer flex items-center justify-center mt-0.5 ${
                      agreeTerms
                        ? 'bg-[#D4AF37] border-[#D4AF37]'
                        : 'bg-transparent border-white/40'
                    }`}
                    aria-label="Concordar com os Termos de Uso"
                  >
                    {agreeTerms && <span className="w-1.5 h-1.5 rounded-full bg-[#002B49]" />}
                  </button>
                  <span className="text-xs font-sans text-slate-200 leading-tight">
                    Declaro que li e concordo com os{' '}
                    <Link to="/termos" className="underline font-semibold text-[#D4AF37] hover:opacity-80">
                      Termos de Uso &amp; Privacidade
                    </Link>{' '}
                    <span className="text-rose-400 font-bold">*</span>
                  </span>
                </div>

                {/* 2. Consentimento LGPD */}
                <div className="gsap-field flex items-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAgreeLgpd(!agreeLgpd)}
                    className={`w-4 h-4 rounded-full border transition shrink-0 cursor-pointer flex items-center justify-center mt-0.5 ${
                      agreeLgpd
                        ? 'bg-[#D4AF37] border-[#D4AF37]'
                        : 'bg-transparent border-white/40'
                    }`}
                    aria-label="Consentimento para tratamento de dados LGPD"
                  >
                    {agreeLgpd && <span className="w-1.5 h-1.5 rounded-full bg-[#002B49]" />}
                  </button>
                  <span className="text-xs font-sans text-slate-200 leading-tight">
                    Autorizo o tratamento de dados cadastrais e prontuário de acordo com a{' '}
                    <strong className="text-white">LGPD (Lei nº 13.709/18)</strong>{' '}
                    <span className="text-rose-400 font-bold">*</span>
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button (Brand Gold Pill Button with Navy Text) */}
            <div className="gsap-action pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] font-cta font-extrabold text-sm uppercase tracking-wider transition shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-60"
              >
                {loading
                  ? 'Processando...'
                  : mode === 'recovery'
                    ? 'Salvar Nova Senha'
                    : mode === 'login'
                      ? 'Entrar'
                      : 'Criar conta'}
              </button>
            </div>
          </form>

          {/* Bottom Switch Link (Sign up only) */}
          {mode === 'signup' && (
            <div className="gsap-action pt-2 border-t border-white/15 text-xs font-sans text-slate-300">
              Já possui uma conta?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className="font-cta font-bold text-[#D4AF37] hover:underline cursor-pointer"
              >
                Entre aqui
              </button>
            </div>
          )}

          {/* Bottom Switch Link for Login */}
          {mode === 'login' && (
            <div className="gsap-action pt-2 border-t border-white/15 text-xs font-sans text-slate-300">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className="font-cta font-bold text-[#D4AF37] hover:underline cursor-pointer"
              >
                Crie uma conta aqui
              </button>
            </div>
          )}

          {/* Return link to homepage */}
          <div className="gsap-action pt-1 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-cta font-bold text-slate-300 hover:text-white transition cursor-pointer"
            >
              ← Voltar para a Página Principal
            </button>
          </div>

        </div>

      </div>

      {/* Email Confirmation Instructions Modal */}
      {showEmailConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6 relative animate-in zoom-in-95 duration-200">
            
            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#002B49]">
                Verifique seu E-mail
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-600 leading-relaxed max-w-md mx-auto">
                Enviamos uma mensagem de ativação segura para:
                <br />
                <strong className="text-[#002B49] font-bold text-sm sm:text-base break-all">{formData.email}</strong>
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowEmailConfirmModal(false)
                  navigate('/login')
                }}
                className="w-full py-3.5 px-6 rounded-full bg-transparent hover:bg-[#D4AF37] text-[#002B49] border-2 border-[#D4AF37] font-cta font-bold text-xs uppercase tracking-wider transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                Já entendi, ir para o Login ❯
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
