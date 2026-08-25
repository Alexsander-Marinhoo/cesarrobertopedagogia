import { X, Clock, Share2 } from 'lucide-react'

export default function ArticleModal({ article, onClose }) {
  if (!article) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-3 pr-8">
          <div className="flex items-center gap-3 text-xs font-sans text-slate-500">
            <span className="font-cta font-bold text-[#002B49] px-2.5 py-0.5 rounded bg-[#D4AF37]/20">
              {article.category}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
            <span>• {article.date}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#002B49] leading-tight">
            {article.title}
          </h3>

          <div className="text-xs font-sans text-slate-500 font-medium">
            Por <strong className="text-[#002B49]">Cesar Roberto de Sousa Loureiro</strong> — Pedagogo e Neuropsicopedagogo
          </div>
        </div>

        <div className="text-slate-700 font-sans text-sm leading-relaxed space-y-4 pt-2 border-t border-slate-100">
          <p className="font-medium text-slate-900 text-base leading-relaxed">
            {article.excerpt}
          </p>

          <p>
            No contexto educacional contemporâneo, a confluência entre a prática pedagógica e os avanços da neurociência tem demonstrado que cada cérebro aprende por rotas singulares. Quando compreendemos a arquitetura neurocognitiva das funções executivas — especialmente a memória de trabalho, o controle inibitório e a flexibilidade cognitiva —, tornamo-nos capazes de planejar intervenções altamente precisas.
          </p>

          <h4 className="font-serif font-bold text-lg text-[#002B49] pt-2">
            A Importância da Abordagem Estruturada
          </h4>

          <p>
            Alunos que apresentam dificuldades persistentes na alfabetização ou no raciocínio lógico-matemático frequentemente não possuem déficit intelectual, mas sim entraves na consolidação de rotinas atencionais ou déficits no processamento fonológico e visoespacial.
          </p>

          <p>
            A intervenção psicopedagógica atua diretamente na reconstrução do vínculo do indivíduo com o objeto de conhecimento, promovendo autoconfiança e autonomia duradouras.
          </p>

          <div className="p-4 rounded-2xl bg-[#F4F6F8] border border-slate-200 text-xs font-serif text-[#002B49] italic">
            "Educar não é impor conteúdos pré-moldados, mas sim construir pontes seguras para que cada mente descubra a potência do seu próprio aprender."
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: article.title,
                  text: article.excerpt,
                  url: window.location.href
                })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('Link do artigo copiado para a área de transferência!')
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-cta font-bold text-[#002B49] hover:text-[#073B63] cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Compartilhar Artigo</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#002B49] text-white text-xs font-cta font-bold hover:bg-[#073B63] transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
