import { X, CheckCircle2, Calendar, Target } from 'lucide-react'

export default function ServiceDetailModal({ service, onClose, onBookThisService }) {
  if (!service) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 pr-8">
          <span className="text-[11px] font-cta font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#002B49]/5 text-[#002B49] border border-[#002B49]/10">
            {service.category}
          </span>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#002B49]">
            {service.title}
          </h3>
          <p className="text-xs sm:text-sm font-cta font-bold text-[#D4AF37]">
            {service.tagline}
          </p>
        </div>

        {/* Detailed description */}
        <div className="text-sm font-sans text-slate-600 leading-relaxed space-y-3">
          <p>{service.fullDesc}</p>
        </div>

        {/* Process */}
        <div className="bg-[#F4F6F8] rounded-2xl p-5 border border-slate-200 space-y-3">
          <div className="text-xs font-cta font-bold uppercase text-[#002B49] tracking-wider flex items-center gap-1.5">
            <Target className="w-4 h-4 text-[#D4AF37]" />
            Como Funciona o Processo:
          </div>
          <ul className="space-y-2.5">
            {service.points.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-sans text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Target and modality info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans text-slate-600">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <strong className="text-[#002B49] block mb-1">Público-Alvo:</strong>
            {service.target}
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <strong className="text-[#002B49] block mb-1">Modalidade:</strong>
            {service.modality}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-300 text-xs font-cta font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              onClose()
              onBookThisService(service.id)
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#002B49] hover:bg-[#073B63] text-white px-6 py-2.5 rounded-full font-cta font-bold text-xs transition cursor-pointer shadow-sm"
          >
            <Calendar className="w-4 h-4 text-[#D4AF37]" />
            <span>Agendar este Serviço</span>
          </button>
        </div>
      </div>
    </div>
  )
}
