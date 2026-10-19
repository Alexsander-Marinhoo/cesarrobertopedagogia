import { useState, useEffect } from 'react'

export default function FloatingWhatsAppButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling past hero section (150px)
      if (window.scrollY > 150) {
        setVisible(true)
      } else {
        setVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const defaultMessage = encodeURIComponent(
    'Olá, Prof. Cesar Roberto! Gostaria de informações sobre atendimentos e consultoria.'
  )
  const whatsappUrl = `https://wa.me/5532987252421?text=${defaultMessage}`

  return (
    <aside
      aria-label="Atendimento rápido via WhatsApp"
      className={`fixed bottom-6 right-6 z-50 transition-all duration-500 transform ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
          : 'opacity-0 translate-y-6 pointer-events-none scale-75'
      }`}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Conversar com o Prof. Cesar Roberto no WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xl shadow-[#25D366]/40 hover:shadow-[#25D366]/60 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
      >
        {/* Subtle pulsating radar ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-35 animate-ping group-hover:opacity-60 pointer-events-none" />

        {/* WhatsApp Icon */}
        <img
          src="/whatsapp-icon.svg"
          alt="WhatsApp"
          className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-md relative z-10 transition-transform duration-300 group-hover:rotate-6"
        />

        {/* Tooltip on desktop hover */}
        <span className="hidden sm:block absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-[#002B49] text-white text-xs font-serif font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 shadow-lg pointer-events-none border border-[#073B63]">
          Falar no WhatsApp
          {/* Tooltip triangle */}
          <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-[#002B49]" />
        </span>
      </a>
    </aside>
  )
}
