import { supabase, isSupabaseConfigured } from '../lib/supabase'

// ----------------------------------------------------------------------------
// 1. MÉTRICAS E VISÃO GERAL DO ADMIN
// ----------------------------------------------------------------------------
export async function fetchAdminDashboardStats() {
  if (!isSupabaseConfigured) {
    return {
      totalPacientes: 0,
      totalLaudos: 0,
      totalRelatoriosEscolares: 0,
      agendamentosPendentes: 0,
      totalMatriculas: 0,
      totalCursos: 0
    }
  }

  try {
    const [
      { count: totalPacientes },
      { count: totalLaudos },
      { count: totalRelatoriosEscolares },
      { count: agendamentosPendentes },
      { count: totalMatriculas },
      { count: totalCursos }
    ] = await Promise.all([
      supabase.from('usuarios').select('*', { count: 'exact', head: true }),
      supabase.from('prontuarios').select('*', { count: 'exact', head: true }),
      supabase.from('relatorios_escolares').select('*', { count: 'exact', head: true }),
      supabase.from('agendamentos').select('*', { count: 'exact', head: true }).eq('status', 'PENDENTE'),
      supabase.from('matriculas').select('*', { count: 'exact', head: true }),
      supabase.from('cursos').select('*', { count: 'exact', head: true }).eq('ativo', true)
    ])

    return {
      totalPacientes: totalPacientes || 0,
      totalLaudos: totalLaudos || 0,
      totalRelatoriosEscolares: totalRelatoriosEscolares || 0,
      agendamentosPendentes: agendamentosPendentes || 0,
      totalMatriculas: totalMatriculas || 0,
      totalCursos: totalCursos || 0
    }
  } catch (err) {
    console.error('Erro ao buscar estatísticas do admin:', err)
    return {
      totalPacientes: 0,
      totalLaudos: 0,
      totalRelatoriosEscolares: 0,
      agendamentosPendentes: 0,
      totalMatriculas: 0,
      totalCursos: 0
    }
  }
}

// ----------------------------------------------------------------------------
// 2. GESTÃO DE USUÁRIOS & PACIENTES
// ----------------------------------------------------------------------------
export async function fetchAdminUsers() {
  if (!isSupabaseConfigured) return []

  try {
    // 1. Busca via RPC administrativa segura (sincroniza auth.users e contorna limitações de RLS)
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_usuarios')
    if (!rpcError && Array.isArray(rpcData)) {
      return rpcData
    }

    // 2. Fallback para consulta direta na tabela usuarios
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Erro ao buscar usuários no admin:', err)
    return []
  }
}

// ----------------------------------------------------------------------------
// 3. GESTÃO DE PRONTUÁRIOS E EMISSÃO DE LAUDOS
// ----------------------------------------------------------------------------
export async function fetchAdminProntuarios() {
  if (!isSupabaseConfigured) return []

  try {
    const { data: prontuarios, error } = await supabase
      .from('prontuarios')
      .select('*')
      .order('data_sessao', { ascending: false })

    if (error) throw error

    // Busca usuários para enriquecer a lista com nomes
    const { data: users } = await supabase.from('usuarios').select('id, nome_completo, email, telefone')
    const usersMap = (users || []).reduce((acc, u) => {
      acc[u.id] = u
      return acc
    }, {})

    return (prontuarios || []).map((p) => ({
      ...p,
      paciente: usersMap[p.paciente_id] || { nome_completo: 'Paciente não identificado', email: '' }
    }))
  } catch (err) {
    console.error('Erro ao buscar prontuários no admin:', err)
    return []
  }
}

export async function createAdminProntuario(prontuarioData) {
  if (!isSupabaseConfigured) return null

  try {
    const { data, error } = await supabase
      .from('prontuarios')
      .insert([
        {
          paciente_id: prontuarioData.paciente_id,
          data_sessao: prontuarioData.data_sessao || new Date().toISOString().split('T')[0],
          tipo_registro: prontuarioData.tipo_registro || 'AVALIACAO_NEUROCOGNITIVA',
          observacoes_clinicas: prontuarioData.observacoes_clinicas || '',
          hipoteses_diagnosticas: prontuarioData.hipoteses_diagnosticas || '',
          plano_intervencao: prontuarioData.plano_intervencao || '',
          arquivo_nome: prontuarioData.arquivo_nome || 'Relatório de Avaliação Neuropsicopedagógica.pdf',
          arquivo_laudo_url: prontuarioData.arquivo_laudo_url || 'laudos/relatorio-avaliacao.pdf',
          visivel_para_paciente: prontuarioData.visivel_para_paciente ?? true
        }
      ])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (err) {
    console.error('Erro ao criar prontuário:', err)
    throw err
  }
}

export async function deleteAdminProntuario(prontuarioId) {
  if (!isSupabaseConfigured || !prontuarioId) return false

  try {
    const { error } = await supabase
      .from('prontuarios')
      .delete()
      .eq('id', prontuarioId)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Erro ao excluir prontuário:', err)
    return false
  }
}

// ----------------------------------------------------------------------------
// 3.1 GESTÃO DE PARECERES & PDIS ESCOLARES (B2B - ESCOLAS CONVENIADAS)
// ----------------------------------------------------------------------------
export async function fetchAdminRelatoriosEscolares() {
  if (!isSupabaseConfigured) return []

  try {
    const { data: relatorios, error } = await supabase
      .from('relatorios_escolares')
      .select('*')
      .order('criado_em', { ascending: false })

    if (error) throw error

    // Busca dados das escolas cadastradas para associar nome da instituição
    const { data: users } = await supabase.from('usuarios').select('id, nome_completo, instituicao_nome, email, telefone')
    const usersMap = (users || []).reduce((acc, u) => {
      acc[u.id] = u
      return acc
    }, {})

    return (relatorios || []).map((r) => ({
      ...r,
      escola: usersMap[r.escola_id] || {
        nome_completo: 'Instituição não identificada',
        instituicao_nome: 'Escola não identificada',
        email: ''
      }
    }))
  } catch (err) {
    console.error('Erro ao buscar relatórios escolares no admin:', err)
    return []
  }
}

export async function createAdminRelatorioEscolar(relatorioData) {
  if (!isSupabaseConfigured) return null

  try {
    const { data, error } = await supabase
      .from('relatorios_escolares')
      .insert([
        {
          escola_id: relatorioData.escola_id,
          aluno_nome: relatorioData.aluno_nome || 'Aluno Encaminhado',
          titulo: relatorioData.titulo || 'Parecer Pedagógico & Inclusão Escolar',
          tipo_documento: relatorioData.tipo_documento || 'PDI_PEI',
          descricao: relatorioData.descricao || '',
          arquivo_nome: relatorioData.arquivo_nome || 'Parecer_Pedagogico_Institucional.pdf',
          arquivo_url: relatorioData.arquivo_url || 'relatorios-escolas/documento.pdf'
        }
      ])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (err) {
    console.error('Erro ao criar relatório escolar:', err)
    throw err
  }
}

export async function deleteAdminRelatorioEscolar(relatorioId) {
  if (!isSupabaseConfigured || !relatorioId) return false

  try {
    const { error } = await supabase
      .from('relatorios_escolares')
      .delete()
      .eq('id', relatorioId)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Erro ao excluir relatório escolar:', err)
    return false
  }
}

// ----------------------------------------------------------------------------
// 4. GESTÃO DE AGENDAMENTOS E CONSULTÓRIO
// ----------------------------------------------------------------------------
export async function fetchAdminAgendamentos() {
  if (!isSupabaseConfigured) return []

  try {
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('*')
      .order('data_hora', { ascending: false })

    if (error) throw error

    const { data: users } = await supabase
      .from('usuarios')
      .select('id, nome_completo, email, telefone, tipo_usuario, instituicao_nome')
    const usersMap = (users || []).reduce((acc, u) => {
      acc[u.id] = u
      return acc
    }, {})

    return (agendamentos || []).map((ag) => ({
      ...ag,
      usuario: usersMap[ag.usuario_id] || {
        nome_completo: 'Usuário não identificado',
        email: '',
        telefone: '',
        tipo_usuario: 'PACIENTE',
        instituicao_nome: ''
      }
    }))
  } catch (err) {
    console.error('Erro ao buscar agendamentos no admin:', err)
    return []
  }
}

export async function updateAdminAgendamentoStatus(id, newStatus, observacoes = null) {
  if (!isSupabaseConfigured || !id) return null

  try {
    const updatePayload = { status: newStatus }
    if (observacoes !== null) updatePayload.observacoes = observacoes

    const { data, error } = await supabase
      .from('agendamentos')
      .update(updatePayload)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (err) {
    console.error('Erro ao atualizar agendamento:', err)
    throw err
  }
}

export async function createAdminAgendamento(agendamentoData) {
  if (!isSupabaseConfigured) return null

  try {
    const { data, error } = await supabase
      .from('agendamentos')
      .insert([
        {
          usuario_id: agendamentoData.usuario_id,
          modalidade: agendamentoData.modalidade || 'PRESENCIAL',
          servico: agendamentoData.servico || 'Sessão de Intervenção Neuropsicopedagógica',
          data_hora: agendamentoData.data_hora,
          status: agendamentoData.status || 'CONFIRMADO',
          observacoes: agendamentoData.observacoes || ''
        }
      ])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (err) {
    console.error('Erro ao criar agendamento no admin:', err)
    throw err
  }
}

// ----------------------------------------------------------------------------
// 5. GESTÃO DE CURSOS & MATRÍCULAS (AVA)
// ----------------------------------------------------------------------------
export async function fetchAdminMatriculas() {
  if (!isSupabaseConfigured) return []

  try {
    const { data: matriculas, error } = await supabase
      .from('matriculas')
      .select('*')
      .order('data_matricula', { ascending: false })

    if (error) throw error

    const [{ data: users }, { data: cursos }] = await Promise.all([
      supabase.from('usuarios').select('id, nome_completo, email, telefone, tipo_usuario, instituicao_nome'),
      supabase.from('cursos').select('*')
    ])

    const usersMap = (users || []).reduce((acc, u) => {
      acc[u.id] = u
      return acc
    }, {})

    const cursosMap = (cursos || []).reduce((acc, c) => {
      acc[c.id] = c
      return acc
    }, {})

    return (matriculas || []).map((m) => ({
      ...m,
      usuario: usersMap[m.usuario_id] || { nome_completo: 'Aluno não identificado', email: '' },
      curso: cursosMap[m.curso_id] || { titulo: 'Curso não identificado', carga_horaria: '30 horas' }
    }))
  } catch (err) {
    console.error('Erro ao buscar matrículas no admin:', err)
    return []
  }
}

export async function createAdminMatricula({ usuario_id, curso_id, progresso = 0, certificado_emitido = false }) {
  if (!isSupabaseConfigured || !usuario_id || !curso_id) return null

  try {
    const codigoCertificado = certificado_emitido ? `CERT-${new Date().getFullYear()}-CR-${Math.floor(1000 + Math.random() * 9000)}` : null

    const { data, error } = await supabase
      .from('matriculas')
      .insert([
        {
          usuario_id,
          curso_id,
          progresso,
          certificado_emitido,
          codigo_certificado: codigoCertificado,
          data_matricula: new Date().toISOString(),
          data_conclusao: certificado_emitido ? new Date().toISOString() : null
        }
      ])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (err) {
    console.error('Erro ao matricular aluno:', err)
    throw err
  }
}

export async function updateAdminMatricula(id, { progresso, certificado_emitido }) {
  if (!isSupabaseConfigured || !id) return null

  try {
    const codigoCertificado = certificado_emitido ? `CERT-${new Date().getFullYear()}-CR-${Math.floor(1000 + Math.random() * 9000)}` : null

    const { data, error } = await supabase
      .from('matriculas')
      .update({
        progresso,
        certificado_emitido,
        codigo_certificado: codigoCertificado,
        data_conclusao: certificado_emitido ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (err) {
    console.error('Erro ao atualizar matrícula:', err)
    throw err
  }
}

export async function deleteAdminMatricula(id) {
  if (!isSupabaseConfigured || !id) return false

  try {
    const { error } = await supabase
      .from('matriculas')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Erro ao remover matrícula:', err)
    return false
  }
}

// ----------------------------------------------------------------------------
// 6. CATÁLOGO DE CURSOS (ADMIN)
// ----------------------------------------------------------------------------
export function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function fetchAdminCursos() {
  if (!isSupabaseConfigured) return []

  try {
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .order('criado_em', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Erro ao buscar catálogo de cursos:', err)
    return []
  }
}

const DEFAULT_CURSO_THUMB = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop'
const MATERIAIS_BUCKET = 'materiais-cursos' // privado: apostilas em PDF (pasta = id do curso)
const CAPAS_BUCKET = 'cursos' // público: imagens de capa

/**
 * Cria um curso. Aceita `id` gerado no navegador (crypto.randomUUID) para que
 * apostilas possam ser enviadas ao Storage antes do curso ser salvo.
 * Se o endereço (slug) já existir, adiciona um sufixo automaticamente.
 */
export async function createAdminCurso(cursoData) {
  if (!isSupabaseConfigured) return null

  const slugBase = generateSlug(cursoData.slug?.trim() || cursoData.titulo || 'curso') || 'curso'
  const basePayload = {
    titulo: cursoData.titulo,
    descricao: cursoData.descricao || '',
    preco: parseFloat(cursoData.preco) || 0.0,
    carga_horaria: cursoData.carga_horaria || '40 horas',
    certificado_info: cursoData.certificado_info || 'Certificado Válido pelo MEC / Extensão',
    thumbnail_url: cursoData.thumbnail_url || DEFAULT_CURSO_THUMB,
    ativo: cursoData.ativo ?? false,
    data_inicio: cursoData.data_inicio || 'Janeiro de 2027'
  }
  if (cursoData.id) basePayload.id = cursoData.id

  for (let tentativa = 0; tentativa < 4; tentativa++) {
    const slug = tentativa === 0 ? slugBase : `${slugBase}-${Math.floor(100 + Math.random() * 900)}`
    const { data, error } = await supabase
      .from('cursos')
      .insert([{ ...basePayload, slug }])
      .select()

    if (!error) return data?.[0] || null

    // 23505 = violação de unicidade (slug já usado) -> tenta outro sufixo
    const slugDuplicado = error.code === '23505' && String(error.message || '').includes('slug')
    if (!slugDuplicado) {
      console.error('Erro ao criar curso no Supabase:', error)
      throw error
    }
  }
  throw new Error('Não foi possível gerar um endereço único para o curso. Altere o título e tente novamente.')
}

export async function updateAdminCurso(id, cursoData) {
  if (!isSupabaseConfigured || !id) return null

  try {
    const updatePayload = {
      titulo: cursoData.titulo,
      descricao: cursoData.descricao,
      preco: parseFloat(cursoData.preco) || 0.0,
      carga_horaria: cursoData.carga_horaria,
      certificado_info: cursoData.certificado_info,
      thumbnail_url: cursoData.thumbnail_url || DEFAULT_CURSO_THUMB,
      ativo: cursoData.ativo ?? true,
      data_inicio: cursoData.data_inicio || 'Janeiro de 2027'
    }

    if (cursoData.slug) {
      updatePayload.slug = generateSlug(cursoData.slug)
    }

    const { data, error } = await supabase
      .from('cursos')
      .update(updatePayload)
      .eq('id', id)
      .select()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Já existe outro curso com este endereço (link). Escolha outro nome no campo "Endereço do curso".')
      }
      throw error
    }
    return data?.[0] || null
  } catch (err) {
    console.error('Erro ao atualizar curso:', err)
    throw err
  }
}

export async function deleteAdminCurso(id) {
  if (!isSupabaseConfigured || !id) return false

  try {
    // 1. Busca dados do curso antes da exclusão para obter o link da capa
    let cursoParaExcluir = null
    try {
      const { data } = await supabase
        .from('cursos')
        .select('id, thumbnail_url')
        .eq('id', id)
        .maybeSingle()
      cursoParaExcluir = data
    } catch (e) {
      console.warn('Não foi possível obter dados prévios do curso:', e)
    }

    // 2. Remove o curso do banco de dados (modulos e aulas têm CASCADE)
    const { error } = await supabase
      .from('cursos')
      .delete()
      .eq('id', id)

    if (error) throw error

    // 3. Limpeza inteligente da imagem de capa no bucket 'cursos'
    try {
      const { data: capaFiles } = await supabase.storage.from(CAPAS_BUCKET).list(id, { limit: 100 })
      if (capaFiles?.length) {
        await supabase.storage.from(CAPAS_BUCKET).remove(capaFiles.map((f) => `${id}/${f.name}`))
      }
      const { data: legacyCapaFiles } = await supabase.storage.from(CAPAS_BUCKET).list(`capas/${id}`, { limit: 100 })
      if (legacyCapaFiles?.length) {
        await supabase.storage.from(CAPAS_BUCKET).remove(legacyCapaFiles.map((f) => `capas/${id}/${f.name}`))
      }
      if (cursoParaExcluir?.thumbnail_url && cursoParaExcluir.thumbnail_url.includes(`/${CAPAS_BUCKET}/`)) {
        const parts = cursoParaExcluir.thumbnail_url.split(`/${CAPAS_BUCKET}/`)
        if (parts[1]) {
          const relativePath = decodeURIComponent(parts[1].split('?')[0])
          await supabase.storage.from(CAPAS_BUCKET).remove([relativePath])
        }
      }
    } catch (capaErr) {
      console.warn('Curso removido, mas não foi possível limpar a capa no Storage:', capaErr)
    }

    // 4. Limpeza inteligente das apostilas no bucket 'materiais-cursos'
    try {
      const { data: files } = await supabase.storage.from(MATERIAIS_BUCKET).list(id, { limit: 1000 })
      if (files?.length) {
        await supabase.storage.from(MATERIAIS_BUCKET).remove(files.map((f) => `${id}/${f.name}`))
      }
    } catch (storageErr) {
      console.warn('Curso removido, mas não foi possível limpar as apostilas:', storageErr)
    }

    return true
  } catch (err) {
    console.error('Erro ao remover curso:', err)
    throw err
  }
}

// ----------------------------------------------------------------------------
// 7. MATÉRIAS DO CURSO (vídeo / apostila PDF / texto — todos opcionais)
//    Tabelas: modulos_curso (matéria) -> aulas_curso (conteúdo)
// ----------------------------------------------------------------------------
export async function fetchAdminCursoMaterias(cursoId) {
  if (!isSupabaseConfigured || !cursoId) return []

  const { data, error } = await supabase
    .from('modulos_curso')
    .select(`
      id, titulo, descricao, ordem,
      conteudos:aulas_curso ( id, titulo, tipo, video_url, pdf_apoio_url, arquivo_nome, conteudo_texto, link_prova, duracao, ordem )
    `)
    .eq('curso_id', cursoId)
    .order('ordem', { ascending: true })

  if (error) {
    console.error('Erro ao buscar matérias do curso:', error)
    throw error
  }

  return (data || []).map((m) => ({
    ...m,
    conteudos: (m.conteudos || [])
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .map((c) => ({
        ...c,
        // Compatibilidade com aulas antigas (antes do campo "tipo")
        tipo: c.tipo || (c.link_prova ? 'PROVA' : c.video_url ? 'VIDEO' : c.pdf_apoio_url ? 'PDF' : 'TEXTO'),
        link_prova: c.link_prova || (c.tipo === 'PROVA' ? c.video_url : '')
      }))
  }))
}

/** Substitui todas as matérias do curso em uma única transação no banco. */
export async function saveAdminCursoMaterias(cursoId, materias = []) {
  if (!isSupabaseConfigured || !cursoId) return null

  const payload = materias.map((m) => ({
    titulo: m.titulo || '',
    descricao: m.descricao || '',
    conteudos: (m.conteudos || []).map((c) => ({
      tipo: c.tipo,
      titulo: c.titulo || '',
      video_url: c.tipo === 'VIDEO' ? c.video_url || '' : '',
      pdf_apoio_url: c.tipo === 'PDF' ? c.pdf_apoio_url || '' : '',
      arquivo_nome: c.tipo === 'PDF' ? c.arquivo_nome || '' : '',
      conteudo_texto: c.tipo === 'TEXTO' ? c.conteudo_texto || '' : '',
      link_prova: c.tipo === 'PROVA' ? (c.link_prova || c.video_url || '') : ''
    }))
  }))

  const { error } = await supabase.rpc('salvar_materias_curso', {
    p_curso_id: cursoId,
    p_materias: payload
  })

  if (error) {
    console.error('Erro ao salvar matérias do curso:', error)
    throw error
  }
  return true
}

function safeFileName(name = 'arquivo') {
  const dot = name.lastIndexOf('.')
  const ext = dot > -1 ? name.slice(dot).toLowerCase() : ''
  const base = generateSlug(dot > -1 ? name.slice(0, dot) : name) || 'arquivo'
  return `${Date.now()}-${base.slice(0, 60)}${ext}`
}

/** Envia uma apostila (PDF) para o bucket privado, na pasta do curso. */
export async function uploadCursoPdf(cursoId, file) {
  if (!isSupabaseConfigured) throw new Error('Supabase não configurado.')
  if (!cursoId || !file) throw new Error('Arquivo inválido.')
  if (file.type !== 'application/pdf') throw new Error('Envie apenas arquivos em PDF.')
  if (file.size > 20 * 1024 * 1024) throw new Error('O PDF é maior que 20 MB. Reduza o arquivo ou use um link do Google Drive.')

  const path = `${cursoId}/${safeFileName(file.name)}`
  const { error } = await supabase.storage
    .from(MATERIAIS_BUCKET)
    .upload(path, file, { contentType: 'application/pdf', upsert: false })

  if (error) throw error
  return { path, nome: file.name }
}

/** Remove as imagens de capa associadas ao curso no bucket público 'cursos'. */
export async function deleteCursoCapa(cursoId) {
  if (!isSupabaseConfigured || !cursoId) return false
  try {
    const { data: files } = await supabase.storage.from(CAPAS_BUCKET).list(cursoId, { limit: 100 })
    if (files?.length) {
      await supabase.storage.from(CAPAS_BUCKET).remove(files.map((f) => `${cursoId}/${f.name}`))
    }
    const { data: legacyFiles } = await supabase.storage.from(CAPAS_BUCKET).list(`capas/${cursoId}`, { limit: 100 })
    if (legacyFiles?.length) {
      await supabase.storage.from(CAPAS_BUCKET).remove(legacyFiles.map((f) => `capas/${cursoId}/${f.name}`))
    }
    return true
  } catch (err) {
    console.warn('Aviso ao remover capa anterior no bucket cursos:', err)
    return false
  }
}

/** Envia a imagem de capa para o bucket público 'cursos' e devolve a URL pública. */
export async function uploadCursoCapa(cursoId, file) {
  if (!isSupabaseConfigured) throw new Error('Supabase não configurado.')
  if (!file || !/^image\/(jpeg|jpg|png|webp|pjpeg)$/i.test(file.type)) {
    throw new Error('Envie uma imagem JPG, PNG ou WEBP.')
  }
  if (file.size > 15 * 1024 * 1024) throw new Error('A imagem é maior que 15 MB. Escolha uma imagem menor.')

  // Remove capa anterior para não deixar arquivo órfão no bucket
  await deleteCursoCapa(cursoId)

  const path = `${cursoId}/${safeFileName(file.name)}`
  const { error } = await supabase.storage
    .from(CAPAS_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: true })

  if (error) throw error
  const { data } = supabase.storage.from(CAPAS_BUCKET).getPublicUrl(path)
  return data?.publicUrl || ''
}

/** Gera link temporário (1h) para abrir uma apostila do bucket privado. */
export async function getCursoPdfSignedUrl(path) {
  if (!isSupabaseConfigured || !path) return null
  const { data, error } = await supabase.storage.from(MATERIAIS_BUCKET).createSignedUrl(path, 3600)
  if (error) {
    console.warn('Erro ao gerar link da apostila:', error)
    return null
  }
  return data?.signedUrl || null
}

// ----------------------------------------------------------------------------
// 8. STORAGE: BUCKET 'laudos' (Laudos Clínicos & Avaliações Neuropsicopedagógicas)
// ----------------------------------------------------------------------------
const LAUDOS_BUCKET = 'laudos'

/**
 * Envia arquivo de laudo/registro clínico do computador para o bucket 'laudos'.
 * Aceita PDF, Word (.doc, .docx) ou imagens escaneadas (até 50 MB).
 */
export async function uploadAdminLaudo(pacienteId, file) {
  if (!isSupabaseConfigured) throw new Error('Supabase não configurado.')
  if (!pacienteId) throw new Error('Selecione o paciente antes de anexar o arquivo.')
  if (!file) throw new Error('Selecione um arquivo para upload.')

  if (file.size > 50 * 1024 * 1024) {
    throw new Error('O arquivo excede o limite máximo permitido de 50 MB.')
  }

  const cleanName = safeFileName(file.name)
  const path = `${pacienteId}/${cleanName}`

  const { data: _data, error } = await supabase.storage
    .from(LAUDOS_BUCKET)
    .upload(path, file, {
      contentType: file.type || 'application/pdf',
      upsert: true
    })

  if (error) {
    console.error(`Erro ao fazer upload para o bucket '${LAUDOS_BUCKET}':`, error)
    throw new Error(`Falha no upload do laudo para o bucket 'laudos': ${error.message || 'Erro no storage'}`)
  }

  // Obtém URL pública se o bucket for público
  const { data: pubData } = supabase.storage.from(LAUDOS_BUCKET).getPublicUrl(path)

  return {
    path,
    publicUrl: pubData?.publicUrl || '',
    nome: file.name,
    tamanho: file.size
  }
}

/**
 * Gera URL segura ou pública para abrir/baixar um laudo do bucket 'laudos'.
 */
export async function getAdminLaudoUrl(path) {
  if (!isSupabaseConfigured || !path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path

  try {
    // 1. Tenta signed URL no bucket 'laudos'
    const { data: signedData } = await supabase.storage
      .from(LAUDOS_BUCKET)
      .createSignedUrl(path, 3600)

    if (signedData?.signedUrl) return signedData.signedUrl

    // 2. Tenta public URL no bucket 'laudos'
    const { data: pubData } = supabase.storage.from(LAUDOS_BUCKET).getPublicUrl(path)
    if (pubData?.publicUrl) return pubData.publicUrl

    // 3. Fallback no bucket antigo 'laudos-privados'
    const { data: oldSigned } = await supabase.storage
      .from('laudos-privados')
      .createSignedUrl(path, 3600)
    if (oldSigned?.signedUrl) return oldSigned.signedUrl

    return null
  } catch (err) {
    console.warn('Erro ao obter link seguro do laudo:', err)
    return null
  }
}

