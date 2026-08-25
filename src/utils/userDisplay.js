/**
 * Formats user display name and avatar initial intelligently.
 * Handles titles and honorifics (Prof., Profª, Dr., Dra., etc.) without clipping to just the title.
 * 
 * Examples:
 * - "Profª Cláudia Mendes" -> displayName: "Profª Cláudia", initial: "C"
 * - "Prof. Carlos Silva" -> displayName: "Prof. Carlos", initial: "C"
 * - "Prof Marcos" -> displayName: "Prof. Marcos", initial: "M"
 * - "Mariana Silveira" -> displayName: "Mariana", initial: "M"
 * - "Colégio Primeiros Passos" -> displayName: "Colégio Primeiros", initial: "C"
 */

const HONORIFICS = new Set([
  'prof', 'prof.', 'profª', 'profª.', 'profa', 'profa.',
  'professor', 'professora',
  'dr', 'dr.', 'dra', 'dra.', 'doutor', 'doutora',
  'sr', 'sr.', 'sra', 'sra.', 'senhor', 'senhora',
  'coord', 'coord.', 'coordª', 'coordª.', 'coordenador', 'coordenadora',
  'diretor', 'diretora', 'pedagogo', 'pedagoga',
  'tia', 'tio'
])

export function getUserDisplayName(profile, user) {
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || ''
  const rawName = 
    profile?.nome_completo?.trim() || 
    user?.user_metadata?.nome_completo?.trim() || 
    profile?.instituicao_nome?.trim() || 
    user?.user_metadata?.instituicao_nome?.trim() || 
    ''

  if (!rawName) {
    const email = profile?.email || user?.email || ''
    if (email) {
      const emailPrefix = email.split('@')[0].replace(/[._-]/g, ' ')
      const cleanPrefix = emailPrefix.split(' ')[0]
      const capitalized = cleanPrefix.charAt(0).toUpperCase() + cleanPrefix.slice(1)
      return {
        displayName: capitalized,
        initial: capitalized.charAt(0).toUpperCase() || 'U',
        fullName: email,
        avatarUrl
      }
    }
    return {
      displayName: 'Meu Portal',
      initial: 'P',
      fullName: 'Usuário',
      avatarUrl
    }
  }

  // Remove parenthesis annotations like "Mariana (Mãe do Lucas)"
  const cleanName = rawName.replace(/\(.*?\)/g, '').trim().replace(/\s+/g, ' ')
  const words = cleanName.split(' ')

  if (words.length === 0 || !words[0]) {
    return {
      displayName: 'Meu Portal',
      initial: 'P',
      fullName: rawName,
      avatarUrl
    }
  }

  const firstWordClean = words[0].toLowerCase().replace(/[,:]/g, '')

  // Check if first word is a title / honorific
  if (HONORIFICS.has(firstWordClean) && words.length > 1) {
    const title = words[0]
    const firstName = words[1]
    
    // Normalize common title representations (e.g. Prof -> Prof.)
    const normalizedTitle = (title.toLowerCase() === 'prof' || title.toLowerCase() === 'profa')
      ? `${title}.`
      : title

    // The avatar initial should be from the person's actual name (e.g. Cláudia -> C)
    const initial = firstName.charAt(0).toUpperCase()

    return {
      displayName: `${normalizedTitle} ${firstName}`,
      shortName: firstName,
      initial: initial || 'U',
      fullName: cleanName,
      avatarUrl
    }
  }

  // If the user typed "Colégio Primeiros Passos" or "Escola Modelo"
  const institutionPrefixes = new Set(['colégio', 'colegio', 'escola', 'instituto', 'centro', 'creche'])
  if (institutionPrefixes.has(firstWordClean) && words.length > 1) {
    return {
      displayName: `${words[0]} ${words[1]}`,
      shortName: words[1],
      initial: words[0].charAt(0).toUpperCase(),
      fullName: cleanName,
      avatarUrl
    }
  }

  // Normal personal name e.g. "Mariana Silveira"
  const firstName = words[0]
  return {
    displayName: firstName,
    shortName: firstName,
    initial: firstName.charAt(0).toUpperCase() || 'U',
    fullName: cleanName,
    avatarUrl
  }
}
