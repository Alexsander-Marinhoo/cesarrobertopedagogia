import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '../utils/gsapConfig'

export default function FadeInParagraph({
  children,
  className = '',
  as: Component = 'p',
  delay = 0.05,
  y = 16,
  duration = 0.5,
  immediate = false,
}) {
  const textRef = useRef(null)

  useGSAP(
    () => {
      const el = textRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const isAlreadyVisible = immediate || (rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 1.05)

      const mm = gsap.matchMedia()

      // Desktop Animation
      mm.add('(min-width: 768px)', () => {
        if (isAlreadyVisible) {
          gsap.fromTo(
            el,
            { opacity: 0, y: Math.min(y, 10) },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              delay: delay * 0.5,
              ease: 'power2.out',
            }
          )
        } else {
          gsap.fromTo(
            el,
            { opacity: 0, y: y },
            {
              opacity: 1,
              y: 0,
              duration: duration,
              delay: delay,
              ease: 'power2.out',
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

      // Mobile Animation
      mm.add('(max-width: 767px)', () => {
        if (isAlreadyVisible) {
          gsap.fromTo(
            el,
            { opacity: 0, y: 8 },
            {
              opacity: 1,
              y: 0,
              duration: 0.35,
              ease: 'power2.out',
            }
          )
        } else {
          gsap.fromTo(
            el,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.35,
              ease: 'power2.out',
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
    { scope: textRef, dependencies: [delay, y, duration, immediate] }
  )

  return (
    <Component ref={textRef} className={className}>
      {children}
    </Component>
  )
}
