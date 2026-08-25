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
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 pr-6">
          <span className="text-[11px] font-cta font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#002B49]/5 text-[#002B49]">
            {material.category}
          </span>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#002B49]">
            {material.title}
          </h3>
          <p className="text-xs font-sans text-slate-500">
            {material.format} • {material.pages}
          </p>
        </div>

        {downloaded ? (
          <div className="bg-[#FAF2D8] border border-[#D4AF37]/40 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#002B49] mx-auto" />
            <h4 className="font-serif font-bold text-lg text-[#002B49]">
              Download Liberado!
            </h4>
            <p className="text-xs font-sans text-[#002B49]/80 leading-relaxed">
              Obrigado, <strong>{name}</strong>! O link para download do material foi gerado e enviado para <strong>{email}</strong>.
            </p>
            <div className="pt-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  alert(`Iniciando download simulado do material: ${material.title}`)
                }}
                className="inline-flex items-center gap-2 bg-[#002B49] text-white px-5 py-2.5 rounded-full text-xs font-cta font-bold hover:bg-[#073B63] transition shadow-sm"
              >
                <Download className="w-4 h-4 text-[#D4AF37]" />
                Clique aqui para baixar agora o PDF
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDownload} className="space-y-4">
            <p className="text-xs font-sans text-slate-600">
              Preencha seus dados abaixo para receber o material gratuito instantaneamente:
            </p>

            <div>
              <label className="block text-xs font-sans font-medium text-slate-700 mb-1">
                Seu Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ana Clara"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-sans focus:outline-none focus:border-[#002B49]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-slate-700 mb-1">
                Seu Melhor E-mail *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-sans focus:outline-none focus:border-[#002B49]"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-slate-700 mb-1">
                Você é:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm font-sans text-slate-800 focus:outline-none focus:border-[#002B49]"
              >
                <option value="Pai/Mãe/Responsável">Pai / Mãe / Responsável</option>
                <option value="Professor(a)">Professor(a) / Educador(a)</option>
                <option value="Coordenador(a)/Diretor(a)">Coordenador(a) / Diretor(a) Escolar</option>
                <option value="Estudante/Adulto">Estudante / Adulto</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-sans text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Respeitamos sua privacidade. Zero spam.</span>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#002B49] hover:bg-[#073B63] text-white px-5 py-3 rounded-full font-cta font-bold text-xs transition cursor-pointer shadow-sm"
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
