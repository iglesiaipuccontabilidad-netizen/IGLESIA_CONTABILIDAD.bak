/**
 * API Route para resetear contraseña de usuario
 * Basado en mejores prácticas de Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/auth/verify-admin'

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
    const { id: userId } = await context.params

    // Verificar permisos de admin usando helper centralizado
    const adminContext = await getAdminContext()
    
    if (!adminContext.success) {
      return NextResponse.json(
        { error: adminContext.error },
        { status: adminContext.error === 'No autenticado' ? 401 : 403 }
      )
    }

    const { supabase, supabaseAdmin } = adminContext

    // Verificar que el usuario existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, email')
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

    // Actualizar contraseña en auth usando cliente admin (requiere service_role)
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: temporaryPassword }
    )

    if (authError) {
      console.error('Error al actualizar contraseña:', authError)
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña: ' + authError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      temporaryPassword,
      message: 'Contraseña reseteada exitosamente. El usuario debe cambiarla en su próximo inicio de sesión.'
    })

  } catch (error) {
    console.error('Error en POST /api/admin/usuarios/[id]/reset-password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
