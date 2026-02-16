import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener usuarios activos
    const { data: usuarios, error } = await supabase
      .from('organizacion_usuarios')
      .select('usuario_id, rol, estado')
      .eq('estado', 'activo')
      .order('rol', { ascending: true })

    if (error) {
      console.error('Error al obtener usuarios:', error)
      return NextResponse.json(
        { error: 'Error al cargar usuarios' },
        { status: 500 }
      )
    }

    return NextResponse.json({ usuarios })
  } catch (error) {
    console.error('Error en API usuarios/activos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
