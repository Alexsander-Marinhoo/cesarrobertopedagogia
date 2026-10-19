import { useState, useEffect } from 'react'
import {
  CheckCircle2,
  ShieldCheck,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CalendarDays,
  Sparkles
} from 'lucide-react'
import CascadeRevealTitle from './CascadeRevealTitle'
import FadeInParagraph from './FadeInParagraph'
import FadeInCardGroup from './FadeInCardGroup'
import { siteData } from '../data/content'
import { useAuth } from '../context/AuthContext'
import { submitBookingToSupabase, fetchBookedSlotsForDate } from '../services/portalService'
import { formatPhoneNumber } from '../utils/phoneFormatter'

export default function BookingSection({ _preselectedAudience, preselectedService }) {
  const { user, profile } = useAuth()

  const [service, setService] = useState(preselectedService || '')

  useEffect(() => {
    if (preselectedService) {
      setService(preselectedService)
    }
  }, [preselectedService])

  const [modality, setModality] = useState('')
  const [patientAgeGroup, setPatientAgeGroup] = useState('')
  
  // Date and Time Slots configuration
  const getTodayLocalDate = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const todayISO = getTodayLocalDate()
  const [selectedDate, setSelectedDate] = useState('')
  const [dateError, setDateError] = useState('')
  
  // Available attendance hours
  const timeSlots = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00'
  ]

  // Helper para checar se a data é fim de semana (sábado ou domingo)
  const isWeekend = (dateStr) => {
    if (!dateStr) return false
    const parts = dateStr.split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) return false
    const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0)
    const day = d.getDay()
    return day === 0 || day === 6
  }

  // Helper para checar se o horário já passou para a data selecionada
  const isSlotPast = (slot, dateStr) => {
    if (!dateStr || !slot) return false
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = slot.split(':').map(Number)
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) return false
    const slotDate = new Date(year, month - 1, day, hours, minutes, 0)
    return slotDate.getTime() <= Date.now()
  }

  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [bookedSlots, setBookedSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Consulta no Supabase os horários já ocupados para o dia selecionado
  useEffect(() => {
    let isMounted = true
    async function loadBookedSlots() {
      if (!selectedDate || isWeekend(selectedDate)) {
        setBookedSlots([])
        setSelectedTimeSlot('')
        return
      }
      setLoadingSlots(true)
      try {
        const booked = await fetchBookedSlotsForDate(selectedDate)
        if (isMounted) {
          setBookedSlots(booked)
          // Se o horário selecionado estiver ocupado ou no passado, seleciona o primeiro disponível
          const isCurrentPast = isSlotPast(selectedTimeSlot, selectedDate)
          if (booked.includes(selectedTimeSlot) || isCurrentPast || !selectedTimeSlot) {
            const firstAvailable = timeSlots.find((s) => !booked.includes(s) && !isSlotPast(s, selectedDate))
            setSelectedTimeSlot(firstAvailable || '')
          }
        }
      } catch (err) {
        console.warn('Erro ao verificar horários ocupados:', err)
      } finally {
        if (isMounted) setLoadingSlots(false)
      }
    }

    loadBookedSlots()
    return () => { isMounted = false }
  }, [selectedDate])

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    consentLGPD: true
  })

  // Autofill if user is logged in
  useEffect(() => {
    if (user || profile) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || profile?.nome_completo || user?.user_metadata?.nome_completo || '',
        phone: prev.phone || formatPhoneNumber(profile?.telefone || user?.user_metadata?.telefone || ''),
        email: prev.email || user?.email || ''
      }))
    }
  }, [user, profile])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [whatsappUrlGenerated, setWhatsappUrlGenerated] = useState('')

  const handlePhoneChange = (e) => {
    const val = e.target.value
    setFormData((prev) => ({
      ...prev,
      phone: formatPhoneNumber(val)
    }))
  }

  // Handle Date Selection with Monday to Friday (Dias Úteis) restriction
  const handleDateChange = (e) => {
    const val = e.target.value
    setDateError('')

    if (!val) {
      setSelectedDate('')
      setSelectedTimeSlot('')
      return
    }

    if (isWeekend(val)) {
      setDateError('Atendimentos ocorrem exclusivamente de Segunda a Sexta-feira (08h às 12h e 14h às 18h). Por favor, escolha um dia útil.')
      setSelectedDate(val)
      setSelectedTimeSlot('')
      return
    }

    // Se o dia selecionado for hoje, verifica se todos os horários já passaram
    const allPast = timeSlots.every((s) => isSlotPast(s, val))
    if (allPast) {
      setDateError('Todos os horários de atendimento para a data de hoje já foram encerrados. Por favor, selecione um próximo dia útil.')
    }

    setSelectedDate(val)
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.phone) {
      alert('Por favor, informe seu nome e número de WhatsApp para contato.')
      return
    }

    if (!service) {
      alert('Por favor, selecione a especialidade ou serviço desejado.')
      return
    }

    if (!modality) {
      alert('Por favor, selecione o formato do atendimento (Presencial ou Teleatendimento).')
      return
    }

    if (!selectedDate) {
      setDateError('Por favor, selecione uma data válida para o atendimento (segunda a sexta-feira).')
      return
    }

    const parts = selectedDate.split('-').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) {
      setDateError('Data inválida. Por favor, selecione uma data válida.')
      return
    }

    const [year, month, day] = parts
    const pickedDate = new Date(year, month - 1, day, 12, 0, 0)
    if (pickedDate.getDay() === 0 || pickedDate.getDay() === 6) {
      setDateError('Atendimentos ocorrem exclusivamente de Segunda a Sexta-feira. Por favor, escolha um dia útil.')
      return
    }

    if (!selectedTimeSlot) {
      alert('Por favor, selecione um dos horários disponíveis.')
      return
    }

    if (isSlotPast(selectedTimeSlot, selectedDate)) {
      alert('O horário selecionado já foi ultrapassado para o dia de hoje. Por favor, selecione um horário futuro disponível.')
      return
    }

    if (bookedSlots.includes(selectedTimeSlot)) {
      alert('Este horário já se encontra reservado para este dia. Por favor, selecione outro horário disponível.')
      return
    }

    setIsSubmitting(true)

    const serviceName = siteData.services.find((s) => s.id === service)?.title || service
    const modalityText = modality === 'presencial'
      ? 'Presencial (Consultório Residencial: Rua Soldado Darcy Ferreira, 135 - Recreio/MG)'
      : 'Teleatendimento On-line'

    // Formata a data para visualização amigável
    const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    const weekdayName = pickedDate.toLocaleDateString('pt-BR', { weekday: 'long' })

    // 1. Salva na Tabela `agendamentos` do Supabase
    try {
      await submitBookingToSupabase({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        service: service,
        serviceName: serviceName,
        modality: modality,
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        notes: patientAgeGroup ? `[Faixa Etária: ${patientAgeGroup}] ${formData.notes || ''}`.trim() : formData.notes,
        userId: user?.id
      })
      // Atualiza imediatamente a lista de ocupados
      setBookedSlots((prev) => [...prev, selectedTimeSlot])
    } catch (err) {
      console.warn('Aviso ao registrar agendamento no Supabase:', err)
    }

    // 2. Gera Mensagem Formatada para WhatsApp
    const message = encodeURIComponent(
      `Olá, Prof. Cesar Roberto Loureiro! Gostaria de agendar um atendimento.\n\n` +
      `🩺 *Especialidade/Serviço:* ${serviceName}\n` +
      `📍 *Modalidade:* ${modalityText}\n` +
      (patientAgeGroup ? `👥 *Faixa Etária:* ${patientAgeGroup}\n` : '') +
      `📅 *Data Escolhida:* ${formattedDate} (${weekdayName})\n` +
      `⏰ *Horário:* ${selectedTimeSlot}\n\n` +
      `👤 *Nome:* ${formData.name}\n` +
      `📱 *WhatsApp:* ${formData.phone}\n` +
      (formData.email ? `✉️ *E-mail:* ${formData.email}\n` : '') +
      (formData.notes ? `📝 *Observações / Queixa:* ${formData.notes}\n` : '')
    )

    const fullWhatsappUrl = `https://wa.me/5532987252421?text=${message}`
    setWhatsappUrlGenerated(fullWhatsappUrl)
    setIsSubmitting(false)
    setSubmitted(true)
  }

  return (
    <section id="agendamento" className="py-24 bg-[#F4F6F8] bg-pattern-grid border-b border-slate-200 relative overflow-hidden">
      {/* Subtle ambient flares */}
      <div className="absolute top-10 left-1/4 w-80 h-80 bg-[#D4AF37]/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#002B49]/3 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-300 bg-white/80 text-[#002B49] text-[11px] font-cta font-bold uppercase tracking-wider mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Atendimento para Crianças • Jovens • Adultos</span>
          </div>

          <CascadeRevealTitle className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#002B49] leading-[1.08] sm:leading-[1.05]">
            Agende sua Consulta ou Atendimento
          </CascadeRevealTitle>
          <FadeInParagraph className="mt-3 text-sm sm:text-base font-sans text-slate-600 max-w-2xl mx-auto">
            Atendimento especializado para <strong>crianças, jovens (adolescentes) e adultos</strong>. Presencial no consultório em Recreio-MG e teleatendimento on-line em todo o Brasil. De segunda a sexta-feira, das 08h às 12h e 14h às 18h.
          </FadeInParagraph>
        </div>

        <FadeInCardGroup cardSelector=".gsap-card" className="max-w-3xl mx-auto">
          {/* Booking Form Card */}
          <div className="w-full">
            <div className="gsap-card bg-[#002B49] rounded-[32px] sm:rounded-[40px] p-7 sm:p-10 lg:p-12 border-2 border-[#002B49] shadow-2xl shadow-[#002B49]/30 flex flex-col justify-between text-white">
              <div>
                {submitted ? (
                  /* Success Card State (matching user attachment) */
                  <div className="text-center py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-300 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <h4 className="text-2xl sm:text-3xl font-serif font-bold text-white">
                        Agendamento Registrado!
                      </h4>
                      <p className="text-sm font-sans text-slate-200 leading-relaxed">
                        Sua solicitação foi salva no sistema com sucesso. Para confirmar o atendimento com prioridade, clique no botão abaixo para enviar os detalhes pelo WhatsApp ao Prof. Cesar Roberto.
                      </p>
                    </div>

                    {whatsappUrlGenerated && (
                      <div className="pt-2">
                        <a
                          href={whatsappUrlGenerated}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-cta font-bold text-sm shadow-md transition hover:scale-105"
                        >
                          <img src="/whatsapp-icon.svg" alt="WhatsApp" className="w-5 h-5 object-contain" />
                          <span>Confirmar no WhatsApp</span>
                        </a>
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/15 flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setSubmitted(false)}
                        className="text-xs font-cta font-bold text-[#D4AF37] hover:underline cursor-pointer"
                      >
                        ← Fazer outro agendamento
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleBookingSubmit} className="space-y-5">
                    {/* Row 1: Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide mb-2 block">
                          Seu Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Ex: João da Silva"
                          className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                        />
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide mb-2 block">
                          WhatsApp (Com DDD) *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          placeholder="(32) 98725-2421"
                          className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Faixa Etária do Paciente */}
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide mb-2 block">
                        Para quem é o Atendimento? (Faixa Etária)
                      </label>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        {[
                          { id: 'crianca', label: 'Criança (Infantil)' },
                          { id: 'jovem', label: 'Jovem / Adolescente' },
                          { id: 'adulto', label: 'Adulto' },
                        ].map((faixa) => (
                          <button
                            key={faixa.id}
                            type="button"
                            onClick={() => setPatientAgeGroup(patientAgeGroup === faixa.label ? '' : faixa.label)}
                            className={`py-3 px-2 rounded-2xl border-2 text-xs sm:text-sm font-sans transition text-center cursor-pointer ${
                              patientAgeGroup === faixa.label
                                ? 'bg-white text-[#002B49] border-white shadow-md font-extrabold ring-2 ring-[#D4AF37]'
                                : 'bg-white/15 hover:bg-white/25 text-white border-white/30 font-bold'
                            }`}
                          >
                            {faixa.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Row 2: Service & Modality */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide mb-2 block">
                          Especialidade / Serviço *
                        </label>
                        <select
                          required
                          value={service}
                          onChange={(e) => setService(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] focus:outline-none transition shadow-2xs cursor-pointer"
                        >
                          <option value="" disabled>
                            Selecione a especialidade desejada...
                          </option>
                          {siteData.services.map((s) => (
                            <option key={s.id} value={s.id} className="text-[#002B49] font-semibold">
                              {s.title} ({s.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide mb-2 block">
                          Formato (Modalidade) *
                        </label>
                        <select
                          required
                          value={modality}
                          onChange={(e) => setModality(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] focus:outline-none transition shadow-2xs cursor-pointer"
                        >
                          <option value="" disabled>
                            Selecione o formato de atendimento...
                          </option>
                          <option value="presencial" className="text-[#002B49] font-semibold">
                            Presencial (Consultório Residencial - Recreio/MG)
                          </option>
                          <option value="online" className="text-[#002B49] font-semibold">
                            Teleatendimento On-line
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* Row 3: Date Picker with Attendance Days Validation */}
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide mb-2 block">
                        Dia de Atendimento * (Segunda a Sexta)
                      </label>

                      <div className="relative">
                        <input
                          type="date"
                          required
                          min={todayISO}
                          value={selectedDate}
                          onChange={handleDateChange}
                          className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-bold text-[#002B49] focus:outline-none transition shadow-2xs cursor-pointer"
                        />
                      </div>

                      {dateError && (
                        <p className="mt-2 text-xs sm:text-sm text-rose-200 font-sans font-bold flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>{dateError}</span>
                        </p>
                      )}
                    </div>

                    {/* Row 4: Interactive Time Slots Grid (Rendered only when valid weekday is selected) */}
                    {selectedDate && !isWeekend(selectedDate) ? (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 rounded-2xl bg-[#001F35] border-2 border-white/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide block">
                            Horário de Preferência *
                          </label>
                          {bookedSlots.length > 0 && (
                            <span className="text-xs font-sans text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                              {bookedSlots.length} horário(s) já reservado(s)
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                          {timeSlots.map((slot) => {
                            const isBooked = bookedSlots.includes(slot)
                            const isPast = isSlotPast(slot, selectedDate)
                            const isUnavailable = isBooked || isPast
                            const isSelected = selectedTimeSlot === slot && !isUnavailable

                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={isUnavailable}
                                onClick={() => !isUnavailable && setSelectedTimeSlot(slot)}
                                title={
                                  isPast
                                    ? `Horário ${slot} já ultrapassado para a data de hoje`
                                    : isBooked
                                    ? `Horário ${slot} já reservado nesta data`
                                    : `Selecionar horário ${slot}`
                                }
                                className={`py-3 px-3 rounded-xl text-sm font-sans transition text-center ${
                                  isUnavailable
                                    ? 'bg-white/10 text-slate-400 border border-white/15 cursor-not-allowed opacity-50 select-none line-through shadow-none'
                                    : isSelected
                                    ? 'bg-[#D4AF37] text-[#002B49] font-black border-2 border-[#D4AF37] shadow-md ring-2 ring-white cursor-pointer scale-[1.02]'
                                    : 'bg-white text-[#002B49] font-bold border-2 border-slate-300 hover:bg-slate-100 cursor-pointer shadow-2xs'
                                }`}
                              >
                                {slot}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-[#001F35] border-2 border-dashed border-white/30 text-center">
                        <p className="text-xs sm:text-sm font-sans font-medium text-slate-200 flex items-center justify-center gap-2">
                          <CalendarDays className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          <span>Selecione um dia útil acima para visualizar os horários disponíveis.</span>
                        </p>
                      </div>
                    )}

                    {/* Row 5: Notes */}
                    <div>
                      <label className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide mb-2 block">
                        Observações ou Queixa Principal (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Descreva brevemente a dificuldade escolar, queixa ou objetivo do atendimento..."
                        className="w-full px-4 py-3.5 rounded-2xl bg-white border-2 border-slate-300 hover:border-slate-400 focus:border-[#D4AF37] focus:bg-white focus:ring-3 focus:ring-[#D4AF37]/25 text-sm sm:text-base font-semibold text-[#002B49] placeholder:text-slate-400 focus:outline-none transition shadow-2xs resize-none"
                      />
                    </div>

                    {/* Bottom Action & Guarantee */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/15">
                      <div className="text-[11px] font-sans text-slate-300 flex items-center gap-1.5 text-center sm:text-left">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Sessão salva no sistema com confirmação direta pelo WhatsApp.</span>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f2b] text-[#002B49] font-cta font-extrabold text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2.5 transition shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.99] cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <img src="/whatsapp-icon.svg" alt="WhatsApp" className="w-4 h-4 object-contain" />
                        <span>{isSubmitting ? 'Registrando...' : 'Confirmar Agendamento'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </FadeInCardGroup>
      </div>
    </section>
  )
}
