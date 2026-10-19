// ----------------------------------------------------------------------------
// Utilitários de mídia dos cursos (vídeos e apostilas)
// Vídeos sempre ficam hospedados fora do Supabase (YouTube, Vimeo, Google Drive)
// para não consumir o plano gratuito.
// ----------------------------------------------------------------------------

/**
 * Extrai o ID de um arquivo do Google Drive a partir de links comuns:
 *  - https://drive.google.com/file/d/ID/view?usp=sharing
 *  - https://drive.google.com/open?id=ID
 *  - https://drive.google.com/uc?id=ID&export=download
 */
export function getGoogleDriveId(url = '') {
  const s = String(url).trim()
  if (!/drive\.google\.com|docs\.google\.com/.test(s)) return null
  const byPath = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/)
  if (byPath) return byPath[1]
  const byQuery = s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/)
  return byQuery ? byQuery[1] : null
}

/**
 * Analisa um link de vídeo e devolve como exibi-lo.
 * @returns {{ provider: 'youtube'|'vimeo'|'drive'|'arquivo', embedUrl: string, thumbnail?: string } | null}
 */
export function parseVideoUrl(url = '') {
  const s = String(url).trim()
  if (!s) return null

  // YouTube (watch, youtu.be, shorts, embed, live)
  const yt = s.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (yt) {
    return {
      provider: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1`,
      thumbnail: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`
    }
  }

  // Vimeo
  const vm = s.match(/vimeo\.com\/(?:video\/)?(\d{6,})/)
  if (vm) {
    return { provider: 'vimeo', embedUrl: `https://player.vimeo.com/video/${vm[1]}` }
  }

  // Google Drive
  const driveId = getGoogleDriveId(s)
  if (driveId) {
    return { provider: 'drive', embedUrl: `https://drive.google.com/file/d/${driveId}/preview` }
  }

  // Arquivo de vídeo direto (mp4/webm)
  if (/^https?:\/\/.+\.(mp4|webm|ogg)(\?.*)?$/i.test(s)) {
    return { provider: 'arquivo', embedUrl: s }
  }

  return null
}

export const VIDEO_PROVIDER_LABEL = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  drive: 'Google Drive',
  arquivo: 'Arquivo de vídeo'
}

/** Um link http(s) externo (ex.: Google Drive) em vez de um arquivo no Storage. */
export function isExternalUrl(value = '') {
  return /^https?:\/\//i.test(String(value).trim())
}

/** Converte link de PDF do Google Drive para visualização embutida. */
export function getPdfEmbedUrl(url = '') {
  const driveId = getGoogleDriveId(url)
  if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`
  return url
}

export function formatFileSize(bytes = 0) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
