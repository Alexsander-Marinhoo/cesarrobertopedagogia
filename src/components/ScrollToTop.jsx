import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getLenis } from '../utils/lenis'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // If there's an anchor hash (e.g. #servicos), let the anchor handler deal with it
    if (hash) return

    // 1. Reset standard browser viewport scroll instantly
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    if (document.documentElement) {
      document.documentElement.scrollTop = 0
    }
    if (document.body) {
      document.body.scrollTop = 0
    }

    // 2. Reset Lenis smooth scroll engine position immediately
    const lenis = getLenis()
    if (lenis) {
      lenis.scrollTo(0, { immediate: true })
    }
  }, [pathname, hash])

  return null
}
