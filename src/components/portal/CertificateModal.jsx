import { useRef, useState } from 'react'
import { Award, CheckCircle2, Download, Loader2, ShieldCheck, X } from 'lucide-react'

export default function CertificateModal({ certificate, onClose }) {
  const certRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  if (!certificate) return null

  const handlePrintCertificateOnly = () => {
    const certEl = certRef.current || document.getElementById('printable-certificate')
    if (!certEl) return

    setDownloading(true)

    // Cria um iframe oculto temporário para renderizar SOMENTE o certificado
    const printFrame = document.createElement('iframe')
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = '0'
    document.body.appendChild(printFrame)

    const frameDoc = printFrame.contentWindow.document

    // Clona todos os estilos e fontes da página atual
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n')

    frameDoc.open()
    frameDoc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Certificado - ${certificate.aluno} - ${certificate.codigo}</title>
          ${styleTags}
          <style>
            @page {
              size: 297mm 210mm landscape;
              margin: 0 !important;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 297mm !important;
              height: 210mm !important;
              max-width: 297mm !important;
              max-height: 210mm !important;
              overflow: hidden !important;
              background: #FCFBF7 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .cert-print-wrapper {
              width: 297mm !important;
              height: 210mm !important;
              padding: 8mm !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            #printable-certificate {
              width: 100% !important;
              height: 100% !important;
              max-height: 194mm !important;
              padding: 5mm 7mm !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .cert-inner-frame {
              width: 100% !important;
              height: 100% !important;
              padding: 4mm 6mm !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
            }
          </style>
        </head>
        <body>
          <div class="cert-print-wrapper">
            ${certEl.outerHTML}
          </div>
        </body>
      </html>
    `)
    frameDoc.close()

    // Aguarda carregamento de fontes e estilos antes de chamar a caixa de diálogo de impressão / salvar PDF
    setTimeout(() => {
      setDownloading(false)
      try {
        printFrame.contentWindow.focus()
        printFrame.contentWindow.print()
      } catch (err) {
        console.warn('Erro ao acionar impressão:', err)
      } finally {
        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 3000)
      }
    }, 500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#001424]/85 backdrop-blur-md animate-in fade-in overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-5xl bg-[#00223A] rounded-3xl p-3 sm:p-5 shadow-2xl border border-[#D4AF37]/30 my-auto print:border-none print:shadow-none print:p-0 print:bg-white print:max-w-none print:rounded-none">
        
        {/* Barra superior de ações (não aparece na impressão) */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 px-2 sm:px-4 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-xs sm:text-sm font-cta font-bold uppercase tracking-wider text-[#D4AF37]">
              Certificado Oficial Digital Autêntico
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* DOCUMENTO OFICIAL DO CERTIFICADO (LAYOUT DIPLOMA LUXO A4 HORIZONTAL) */}
        {/* ========================================================================= */}
        <div
          ref={certRef}
          id="printable-certificate"
          className="relative w-full bg-[#FCFBF7] text-[#002B49] rounded-2xl p-6 sm:p-10 md:p-14 shadow-inner border-8 border-double border-[#D4AF37] overflow-hidden select-none print:shadow-none print:border-8 print:rounded-none"
          style={{
            backgroundImage: `radial-gradient(rgba(212, 175, 55, 0.08) 1.5px, transparent 1.5px), radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(252, 251, 247, 0.98) 100%)`,
            backgroundSize: '24px 24px, 100% 100%'
          }}
        >
          {/* Marca d'água oficial no fundo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none">
            <img src="/logo.svg" alt="" className="w-[580px] h-[580px] object-contain" />
          </div>

          {/* Cantoneiras decorativas clássicas de diploma */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37]" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37]" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]" />

          {/* Moldura interna fina em dourado */}
          <div className="cert-inner-frame relative border border-[#D4AF37]/50 p-5 sm:p-7 md:p-8 rounded-xl space-y-4 sm:space-y-5">
            
            {/* Cabeçalho do Certificado */}
            <header className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#D4AF37]/30 pb-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.svg"
                  alt="Prof. Cesar Roberto Loureiro"
                  className="h-14 sm:h-16 w-auto object-contain"
                />
                <div>
                  <div className="text-xs sm:text-sm font-heading font-extrabold text-[#002B49] uppercase tracking-wide">
                    Prof. Cesar Roberto Loureiro
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#A88319] font-cta font-bold tracking-wider uppercase">
                    Consultório &amp; Plataforma de Formação Docente
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-sans">
                    Pedagogia • Psicopedagogia Clínica • Neuropsicopedagogia Institucional
                  </div>
                </div>
              </div>

              {/* Selo Dourado de Conclusão Oficial */}
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#FAF2D8] border border-[#D4AF37]/40 shadow-xs">
                <div className="w-10 h-10 rounded-full bg-[#002B49] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-md">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-[9px] font-cta font-bold uppercase tracking-wider text-[#A88319]">
                    Selo de Qualidade
                  </span>
                  <span className="block text-xs font-heading font-extrabold text-[#002B49] leading-tight">
                    MEC / Extensão
                  </span>
                </div>
              </div>
            </header>

            {/* Título Principal */}
            <div className="text-center space-y-1 pt-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-black tracking-wider text-[#002B49] uppercase">
                Certificado de Conclusão &amp; Extensão
              </h1>
              <p className="text-[11px] sm:text-xs font-cta uppercase tracking-widest text-[#A88319] font-bold">
                Reconhecimento de Mérito e Capacitação Profissional
              </p>
            </div>

            {/* Corpo do Certificado */}
            <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm font-sans text-slate-700 italic">
                Certificamos para os devidos fins de direito e comprovação que
              </p>

              {/* Nome do Aluno Destacado */}
              <div className="inline-block relative">
                <div className="text-2xl sm:text-3xl font-heading font-black text-[#002B49] tracking-tight px-6 sm:px-12 pb-1.5 border-b-2 border-[#D4AF37]">
                  {certificate.aluno}
                </div>
              </div>

              {/* Texto de Conclusão com Carga Horária e Título do Curso */}
              <p className="text-xs sm:text-sm md:text-base font-sans text-slate-800 leading-relaxed">
                concluiu com pleno aproveitamento e frequência integral o curso de formação continuada em{' '}
                <strong className="text-[#002B49] font-heading font-extrabold text-sm sm:text-base md:text-lg">
                  "{certificate.curso}"
                </strong>
                , ministrado pelo docente e especialista{' '}
                <strong className="text-[#002B49] font-bold">Prof. Cesar Roberto de Sousa Loureiro</strong>,
                cumprindo satisfatoriamente a carga horária total de{' '}
                <strong className="inline-block px-2 py-0.5 rounded-md bg-[#FAF2D8] border border-[#D4AF37]/50 text-[#002B49] font-bold">
                  {certificate.carga}
                </strong>
                .
              </p>
            </div>

            {/* Rodapé: Assinatura e Registro de Autenticidade */}
            <footer className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-4 border-t border-[#D4AF37]/30 items-end">
              {/* Box de Autenticidade e Hash */}
              <div className="sm:col-span-7 bg-white/80 backdrop-blur-xs p-3.5 sm:p-4 rounded-xl border border-[#D4AF37]/40 space-y-1.5 text-left">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-cta font-bold uppercase tracking-wider text-[#A88319]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Registro Oficial de Autenticidade</span>
                </div>
                <div className="font-mono text-xs sm:text-sm font-bold text-[#002B49] tracking-wider select-all">
                  {certificate.codigo}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-600 space-y-0.5">
                  <div>{certificate.livro}</div>
                  <div>Data de Expedição: <strong className="text-[#002B49]">{certificate.dataEmissao}</strong></div>
                  <div className="text-[9px] text-slate-400">
                    Válido em todo o território nacional como capacitação e horas complementares (MEC).
                  </div>
                </div>
              </div>

              {/* Assinatura do Professor */}
              <div className="sm:col-span-5 text-center flex flex-col items-center justify-end pb-1">
                {/* Linha e rubrica estilizada */}
                <div className="w-56 sm:w-64 border-b-2 border-[#002B49] pb-1 mb-1.5 flex flex-col items-center">
                  <span className="font-serif italic text-base sm:text-lg text-[#002B49] font-extrabold tracking-wide">
                    Cesar Roberto S. Loureiro
                  </span>
                </div>
                <span className="font-heading font-extrabold text-xs sm:text-sm text-[#002B49] uppercase tracking-wide">
                  Prof. Cesar Roberto Loureiro
                </span>
                <span className="text-[9px] sm:text-[10px] font-cta font-bold text-[#A88319] uppercase tracking-wider">
                  Diretor Técnico &amp; Coordenador Pedagógico
                </span>
              </div>
            </footer>

          </div>
        </div>

        {/* Barra Inferior com Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 px-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-cta font-bold uppercase tracking-wider transition cursor-pointer text-center"
          >
            Fechar
          </button>

          <button
            type="button"
            disabled={downloading}
            onClick={handlePrintCertificateOnly}
            className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#C59E27] disabled:opacity-50 text-[#002B49] text-xs font-cta font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition text-center"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#002B49]" />
                <span>Preparando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#002B49]" />
                <span>Salvar / Baixar em PDF</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
