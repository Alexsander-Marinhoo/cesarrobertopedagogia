/**
 * Formata um número de telefone no padrão brasileiro:
 * - Até 10 dígitos: (XX) XXXX-XXXX (Telefone fixo ou incompleto)
 * - 11 dígitos: (XX) XXXXX-XXXX (WhatsApp / Celular com 9 dígitos)
 * 
 * @param {string} value - String com números e caracteres
 * @returns {string} - Telefone formatado
 */
export function formatPhoneNumber(value) {
  if (!value) return ''
  
  // Extrai apenas dígitos numéricos e limita a 11 dígitos
  const digits = String(value).replace(/\D/g, '').slice(0, 11)
  
  if (digits.length === 0) return ''
  
  if (digits.length <= 2) {
    return `(${digits}`
  }
  
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

/**
 * Remove todos os caracteres não numéricos.
 * @param {string} value 
 * @returns {string} Apenas dígitos
 */
export function cleanPhoneNumber(value) {
  if (!value) return ''
  return String(value).replace(/\D/g, '')
}
