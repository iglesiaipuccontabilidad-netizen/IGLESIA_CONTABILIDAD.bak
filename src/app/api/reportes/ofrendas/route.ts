import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { generarReportePDF, descargarPDF } from '@/lib/pdf/reporteOfrendas'

/**
 * POST /api/reportes/ofrendas
 * Genera un reporte PDF de ofrendas
 * Requiere autenticación y acceso al comité
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener datos de la solicitud
    const { comiteId, formato = 'pdf' } = await request.json()

    if (!comiteId) {
      return NextResponse.json(
        { error: 'comiteId es requerido' },
        { status: 400 }
      )
    }

    // Verificar permisos del usuario en el comité
    const { data: userData } = await supabase
      .from('organizacion_usuarios')
      .select('rol')
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .maybeSingle()

    const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

    let hasAccess = isAdmin
    if (!isAdmin) {
      const { data: comiteUsuario } = await supabase
        .from('comite_usuarios')
        .select('rol')
        .eq('comite_id', comiteId)
        .eq('usuario_id', user.id)
        .eq('estado', 'activo')
        .single()

      hasAccess = !!comiteUsuario
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este comité' },
        { status: 403 }
      )
    }

    // Obtener datos del comité
    const { data: comite } = await supabase
      .from('comites')
      .select('nombre')
      .eq('id', comiteId)
      .single()

    if (!comite) {
      return NextResponse.json(
        { error: 'Comité no encontrado' },
        { status: 404 }
      )
    }

    // Obtener ofrendas
    const { data: ofrendas } = await supabase
      .from('comite_ofrendas')
      .select(`
        *,
        comite_proyectos (
          nombre
        )
      `)
      .eq('comite_id', comiteId)
      .order('fecha', { ascending: false })

    // Mapear datos
    const ofrendasConProyecto = (ofrendas || []).map(ofrenda => ({
      id: ofrenda.id,
      fecha: ofrenda.fecha,
      tipo: ofrenda.tipo,
      monto: ofrenda.monto,
      concepto: ofrenda.concepto,
      proyecto_nombre: ofrenda.comite_proyectos?.nombre,
    }))

    // Generar PDF
    if (formato === 'pdf') {
      const doc = generarReportePDF(
        ofrendasConProyecto,
        comite.nombre,
        {
          titulo: 'REPORTE DE OFRENDAS',
          fecha: new Date(),
        }
      )

      // Convertir PDF a buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

      // Retornar como descarga
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename*=UTF-8''reporte-ofrendas-${comite.nombre.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`,
        },
      })
    }

    // Para otros formatos, retornar datos JSON
    return NextResponse.json({
      success: true,
      comite: comite.nombre,
      totalOfrendas: ofrendasConProyecto.length,
      montoTotal: ofrendasConProyecto.reduce((sum, o) => sum + o.monto, 0),
      ofrendas: ofrendasConProyecto,
    })
  } catch (error) {
    console.error('Error generando reporte:', error)
    return NextResponse.json(
      { error: 'Error al generar el reporte' },
      { status: 500 }
    )
  }
}
