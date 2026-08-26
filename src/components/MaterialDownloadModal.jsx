import { useState } from 'react'
import { X, Download, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function MaterialDownloadModal({ material, onClose }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Pai/Mãe/Responsável')
  const [downloaded, setDownloaded] = useState(false)

  if (!material) return null

  const handleDownload = (e) => {
    e.preventDefault()
    if (!name || !email) {
      alert('Por favor, informe seu nome e e-mail.')
      return
    }

    setDownloaded(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-slate-300 p-6 sm:p-8 relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 pr-6">
          <span className="text-xs font-cta font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#002B49]/10 text-[#002B49] border border-[#002B49]/20">
            {material.category}
          </span>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#002B49]">
            {material.title}
          </h3>
          <p className="text-xs font-sans text-slate-600 font-medium">
            {material.format} • {material.pages}
          </p>
        </div>

        {downloaded ? (
          <div className="bg-[#FAF2D8] border-2 border-[#D4AF37] rounded-2xl p-6 text-center space-y-3 shadow-md">
            <CheckCircle2 className="w-10 h-10 text-[#002B49] mx-auto" />
            <h4 className="font-serif font-bold text-lg text-[#002B49]">
              Download Liberado!
            </h4>
            <p className="text-xs sm:text-sm font-sans text-[#002B49] font-medium leading-relaxed">
              Obrigado, <strong>{name}</strong>! O link para download do material foi gerado e enviado para <strong>{email}</strong>.
            </p>
            <div className="pt-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  alert(`Iniciando download simulado do material: ${material.title}`)
                }}
                className="inline-flex items-center gap-2 bg-[#002B49] text-white px-5 py-2.5 rounded-full text-xs font-cta font-bold hover:bg-[#073B63] transition shadow-md"
              >
                <Download className="w-4 h-4 text-[#D4AF37]" />
                Clique aqui para baixar agora o PDF
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDownload} className="space-y-4">
            <p className="text-xs sm:text-sm font-sans text-slate-700 font-medium">
              Preencha seus dados abaixo para receber o material gratuito instantaneamente:
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#002B49] uppercase tracking-wide">
                Seu Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ana Clara"
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-500 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#002B49] uppercase tracking-wide">
                Seu Melhor E-mail *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-xs sm:text-sm font-semibold text-[#002B49] placeholder:text-slate-500 focus:outline-none transition shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#002B49] uppercase tracking-wide">
                Você é:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-xs sm:text-sm font-semibold text-[#002B49] focus:outline-none transition shadow-2xs cursor-pointer"
              >
                <option value="Pai/Mãe/Responsável">Pai / Mãe / Responsável</option>
                <option value="Professor(a)">Professor(a) / Educador(a)</option>
                <option value="Coordenador(a)/Diretor(a)">Coordenador(a) / Diretor(a) Escolar</option>
                <option value="Estudante/Adulto">Estudante / Adulto</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs font-sans text-slate-600 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Respeitamos sua privacidade. Zero spam.</span>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#002B49] hover:bg-[#073B63] text-white px-5 py-3.5 rounded-full font-cta font-bold text-xs sm:text-sm uppercase tracking-wider transition cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span>Baixar Material Gratuito</span>
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
