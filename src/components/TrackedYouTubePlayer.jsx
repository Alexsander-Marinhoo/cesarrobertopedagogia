import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Lock } from 'lucide-react'

// ----------------------------------------------------------------------------
// Player de YouTube com medição de tempo REALMENTE assistido.
// Usa a YouTube IFrame Player API (gratuita). Conta apenas segundos reproduzidos
// de forma contínua: pular para o final não conta como assistido.
// ----------------------------------------------------------------------------

let ytApiPromise = null
function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('sem window'))
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      ytApiPromise = null
      reject(new Error('Falha ao carregar a API do YouTube'))
    }
    document.head.appendChild(script)
  })
  return ytApiPromise
}

const TICK_MS = 500
// Avanço máximo entre dois ticks para considerar reprodução contínua (cobre velocidade até 2x)
const MAX_JUMP_SECONDS = 2.5
const SAVE_EVERY_MS = 10000

/**
 * @param {Object} props
 * @param {string} props.videoId  ID do vídeo no YouTube
 * @param {number} [props.threshold=0.9]  Fração mínima assistida (0 a 1)
 * @param {number[]} [props.initialSeen]  Segundos já assistidos (retomar progresso)
 * @param {number} [props.initialPercent=0]  Porcentagem inicial já computada (0 a 1)
 * @param {number} [props.lastPosition=0]  Último segundo reproduzido para retomar
 * @param {(info: {percent: number, seen: number[], duration: number, currentTime: number}) => void} [props.onProgress]
 *        Chamado periodicamente (a cada ~10s), ao pausar e ao terminar
 * @param {() => void} [props.onComplete]  Chamado uma única vez ao atingir o limite
 * @param {boolean} [props.showMeter=true]  Exibe a barra de progresso abaixo do vídeo
 */
export default function TrackedYouTubePlayer({
  videoId,
  threshold = 0.9,
  initialSeen = [],
  initialPercent = 0,
  lastPosition = 0,
  onProgress,
  onComplete,
  showMeter = true,
  startCompleted = false
}) {
  const hostRef = useRef(null)
  const seenRef = useRef(new Set(initialSeen))
  const completedRef = useRef(startCompleted)
  const callbacksRef = useRef({ onProgress, onComplete })
  const [percent, setPercent] = useState(() => (startCompleted ? 1 : initialPercent > 0 ? initialPercent : 0))
  const [completed, setCompleted] = useState(startCompleted)
  const [error, setError] = useState('')

  useEffect(() => {
    callbacksRef.current = { onProgress, onComplete }
  }, [onProgress, onComplete])

  useEffect(() => {
    let player = null
    let timer = null
    let destroyed = false
    let lastTime = null
    let lastSave = 0

    const computePercent = (duration) => {
      const total = Math.floor(duration)
      if (!total) return 0
      return Math.min(1, seenRef.current.size / total)
    }

    const emit = (duration, force = false) => {
      const now = Date.now()
      if (!force && now - lastSave < SAVE_EVERY_MS) return
      lastSave = now
      const curTime = player?.getCurrentTime ? player.getCurrentTime() : null
      callbacksRef.current.onProgress?.({
        percent: computePercent(duration),
        seen: Array.from(seenRef.current),
        duration,
        currentTime: curTime !== null ? Math.floor(curTime) : 0
      })
    }

    const tick = () => {
      if (!player?.getCurrentTime) return
      const duration = player.getDuration?.() || 0
      if (!duration) return
      const t = player.getCurrentTime()

      // Só conta se avançou de forma contínua desde a última leitura
      if (lastTime !== null && t >= lastTime && t - lastTime <= MAX_JUMP_SECONDS) {
        seenRef.current.add(Math.floor(t))
      }
      lastTime = t

      const p = computePercent(duration)
      setPercent(completedRef.current ? 1 : p)
      if (!completedRef.current && p >= threshold) {
        completedRef.current = true
        setCompleted(true)
        emit(duration, true)
        callbacksRef.current.onComplete?.()
      } else {
        emit(duration)
      }
    }

    const startTimer = () => {
      if (timer) return
      lastTime = player?.getCurrentTime?.() ?? null
      timer = setInterval(tick, TICK_MS)
    }
    const stopTimer = (flush) => {
      if (timer) clearInterval(timer)
      timer = null
      lastTime = null
      if (flush && player?.getDuration) emit(player.getDuration() || 0, true)
    }

    loadYouTubeApi()
      .then((YT) => {
        if (destroyed || !hostRef.current) return
        // O container interno é substituído pelo iframe do YouTube
        const mount = document.createElement('div')
        hostRef.current.innerHTML = ''
        hostRef.current.appendChild(mount)

        player = new YT.Player(mount, {
          videoId,
          host: 'https://www.youtube-nocookie.com',
          width: '100%',
          height: '100%',
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
          events: {
            onReady: () => {
              const d = player.getDuration?.() || 0
              if (d) {
                const p = computePercent(d)
                if (!completedRef.current) setPercent(Math.max(p, initialPercent || 0))
                if (p >= threshold) {
                  completedRef.current = true
                  setCompleted(true)
                }
                if (lastPosition > 0 && lastPosition < d - 5 && !completedRef.current) {
                  try {
                    player.seekTo(lastPosition, true)
                  } catch (err) {
                    console.warn('Aviso ao buscar posição do vídeo:', err)
                  }
                }
              }
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.PLAYING) startTimer()
              else if (e.data === YT.PlayerState.ENDED) {
                tick()
                stopTimer(true)
              } else stopTimer(e.data === YT.PlayerState.PAUSED)
            }
          }
        })
      })
      .catch((err) => setError(err.message))

    return () => {
      destroyed = true
      stopTimer(true)
      try {
        player?.destroy?.()
      } catch {
        // player já descartado
      }
    }
  }, [videoId, threshold])

  const pct = Math.round(percent * 100)
  const goal = Math.round(threshold * 100)

  return (
    <div className="space-y-3">
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl">
        {error ? (
          <div className="w-full h-full flex items-center justify-center text-white text-base p-6 text-center">
            {error}
          </div>
        ) : (
          <div ref={hostRef} className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
        )}
      </div>

      {showMeter && (
        <div
          className={`rounded-2xl border p-4 space-y-2 ${
            completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3 text-sm font-bold">
            <span className={`inline-flex items-center gap-2 ${completed ? 'text-emerald-700' : 'text-[#002B49]'}`}>
              {completed ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-4 h-4 text-slate-400" />}
              {completed
                ? 'Aula concluída'
                : `Assista pelo menos ${goal}% para concluir esta aula`}
            </span>
            <span className="text-[#002B49]">{pct}%</span>
          </div>
          <div className="relative h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-emerald-500' : 'bg-[#D4AF37]'}`}
              style={{ width: `${pct}%` }}
            />
            <div className="absolute top-0 bottom-0 w-0.5 bg-[#002B49]/40" style={{ left: `${goal}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
