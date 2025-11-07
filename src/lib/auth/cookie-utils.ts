export function clearAuthCookies() {
  if (typeof window === 'undefined') return
  
  const cookies = document.cookie.split(';')
  
  cookies.forEach(cookie => {
    const [name] = cookie.split('=').map(c => c.trim())
    if (name.startsWith('sb-')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
    }
  })
}

export function handleAuthError(error: Error) {
  if (error.message?.includes('Failed to parse cookie')) {
    clearAuthCookies()
    // Redireccionar al login
    window.location.href = '/login'
    return true
  }
  return false
}