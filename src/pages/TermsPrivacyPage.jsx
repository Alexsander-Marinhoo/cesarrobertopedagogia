import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function TermsPrivacyPage() {
  const navigate = useNavigate()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/cadastro')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#1E293B] font-sans antialiased selection:bg-[#D4AF37] selection:text-[#002B49] py-6 sm:py-10 px-3 sm:px-6">
      
      {/* Top Floating Minimal Navigation Bar */}
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 mb-6 px-2 print:hidden">
        <button
          onClick={() => navigate('/')}
          className="flex items-center cursor-pointer group hover:opacity-90 transition"
          aria-label="Voltar para a página inicial"
        >
          <img
            src="/logo.svg"
            alt="Logo Prof. Cesar Roberto Loureiro"
            className="h-12 sm:h-16 w-auto max-w-[180px] sm:max-w-[240px] object-contain"
          />
        </button>

        <button
          onClick={handleGoBack}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white text-xs font-cta font-bold transition cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Voltar</span>
        </button>
      </div>

      {/* Formal Paper / PDF Document Sheet */}
      <article className="max-w-4xl mx-auto bg-white border border-slate-200/90 shadow-md sm:rounded-2xl p-6 sm:p-12 lg:p-16 space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Document Formal Header with Prominent Logo */}
        <header className="space-y-6 pb-6 border-b border-slate-300 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start gap-4">
            <img
              src="/logo.svg"
              alt="Logo Oficial Prof. Cesar Roberto Loureiro"
              className="h-20 sm:h-26 lg:h-30 w-auto max-w-[260px] sm:max-w-[340px] object-contain"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-black tracking-tight text-[#002B49] uppercase">
                Termos de Uso &amp; Política de Privacidade
              </h1>
              <p className="text-xs sm:text-sm font-sans text-slate-600 font-medium mt-1">
                Portal Psicopedagógico Digital • Prof. Cesar Roberto Loureiro
              </p>
            </div>
          </div>
        </header>

        {/* Document Body Texts (Titles and Paragraphs Only) */}
        <div className="space-y-8 text-xs sm:text-sm font-sans text-slate-700 leading-relaxed text-justify sm:text-left">
          
          {/* Cláusula 1 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-heading font-bold text-[#002B49] uppercase tracking-wide">
              1. Disposições Iniciais e Aceitação
            </h2>
            <p>
              O presente instrumento regulamenta os termos e as condições de uso da plataforma digital do Prof. Cesar Roberto Loureiro, abrangendo o site institucional, o Portal do Paciente e Família, o Portal de Escolas Conveniadas, o Ambiente Virtual de Aprendizagem (AVA) e as modalidades de atendimento psicopedagógico presencial e remoto.
            </p>
            <p>
              Ao efetuar o cadastro, criar credenciais de acesso ou interagir com os formulários de triagem e agendamento, o usuário (ou seu responsável legal, no caso de menores de idade) expressa plena concordância e adesão às normas aqui descritas, em consonância com o Código de Ética da Associação Brasileira de Psicopedagogia (ABPp) e com o ordenamento jurídico brasileiro.
            </p>
          </section>

          {/* Cláusula 2 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-heading font-bold text-[#002B49] uppercase tracking-wide">
              2. Tratamento de Dados Pessoais e Conformidade com a LGPD
            </h2>
            <p>
              Em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018 – LGPD), informamos com total clareza a natureza dos dados tratados e suas respectivas bases legais:
            </p>
            <p>
              <strong>2.1. Dados Cadastrais e de Contato:</strong> Coletamos nome completo, endereço de correio eletrônico, número de telefone/WhatsApp, endereço residencial e data de nascimento. Essas informações são estritamente necessárias para a criação de conta de usuário, autenticação segura, comunicação direta de horários e emissão de recibos e comprovantes de prestação de serviços.
            </p>
            <p>
              <strong>2.2. Dados Pessoais Sensíveis (Saúde e Aprendizagem):</strong> O atendimento psicopedagógico demanda o registro e a análise de dados relativos ao desenvolvimento cognitivo, histórico escolar, hipóteses diagnósticas de neurodesenvolvimento (como TDAH, Dislexia, TEA e Funções Executivas), além de anotações de evolução clínica e planos de intervenção (PDI). O tratamento desses dados sensíveis é fundamentado no consentimento específico e em destaque concedido pelos responsáveis legais (Art. 11, inciso I e II da LGPD) e no compromisso ético de proteção integral da criança e do adolescente.
            </p>
          </section>

          {/* Cláusula 3 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-heading font-bold text-[#002B49] uppercase tracking-wide">
              3. Sigilo Profissional e Prontuário Digital
            </h2>
            <p>
              O Prof. Cesar Roberto Loureiro assume o compromisso de sigilo absoluto sobre todas as informações reveladas durante as consultas, anamneses e baterias de avaliação psicopedagógica.
            </p>
            <p>
              <strong>3.1. Armazenamento e Criptografia:</strong> Os prontuários e laudos digitais são armazenados em infraestrutura de nuvem de alta segurança com criptografia de ponta a ponta (AES-256 e SSL/TLS) e políticas restritas de segurança em nível de linha (Row Level Security - RLS).
            </p>
            <p>
              <strong>3.2. Acesso e Download de Documentos:</strong> A visualização e o download de laudos clínicos em formato PDF no portal de membros utilizam assinaturas criptográficas temporárias, com links que expiram automaticamente após 60 (sessenta) segundos, impedindo o acesso não autorizado ou o compartilhamento indevido.
            </p>
          </section>

          {/* Cláusula 4 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-heading font-bold text-[#002B49] uppercase tracking-wide">
              4. Direitos do Titular dos Dados
            </h2>
            <p>
              O titular dos dados (ou seu representante legal) poderá, a qualquer momento e mediante requisição expressa aos canais oficiais de atendimento, exercer seus direitos assegurados pelo Artigo 18 da LGPD, incluindo:
            </p>
            <p>
              a) Confirmação da existência de tratamento de seus dados;<br />
              b) Acesso facilitado e integral aos seus dados pessoais e ao histórico de laudos emitidos;<br />
              c) Correção de dados incompletos, inexatos ou desatualizados;<br />
              d) Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;<br />
              e) Revogação do consentimento, ressalvada a guarda de registros obrigatórios por dever legal ou regulatório.
            </p>
          </section>

          {/* Cláusula 5 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-heading font-bold text-[#002B49] uppercase tracking-wide">
              5. Segurança da Conta e Responsabilidades do Usuário
            </h2>
            <p>
              O usuário é exclusivamente responsável por manter a confidencialidade de sua senha de acesso e por todas as atividades realizadas em sua conta. É terminantemente proibido o compartilhamento de credenciais de acesso com terceiros.
            </p>
            <p>
              Em caso de suspeita de violação de segurança ou extravio de credenciais, o usuário deve notificar imediatamente o suporte por meio dos canais informados neste documento.
            </p>
          </section>

          {/* Cláusula 6 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-heading font-bold text-[#002B49] uppercase tracking-wide">
              6. Encarregado de Proteção de Dados (DPO) e Contato
            </h2>
            <p>
              Para esclarecimento de dúvidas sobre estes Termos de Uso, solicitação de direitos de privacidade ou qualquer comunicação referente ao tratamento de dados pessoais, o contato oficial com o responsável e encarregado de dados deve ser efetuado através dos seguintes canais:
            </p>
            <p>
              <strong>Prof. Cesar Roberto de Sousa Loureiro</strong> – Psicopedagogo &amp; Neuropsicopedagogo Clínico<br />
              <strong>Correio Eletrônico:</strong> cesar.psicopedagogia@gmail.com<br />
              <strong>Atendimento Telefônico / WhatsApp:</strong> (32) 98725-2421<br />
              <strong>Endereço de Atendimento:</strong> Rua Soldado Darcy Ferreira, 135 – Alto do Asilo, Recreio – MG, CEP 36.740-000
            </p>
          </section>

          {/* Cláusula 7 */}
          <section className="space-y-3">
            <h2 className="text-sm sm:text-base font-heading font-bold text-[#002B49] uppercase tracking-wide">
              7. Foro e Legislação Aplicável
            </h2>
            <p>
              Este instrumento é regido e interpretado segundo as leis da República Federativa do Brasil. Para a solução de quaisquer controvérsias decorrentes deste documento, fica eleito o Foro da Comarca de Leopoldina/Recreio, Estado de Minas Gerais, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

        </div>

        {/* Document Signature / Formal Signoff */}
        <footer className="pt-10 mt-10 border-t border-slate-300 space-y-4 text-center sm:text-left">
          <div className="space-y-1 text-xs font-sans text-slate-600">
            <p className="font-bold text-[#002B49]">PROF. CESAR ROBERTO LOUREIRO</p>
            <p>Psicopedagogo Clínico &amp; Neuropsicopedagogo</p>
            <p>Recreio – Minas Gerais, 2026</p>
          </div>
        </footer>

      </article>

    </div>
  )
}
