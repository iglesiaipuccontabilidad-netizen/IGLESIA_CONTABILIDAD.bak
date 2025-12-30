// =========================================
// Servicio de Comités - Capa de Datos
// =========================================
// Fecha: 30 Diciembre 2025
// Descripción: Queries y lógica de negocio para el módulo de comités

import { supabase } from '@/lib/supabase';
import type {
  Comite,
  ComiteRow,
  ComiteUsuario,
  ComiteMiembroRow,
  ComiteProyectoRow,
  ComiteVotoRow,
  BalanceComite,
  EstadisticasComite,
  ComiteFiltros,
  VotosFiltros,
  ProyectosFiltros,
  DashboardComite,
  TransaccionReciente,
  ComiteVoto,
} from '@/types/comites';

// =========================================
// COMITÉS
// =========================================

/**
 * Obtiene todos los comités con filtros opcionales
 */
export async function getComites(filtros?: ComiteFiltros) {
  try {
    let query = supabase
      .from('comites')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filtros?.estado) {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros?.search) {
      query = query.or(`nombre.ilike.%${filtros.search}%,descripcion.ilike.%${filtros.search}%`);
    }

    if (filtros?.limit) {
      query = query.limit(filtros.limit);
    }

    if (filtros?.offset) {
      query = query.range(filtros.offset, filtros.offset + (filtros.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as ComiteRow[], error: null };
  } catch (error) {
    console.error('Error al obtener comités:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtiene un comité por ID con información extendida
 */
export async function getComiteById(comiteId: string) {
  try {
    const { data, error } = await supabase
      .from('comites')
      .select('*')
      .eq('id', comiteId)
      .single();

    if (error) throw error;

    return { data: data as any, error: null };
  } catch (error) {
    console.error('Error al obtener comité:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Cuenta el total de comités según filtros
 */
export async function countComites(filtros?: ComiteFiltros) {
  try {
    let query = supabase
      .from('comites')
      .select('*', { count: 'exact', head: true });

    if (filtros?.estado) {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros?.search) {
      query = query.or(`nombre.ilike.%${filtros.search}%,descripcion.ilike.%${filtros.search}%`);
    }

    const { count, error } = await query;

    if (error) throw error;

    return { data: count || 0, error: null };
  } catch (error) {
    console.error('Error al contar comités:', error);
    return { data: 0, error: error as Error };
  }
}

// =========================================
// USUARIOS DE COMITÉ
// =========================================

/**
 * Obtiene los usuarios asignados a un comité
 */
export async function getUsuariosComite(comiteId: string) {
  try {
    const { data, error } = await supabase
      .from('comite_usuarios')
      .select('*')
      .eq('comite_id', comiteId)
      .eq('estado', 'activo')
      .order('fecha_ingreso', { ascending: false });

    if (error) throw error;

    return { data: data as any, error: null };
  } catch (error) {
    console.error('Error al obtener usuarios del comité:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Verifica si un usuario tiene acceso a un comité específico
 * @param usuarioId - ID del usuario
 * @param comiteId - ID del comité
 * @returns true si el usuario tiene acceso, false si no
 */
export async function verificarAccesoComite(usuarioId: string, comiteId: string) {
  try {
    const { data, error } = await supabase
      .from('comite_usuarios')
      .select('id, rol')
      .eq('comite_id', comiteId)
      .eq('usuario_id', usuarioId)
      .eq('estado', 'activo')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró registro
        return { data: null, error: null };
      }
      throw error;
    }

    return { data: data, error: null };
  } catch (error) {
    console.error('Error al verificar acceso al comité:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtiene el rol de un usuario en un comité
 */
export async function getRolUsuarioEnComite(usuarioId: string, comiteId: string) {
  try {
    const { data, error } = await supabase
      .from('comite_usuarios')
      .select('rol')
      .eq('comite_id', comiteId)
      .eq('usuario_id', usuarioId)
      .eq('estado', 'activo')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      throw error;
    }

    return { data: data.rol, error: null };
  } catch (error) {
    console.error('Error al obtener rol del usuario:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtiene todos los comités a los que pertenece un usuario
 */
export async function getComitesDeUsuario(usuarioId: string) {
  try {
    const { data, error } = await supabase
      .from('comite_usuarios')
      .select(`
        id,
        rol,
        fecha_ingreso,
        comite:comites(*)
      `)
      .eq('usuario_id', usuarioId)
      .eq('estado', 'activo')
      .order('fecha_ingreso', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error al obtener comités del usuario:', error);
    return { data: null, error: error as Error };
  }
}

// =========================================
// MIEMBROS DEL COMITÉ
// =========================================

/**
 * Obtiene los miembros de un comité
 */
export async function getMiembrosComite(comiteId: string, soloActivos: boolean = true) {
  try {
    let query = supabase
      .from('comite_miembros')
      .select('*')
      .eq('comite_id', comiteId)
      .order('apellidos', { ascending: true });

    if (soloActivos) {
      query = query.eq('estado', 'activo');
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as ComiteMiembroRow[], error: null };
  } catch (error) {
    console.error('Error al obtener miembros del comité:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtiene un miembro específico del comité
 */
export async function getMiembroComiteById(miembroId: string) {
  try {
    const { data, error } = await supabase
      .from('comite_miembros')
      .select('*')
      .eq('id', miembroId)
      .single();

    if (error) throw error;

    return { data: data as ComiteMiembroRow, error: null };
  } catch (error) {
    console.error('Error al obtener miembro del comité:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Cuenta los miembros activos de un comité
 */
export async function countMiembrosActivos(comiteId: string) {
  try {
    const { count, error } = await supabase
      .from('comite_miembros')
      .select('*', { count: 'exact', head: true })
      .eq('comite_id', comiteId)
      .eq('estado', 'activo');

    if (error) throw error;

    return { data: count || 0, error: null };
  } catch (error) {
    console.error('Error al contar miembros activos:', error);
    return { data: 0, error: error as Error };
  }
}

// =========================================
// PROYECTOS
// =========================================

/**
 * Obtiene los proyectos de un comité
 */
export async function getProyectosComite(filtros: ProyectosFiltros) {
  try {
    let query = supabase
      .from('comite_proyectos')
      .select('*')
      .eq('comite_id', filtros.comite_id)
      .order('created_at', { ascending: false });

    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros.search) {
      query = query.or(`nombre.ilike.%${filtros.search}%,descripcion.ilike.%${filtros.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as ComiteProyectoRow[], error: null };
  } catch (error) {
    console.error('Error al obtener proyectos del comité:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtiene un proyecto específico
 */
export async function getProyectoById(proyectoId: string) {
  try {
    const { data, error } = await supabase
      .from('comite_proyectos')
      .select('*')
      .eq('id', proyectoId)
      .single();

    if (error) throw error;

    return { data: data as ComiteProyectoRow, error: null };
  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    return { data: null, error: error as Error };
  }
}

// =========================================
// VOTOS
// =========================================

/**
 * Obtiene los votos de un comité con filtros
 */
export async function getVotosComite(filtros: VotosFiltros) {
  try {
    let query = supabase
      .from('comite_votos')
      .select('*')
      .eq('comite_id', filtros.comite_id)
      .order('created_at', { ascending: false });

    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    }

    if (filtros.miembro_id) {
      query = query.eq('comite_miembro_id', filtros.miembro_id);
    }

    if (filtros.proyecto_id) {
      query = query.eq('proyecto_id', filtros.proyecto_id);
    }

    if (filtros.fecha_desde) {
      query = query.gte('fecha_limite', filtros.fecha_desde);
    }

    if (filtros.fecha_hasta) {
      query = query.lte('fecha_limite', filtros.fecha_hasta);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data: data as any, error: null };
  } catch (error) {
    console.error('Error al obtener votos del comité:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtiene un voto específico con sus pagos
 */
export async function getVotoById(votoId: string) {
  try {
    const { data, error } = await supabase
      .from('comite_votos')
      .select('*')
      .eq('id', votoId)
      .single();

    if (error) throw error;

    return { data: data as any, error: null };
  } catch (error) {
    console.error('Error al obtener voto:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtiene votos próximos a vencer (siguientes 7 días)
 */
export async function getVotosProximosVencer(comiteId: string, dias: number = 7) {
  try {
    const hoy = new Date();
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + dias);

    const { data, error } = await supabase
      .from('comite_votos')
      .select('*')
      .eq('comite_id', comiteId)
      .eq('estado', 'activo')
      .gte('fecha_limite', hoy.toISOString().split('T')[0])
      .lte('fecha_limite', futuro.toISOString().split('T')[0])
      .order('fecha_limite', { ascending: true });

    if (error) throw error;

    return { data: data as any, error: null };
  } catch (error) {
    console.error('Error al obtener votos próximos a vencer:', error);
    return { data: null, error: error as Error };
  }
}

// =========================================
// BALANCE Y FINANZAS
// =========================================

/**
 * Obtiene el balance de un comité usando la función SQL
 */
export async function getBalanceComite(comiteId: string): Promise<{ data: BalanceComite | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.rpc('obtener_balance_comite', {
      p_comite_id: comiteId,
    });

    if (error) throw error;

    return { data: data as any, error: null };
  } catch (error) {
    console.error('Error al obtener balance del comité:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtiene estadísticas del comité
 */
export async function getEstadisticasComite(comiteId: string): Promise<{ data: EstadisticasComite | null; error: Error | null }> {
  try {
    // Obtener estadísticas de proyectos
    const [proyectosResult, miembrosResult, votosResult] = await Promise.all([
      supabase
        .from('comite_proyectos')
        .select('estado', { count: 'exact' })
        .eq('comite_id', comiteId),
      supabase
        .from('comite_miembros')
        .select('estado', { count: 'exact' })
        .eq('comite_id', comiteId),
      supabase
        .from('comite_votos')
        .select('estado', { count: 'exact' })
        .eq('comite_id', comiteId),
    ]);

    if (proyectosResult.error) throw proyectosResult.error;
    if (miembrosResult.error) throw miembrosResult.error;
    if (votosResult.error) throw votosResult.error;

    // Contar por estado
    const proyectosActivos = proyectosResult.data?.filter((p) => p.estado === 'activo').length || 0;
    const proyectosCompletados = proyectosResult.data?.filter((p) => p.estado === 'completado').length || 0;
    const miembrosActivos = miembrosResult.data?.filter((m) => m.estado === 'activo').length || 0;
    const votosActivos = votosResult.data?.filter((v) => v.estado === 'activo').length || 0;
    const votosCompletados = votosResult.data?.filter((v) => v.estado === 'completado').length || 0;
    const votosVencidos = votosResult.data?.filter((v) => v.estado === 'vencido').length || 0;

    const totalVotos = votosResult.data?.length || 0;
    const tasaCumplimiento = totalVotos > 0 ? (votosCompletados / totalVotos) * 100 : 0;

    const estadisticas: EstadisticasComite = {
      total_proyectos: proyectosResult.data?.length || 0,
      proyectos_activos: proyectosActivos,
      proyectos_completados: proyectosCompletados,
      total_miembros: miembrosResult.data?.length || 0,
      miembros_activos: miembrosActivos,
      total_votos: totalVotos,
      votos_activos: votosActivos,
      votos_completados: votosCompletados,
      votos_vencidos: votosVencidos,
      tasa_cumplimiento: parseFloat(tasaCumplimiento.toFixed(2)),
    };

    return { data: estadisticas, error: null };
  } catch (error) {
    console.error('Error al obtener estadísticas del comité:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtiene las últimas transacciones del comité para el dashboard
 */
export async function getTransaccionesRecientes(
  comiteId: string,
  limite: number = 10
): Promise<{ data: TransaccionReciente[] | null; error: Error | null }> {
  try {
    // Obtener pagos recientes
    const { data: pagos, error: errorPagos } = await supabase
      .from('comite_pagos')
      .select('id, monto, fecha_pago, comite_voto_id')
      .order('fecha_pago', { ascending: false })
      .limit(limite);

    // Filtrar por comité después (ya que no podemos hacer join por RLS)
    // Para esto necesitamos obtener primero los votos del comité
    const { data: votosComite } = await supabase
      .from('comite_votos')
      .select('id, concepto')
      .eq('comite_id', comiteId);

    const votosMap = new Map((votosComite || []).map((v) => [v.id, v.concepto]));
    const pagosFiltrados = (pagos || []).filter((p) => votosMap.has(p.comite_voto_id));

    // Obtener ofrendas recientes
    const { data: ofrendas, error: errorOfrendas } = await supabase
      .from('comite_ofrendas')
      .select('id, monto, fecha, concepto')
      .eq('comite_id', comiteId)
      .order('fecha', { ascending: false })
      .limit(limite);

    // Obtener gastos recientes
    const { data: gastos, error: errorGastos } = await supabase
      .from('comite_gastos')
      .select('id, monto, fecha, concepto')
      .eq('comite_id', comiteId)
      .order('fecha', { ascending: false })
      .limit(limite);

    if (errorPagos) throw errorPagos;
    if (errorOfrendas) throw errorOfrendas;
    if (errorGastos) throw errorGastos;

    // Combinar y formatear transacciones
    const transacciones: TransaccionReciente[] = [
      ...pagosFiltrados.map((p: any) => ({
        id: p.id,
        tipo: 'pago' as const,
        concepto: votosMap.get(p.comite_voto_id) || 'Pago de voto',
        monto: p.monto,
        fecha: p.fecha_pago,
        icono: '💳',
        color: 'text-green-600',
      })),
      ...(ofrendas || []).map((o) => ({
        id: o.id,
        tipo: 'ofrenda' as const,
        concepto: o.concepto,
        monto: o.monto,
        fecha: o.fecha,
        icono: '📥',
        color: 'text-blue-600',
      })),
      ...(gastos || []).map((g) => ({
        id: g.id,
        tipo: 'gasto' as const,
        concepto: g.concepto,
        monto: g.monto,
        fecha: g.fecha,
        icono: '📤',
        color: 'text-red-600',
      })),
    ];

    // Ordenar por fecha descendente y limitar
    transacciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const transaccionesLimitadas = transacciones.slice(0, limite);

    return { data: transaccionesLimitadas, error: null };
  } catch (error) {
    console.error('Error al obtener transacciones recientes:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtiene todos los datos para el dashboard del comité
 */
export async function getDashboardComite(comiteId: string): Promise<{ data: DashboardComite | null; error: Error | null }> {
  try {
    // Obtener todos los datos en paralelo
    const [comiteResult, balanceResult, estadisticasResult, transaccionesResult, votosVencerResult] = await Promise.all([
      getComiteById(comiteId),
      getBalanceComite(comiteId),
      getEstadisticasComite(comiteId),
      getTransaccionesRecientes(comiteId, 10),
      getVotosProximosVencer(comiteId, 7),
    ]);

    // Verificar errores
    if (comiteResult.error) throw comiteResult.error;
    if (balanceResult.error) throw balanceResult.error;
    if (estadisticasResult.error) throw estadisticasResult.error;
    if (transaccionesResult.error) throw transaccionesResult.error;
    if (votosVencerResult.error) throw votosVencerResult.error;

    // Validar datos
    if (!comiteResult.data || !balanceResult.data || !estadisticasResult.data) {
      throw new Error('Datos incompletos para el dashboard');
    }

    const dashboard: DashboardComite = {
      comite: comiteResult.data,
      balance: balanceResult.data,
      estadisticas: estadisticasResult.data,
      transacciones_recientes: transaccionesResult.data || [],
      votos_proximos_vencer: votosVencerResult.data || [],
    };

    return { data: dashboard, error: null };
  } catch (error) {
    console.error('Error al obtener dashboard del comité:', error);
    return { data: null, error: error as Error };
  }
}
