import { useState } from 'react'
import {
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  MapPin,
  Clock,
  Mail
} from 'lucide-react'
import CascadeRevealTitle from './CascadeRevealTitle'
import FadeInParagraph from './FadeInParagraph'
import FadeInCardGroup from './FadeInCardGroup'
import { siteData } from '../data/content'
import { formatPhoneNumber } from '../utils/phoneFormatter'

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    role: 'Família / Responsável',
    phone: '',
    email: '',
    subject: 'Atendimento Psicopedagógico',
    message: ''
  })
  const [sent, setSent] = useState(false)

  // Phone input formatting mask: (32) 99847-0152
  const handlePhoneChange = (e) => {
    setFormData((prev) => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone || !formData.message) {
      alert('Por favor, preencha nome, telefone e mensagem.')
      return
    }

    const msg = encodeURIComponent(
      `Olá, Prof. Cesar Loureiro! Mensagem enviada pelo formulário de contato:\n\n` +
      `👤 *Nome:* ${formData.name}\n` +
      `🏷️ *Perfil:* ${formData.role}\n` +
      `📱 *Telefone/WhatsApp:* ${formData.phone}\n` +
      `✉️ *E-mail:* ${formData.email || 'Não informado'}\n` +
      `📌 *Assunto de Interesse:* ${formData.subject}\n\n` +
      `💬 *Mensagem:* ${formData.message}`
    )

    window.open(`https://wa.me/5532998470152?text=${msg}`, '_blank')
    setSent(true)
  }

  return (
    <section id="contato" className="py-24 bg-[#F4F6F8] bg-pattern-grid border-b border-slate-200 relative overflow-hidden">
      {/* Subtle ambient light glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#002B49]/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#D4AF37]/4 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeInCardGroup cardSelector=".gsap-card" className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          
          {/* Left Column: Editorial Content & Direct Information */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 lg:pr-4">
            <div className="space-y-4">
              {/* Editorial Headline */}
              <CascadeRevealTitle className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-bold text-[#002B49] leading-[1.12] tracking-tight">
                Vamos transformar os desafios da aprendizagem juntos.
              </CascadeRevealTitle>

              {/* Intro Paragraph */}
              <FadeInParagraph className="text-sm sm:text-base font-sans text-slate-600 leading-relaxed">
                Conte-nos o que está travando o desenvolvimento escolar, cognitivo ou metodológico. Atendimentos especializados para crianças, jovens (adolescentes) e adultos no consultório em Recreio-MG e on-line em todo o Brasil.
              </FadeInParagraph>
            </div>

            {/* Direct Channel Badges & Address */}
            <div className="space-y-3 pt-2">
              {/* WhatsApp Card */}
              <div>
                <a
                  href={siteData.professional.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 hover:border-[#002B49]/40 shadow-xs hover:shadow-md transition inline-flex items-center gap-3.5 text-xs font-cta font-bold text-[#002B49] group cursor-pointer"
                >
                  <img
                    src="/whatsapp-icon.svg"
                    alt="WhatsApp"
                    className="w-8 h-8 object-contain group-hover:scale-105 transition shrink-0 drop-shadow-xs"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-sans uppercase font-medium">WhatsApp Direto</div>
                    <div className="truncate text-sm sm:text-base font-bold text-[#002B49]">{siteData.professional.phone}</div>
                  </div>
                </a>
              </div>

              {/* E-mail de Consultorias & Atendimento */}
              <div>
                <a
                  href={`mailto:${siteData.professional.email}`}
                  className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 hover:border-[#002B49]/40 shadow-xs hover:shadow-md transition inline-flex items-center gap-3.5 text-xs font-cta font-bold text-[#002B49] group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#002B49]/5 text-[#002B49] group-hover:bg-[#002B49] group-hover:text-[#D4AF37] flex items-center justify-center transition shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-sans uppercase font-medium">E-mail Profissional &amp; Consultorias</div>
                    <div className="truncate text-sm sm:text-base font-bold text-[#002B49]">{siteData.professional.email}</div>
                  </div>
                </a>
              </div>

              {/* Endereço & Horários */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 text-xs font-sans text-slate-600 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#002B49] block">Atendimento Presencial (Residência):</span>
                    <span>Rua Soldado Darcy Ferreira, 135 - Alto do Asilo, Recreio - MG (CEP 36.740-000)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1 border-t border-slate-100">
                  <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <div>
                    <span className="font-bold text-[#002B49]">Horário de Atendimento:</span>
                    <span className="ml-1 text-slate-600">08h às 12h e 14h às 18h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Modern High-Contrast Form Card */}
          <div className="lg:col-span-7">
            <div className="gsap-card bg-white rounded-[32px] sm:rounded-[40px] p-7 sm:p-10 lg:p-12 border-2 border-slate-300 shadow-2xl shadow-[#002B49]/8">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#002B49] tracking-tight">
                Entre em contato
              </h3>
              <p className="text-sm font-sans text-slate-600 mt-2 mb-8">
                Retornaremos seu contato em até 24 horas úteis.
              </p>

              {sent ? (
                <div className="p-8 rounded-3xl bg-emerald-50/70 border-2 border-emerald-300 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                  </div>
                  <h4 className="font-serif font-bold text-xl text-emerald-900">
                    Mensagem Encaminhada com Sucesso!
                  </h4>
                  <p className="text-sm font-sans text-emerald-800 max-w-md mx-auto leading-relaxed">
                    Sua mensagem foi estruturada e aberta no canal oficial de atendimento. Em breve retornaremos com a atenção que você merece.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-2 text-xs font-cta font-bold text-[#002B49] hover:text-[#073B63] underline cursor-pointer"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Field 1: Full Name */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-[#002B49] uppercase tracking-wide mb-2 block">
                      Seu Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Jessica Mercedes"
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-500 focus:outline-none transition-all duration-200"
                    />
                  </div>

                  {/* Field 2 & 3: Role & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-[#002B49] uppercase tracking-wide mb-2 block">
                        Seu Perfil / Vínculo
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-sm sm:text-base font-semibold text-[#002B49] focus:outline-none transition-all duration-200 cursor-pointer"
                      >
                        <option value="Família / Responsável">Família / Responsável</option>
                        <option value="Escola / Gestor / Direção">Escola / Gestor / Direção</option>
                        <option value="Professor(a) / Educador(a)">Professor(a) / Educador(a)</option>
                        <option value="Estudante Adulto">Estudante Adulto</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-bold text-[#002B49] uppercase tracking-wide mb-2 block">
                        WhatsApp ou Telefone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        placeholder="(32) 99847-0152"
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-500 focus:outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Field 4 & 5: Email & Subject */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-[#002B49] uppercase tracking-wide mb-2 block">
                        Endereço de E-mail
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seuemail@exemplo.com"
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-500 focus:outline-none transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="text-xs sm:text-sm font-bold text-[#002B49] uppercase tracking-wide mb-2 block">
                        Assunto de Interesse
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-sm sm:text-base font-semibold text-[#002B49] focus:outline-none transition-all duration-200 cursor-pointer"
                      >
                        <option value="Atendimento Psicopedagógico">Atendimento Psicopedagógico</option>
                        <option value="Atendimento Neuropsicopedagógico">Atendimento Neuropsicopedagógico</option>
                        <option value="Apoio Pedagógico & Reforço">Apoio Pedagógico & Reforço</option>
                        <option value="Consultoria Escolar (B2B)">Consultoria Escolar (B2B)</option>
                        <option value="Cursos e Treinamentos">Cursos e Treinamentos</option>
                        <option value="Outras Dúvidas">Outras Dúvidas</option>
                      </select>
                    </div>
                  </div>

                  {/* Field 6: Message */}
                  <div>
                    <label className="text-xs sm:text-sm font-bold text-[#002B49] uppercase tracking-wide mb-2 block">
                      Mensagem *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Conte-nos o que você precisa ou quais são suas principais dúvidas..."
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-300 hover:border-slate-400 focus:border-[#002B49] focus:bg-white focus:ring-3 focus:ring-[#002B49]/15 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-500 focus:outline-none transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* LGPD Security note */}
                  <div className="flex items-center gap-2 text-xs font-sans text-slate-500 pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Seus dados são protegidos e tratados sob estrito sigilo ético (LGPD).</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full pl-6 pr-2 py-3.5 sm:py-4 rounded-full bg-[#002B49] hover:bg-[#073B63] text-white font-cta font-bold text-sm sm:text-base inline-flex items-center justify-between transition shadow-md hover:shadow-lg cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>Enviar Mensagem</span>
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-[#002B49] flex items-center justify-center">
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </div>
                  </button>
                </form>
              )}
            </div>
          </div>

        </FadeInCardGroup>
      </div>
    </section>
  )
}
