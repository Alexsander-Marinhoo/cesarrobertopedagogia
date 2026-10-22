import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * SERVIÇO DE INTEGRAÇÃO SUPABASE - PORTAL DO ALUNO / PACIENTE & ESCOLA
 * Módulos 1, 2, 3 e 4 com suporte a RLS e Storage
 */

// ----------------------------------------------------------------------------
// 1. CARREGAMENTO DE DADOS DO PACIENTE / ALUNO (B2C & AVA)
// ----------------------------------------------------------------------------
export async function fetchPatientPortalData(userId) {
  if (!isSupabaseConfigured || !userId) {
    return { isLive: false, laudos: [], agendamentos: [], matriculas: [], cursos: [] }
  }

  try {
    // 1.1 Busca Laudos e Prontuários Clínicos visíveis
    const { data: laudosData, error: laudosError } = await supabase
      .from('prontuarios')
      .select('*')
      .eq('paciente_id', userId)
      .eq('visivel_para_paciente', true)
      .order('data_sessao', { ascending: false })

    // 1.2 Busca Agendamentos e Histórico de Sessões
    const { data: agendamentosData, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('usuario_id', userId)
      .order('data_hora', { ascending: true })

    // 1.3 Busca Catálogo de Cursos
    const { data: cursosData } = await supabase
      .from('cursos')
      .select('*')
      .order('criado_em', { ascending: true })

    const cursosMap = (cursosData || []).reduce((acc, c) => {
      acc[c.id] = c
      return acc
    }, {})

    // 1.4 Busca Matrículas nos Cursos para o Usuário
    const { data: matriculasData, error: matriculasError } = await supabase
      .from('matriculas')
      .select('*')
      .eq('usuario_id', userId)

    const matriculasFormatadas = (matriculasData || []).map((m) => ({
      ...m,
      curso: m.curso || cursosMap[m.curso_id] || {}
    }))

    return {
      isLive: true,
      laudos: laudosError ? [] : (laudosData || []),
      agendamentos: agendamentosError ? [] : (agendamentosData || []),
      matriculas: matriculasError ? [] : matriculasFormatadas,
      cursos: cursosData || []
    }
  } catch (err) {
    console.warn('Aviso ao carregar dados do Supabase:', err)
    return { isLive: false, laudos: [], agendamentos: [], matriculas: [], cursos: [] }
  }
}

// ----------------------------------------------------------------------------
// 2. CARREGAMENTO DE DADOS DO PORTAL ESCOLAS CONVENIADAS (B2B)
// ----------------------------------------------------------------------------
export async function fetchSchoolPortalData(schoolUserId) {
  if (!isSupabaseConfigured || !schoolUserId) {
    return { isLive: false, relatorios: [], agendamentos: [], matriculas: [], cursos: [] }
  }

  try {
    // 2.1 Busca Relatórios Pedagógicos e PDIs vinculados à escola
    const { data: relatoriosData, error: relatoriosError } = await supabase
      .from('relatorios_escolares')
      .select('*')
      .eq('escola_id', schoolUserId)
      .order('criado_em', { ascending: false })

    // 2.2 Busca Reuniões Institucionais
    const { data: agendamentosData, error: agendamentosError } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('usuario_id', schoolUserId)
      .order('data_hora', { ascending: true })

    // 2.3 Busca Catálogo de Cursos para Docentes
    const { data: cursosData } = await supabase
      .from('cursos')
      .select('*')
      .order('criado_em', { ascending: true })

    const cursosMap = (cursosData || []).reduce((acc, c) => {
      acc[c.id] = c
      return acc
    }, {})

    // 2.4 Busca Matrículas nos Cursos para a Escola / Docente
    const { data: matriculasData, error: matriculasError } = await supabase
      .from('matriculas')
      .select('*')
      .eq('usuario_id', schoolUserId)

    const matriculasFormatadas = (matriculasData || []).map((m) => ({
      ...m,
      curso: m.curso || cursosMap[m.curso_id] || {}
    }))

    return {
      isLive: true,
      relatorios: relatoriosError ? [] : (relatoriosData || []),
      agendamentos: agendamentosError ? [] : (agendamentosData || []),
      matriculas: matriculasError ? [] : matriculasFormatadas,
      cursos: cursosData || []
    }
  } catch (err) {
    console.warn('Aviso ao carregar dados da Escola no Supabase:', err)
    return { isLive: false, relatorios: [], agendamentos: [], matriculas: [], cursos: [] }
  }
}

// ----------------------------------------------------------------------------
// 3. MÓDULOS E AULAS DE UM CURSO ESPECÍFICO (AVA)
// ----------------------------------------------------------------------------
export async function fetchCourseModulesAndLessons(cursoId) {
  if (!isSupabaseConfigured || !cursoId) return []

  try {
    const { data: modulos, error } = await supabase
      .from('modulos_curso')
      .select(`
        id,
        titulo,
        ordem,
        aulas:aulas_curso (
          id,
          titulo,
          duracao,
          video_url,
          pdf_apoio_url,
          ordem
        )
      `)
      .eq('curso_id', cursoId)
      .order('ordem', { ascending: true })

    if (error) throw error
    return modulos || []
  } catch {
    return []
  }
}

/**
 * Matérias e conteúdos (vídeo / PDF / texto) de um curso, exatamente como gravados no painel admin.
 * Formato: [{ id, titulo, descricao, conteudos: [{ tipo, titulo, video_url, pdf_apoio_url, ... }] }]
 */
export async function fetchCursoMaterias(cursoId) {
  if (!isSupabaseConfigured || !cursoId) return []

  const { data, error } = await supabase
    .from('modulos_curso')
    .select(`
      id, titulo, descricao, ordem,
      conteudos:aulas_curso ( id, titulo, tipo, video_url, pdf_apoio_url, arquivo_nome, conteudo_texto, link_prova, duracao, ordem )
    `)
    .eq('curso_id', cursoId)
    .order('ordem', { ascending: true })

  if (error) throw error

  return (data || []).map((m) => ({
    ...m,
    conteudos: (m.conteudos || [])
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .map((c) => ({
        ...c,
        tipo: c.tipo || (c.link_prova ? 'PROVA' : c.video_url ? 'VIDEO' : c.pdf_apoio_url ? 'PDF' : 'TEXTO'),
        link_prova: c.link_prova || (c.tipo === 'PROVA' ? c.video_url : '')
      }))
  }))
}

/** Total de conteúdos de cada curso informado: { [cursoId]: number } */
export async function fetchCursosTotalConteudos(cursoIds = []) {
  const ids = [...new Set(cursoIds.filter(Boolean))]
  if (!isSupabaseConfigured || ids.length === 0) return {}

  try {
    const { data, error } = await supabase
      .from('modulos_curso')
      .select('curso_id, aulas:aulas_curso ( id )')
      .in('curso_id', ids)

    if (error) throw error

    return (data || []).reduce((acc, m) => {
      acc[m.curso_id] = (acc[m.curso_id] || 0) + (m.aulas?.length || 0)
      return acc
    }, {})
  } catch (err) {
    console.warn('Aviso ao contar conteúdos dos cursos:', err)
    return {}
  }
}

// ----------------------------------------------------------------------------
// 4. ATUALIZAR PROGRESSO DE CURSO DO ALUNO
// ----------------------------------------------------------------------------
export async function updateCourseProgress(userId, cursoId, newProgress) {
  if (!isSupabaseConfigured || !userId || !cursoId) return null

  try {
    const certificadoEmitido = newProgress >= 100
    const codigoCertificado = certificadoEmitido ? `CERT-${new Date().getFullYear()}-CR-${Math.floor(1000 + Math.random() * 9000)}` : null

    const { data, error } = await supabase
      .from('matriculas')
      .update({
        progresso: newProgress,
        certificado_emitido: certificadoEmitido,
        codigo_certificado: codigoCertificado,
        data_conclusao: certificadoEmitido ? new Date().toISOString() : null
      })
      .eq('usuario_id', userId)
      .eq('curso_id', cursoId)
      .select()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Erro ao atualizar progresso:', err)
    return null
  }
}

// ----------------------------------------------------------------------------
// 5. SOLICITAR NOVO AGENDAMENTO / SESSÃO
// ----------------------------------------------------------------------------
export async function createAppointmentRequest(userId, { modalidade, servico, data_hora, observacoes }) {
  if (!isSupabaseConfigured || !userId) return null

  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([
        {
          usuario_id: userId,
          modalidade: modalidade || 'PRESENCIAL',
          servico: servico || 'Sessão de Intervenção Neuropsicopedagógica',
          data_hora: data_hora || new Date().toISOString(),
          status: 'PENDENTE',
          observacoes: observacoes || ''
        }
      ])
      .select()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Erro ao registrar agendamento no Supabase:', err)
    return null
  }
}

// ----------------------------------------------------------------------------
// 6. GERAÇÃO DE LINK SEGURO (SIGNED URL) NO STORAGE PARA DOWNLOAD
// ----------------------------------------------------------------------------
export async function getSecureDownloadUrl(bucketName, filePath) {
  if (!isSupabaseConfigured || !bucketName || !filePath) return null
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath

  try {
    // 1. Tenta gerar URL assinada no bucket especificado
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600) // Válido por 1 hora

    if (!error && data?.signedUrl) return data.signedUrl

    // 2. Fallback de interoperabilidade entre 'laudos' e 'laudos-privados'
    const fallbackBucket = bucketName === 'laudos-privados' ? 'laudos' : bucketName === 'laudos' ? 'laudos-privados' : null
    if (fallbackBucket) {
      const { data: fbData, error: fbError } = await supabase.storage
        .from(fallbackBucket)
        .createSignedUrl(filePath, 3600)

      if (!fbError && fbData?.signedUrl) return fbData.signedUrl
    }

    // 3. Fallback para URL pública caso o bucket seja público
    const { data: pubData } = supabase.storage.from(bucketName).getPublicUrl(filePath)
    if (pubData?.publicUrl) return pubData.publicUrl

    return null
  } catch (err) {
    console.warn('Erro ao gerar URL do arquivo no storage:', err)
    return null
  }
}

// ----------------------------------------------------------------------------
// 7. CATÁLOGO PÚBLICO DE CURSOS E AVA (VITRINE HOMEPAGE)
// ----------------------------------------------------------------------------
export async function fetchPublicCourses() {
  if (!isSupabaseConfigured) return []

  try {
    const { data: cursos, error } = await supabase
      .from('cursos')
      .select(`
        id,
        slug,
        titulo,
        descricao,
        preco,
        carga_horaria,
        certificado_info,
        thumbnail_url,
        miniatura_url,
        ativo,
        data_inicio,
        criado_em,
        modulos:modulos_curso (
          id,
          titulo,
          ordem,
          aulas:aulas_curso (
            id,
            titulo,
            duracao,
            ordem,
            tipo,
            video_url,
            pdf_apoio_url,
            arquivo_nome,
            conteudo_texto
          )
        )
      `)
      .eq('ativo', true)
      .order('criado_em', { ascending: true })

    if (error) throw error

    return (cursos || []).map((c) => ({
      ...c,
      thumbnail_url: c.thumbnail_url || c.miniatura_url,
      modulos: (c.modulos || []).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
    }))
  } catch (err) {
    console.warn('Aviso ao buscar cursos públicos no Supabase:', err)
    return []
  }
}

// ----------------------------------------------------------------------------
// 8. REGISTRO DE AGENDAMENTO NO SUPABASE (HOMEPAGE & PORTAIS)
// ----------------------------------------------------------------------------
export async function submitBookingToSupabase({
  name,
  phone,
  email,
  service,
  serviceName,
  modality,
  date,
  timeSlot,
  notes,
  userId
}) {
  if (!isSupabaseConfigured) return { success: true, isDemo: true }

  try {
    let targetUserId = userId

    // Se o usuário não está autenticado, tenta encontrar por email ou telefone na tabela usuarios
    if (!targetUserId) {
      if (email) {
        const { data: userByEmail } = await supabase
          .from('usuarios')
          .select('id')
          .eq('email', email)
          .maybeSingle()
        if (userByEmail?.id) targetUserId = userByEmail.id
      }

      if (!targetUserId && phone) {
        const rawPhone = phone.replace(/\D/g, '')
        const { data: userByPhone } = await supabase
          .from('usuarios')
          .select('id, telefone')
          .ilike('telefone', `%${rawPhone.slice(-8)}%`)
          .maybeSingle()
        if (userByPhone?.id) targetUserId = userByPhone.id
      }

      // Se ainda não encontrou, busca qualquer usuário cadastrado para manter a FK válida
      if (!targetUserId) {
        const { data: anyUser } = await supabase
          .from('usuarios')
          .select('id')
          .limit(1)
          .maybeSingle()
        if (anyUser?.id) targetUserId = anyUser.id
      }
    }

    if (!targetUserId) {
      return { success: false, error: 'Nenhum usuário de referência disponível.' }
    }

    // Calcula data_hora combinada
    const timeMatch = timeSlot ? timeSlot.match(/(\d{2}):(\d{2})/) : null
    let finalDateTimeISO
    if (date && timeMatch) {
      finalDateTimeISO = new Date(`${date}T${timeMatch[1]}:${timeMatch[2]}:00`).toISOString()
    } else if (date) {
      finalDateTimeISO = new Date(`${date}T09:00:00`).toISOString()
    } else {
      finalDateTimeISO = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('agendamentos')
      .insert([
        {
          usuario_id: targetUserId,
          modalidade: modality?.toLowerCase() === 'online' ? 'ONLINE' : 'PRESENCIAL',
          servico: serviceName || service || 'Atendimento Psicopedagógico / Consultoria',
          data_hora: finalDateTimeISO,
          periodo_preferencia: timeSlot || '09:00',
          status: 'PENDENTE',
          observacoes: `Solicitante: ${name} | WhatsApp: ${phone}${email ? ' | E-mail: ' + email : ''}${notes ? ' | Observações: ' + notes : ''}`
        }
      ])
      .select()

    if (error) throw error

    return { success: true, data: data?.[0] }
  } catch (err) {
    console.error('Erro ao salvar agendamento no Supabase:', err)
    return { success: false, error: err.message }
  }
}

// ----------------------------------------------------------------------------
// 9. BUSCA DE HORÁRIOS JÁ AGENDADOS PARA UMA DATA (EVITAR DUPLICIDADE)
// ----------------------------------------------------------------------------
export async function fetchBookedSlotsForDate(dateStr) {
  if (!isSupabaseConfigured || !dateStr || typeof dateStr !== 'string' || dateStr.length < 10) return []

  try {
    const parts = dateStr.split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) return []

    const [year, month, day] = parts
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString()
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString()

    const { data, error } = await supabase
      .from('agendamentos')
      .select('data_hora, periodo_preferencia, status')
      .gte('data_hora', startOfDay)
      .lte('data_hora', endOfDay)
      .neq('status', 'CANCELADO')

    if (error) throw error

    const booked = (data || []).map((ag) => {
      // 1. Se periodo_preferencia tem horário (ex: '14:00')
      if (ag.periodo_preferencia) {
        const match = ag.periodo_preferencia.match(/(\d{2}:\d{2})/)
        if (match) return match[1]
      }
      // 2. Extrai da data_hora
      if (ag.data_hora) {
        const d = new Date(ag.data_hora)
        if (!isNaN(d.getTime())) {
          const hour = String(d.getHours()).padStart(2, '0')
          const minute = String(d.getMinutes()).padStart(2, '0')
          return `${hour}:${minute}`
        }
      }
      return null
    }).filter(Boolean)

    return [...new Set(booked)]
  } catch (err) {
    console.warn('Aviso ao buscar horários ocupados no Supabase:', err)
    return []
  }
}

// ----------------------------------------------------------------------------
// 10. CANCELAR AGENDAMENTO (PORTAL PACIENTE & ESCOLA)
// ----------------------------------------------------------------------------
export async function cancelUserAppointment(appointmentId) {
  if (!isSupabaseConfigured || !appointmentId) return false

  try {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: 'CANCELADO' })
      .eq('id', appointmentId)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Erro ao cancelar agendamento:', err)
    return false
  }
}

// ----------------------------------------------------------------------------
// 11. REMOÇÃO DE AVATARES ANTIGOS (ECONOMIA DE ARMAZENAMENTO NO SUPABASE STORAGE)
// ----------------------------------------------------------------------------
export async function deleteUserOldAvatars(userId) {
  if (!isSupabaseConfigured || !userId) return false

  try {
    // Lista todos os arquivos existentes dentro do diretório do usuário no bucket 'avatars'
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(userId)

    if (listError) {
      console.warn('Aviso ao listar arquivos anteriores de avatar:', listError)
      return false
    }

    if (files && files.length > 0) {
      // Filtra arquivos válidos excluindo placeholders de sistema
      const pathsToDelete = files
        .filter((f) => f.name && f.name !== '.emptyFolderPlaceholder')
        .map((f) => `${userId}/${f.name}`)

      if (pathsToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove(pathsToDelete)

        if (deleteError) {
          console.warn('Aviso ao remover avatares antigos:', deleteError)
          return false
        }
      }
    }
    return true
  } catch (err) {
    console.warn('Erro ao limpar fotos de perfil antigas:', err)
    return false
  }
}

// ----------------------------------------------------------------------------
// 12. UPLOAD DE FOTO DE PERFIL / AVATAR (SUPABASE STORAGE: BUCKET AVATARS)
// ----------------------------------------------------------------------------
export async function uploadUserAvatar(userId, file) {
  if (!isSupabaseConfigured || !userId || !file) {
    throw new Error('Supabase ou usuário não inicializado para upload.')
  }

  // 1. Validação de tamanho (máximo 2MB)
  const maxBytes = 2 * 1024 * 1024
  if (file.size > maxBytes) {
    throw new Error('A imagem selecionada excede o limite máximo permitido de 2MB.')
  }

  // 2. Validação de formato (MIME type)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Formato de arquivo inválido. Envie uma imagem JPG, PNG, WEBP ou GIF.')
  }

  // 3. Limpa todas as fotos antigas deste usuário no Storage antes de enviar a nova (Economia de espaço)
  await deleteUserOldAvatars(userId)

  // 4. Monta o caminho único seguro com o ID do usuário como pasta raiz
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filePath = `${userId}/avatar-${Date.now()}.${ext}`

  try {
    // 5. Envia o arquivo para o bucket 'avatars'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      })

    if (uploadError) throw uploadError

    // 6. Gera a URL pública do avatar
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path)

    const publicUrl = urlData?.publicUrl || null
    if (!publicUrl) {
      throw new Error('Não foi possível gerar a URL pública da foto de perfil.')
    }

    return publicUrl
  } catch (err) {
    console.error('Erro ao enviar foto para o bucket avatars:', err)
    throw err
  }
}


