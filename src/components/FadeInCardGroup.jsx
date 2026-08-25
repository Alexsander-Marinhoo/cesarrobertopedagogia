import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '../utils/gsapConfig'

export default function FadeInCardGroup({
  children,
  className = '',
  cardSelector = '.gsap-card',
  stagger = 0.08,
  y = 20,
  duration = 0.5,
}) {
  const containerRef = useRef(null)

  useGSAP(
    () => {
      const el = containerRef.current
      if (!el) return

      const cards = el.querySelectorAll(cardSelector)
      if (!cards.length) return

      const rect = el.getBoundingClientRect()
      const isAlreadyVisible = (rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 1.05)

      const mm = gsap.matchMedia()

      // Desktop: Entrada elegante com stagger escalonado
      mm.add('(min-width: 768px)', () => {
        if (isAlreadyVisible) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: Math.min(y, 14), scale: 0.98 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: duration,
              ease: 'power2.out',
              stagger: stagger,
            }
          )
        } else {
          gsap.fromTo(
            cards,
            { opacity: 0, y: y, scale: 0.98 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: duration,
              ease: 'expo.out',
              stagger: stagger,
              scrollTrigger: {
                trigger: el,
                start: 'top 96%',
                once: true,
                fastScrollEnd: true,
              },
            }
          )
        }
      })

      // Mobile: Entrada ágil, leve e sem risco de travamento ou cards transparentes
      mm.add('(max-width: 767px)', () => {
        if (isAlreadyVisible) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.35,
              ease: 'power2.out',
              stagger: 0.03,
            }
          )
        } else {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: 'power2.out',
              stagger: 0.03,
              scrollTrigger: {
                trigger: el,
                start: 'top 96%',
                once: true,
                fastScrollEnd: true,
              },
            }
          )
        }
      })
    },
    { scope: containerRef, dependencies: [cardSelector, stagger, y, duration] }
  )

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}
