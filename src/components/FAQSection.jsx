import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import CascadeRevealTitle from './CascadeRevealTitle'
import FadeInParagraph from './FadeInParagraph'
import FadeInCardGroup from './FadeInCardGroup'
import { siteData } from '../data/content'

export default function FAQSection() {
  const [openIdx, setOpenIdx] = useState(0)

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx)
  }

  return (
    <section className="py-20 bg-[#F4F6F8] bg-pattern-dots border-b border-slate-200 relative overflow-hidden">
      {/* Subtle ambient flare */}
      <div className="absolute -top-10 right-1/4 w-80 h-80 bg-[#002B49]/2.5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <CascadeRevealTitle className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#002B49] leading-[1.08] sm:leading-[1.05]">
            Perguntas Frequentes
          </CascadeRevealTitle>
          <FadeInParagraph className="mt-3 text-sm sm:text-base font-sans text-slate-600">
            Respostas claras sobre o processo de avaliação, sessões clínicas e consultoria pedagógica.
          </FadeInParagraph>
        </div>

        {/* Accordion with Sequential Fade-In */}
        <FadeInCardGroup stagger={0.08} className="space-y-4">
          {siteData.faqs.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div
                key={idx}
                className={`gsap-card bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen ? 'border-[#002B49]/40 shadow-md shadow-[#002B49]/4' : 'border-[#002B49]/15 shadow-xs hover:border-[#002B49]/30'
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition"
                >
                  <span className="font-serif font-bold text-base sm:text-lg text-[#002B49]">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#D4AF37] transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm font-sans text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </FadeInCardGroup>
      </div>
    </section>
  )
}
