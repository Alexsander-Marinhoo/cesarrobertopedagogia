import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)

  // Otimização crucial para dispositivos móveis:
  // Evita que a barra de endereços do navegador (iOS/Android) resete ou trave os gatilhos ao rolar
  ScrollTrigger.config({
    ignoreMobileResize: true,
    autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
  })
}

export { gsap, ScrollTrigger }
