import { useState } from 'react'
import { X, ShieldCheck, Lock, FileText, CheckCircle2, Mail } from 'lucide-react'

export default function PrivacyModal({ isOpen, onClose }) {
  const [activeSection, setActiveSection] = useState('overview')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#002B49] text-xs font-cta font-bold">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            Conformidade LGPD (Lei nº 13.709/2018) &amp; Certificação SSL (HTTPS)
          </div>
          <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#002B49]">
            Política de Privacidade, Proteção de Dados &amp; Segurança
          </h3>
          <p className="text-xs font-sans text-slate-500">
            Última atualização: Agosto de 2026 • Controlador: Prof. Cesar Roberto de Sousa Loureiro
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs font-cta font-bold">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              activeSection === 'overview'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            1. Visão Geral &amp; Controlador
          </button>
          <button
            onClick={() => setActiveSection('children')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              activeSection === 'children'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            2. Dados de Menores (Art. 14)
          </button>
          <button
            onClick={() => setActiveSection('ssl')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              activeSection === 'ssl'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            3. Criptografia SSL (HTTPS)
          </button>
          <button
            onClick={() => setActiveSection('rights')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              activeSection === 'rights'
                ? 'bg-[#002B49] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            4. Seus Direitos (Art. 18)
          </button>
        </div>

        {/* Tab Contents */}
        <div className="text-xs sm:text-sm font-sans text-slate-600 space-y-4 leading-relaxed min-h-[220px]">
          {activeSection === 'overview' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <h4 className="font-serif font-bold text-[#002B49] text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                1. Identificação do Controlador &amp; Finalidades
              </h4>
              <p>
                O profissional <strong>Cesar Roberto de Sousa Loureiro</strong> (Pedagogo, Psicopedagogo e Neuropsicopedagogo Clínico), com atuação em Recreio - MG e On-line Nacional, atua como <strong>Controlador de Dados Pessoais</strong> nos termos do Art. 5º, VI da Lei nº 13.709/2018 (LGPD).
              </p>
              <p>
                Os dados pessoais coletados neste site (nome, telefone/WhatsApp, e-mail, idade e queixa escolar) têm a finalidade estrita e exclusiva de:
              </p>
              <ul className="space-y-1.5 list-disc pl-5 text-slate-700">
                <li>Agendamento e realização de avaliações psicopedagógicas e neuropsicopedagógicas;</li>
                <li>Envio de laudos, relatórios diagnósticos e orientações familiares solicitadas;</li>
                <li>Atendimento a solicitações institucionais de consultoria e capacitação docente (B2B);</li>
                <li>Disponibilização de materiais pedagógicos gratuitos e acesso ao Ambiente Virtual de Aprendizagem (AVA).</li>
              </ul>
            </div>
          )}

          {activeSection === 'children' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <h4 className="font-serif font-bold text-[#002B49] text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                2. Tratamento Especial de Dados de Crianças e Adolescentes (Art. 14)
              </h4>
              <p>
                Em observância rigorosa ao <strong>Artigo 14 da LGPD</strong> e aos preceitos do <strong>Estatuto da Criança e do Adolescente (ECA)</strong>, o tratamento de dados de menores ocorre no seu melhor interesse e depende obrigatoriamente do consentimento específico e em destaque dado por pelo menos um dos pais ou responsável legal.
              </p>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                <strong>Sigilo Ético Absoluto:</strong>
                <p className="text-xs">
                  Informações sobre neurodesenvolvimento, histórico escolar, laudos e hipóteses diagnósticas (TDAH, TEA, Dislexia) são tratadas como <strong>dados sensíveis</strong> e protegidas sob sigilo profissional estrito (Códigos de Ética da Psicopedagogia e Neuropsicopedagogia). Nenhum laudo é enviado a escolas ou terceiros sem autorização prévia por escrito da família.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'ssl' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <h4 className="font-serif font-bold text-[#002B49] text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D4AF37]" />
                3. Segurança da Informação &amp; Criptografia SSL (HTTPS)
              </h4>
              <p>
                Todas as transmissões de dados neste ecossistema são protegidas por <strong>Certificado de Segurança SSL/TLS de 256 bits com protocolo HTTPS ativo</strong>, garantindo que suas mensagens, solicitações e dados trafeguem de ponta a ponta criptografados, prevenindo interceptações indevidas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-[#002B49] flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Protocolo HTTPS Forçado
                  </div>
                  <p className="text-xs text-slate-500">
                    Redirecionamento automático 301 de qualquer conexão HTTP para canal HTTPS criptografado com HSTS.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-[#002B49] flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Armazenamento Restrito
                  </div>
                  <p className="text-xs text-slate-500">
                    Prontuários e laudos são arquivados em ambientes criptografados com acesso restrito e autenticação segura.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'rights' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <h4 className="font-serif font-bold text-[#002B49] text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D4AF37]" />
                4. Direitos do Titular (Art. 18) &amp; Canal do Encarregado (DPO)
              </h4>
              <p>
                Nos termos do <strong>Art. 18 da LGPD</strong>, você ou seu responsável legal tem o direito de, a qualquer momento e mediante solicitação gratuita:
              </p>
              <ul className="space-y-1 list-disc pl-5 text-slate-700 text-xs sm:text-sm">
                <li>Confirmar a existência de tratamento e acessar os dados arquivados;</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                <li>Revogar o consentimento previamente concedido.</li>
              </ul>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#002B49] text-[#D4AF37] flex items-center justify-center font-bold shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#002B49]">Canal de Atendimento de Privacidade:</div>
                    <div className="text-xs text-slate-600 font-medium">privacidade@cesarlobanopedagogia.com.br</div>
                  </div>
                </div>
                <a
                  href="mailto:privacidade@cesarlobanopedagogia.com.br"
                  className="px-3.5 py-1.5 rounded-full bg-[#002B49] text-white text-xs font-cta font-bold hover:bg-[#073B63] transition shrink-0"
                >
                  Enviar E-mail
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-sans">
            Em conformidade com a Autoridade Nacional de Proteção de Dados (ANPD).
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#002B49] text-white text-xs font-cta font-bold hover:bg-[#073B63] transition cursor-pointer shadow-sm"
          >
            Entendido e Concordo
          </button>
        </div>
      </div>
    </div>
  )
}

