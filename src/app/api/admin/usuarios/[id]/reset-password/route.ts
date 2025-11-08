import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Función para generar contraseña aleatoria segura
function generateSecurePassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '@$!%*?&'
  
  const allChars = lowercase + uppercase + numbers + symbols
  
  let password = ''
  
  // Asegurar al menos un carácter de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Completar el resto de la longitud
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: userId } = await context.params

    // Verificar que el usuario existe
    const { data: existingUser, error: fetchError } = await (supabase as any)
      .from('usuarios')
      .select('email')
      .eq('id', userId)
      .single()

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Generar nueva contraseña temporal
    const temporaryPassword = generateSecurePassword(12)

    // Actualizar contraseña en auth
    const { error: authError } = await (supabase as any).auth.admin.updateUserById(
      userId,
      { password: temporaryPassword }
    )

    if (authError) {
      console.error('Error al actualizar contraseña:', authError)
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña' },
        { status: 500 }
      )
    }

    // Opcional: Marcar que debe cambiar la contraseña en el próximo login
    // Esto depende de tu implementación de autenticación

    return NextResponse.json({
      success: true,
      temporaryPassword,
      message: 'Contraseña reseteada exitosamente'
    })

  } catch (error) {
    console.error('Error al resetear contraseña:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
