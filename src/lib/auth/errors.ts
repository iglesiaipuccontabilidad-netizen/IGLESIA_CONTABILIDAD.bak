export const AUTH_ERRORS = {
  InvalidCredentials: 'El correo electrónico o la contraseña son incorrectos',
  UserNotFound: 'No se encontró una cuenta con este correo electrónico',
  EmailNotConfirmed: 'El email no ha sido confirmado. Se ha enviado un enlace de confirmación a tu correo electrónico. Por favor, revisa tu bandeja de entrada y spam.',
  AccountInactive: 'Tu cuenta está inactiva. Contacta al administrador.',
  PendingApproval: 'Tu cuenta está pendiente de aprobación.',
  ProfileNotFound: 'No se encontró el perfil del usuario',
  DatabaseError: 'Error en el servidor. Por favor, intenta de nuevo más tarde.',
  DuplicateEmail: 'Este correo electrónico ya está registrado',
  SignupError: 'Error al crear la cuenta. Por favor, verifica los datos e intenta de nuevo.',
  ProfileCreationError: 'Error al crear el perfil. Por favor, intenta de nuevo más tarde.',
  NetworkError: 'Error de conexión. Por favor, verifica tu conexión a internet e intenta de nuevo.',
  InvalidData: 'Los datos proporcionados no son válidos',
  NotAuthorized: 'No estás autorizado para realizar esta acción',
  AdminRequired: 'Se requieren permisos de administrador para esta acción',
  ActionFailed: 'No se pudo completar la acción solicitada',
  TooManyRequests: 'Has intentado demasiadas veces. Por favor, espera unos minutos e intenta de nuevo.',
  RateLimitExceeded: 'Por seguridad, debes esperar unos segundos antes de intentar de nuevo.',
  InvalidEmail: 'El correo electrónico ingresado no es válido',
  WeakPassword: 'La contraseña debe tener al menos 6 caracteres'
} as const

export type AuthErrorKey = keyof typeof AUTH_ERRORS

export function getAuthErrorMessage(key: AuthErrorKey): string {
  return AUTH_ERRORS[key]
}

export function parseAuthError(error: Error & { code?: string }): string {
  const message = error.message.toLowerCase()
  const code = error.code?.toLowerCase()
  
  // Primero verificamos por código de error específico
  if (code === 'email_not_confirmed') {
    return AUTH_ERRORS.EmailNotConfirmed
  }
  if (code === 'invalid_credentials') {
    return AUTH_ERRORS.InvalidCredentials
  }
  
  // Luego verificamos por mensaje
  if (message.includes('invalid login credentials')) {
    return AUTH_ERRORS.InvalidCredentials
  }
  if (message.includes('email not confirmed')) {
    return AUTH_ERRORS.EmailNotConfirmed
  }
  if (message.includes('duplicate key') || message.includes('already registered')) {
    return AUTH_ERRORS.DuplicateEmail
  }
  if (message.includes('network') || message.includes('failed to fetch')) {
    return AUTH_ERRORS.NetworkError
  }
  if (message.includes('too many requests') || message.includes('rate limit')) {
    return AUTH_ERRORS.RateLimitExceeded
  }
  if (message.includes('you can only request this after')) {
    return AUTH_ERRORS.TooManyRequests
  }
  if (message.includes('user not allowed') || message.includes('unauthorized')) {
    return AUTH_ERRORS.NotAuthorized
  }
  if (message.includes('invalid email')) {
    return AUTH_ERRORS.InvalidEmail
  }
  if (message.includes('password') && (message.includes('too short') || message.includes('weak'))) {
    return AUTH_ERRORS.WeakPassword
  }
  
  // Si no podemos identificar el error, devolvemos un mensaje genérico
  console.error('Error no identificado:', { message, code })
  return AUTH_ERRORS.InvalidCredentials
}