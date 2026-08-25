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

export async function createAdminCurso(cursoData) {
  if (!isSupabaseConfigured) return null

  try {
    const slugBase = cursoData.slug?.trim() || generateSlug(cursoData.titulo || 'curso')
    const finalSlug = slugBase + (cursoData.slug ? '' : '-' + Math.floor(100 + Math.random() * 900))

    const { data, error } = await supabase
      .from('cursos')
      .insert([
        {
          slug: finalSlug,
          titulo: cursoData.titulo,
          descricao: cursoData.descricao || '',
          preco: parseFloat(cursoData.preco) || 0.0,
          carga_horaria: cursoData.carga_horaria || '40 horas',
          certificado_info: cursoData.certificado_info || 'Certificado Válido pelo MEC / Extensão',
          thumbnail_url: cursoData.thumbnail_url || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop',
          ativo: cursoData.ativo ?? true
        }
      ])
      .select()

    if (error) throw error

    // Se módulos foram fornecidos, cria os módulos e aulas iniciais
    if (cursoData.modulos && Array.isArray(cursoData.modulos) && data?.[0]?.id) {
      const cursoId = data[0].id
      for (let i = 0; i < cursoData.modulos.length; i++) {
        const mod = cursoData.modulos[i]
        const { data: modData } = await supabase
          .from('modulos_curso')
          .insert([{ curso_id: cursoId, titulo: mod.titulo || `Módulo ${i + 1}`, ordem: i + 1 }])
          .select()

        if (modData?.[0]?.id && mod.aulas && Array.isArray(mod.aulas)) {
          const modId = modData[0].id
          for (let j = 0; j < mod.aulas.length; j++) {
            const aula = mod.aulas[j]
            await supabase.from('aulas_curso').insert([
              {
                modulo_id: modId,
                titulo: aula.titulo || `Aula ${j + 1}`,
                duracao: aula.duracao || '15 min',
                video_url: aula.video_url || '',
                pdf_apoio_url: aula.pdf_apoio_url || '',
                ordem: j + 1
              }
            ])
          }
        }
      }
    }

    return data?.[0] || null
  } catch (err) {
    console.error('Erro ao criar curso no Supabase:', err)
    throw err
  }
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
      thumbnail_url: cursoData.thumbnail_url,
      ativo: cursoData.ativo ?? true
    }

    if (cursoData.slug) {
      updatePayload.slug = cursoData.slug
    }

    const { data, error } = await supabase
      .from('cursos')
      .update(updatePayload)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (err) {
    console.error('Erro ao atualizar curso:', err)
    throw err
  }
}

export async function deleteAdminCurso(id) {
  if (!isSupabaseConfigured || !id) return false

  try {
    const { error } = await supabase
      .from('cursos')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (err) {
    console.error('Erro ao remover curso:', err)
    throw err
  }
}
