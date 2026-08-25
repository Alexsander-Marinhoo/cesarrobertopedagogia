import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

let lenisInstance = null

export function initLenis() {
  if (typeof window === 'undefined') return null

  // Em mobile ou telas touch, mantemos o scroll nativo super rápido (60-120fps) sem travamentos
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024

  if (!lenisInstance) {
    if (isTouchDevice) {
      ScrollTrigger.refresh()
      return null
    }

    // Lenis leve apenas para desktop com scroll wheel
    lenisInstance = new Lenis({
      autoRaf: true,
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 0,
      infinite: false,
    })

    window.__lenis = lenisInstance
    lenisInstance.on('scroll', ScrollTrigger.update)
  }

  return lenisInstance
}

export function getLenis() {
  return lenisInstance || (typeof window !== 'undefined' ? window.__lenis : null)
}

export function smoothScrollTo(target, options = {}) {
  const lenis = getLenis()
  const defaultOptions = {
    offset: -75,
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    ...options,
  }

  if (lenis) {
    lenis.scrollTo(target, defaultOptions)
  } else {
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'smooth' })
    } else {
      const el = typeof target === 'string' ? document.querySelector(target) : target
      if (el) {
        const targetTop = el.getBoundingClientRect().top + window.scrollY + (defaultOptions.offset || 0)
        window.scrollTo({ top: targetTop, behavior: 'smooth' })
      }
    }
  }
}

