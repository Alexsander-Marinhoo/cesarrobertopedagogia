import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '../utils/gsapConfig'

export default function CascadeRevealTitle({
  children,
  as: Component = 'h2',
  className = '',
  id,
  immediate = false,
  start = 'top 96%',
}) {
  const containerRef = useRef(null)

  useGSAP(
    () => {
      const el = containerRef.current
      if (!el) return

      const chars = el.querySelectorAll('.cascade-char')
      if (!chars.length) return

      const rect = el.getBoundingClientRect()
      const isAlreadyVisible = immediate || (rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 1.05)

      const mm = gsap.matchMedia()

      // Desktop Animation: Efeito 3D com perspectiva e rotação sutil
      mm.add('(min-width: 768px)', () => {
        if (isAlreadyVisible) {
          gsap.fromTo(
            chars,
            { opacity: 0, y: 14, scale: 0.98 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.45,
              ease: 'power2.out',
              stagger: 0.008,
            }
          )
        } else {
          gsap.fromTo(
            chars,
            { opacity: 0, y: 20, rotateX: -18, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              scale: 1,
              duration: 0.5,
              ease: 'expo.out',
              stagger: 0.01,
              scrollTrigger: {
                trigger: el,
                start: start,
                once: true,
                fastScrollEnd: true,
              },
            }
          )
        }
      })

      // Mobile Animation: Efeito cascata 2D ultra-fluido, leve e com ativação imediata (start: 'top 96%')
      mm.add('(max-width: 767px)', () => {
        if (isAlreadyVisible) {
          gsap.fromTo(
            chars,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.35,
              ease: 'power2.out',
              stagger: 0.006,
            }
          )
        } else {
          gsap.fromTo(
            chars,
            { opacity: 0, y: 14 },
            {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: 'power2.out',
              stagger: 0.007,
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
    { scope: containerRef, dependencies: [immediate, start] }
  )

  const renderCascadeContent = (content) => {
    if (typeof content === 'string') {
      const words = content.split(' ')
      return words.map((word, wIdx) => (
        <span key={wIdx} className="inline-block whitespace-nowrap overflow-hidden py-0.5 leading-[1.05]">
          {word.split('').map((char, cIdx) => (
            <span
              key={cIdx}
              className="cascade-char inline-block will-change-transform transform-gpu origin-bottom leading-[1.05]"
            >
              {char}
            </span>
          ))}
          {wIdx < words.length - 1 && <span className="inline-block leading-[1.05]">&nbsp;</span>}
        </span>
      ))
    }
    return content
  }

  return (
    <Component
      ref={containerRef}
      id={id}
      className={`tracking-tight leading-[1.08] sm:leading-[1.05] ${className}`}
      style={{ perspective: '800px' }}
    >
      {renderCascadeContent(children)}
    </Component>
  )
}
