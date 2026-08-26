import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  User,
  Phone,
  Calendar,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Save,
  GraduationCap,
  Users,
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  UploadCloud,
  Check,
  Trash2,
  Mail,
  BookOpen
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getUserDisplayName } from '../../utils/userDisplay'
import { uploadUserAvatar, deleteUserOldAvatars } from '../../services/portalService'
import { formatPhoneNumber } from '../../utils/phoneFormatter'

export default function ProfileSettingsModal({ isOpen, onClose, onLogout }) {
  const navigate = useNavigate()
  const { user, profile, updateUserProfile, updateUserPassword, signOut } = useAuth()
  const { displayName, initial, fullName } = getUserDisplayName(profile, user)

  const isSchool = profile?.tipo_usuario === 'ESCOLA'
  const [activeSubTab, setActiveSubTab] = useState('dados') // 'dados' | 'detalhes' | 'seguranca'
  const [loading, setLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null)
  const [removeAvatarPending, setRemoveAvatarPending] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    nome_completo: profile?.nome_completo || user?.user_metadata?.nome_completo || '',
    telefone: formatPhoneNumber(profile?.telefone || user?.user_metadata?.telefone || ''),
    instituicao_nome: profile?.instituicao_nome || user?.user_metadata?.instituicao_nome || '',
    idade: profile?.idade || user?.user_metadata?.idade || '',
    data_nascimento: profile?.data_nascimento || user?.user_metadata?.data_nascimento || '',
    serie_escolar: profile?.serie_escolar || user?.user_metadata?.serie_escolar || '',
    nome_responsavel: profile?.nome_responsavel || user?.user_metadata?.nome_responsavel || '',
    parentesco: profile?.parentesco || user?.user_metadata?.parentesco || '',
    avatar_url: profile?.avatar_url || user?.user_metadata?.avatar_url || ''
  })

  // Password State
  const [passData, setPassData] = useState({
    novaSenha: '',
    confirmarSenha: ''
  })
  const [showPass, setShowPass] = useState(false)

  // Avaliação de Força de Senha e Requisitos Específicos (Idêntico ao Cadastro)
  const passwordStrength = useMemo(() => {
    const pass = passData.novaSenha || ''
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
  }, [passData.novaSenha])

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const formattedValue = name === 'telefone' ? formatPhoneNumber(value) : value
    setFormData((prev) => ({ ...prev, [name]: formattedValue }))
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação de tamanho (máx 2MB)
    const maxBytes = 2 * 1024 * 1024
    if (file.size > maxBytes) {
      setErrorMsg('A imagem selecionada excede o limite máximo permitido de 2MB.')
      return
    }

    // Validação de formato (MIME)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Formato inválido. Por favor, selecione uma imagem JPG, PNG, WEBP ou GIF.')
      return
    }

    setErrorMsg('')
    setSelectedPhotoFile(file)
    setRemoveAvatarPending(false)

    // Gera pré-visualização instantânea local
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatar_url: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setSelectedPhotoFile(null)
    setFormData((prev) => ({ ...prev, avatar_url: '' }))
    setRemoveAvatarPending(true)
    setErrorMsg('')
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (!formData.nome_completo.trim()) {
        throw new Error('O nome completo não pode ficar em branco.')
      }

      let finalAvatarUrl = formData.avatar_url

      // Se o usuário solicitou remover a foto existente
      if (removeAvatarPending && user?.id) {
        await deleteUserOldAvatars(user.id)
        finalAvatarUrl = ''
      }
      // Se houver um novo arquivo selecionado, faz o upload para o bucket 'avatars' (limpando antigas automaticamente)
      else if (selectedPhotoFile && user?.id) {
        setUploadingPhoto(true)
        try {
          finalAvatarUrl = await uploadUserAvatar(user.id, selectedPhotoFile)
        } catch (uploadErr) {
          console.warn('Aviso no upload da foto para o Storage:', uploadErr)
          throw new Error(uploadErr.message || 'Erro ao enviar foto para o Storage. Verifique sua conexão.')
        } finally {
          setUploadingPhoto(false)
        }
      }

      await updateUserProfile({
        nome_completo: formData.nome_completo.trim(),
        telefone: formData.telefone.trim(),
        instituicao_nome: formData.instituicao_nome.trim(),
        idade: formData.idade.trim(),
        data_nascimento: formData.data_nascimento,
        serie_escolar: formData.serie_escolar.trim(),
        nome_responsavel: formData.nome_responsavel.trim(),
        parentesco: formData.parentesco.trim(),
        avatar_url: finalAvatarUrl
      })

      setFormData((prev) => ({ ...prev, avatar_url: finalAvatarUrl }))
      setSelectedPhotoFile(null)
      setRemoveAvatarPending(false)
      setSuccessMsg('Informações de perfil e foto atualizadas com sucesso!')
      setTimeout(() => {
        setSuccessMsg('')
      }, 3500)
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar alterações.')
    } finally {
      setLoading(false)
      setUploadingPhoto(false)
    }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (!passData.novaSenha) {
        throw new Error('Por favor, informe a nova senha.')
      }
      if (!passwordStrength.isComplete) {
        throw new Error('A nova senha deve atender a todos os requisitos de segurança abaixo.')
      }
      if (passData.novaSenha !== passData.confirmarSenha) {
        throw new Error('As senhas digitadas não coincidem.')
      }

      await updateUserPassword(passData.novaSenha)
      setSuccessMsg('Senha de acesso atualizada com sucesso!')
      setPassData({ novaSenha: '', confirmarSenha: '' })
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao atualizar a senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#00182A]/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#002B49] rounded-[28px] sm:rounded-[36px] shadow-2xl border-2 border-[#002B49] text-white overflow-hidden flex flex-col max-h-[92dvh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ========================================================================= */}
        {/* HEADER SUPERIOR: PADRÃO CLÍNICO NAVY COM HERO DE IDENTIDADE */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 bg-[#002B49] text-white relative border-b border-white/15">
          
          {/* Top Eyebrow & Close Button */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="text-xs font-cta font-bold uppercase tracking-wider text-[#D4AF37]">
              <span>{isSchool ? 'Portal Institucional & Escola' : 'Portal do Aluno & Família'}</span>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Fechar modal"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* User Identity Hero */}
          <div className="flex items-center gap-3 sm:gap-4.5">
            
            {/* Interactive Avatar Container */}
            <div className="relative group shrink-0">
              <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-[#D4AF37] text-[#002B49] font-serif font-extrabold text-xl sm:text-2xl flex items-center justify-center overflow-hidden shadow-lg border-2 border-[#D4AF37]/70 ring-2 sm:ring-4 ring-white/10">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : isSchool ? (
                  <Building2 className="w-7 h-7 text-[#002B49]" />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              {/* Camera Trigger Badge */}
              <label
                htmlFor="header-photo-upload"
                className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#002B49] hover:bg-[#073B63] text-[#D4AF37] border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition transform hover:scale-110"
                title="Trocar foto de perfil"
              >
                <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </label>
              <input
                id="header-photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* Name, Email and Role Badge */}
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-serif font-extrabold text-base sm:text-xl text-white truncate">
                  {formData.nome_completo || fullName || displayName}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#002B49] border border-[#D4AF37] font-cta font-black text-[9px] sm:text-[10px] uppercase tracking-wider shadow-2xs">
                  {profile?.tipo_usuario || 'PACIENTE'}
                </span>
              </div>
              
              <p className="text-[11px] sm:text-xs font-sans text-slate-300 truncate">
                {user?.email || profile?.email}
              </p>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* SUB-ABAS DE NAVEGAÇÃO SEGMENTADA (ESTILO DASHBOARD PILL) */}
        {/* ========================================================================= */}
        <div className="px-3 sm:px-6 pt-2.5 pb-2 bg-[#001F35] border-b-2 border-white/20 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            <button
              type="button"
              onClick={() => setActiveSubTab('dados')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-cta font-bold transition flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                activeSubTab === 'dados'
                  ? 'bg-[#D4AF37] text-[#002B49] shadow-xs border-2 border-[#D4AF37] font-black'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 border-2 border-white/20'
              }`}
            >
              <User className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'dados' ? 'text-[#002B49]' : 'text-[#D4AF37]'}`} />
              <span className="hidden sm:inline">Dados de Contato</span>
              <span className="sm:hidden">Contato</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('detalhes')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-cta font-bold transition flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                activeSubTab === 'detalhes'
                  ? 'bg-[#D4AF37] text-[#002B49] shadow-xs border-2 border-[#D4AF37] font-black'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 border-2 border-white/20'
              }`}
            >
              {isSchool ? (
                <>
                  <Building2 className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'detalhes' ? 'text-[#002B49]' : 'text-[#D4AF37]'}`} />
                  <span className="hidden sm:inline">Dados da Instituição</span>
                  <span className="sm:hidden">Instituição</span>
                </>
              ) : (
                <>
                  <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'detalhes' ? 'text-[#002B49]' : 'text-[#D4AF37]'}`} />
                  <span className="hidden sm:inline">Informações do Aluno</span>
                  <span className="sm:hidden">Aluno</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('seguranca')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-cta font-bold transition flex items-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                activeSubTab === 'seguranca'
                  ? 'bg-[#D4AF37] text-[#002B49] shadow-xs border-2 border-[#D4AF37] font-black'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20 border-2 border-white/20'
              }`}
            >
              <Lock className={`w-3.5 h-3.5 shrink-0 ${activeSubTab === 'seguranca' ? 'text-[#002B49]' : 'text-[#D4AF37]'}`} />
              <span className="hidden sm:inline">Segurança &amp; Senha</span>
              <span className="sm:hidden">Segurança</span>
            </button>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* MENSAGENS DE STATUS (FEEDBACK TOAST) */}
        {/* ========================================================================= */}
        {(successMsg || errorMsg) && (
          <div className="px-4 sm:px-6 pt-3 animate-in fade-in">
            {successMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs font-sans flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-sans flex items-center gap-2 shadow-2xs">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CORPO DO FORMULÁRIO COM ROLAGEM SUAVE */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 flex-1 bg-[#002B49] text-white">

          {/* --------------------------------------------------------------------- */}
          {/* SUB-ABA 1: DADOS PESSOAIS & CONTATO */}
          {/* --------------------------------------------------------------------- */}
          {activeSubTab === 'dados' && (
            <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-3 sm:space-y-4">
              
              {/* Card 1: Foto e Identidade Visual (Design Slim e Elegante) */}
              <div className="p-3 sm:p-4 rounded-2xl bg-[#001F35] border-2 border-white/20 shadow-sm flex items-center justify-between gap-3 text-white">
                
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 border-2 border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Foto" className="w-full h-full object-cover" />
                    ) : isSchool ? (
                      <Building2 className="w-5 h-5 text-[#D4AF37]" />
                    ) : (
                      <span className="font-serif font-black text-sm text-[#D4AF37]">{initial}</span>
                    )}
                  </div>
                  
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-serif font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 flex-wrap">
                      <span>Foto de Perfil</span>
                      {selectedPhotoFile && (
                        <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500 text-emerald-300 font-sans font-semibold">
                          Pronta
                        </span>
                      )}
                      {removeAvatarPending && (
                        <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-rose-950 border border-rose-500 text-rose-300 font-sans font-semibold">
                          Remover ao salvar
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] font-sans text-slate-300 truncate">
                      JPG, PNG ou WEBP até 2MB
                    </p>
                  </div>
                </div>

                {/* Botões de Ação da Foto */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {(formData.avatar_url || selectedPhotoFile) && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Remover foto de perfil"
                      className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-2 border-rose-500 text-xs font-cta font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                      <span className="hidden sm:inline">Remover</span>
                    </button>
                  )}

                  <label
                    htmlFor="photo-upload-main"
                    className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] border-2 border-[#D4AF37] text-xs font-cta font-black transition flex items-center justify-center gap-1 cursor-pointer shadow-md"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{formData.avatar_url || selectedPhotoFile ? 'Trocar' : 'Escolher'}</span>
                  </label>
                  <input
                    id="photo-upload-main"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>

              </div>

              {/* Card 2: Campos de Informações Cadastrais */}
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#001F35] border-2 border-white/20 shadow-sm space-y-4 text-white">
                
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Nome Completo *</span>
                  </label>
                  <input
                    type="text"
                    name="nome_completo"
                    required
                    value={formData.nome_completo}
                    onChange={handleInputChange}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Telefone / WhatsApp</span>
                    </label>
                    <input
                      type="text"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      placeholder="Ex: (32) 99988-7766"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>E-mail Registrado (Fixo)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={user?.email || profile?.email || ''}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border-2 border-white/20 text-xs sm:text-sm font-sans text-white cursor-not-allowed font-semibold opacity-90 pr-10"
                      />
                      <Lock className="w-3.5 h-3.5 text-[#D4AF37] absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {isSchool && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Nome da Escola / Instituição de Ensino</span>
                    </label>
                    <input
                      type="text"
                      name="instituicao_nome"
                      value={formData.instituicao_nome}
                      onChange={handleInputChange}
                      placeholder="Ex: Colégio Primeiros Passos"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                    />
                  </div>
                )}

              </div>

            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* SUB-ABA 2: INFORMAÇÕES DO PACIENTE / ESCOLA */}
          {/* --------------------------------------------------------------------- */}
          {activeSubTab === 'detalhes' && (
            <form id="profile-form" onSubmit={handleSaveProfile} className="space-y-4">
              
              <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#001F35] border-2 border-white/20 shadow-sm space-y-4 text-white">
                
                {isSchool ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Nome Institucional da Escola</span>
                      </label>
                      <input
                        type="text"
                        name="instituicao_nome"
                        value={formData.instituicao_nome}
                        onChange={handleInputChange}
                        placeholder="Ex: Escola Municipal / Colégio Exemplo"
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Coordenação / Gestão Responsável</span>
                        </label>
                        <input
                          type="text"
                          name="nome_responsavel"
                          value={formData.nome_responsavel}
                          onChange={handleInputChange}
                          placeholder="Ex: Coordenação Pedagógica / Direção"
                          className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Segmentos Atendidos</span>
                        </label>
                        <input
                          type="text"
                          name="serie_escolar"
                          value={formData.serie_escolar}
                          onChange={handleInputChange}
                          placeholder="Ex: Ed. Infantil, Fundamental I e II"
                          className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#001524] text-xs sm:text-sm font-sans text-slate-200 flex items-start gap-3 border-2 border-white/20">
                      <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-medium">
                        Os dados institucionais são aplicados na emissão de pareceres escolares, relatórios de adequação da BNCC e certificação da equipe docente pelo <strong className="text-white">Prof. Cesar Roberto Loureiro</strong>.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Idade do Aluno / Paciente</span>
                        </label>
                        <input
                          type="text"
                          name="idade"
                          value={formData.idade}
                          onChange={handleInputChange}
                          placeholder="Ex: 9 anos ou 14 anos"
                          className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Série / Escolaridade</span>
                        </label>
                        <input
                          type="text"
                          name="serie_escolar"
                          value={formData.serie_escolar}
                          onChange={handleInputChange}
                          placeholder="Ex: 4º Ano do Ensino Fundamental"
                          className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Nome do Responsável Legal</span>
                        </label>
                        <input
                          type="text"
                          name="nome_responsavel"
                          value={formData.nome_responsavel}
                          onChange={handleInputChange}
                          placeholder="Ex: Mariana Silveira"
                          className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Grau de Parentesco</span>
                        </label>
                        <input
                          type="text"
                          name="parentesco"
                          value={formData.parentesco}
                          onChange={handleInputChange}
                          placeholder="Ex: Mãe / Pai / Responsável Legal"
                          className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#001524] text-xs sm:text-sm font-sans text-slate-200 flex items-start gap-3 border-2 border-white/20">
                      <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-medium">
                        Essas informações são estritamente confidenciais e protegidas pela LGPD, auxiliando o <strong className="text-white">Prof. Cesar Roberto</strong> na personalização das intervenções psicopedagógicas.
                      </p>
                    </div>
                  </>
                )}

              </div>

            </form>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* SUB-ABA 3: SEGURANÇA & ALTERAÇÃO DE SENHA */}
          {/* --------------------------------------------------------------------- */}
          {activeSubTab === 'seguranca' && (
            <form id="password-form" onSubmit={handleSavePassword} className="space-y-4">
              
              <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#001F35] border-2 border-white/20 shadow-sm space-y-4 text-white">
                
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Nova Senha</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={passData.novaSenha}
                      onChange={(e) => setPassData({ ...passData, novaSenha: e.target.value })}
                      placeholder="Digite a sua nova senha"
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#002B49] p-1 cursor-pointer transition"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Medidor de Força e Checklist de Requisitos de Senha */}
                {passData.novaSenha && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      {/* 4 Barras Segmentadas */}
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

                      {/* Rótulo de Status */}
                      <span className={`text-xs font-cta font-bold shrink-0 transition-colors ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Lista de Requisitos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs font-sans text-slate-300">
                      <div className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.length ? 'text-white font-bold' : ''}`}>
                        {passwordStrength.checks.length ? (
                          <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 stroke-[3]" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>Pelo menos 8 dígitos</span>
                      </div>

                      <div className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.upper ? 'text-white font-bold' : ''}`}>
                        {passwordStrength.checks.upper ? (
                          <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 stroke-[3]" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>1 letra maiúscula</span>
                      </div>

                      <div className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.lower ? 'text-white font-bold' : ''}`}>
                        {passwordStrength.checks.lower ? (
                          <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 stroke-[3]" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>1 letra minúscula</span>
                      </div>

                      <div className={`flex items-center gap-1.5 transition-colors ${passwordStrength.checks.num ? 'text-white font-bold' : ''}`}>
                        {passwordStrength.checks.num ? (
                          <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0 stroke-[3]" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>1 número</span>
                      </div>

                      <div className={`flex items-center gap-1.5 sm:col-span-2 transition-colors ${passwordStrength.checks.special ? 'text-white font-bold' : ''}`}>
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

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold uppercase tracking-wide text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Confirmar Nova Senha</span>
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={passData.confirmarSenha}
                    onChange={(e) => setPassData({ ...passData, confirmarSenha: e.target.value })}
                    placeholder="Repita a nova senha para confirmação"
                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:bg-white focus:border-[#D4AF37] focus:ring-3 focus:ring-[#D4AF37]/25 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-400 transition shadow-2xs"
                  />
                </div>

                <p className="text-xs font-sans text-slate-300 font-medium leading-relaxed pt-1">
                  A sua nova senha será atualizada instantaneamente com criptografia de ponta a ponta.
                </p>

              </div>

            </form>
          )}

        </div>

        {/* ========================================================================= */}
        {/* FOOTER FIXO ELEGANTE (AÇÕES PRIMÁRIAS E SECUNDÁRIAS) */}
        {/* ========================================================================= */}
        <div className="p-3.5 sm:p-5 px-4 sm:px-7 bg-[#001F35] border-t border-white/15 flex items-center justify-between gap-3 shrink-0">
          
          <button
            type="button"
            onClick={async () => {
              onClose()
              if (onLogout) {
                await onLogout()
              } else {
                try {
                  await signOut()
                } finally {
                  navigate('/', { replace: true })
                }
              }
            }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-rose-300 hover:text-rose-200 hover:bg-rose-950/50 border border-transparent hover:border-rose-500/50 text-xs font-cta font-bold transition cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Sair desta conta</span>
            <span className="sm:hidden">Sair</span>
          </button>

          {activeSubTab === 'seguranca' ? (
            <button
              type="submit"
              form="password-form"
              disabled={loading}
              className="px-5 sm:px-7 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] font-cta font-extrabold text-xs uppercase tracking-wider transition shadow-lg hover:shadow-xl inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-[#002B49]" />
              <span>{loading ? 'Salvando...' : 'Salvar Senha'}</span>
            </button>
          ) : (
            <button
              type="submit"
              form="profile-form"
              disabled={loading || uploadingPhoto}
              className="px-5 sm:px-7 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] font-cta font-extrabold text-xs uppercase tracking-wider transition shadow-lg hover:shadow-xl inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {uploadingPhoto ? (
                <>
                  <UploadCloud className="w-3.5 h-3.5 animate-bounce text-[#002B49]" />
                  <span className="hidden sm:inline">Enviando Foto...</span>
                  <span className="sm:hidden">Enviando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-[#002B49]" />
                  <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                </>
              )}
            </button>
          )}

        </div>

      </div>
    </div>
  )
}
