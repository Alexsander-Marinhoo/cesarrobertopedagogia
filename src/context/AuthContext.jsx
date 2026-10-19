import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  // Carrega perfil adicional do usuário na tabela public.usuarios
  const fetchUserProfile = async (userId, userMetadata = {}) => {
    if (!isSupabaseConfigured) {
      return {
        id: userId,
        nome_completo: userMetadata.nome_completo || 'Usuário Demo',
        email: userMetadata.email || 'demo@cesarlooureiropedagogo.com.br',
        tipo_usuario: userMetadata.tipo_usuario || 'PACIENTE',
        instituicao_nome: userMetadata.instituicao_nome || ''
      }
    }

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Fallback usando os metadados do auth
        return {
          id: userId,
          nome_completo: userMetadata.nome_completo || 'Usuário',
          email: userMetadata.email,
          tipo_usuario: userMetadata.tipo_usuario || 'PACIENTE',
          instituicao_nome: userMetadata.instituicao_nome || '',
          avatar_url: userMetadata.avatar_url || '',
          telefone: userMetadata.telefone || ''
        }
      }
      return {
        ...data,
        avatar_url: data?.avatar_url || userMetadata.avatar_url || ''
      }
    } catch {
      return {
        id: userId,
        nome_completo: userMetadata.nome_completo || 'Usuário',
        email: userMetadata.email,
        tipo_usuario: userMetadata.tipo_usuario || 'PACIENTE',
        instituicao_nome: userMetadata.instituicao_nome || '',
        avatar_url: userMetadata.avatar_url || '',
        telefone: userMetadata.telefone || ''
      }
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return

    // Obtém sessão inicial
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession)
      setUser(currentSession?.user ?? null)
      if (currentSession?.user) {
        const userProf = await fetchUserProfile(currentSession.user.id, currentSession.user.user_metadata)
        setProfile(userProf)
      }
      setLoading(false)
    })

    // Ouve alterações de autenticação (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        if (newSession?.user) {
          const userProf = await fetchUserProfile(newSession.user.id, newSession.user.user_metadata)
          setProfile(userProf)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Login com E-mail e Senha
  const signInWithPassword = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase ainda não configurado no arquivo .env. Configure suas chaves para autenticação em tempo real.')
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    if (data?.user) {
      const userProf = await fetchUserProfile(data.user.id, data.user.user_metadata)
      setProfile(userProf)
      return { ...data, profile: userProf }
    }
    return data
  }

  // Cadastro de Novo Usuário (com tipo de perfil e metadados)
  const signUp = async (email, password, metadata = {}) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase ainda não configurado no arquivo .env. Configure suas chaves para criar novas contas.')
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          nome_completo: metadata.nome_completo,
          telefone: metadata.telefone,
          tipo_usuario: metadata.tipo_usuario || 'PACIENTE',
          instituicao_nome: metadata.instituicao_nome || '',
          documento: metadata.documento || ''
        }
      }
    })
    if (error) throw error
    return data
  }

  // Login sem senha via Link Mágico (Magic Link no e-mail)
  const signInWithMagicLink = async (email) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase ainda não configurado no arquivo .env.')
    }
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    })
    if (error) throw error
    return data
  }

  // Recuperação de Senha
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase ainda não configurado no arquivo .env.')
    }
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`
    })
    if (error) throw error
    return data
  }

  // Logout
  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut()
      }
    } catch {
      // Ignora erro de rede no logout
    } finally {
      setUser(null)
      setSession(null)
      setProfile(null)
    }
  }

  // Atualização de Perfil (Nome, Telefone, Foto, Idade, Metadados)
  const updateUserProfile = async (updates) => {
    // Sanitização de segurança: impede alteração indevida de campos críticos pelo cliente
    const { id: _id, tipo_usuario: _tipo, email: _email, criado_em: _criado, ...safeUpdates } = updates || {}

    if (isSupabaseConfigured && user) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          data: safeUpdates
        })
        if (error) throw error

        try {
          await supabase
            .from('usuarios')
            .update(safeUpdates)
            .eq('id', user.id)
        } catch (dbErr) {
          console.warn('Aviso ao atualizar tabela usuarios no Supabase:', dbErr)
        }

        setProfile((prev) => ({ ...prev, ...safeUpdates }))
        setUser((prev) => prev ? {
          ...prev,
          user_metadata: { ...prev.user_metadata, ...safeUpdates }
        } : null)

        return data
      } catch (err) {
        console.warn('Aviso ao atualizar metadados de autenticação:', err)
        setProfile((prev) => ({ ...prev, ...safeUpdates }))
        setUser((prev) => prev ? {
          ...prev,
          user_metadata: { ...prev.user_metadata, ...safeUpdates }
        } : null)
      }
    } else {
      setProfile((prev) => ({ ...prev, ...safeUpdates }))
      setUser((prev) => prev ? {
        ...prev,
        user_metadata: { ...prev.user_metadata, ...safeUpdates }
      } : null)
    }
  }

  // Atualização de Senha
  const updateUserPassword = async (newPassword) => {
    if (isSupabaseConfigured && user) {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
      return data
    }
    return true
  }

  // Modo Demonstração (Permite testar instantaneamente os 4 perfis de usuário)
  const loginWithDemo = (tipo_usuario = 'PACIENTE') => {
    const demoProfiles = {
      PACIENTE: {
        id: 'demo-paciente-id',
        nome_completo: 'Mariana Silveira (Mãe do Lucas)',
        email: 'mariana.silveira@exemplo.com',
        telefone: '(32) 99988-1122',
        tipo_usuario: 'PACIENTE',
        instituicao_nome: ''
      },
      ESCOLA: {
        id: 'demo-escola-id',
        nome_completo: 'Profª Cláudia Mendes',
        email: 'coordenacao@colegioprimeirospassos.com.br',
        telefone: '(32) 3444-1234',
        tipo_usuario: 'ESCOLA',
        instituicao_nome: 'Colégio Primeiros Passos'
      },
      ALUNO: {
        id: 'demo-aluno-id',
        nome_completo: 'Prof. Rafael Albuquerque',
        email: 'rafael.docente@educacao.mg.gov.br',
        telefone: '(32) 98877-3344',
        tipo_usuario: 'ALUNO',
        instituicao_nome: 'Rede Estadual de Ensino'
      },
      ADMIN: {
        id: 'demo-admin-id',
        nome_completo: 'Prof. Cesar Roberto de Sousa Loureiro',
        email: 'cesar@cesarloureiro.com.br',
        telefone: '(32) 98725-2421',
        tipo_usuario: 'ADMIN',
        instituicao_nome: 'Consultório Neuropsicopedagógico'
      }
    }

    const selectedProfile = demoProfiles[tipo_usuario] || demoProfiles.PACIENTE
    setUser({ id: selectedProfile.id, email: selectedProfile.email })
    setProfile(selectedProfile)
    setSession({ access_token: 'demo-token', user: { id: selectedProfile.id } })
  }

  const value = {
    user,
    session,
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
    signInWithPassword,
    signUp,
    signInWithMagicLink,
    resetPassword,
    updateUserProfile,
    updateUserPassword,
    signOut,
    loginWithDemo
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
