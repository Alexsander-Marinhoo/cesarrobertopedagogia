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
 * @returns {{ provider: 'youtube'|'vimeo'|'drive'|'arquivo', embedUrl: string, thumbnail?: string, videoId?: string } | null}
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
      videoId: yt[1],
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

/**
 * Comprime e redimensiona uma imagem no navegador antes do upload.
 * Converte para WebP (com fallback) e reduz fotos pesadas (3MB - 10MB)
 * para apenas ~40KB a 90KB mantendo excelente nitidez visual.
 *
 * @param {File} file
 * @param {Object} [options]
 * @param {number} [options.maxWidth=1200]
 * @param {number} [options.maxHeight=750]
 * @param {number} [options.quality=0.82]
 * @returns {Promise<File>}
 */
export async function compressImage(
  file,
  { maxWidth = 1200, maxHeight = 750, quality = 0.82 } = {}
) {
  if (!file || !file.type.startsWith('image/')) return file

  // Se já for WebP muito leve (<= 90KB), não precisa recomprimir
  if (file.size <= 90 * 1024 && file.type === 'image/webp') return file

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onerror = () => resolve(file)
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => resolve(file)
      img.onload = () => {
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(file)

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file)

            const baseName = file.name.replace(/\.[^/.]+$/, '')
            const compressedFile = new File([blob], `${baseName}.webp`, {
              type: 'image/webp',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          'image/webp',
          quality
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

