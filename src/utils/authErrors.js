/**
 * Tradutor universal de mensagens de erro do Supabase Auth para Português do Brasil (PT-BR)
 */
export function translateAuthError(error) {
  if (!error) return 'Ocorreu um erro inesperado. Por favor, tente novamente.'

  const message = (typeof error === 'string' ? error : error.message || error.error_description || '').toLowerCase()

  if (message.includes('invalid login credentials') || message.includes('invalid_credentials')) {
    return 'E-mail ou senha incorretos. Por favor, verifique seus dados de acesso.'
  }

  if (message.includes('user already registered') || message.includes('user_already_exists') || message.includes('already registered') || message.includes('database error saving new user') || message.includes('duplicate key') || message.includes('users_email_partial_key')) {
    return 'Este e-mail já está cadastrado no sistema. Tente entrar na sua conta ou utilize a opção de limpeza de conta antiga.'
  }

  if (message.includes('password should be at least') || message.includes('weak_password')) {
    return 'A senha deve conter no mínimo 8 caracteres com letras maiúsculas, minúsculas, números e caracteres especiais.'
  }

  if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Seu endereço de e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada.'
  }

  if (message.includes('rate limit') || message.includes('over_email_send_rate_limit') || message.includes('too many requests')) {
    return 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente.'
  }

  if (message.includes('user not found') || message.includes('user_not_found')) {
    return 'Nenhum cadastro encontrado com este e-mail.'
  }

  if (message.includes('invalid email') || message.includes('unable to validate email') || message.includes('invalid_email')) {
    return 'Por favor, insira um formato de e-mail válido (ex: seuemail@exemplo.com).'
  }

  if (message.includes('network') || message.includes('failed to fetch')) {
    return 'Erro de conexão com o servidor. Verifique sua conexão com a internet.'
  }

  if (message.includes('signup requires a valid password') || message.includes('missing email or phone')) {
    return 'Por favor, preencha todos os campos obrigatórios com informações válidas.'
  }

  if (message.includes('supabase ainda não configurado') || message.includes('ainda não configurado')) {
    return 'Configuração do Supabase pendente no arquivo .env. Por favor, configure as variáveis de ambiente.'
  }

  // Se já for uma mensagem personalizada em português gerada localmente
  if (typeof error === 'string') return error
  if (error.message && !/[a-zA-Z]/.test(error.message)) return error.message

  return error.message || 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.'
}
