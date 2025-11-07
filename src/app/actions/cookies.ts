'use server'

import { cookies } from 'next/headers'
import { type CookieOptions } from '@supabase/ssr'

export async function setCookie(name: string, value: string, options: CookieOptions) {
  const cookieStore = await cookies()
  cookieStore.set(name, value, options)
}

export async function removeCookie(name: string, options: CookieOptions) {
  const cookieStore = await cookies()
  cookieStore.set(name, '', { ...options, maxAge: 0 })
}

export async function getCookie(name: string) {
  const cookieStore = await cookies()
  return cookieStore.get(name)?.value
}