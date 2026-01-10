'use server'

import { createActionClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

export async function getSession() {
  const supabase = await createActionClient()
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error:', error)
    return null
  }
}

export async function signIn(formData: FormData) {
  const supabase = await createActionClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createActionClient()
  await supabase.auth.signOut()
  return { success: true }
}