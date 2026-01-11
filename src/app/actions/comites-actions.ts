'use server';

// =========================================
// Server Actions - Comités IPUC
// =========================================
// Fecha: 30 Diciembre 2025
// Última actualización: 30 Diciembre 2025
// Descripción: Server Actions completas para operaciones CRUD de comités
//
// RESUMEN DE IMPLEMENTACIÓN:
// ✅ Fase 2: Tipos y Servicios (Base completa)
// ✅ Fase 3.B: CRUD Comités (6 actions)
// ✅ Fase 4.B: CRUD Miembros (4 actions)  
// ✅ Fase 5.B: Dashboard y Utilidades (4 actions)
// ✅ Fase 6.B: CRUD Proyectos (4 actions)
// ✅ Fase 7.B: CRUD Votos y Pagos (5 actions)
// ✅ Fase 8.B: CRUD Ofrendas (4 actions)
// ✅ Fase 9.B: CRUD Gastos (4 actions)
//
// TOTAL: 35 Server Actions implementadas
// =========================================

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  getComites as getComitesService,
  getComiteById as getComiteByIdService,
  getUsuariosComite as getUsuariosComiteService,
  getMiembrosComite as getMiembrosComiteService,
  getComitesDeUsuario as getComitesDeUsuarioService,
  verificarAccesoComite,
  getRolUsuarioEnComite,
  getDashboardComite as getDashboardComiteService,
  getProyectosComite as getProyectosComiteService,
  getVotosComite as getVotosComiteService,
  getVotoById as getVotoByIdService,
  getBalanceComite as getBalanceComiteService,
  getEstadisticasComite as getEstadisticasComiteService,
} from '@/lib/services/comite-service';
import type {
  CreateComiteDTO,
  UpdateComiteDTO,
  AsignarUsuarioComiteDTO,
  CreateComiteMiembroDTO,
  CreateComiteProyectoDTO,
  CreateComiteVotoDTO,
  RegistrarPagoDTO,
  RegistrarOfrendaDTO,
  RegistrarGastoDTO,
  CreateProyectoProductoDTO,
  CreateProyectoVentaDTO,
  RegistrarPagoVentaDTO,
  ComiteFiltros,
  OperationResult,
} from '@/types/comites';

// =========================================
// HELPER FUNCTIONS
// =========================================

/**
 * Verifica la autenticación del usuario actual
 */
async function verificarAutenticacion() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No autenticado');
  }

  // Obtener datos del usuario
  const { data: userData, error } = await supabase
    .from('usuarios')
    .select('id, rol, estado')
    .eq('id', user.id)
    .single();

  if (error || !userData) {
    throw new Error('Usuario no encontrado');
  }

  if (userData.estado !== 'activo') {
    throw new Error('Usuario inactivo');
  }

  return { user, userData };
}

/**
 * Verifica si el usuario tiene permisos de administrador o tesorero general
 */
async function verificarPermisoAdmin() {
  const { userData } = await verificarAutenticacion();

  if (!['admin', 'tesorero'].includes(userData.rol || '')) {
    throw new Error('No tienes permisos suficientes');
  }

  return userData;
}

/**
 * Verifica si el usuario tiene acceso a un comité específico
 */
async function verificarAccesoUsuarioComite(comiteId: string) {
  const { user, userData } = await verificarAutenticacion();
  const supabase = await createClient();

  console.log('🔍 Verificando acceso al comité:', {
    userId: user.id,
    comiteId,
    rolGlobal: userData.rol,
  });

  // Admin y tesorero general tienen acceso a todos los comités
  const rol = userData.rol || '';
  if (['admin', 'tesorero'].includes(rol)) {
    console.log('✅ Acceso concedido (Admin/Tesorero global)');
    return { user, userData, rol: 'admin' as const };
  }

  // Verificar si el usuario pertenece al comité
  const { data: acceso, error } = await verificarAccesoComite(user.id, comiteId, supabase);

  console.log('🔍 Resultado verificarAccesoComite:', { acceso, error });

  if (!acceso) {
    console.error('❌ No se encontró acceso al comité');
    throw new Error('No tienes acceso a este comité');
  }

  console.log('✅ Acceso concedido con rol:', acceso.rol);
  return { user, userData, rol: acceso.rol };
}

// =========================================
// COMITÉS - CRUD
// =========================================

/**
 * Obtiene todos los comités (solo admin y tesorero general)
 */
export async function getComites(filtros?: ComiteFiltros): Promise<OperationResult<any[]>> {
  try {
    await verificarPermisoAdmin();
    const { data, error } = await getComitesService(filtros);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener comités:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene un comité por ID
 */
export async function getComiteById(comiteId: string): Promise<OperationResult<any>> {
  try {
    // Verificar acceso al comité
    await verificarAccesoUsuarioComite(comiteId);

    const { data, error } = await getComiteByIdService(comiteId);

    if (error) throw error;
    if (!data) throw new Error('Comité no encontrado');

    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Crea un nuevo comité (solo admin y tesorero general)
 */
export async function createComite(dto: CreateComiteDTO): Promise<OperationResult<any>> {
  try {
    const userData = await verificarPermisoAdmin();
    const supabase = await createClient();

    // Validaciones
    if (!dto.nombre || dto.nombre.trim().length === 0) {
      throw new Error('El nombre del comité es requerido');
    }

    if (dto.nombre.length > 100) {
      throw new Error('El nombre del comité no puede exceder 100 caracteres');
    }

    // Verificar que no exista un comité con el mismo nombre
    const { data: existente } = await supabase
      .from('comites')
      .select('id')
      .eq('nombre', dto.nombre)
      .single();

    if (existente) {
      throw new Error('Ya existe un comité con ese nombre');
    }

    // Crear el comité
    const { data, error } = await supabase
      .from('comites')
      .insert({
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        estado: dto.estado || 'activo',
        creado_por: userData.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath('/dashboard/comites');
    revalidatePath('/dashboard');

    return {
      success: true,
      data,
      message: 'Comité creado exitosamente',
    };
  } catch (error) {
    console.error('Error al crear comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Actualiza un comité existente (solo admin y tesorero general)
 */
export async function updateComite(comiteId: string, dto: UpdateComiteDTO): Promise<OperationResult<any>> {
  try {
    await verificarPermisoAdmin();
    const supabase = await createClient();

    // Validaciones
    if (dto.nombre !== undefined) {
      if (!dto.nombre || dto.nombre.trim().length === 0) {
        throw new Error('El nombre del comité no puede estar vacío');
      }

      if (dto.nombre.length > 100) {
        throw new Error('El nombre del comité no puede exceder 100 caracteres');
      }

      // Verificar nombre duplicado
      const { data: existente } = await supabase
        .from('comites')
        .select('id')
        .eq('nombre', dto.nombre)
        .neq('id', comiteId)
        .single();

      if (existente) {
        throw new Error('Ya existe un comité con ese nombre');
      }
    }

    // Actualizar el comité
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.nombre !== undefined) updateData.nombre = dto.nombre.trim();
    if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion?.trim() || null;
    if (dto.estado !== undefined) updateData.estado = dto.estado;

    const { data, error } = await supabase
      .from('comites')
      .update(updateData)
      .eq('id', comiteId)
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath('/dashboard/comites');
    revalidatePath(`/dashboard/comites/${comiteId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      data,
      message: 'Comité actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina (desactiva) un comité (solo admin)
 */
export async function deleteComite(comiteId: string): Promise<OperationResult> {
  try {
    const userData = await verificarPermisoAdmin();

    // Solo admin puede eliminar
    if (userData.rol !== 'admin') {
      throw new Error('Solo administradores pueden eliminar comités');
    }

    const supabase = await createClient();

    // Cambiar estado a inactivo en lugar de eliminar
    const { error } = await supabase
      .from('comites')
      .update({
        estado: 'inactivo',
        updated_at: new Date().toISOString(),
      })
      .eq('id', comiteId);

    if (error) throw error;

    // Revalidar rutas
    revalidatePath('/dashboard/comites');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Comité desactivado exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// USUARIOS DE COMITÉ
// =========================================

/**
 * Asigna un usuario a un comité con un rol específico
 */
export async function asignarUsuarioComite(dto: AsignarUsuarioComiteDTO): Promise<OperationResult> {
  try {
    await verificarPermisoAdmin();
    const supabase = await createClient();

    // Validaciones
    if (!dto.comite_id || !dto.usuario_id || !dto.rol) {
      throw new Error('Comité, usuario y rol son requeridos');
    }

    if (!['lider', 'tesorero', 'secretario', 'vocal'].includes(dto.rol)) {
      throw new Error('Rol inválido');
    }

    // Verificar que el comité existe
    const { data: comite } = await supabase
      .from('comites')
      .select('id')
      .eq('id', dto.comite_id)
      .single();

    if (!comite) {
      throw new Error('Comité no encontrado');
    }

    // Verificar que el usuario existe
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', dto.usuario_id)
      .single();

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar que el usuario no esté ya asignado al comité
    const { data: existente } = await supabase
      .from('comite_usuarios')
      .select('id')
      .eq('comite_id', dto.comite_id)
      .eq('usuario_id', dto.usuario_id)
      .eq('estado', 'activo')
      .single();

    if (existente) {
      throw new Error('El usuario ya está asignado a este comité');
    }

    // Asignar usuario
    const { error } = await supabase.from('comite_usuarios').insert({
      comite_id: dto.comite_id,
      usuario_id: dto.usuario_id,
      rol: dto.rol,
      fecha_ingreso: dto.fecha_ingreso || new Date().toISOString().split('T')[0],
      estado: 'activo',
    });

    if (error) throw error;

    // Revalidar rutas
    revalidatePath('/dashboard/comites');
    revalidatePath(`/dashboard/comites/${dto.comite_id}`);

    return {
      success: true,
      message: 'Usuario asignado al comité exitosamente',
    };
  } catch (error) {
    console.error('Error al asignar usuario al comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Actualiza el rol de un usuario en un comité
 */
export async function actualizarRolUsuarioComite(
  comiteId: string,
  usuarioId: string,
  nuevoRol: string
): Promise<OperationResult> {
  try {
    await verificarPermisoAdmin();
    const supabase = await createClient();

    // Actualizar el rol
    const { error } = await supabase
      .from('comite_usuarios')
      .update({ rol: nuevoRol })
      .eq('comite_id', comiteId)
      .eq('usuario_id', usuarioId)
      .eq('estado', 'activo'); // Solo actualizar usuarios activos

    if (error) throw error;

    // Revalidar rutas
    revalidatePath('/dashboard/comites');
    revalidatePath(`/dashboard/comites/${comiteId}`);

    return {
      success: true,
      message: 'Rol actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar rol del usuario:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Remueve un usuario de un comité
 */
export async function removerUsuarioComite(comiteId: string, usuarioId: string): Promise<OperationResult> {
  try {
    await verificarPermisoAdmin();
    const supabase = await createClient();

    // Desactivar en lugar de eliminar
    const { error } = await supabase
      .from('comite_usuarios')
      .update({ estado: 'inactivo' })
      .eq('comite_id', comiteId)
      .eq('usuario_id', usuarioId);

    if (error) throw error;

    // Revalidar rutas
    revalidatePath('/dashboard/comites');
    revalidatePath(`/dashboard/comites/${comiteId}`);

    return {
      success: true,
      message: 'Usuario removido del comité exitosamente',
    };
  } catch (error) {
    console.error('Error al remover usuario del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene los usuarios de un comité
 */
export async function getUsuariosComite(comiteId: string): Promise<OperationResult<any[]>> {
  try {
    await verificarAccesoUsuarioComite(comiteId);
    const { data, error } = await getUsuariosComiteService(comiteId);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener usuarios del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// MIEMBROS DEL COMITÉ
// =========================================

/**
 * Crea un nuevo miembro del comité
 */
export async function createComiteMiembro(dto: CreateComiteMiembroDTO): Promise<OperationResult<any>> {
  try {
    const { rol } = await verificarAccesoUsuarioComite(dto.comite_id);

    // Solo lider y tesorero pueden agregar miembros
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para agregar miembros');
    }

    const supabase = await createClient();

    // Validaciones
    if (!dto.nombres || dto.nombres.trim().length === 0) {
      throw new Error('El nombre es requerido');
    }

    if (!dto.apellidos || dto.apellidos.trim().length === 0) {
      throw new Error('El apellido es requerido');
    }

    // Crear miembro
    const { data, error } = await supabase
      .from('comite_miembros')
      .insert({
        comite_id: dto.comite_id,
        nombres: dto.nombres.trim(),
        apellidos: dto.apellidos.trim(),
        telefono: dto.telefono?.trim() || null,
        email: dto.email?.trim() || null,
        fecha_ingreso: dto.fecha_ingreso || new Date().toISOString().split('T')[0],
        estado: dto.estado || 'activo',
      })
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${dto.comite_id}`);
    revalidatePath(`/dashboard/comites/${dto.comite_id}/miembros`);

    return {
      success: true,
      data,
      message: 'Miembro agregado exitosamente',
    };
  } catch (error) {
    console.error('Error al crear miembro del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene los miembros de un comité
 */
export async function getMiembrosComite(comiteId: string): Promise<OperationResult<any[]>> {
  try {
    await verificarAccesoUsuarioComite(comiteId);
    const { data, error } = await getMiembrosComiteService(comiteId);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener miembros del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// DASHBOARD Y UTILIDADES
// =========================================

/**
 * Obtiene los comités de un usuario específico
 */
export async function getComitesUsuario(): Promise<OperationResult<any[]>> {
  try {
    const { user } = await verificarAutenticacion();
    const { data, error } = await getComitesDeUsuarioService(user.id);

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener comités del usuario:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene el dashboard completo de un comité
 */
export async function getDashboardComite(comiteId: string): Promise<OperationResult<any>> {
  try {
    await verificarAccesoUsuarioComite(comiteId);
    const { data, error } = await getDashboardComiteService(comiteId);

    if (error) throw error;
    if (!data) throw new Error('No se pudo obtener el dashboard');

    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener dashboard del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene el balance de un comité
 */
export async function getBalanceComite(comiteId: string): Promise<OperationResult<any>> {
  try {
    await verificarAccesoUsuarioComite(comiteId);
    const { data, error } = await getBalanceComiteService(comiteId);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener balance del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene las estadísticas de un comité
 */
export async function getEstadisticasComite(comiteId: string): Promise<OperationResult<any>> {
  try {
    await verificarAccesoUsuarioComite(comiteId);
    const { data, error } = await getEstadisticasComiteService(comiteId);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener estadísticas del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// MIEMBROS - CRUD COMPLETO (Fase 4.B)
// =========================================

/**
 * Actualiza un miembro del comité
 */
export async function updateComiteMiembro(
  miembroId: string,
  dto: Partial<CreateComiteMiembroDTO>
): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Primero obtener el miembro para verificar acceso al comité
    const { data: miembro } = await supabase
      .from('comite_miembros')
      .select('comite_id')
      .eq('id', miembroId)
      .single();

    if (!miembro) {
      throw new Error('Miembro no encontrado');
    }

    const { rol } = await verificarAccesoUsuarioComite(miembro.comite_id);

    // Solo lider y tesorero pueden editar miembros
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para editar miembros');
    }

    // Validaciones
    if (dto.nombres !== undefined && dto.nombres.trim().length === 0) {
      throw new Error('El nombre no puede estar vacío');
    }

    if (dto.apellidos !== undefined && dto.apellidos.trim().length === 0) {
      throw new Error('El apellido no puede estar vacío');
    }

    // Actualizar miembro
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.nombres) updateData.nombres = dto.nombres.trim();
    if (dto.apellidos) updateData.apellidos = dto.apellidos.trim();
    if (dto.telefono !== undefined) updateData.telefono = dto.telefono?.trim() || null;
    if (dto.email !== undefined) updateData.email = dto.email?.trim() || null;
    if (dto.estado !== undefined) updateData.estado = dto.estado;

    const { data, error } = await supabase
      .from('comite_miembros')
      .update(updateData)
      .eq('id', miembroId)
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${miembro.comite_id}/miembros`);
    revalidatePath(`/dashboard/comites/${miembro.comite_id}`);

    return {
      success: true,
      data,
      message: 'Miembro actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar miembro del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina (desactiva) un miembro del comité
 */
export async function deleteComiteMiembro(miembroId: string): Promise<OperationResult> {
  try {
    const supabase = await createClient();

    // Obtener el miembro para verificar acceso al comité
    const { data: miembro } = await supabase
      .from('comite_miembros')
      .select('comite_id')
      .eq('id', miembroId)
      .single();

    if (!miembro) {
      throw new Error('Miembro no encontrado');
    }

    const { rol } = await verificarAccesoUsuarioComite(miembro.comite_id);

    // Solo lider y tesorero pueden eliminar miembros
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para eliminar miembros');
    }

    // Desactivar en lugar de eliminar
    const { error } = await supabase
      .from('comite_miembros')
      .update({
        estado: 'inactivo',
        updated_at: new Date().toISOString(),
      })
      .eq('id', miembroId);

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${miembro.comite_id}/miembros`);
    revalidatePath(`/dashboard/comites/${miembro.comite_id}`);

    return {
      success: true,
      message: 'Miembro desactivado exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar miembro del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// PROYECTOS - CRUD COMPLETO (Fase 6.B)
// =========================================

/**
 * Crea un nuevo proyecto del comité
 */
export async function createComiteProyecto(dto: CreateComiteProyectoDTO): Promise<OperationResult<any>> {
  try {
    const { user, rol } = await verificarAccesoUsuarioComite(dto.comite_id);

    // Solo lider y tesorero pueden crear proyectos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para crear proyectos');
    }

    const supabase = await createClient();

    // Validaciones
    if (!dto.nombre || dto.nombre.trim().length === 0) {
      throw new Error('El nombre del proyecto es requerido');
    }

    if (dto.nombre.length > 200) {
      throw new Error('El nombre del proyecto no puede exceder 200 caracteres');
    }

    if (dto.monto_objetivo !== undefined && dto.monto_objetivo < 0) {
      throw new Error('El monto objetivo no puede ser negativo');
    }

    // Crear proyecto
    const { data, error } = await supabase
      .from('comite_proyectos')
      .insert({
        comite_id: dto.comite_id,
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        monto_objetivo: dto.monto_objetivo || null,
        fecha_inicio: dto.fecha_inicio || null,
        fecha_fin: dto.fecha_fin || null,
        estado: 'activo',
        monto_recaudado: 0,
        creado_por: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${dto.comite_id}/proyectos`);
    revalidatePath(`/dashboard/comites/${dto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${dto.comite_id}`);

    return {
      success: true,
      data,
      message: 'Proyecto creado exitosamente',
    };
  } catch (error) {
    console.error('Error al crear proyecto del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Actualiza un proyecto del comité
 */
export async function updateComiteProyecto(
  proyectoId: string,
  dto: Partial<CreateComiteProyectoDTO> & { estado?: 'activo' | 'completado' | 'cancelado' }
): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener el proyecto para verificar acceso
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', proyectoId)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const { user, rol } = await verificarAccesoUsuarioComite(proyecto.comite_id);

    // Solo lider y tesorero pueden editar proyectos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para editar proyectos');
    }

    // Validaciones
    if (dto.nombre !== undefined) {
      if (!dto.nombre || dto.nombre.trim().length === 0) {
        throw new Error('El nombre del proyecto no puede estar vacío');
      }

      if (dto.nombre.length > 200) {
        throw new Error('El nombre del proyecto no puede exceder 200 caracteres');
      }
    }

    if (dto.monto_objetivo !== undefined && dto.monto_objetivo < 0) {
      throw new Error('El monto objetivo no puede ser negativo');
    }

    // Actualizar proyecto
    const updateData: any = {
      updated_at: new Date().toISOString(),
      ultima_actualizacion_por: user.id,
    };

    if (dto.nombre) updateData.nombre = dto.nombre.trim();
    if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion?.trim() || null;
    if (dto.monto_objetivo !== undefined) updateData.monto_objetivo = dto.monto_objetivo;
    if (dto.fecha_inicio !== undefined) updateData.fecha_inicio = dto.fecha_inicio;
    if (dto.fecha_fin !== undefined) updateData.fecha_fin = dto.fecha_fin;
    if (dto.estado !== undefined) updateData.estado = dto.estado;

    const { data, error } = await supabase
      .from('comite_proyectos')
      .update(updateData)
      .eq('id', proyectoId)
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${proyecto.comite_id}/proyectos`);
    revalidatePath(`/dashboard/comites/${proyecto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${proyecto.comite_id}`);

    return {
      success: true,
      data,
      message: 'Proyecto actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar proyecto del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina (desactiva/cancela) un proyecto del comité
 */
export async function deleteComiteProyecto(proyectoId: string): Promise<OperationResult> {
  try {
    const supabase = await createClient();

    // Obtener el proyecto
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', proyectoId)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const { rol } = await verificarAccesoUsuarioComite(proyecto.comite_id);

    // Solo lider y tesorero pueden eliminar proyectos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para eliminar proyectos');
    }

    // Cambiar estado a cancelado
    const { error } = await supabase
      .from('comite_proyectos')
      .update({
        estado: 'cancelado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', proyectoId);

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${proyecto.comite_id}/proyectos`);
    revalidatePath(`/dashboard/comites/${proyecto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${proyecto.comite_id}`);

    return {
      success: true,
      message: 'Proyecto cancelado exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar proyecto del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene los proyectos de un comité
 */
export async function getProyectosComite(comiteId: string, estado?: string): Promise<OperationResult<any[]>> {
  try {
    await verificarAccesoUsuarioComite(comiteId);
    const { data, error } = await getProyectosComiteService({ comite_id: comiteId, estado: estado as any });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener proyectos del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// VOTOS - CRUD COMPLETO (Fase 7.B)
// =========================================

/**
 * Crea un nuevo voto del comité
 */
export async function createComiteVoto(dto: CreateComiteVotoDTO): Promise<OperationResult<any>> {
  try {
    const { user, rol } = await verificarAccesoUsuarioComite(dto.comite_id);

    // Solo lider y tesorero pueden crear votos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para crear votos');
    }

    const supabase = await createClient();

    // Validaciones
    if (!dto.concepto || dto.concepto.trim().length === 0) {
      throw new Error('El concepto es requerido');
    }

    if (dto.monto_total <= 0) {
      throw new Error('El monto total debe ser mayor a 0');
    }

    if (!dto.fecha_limite) {
      throw new Error('La fecha límite es requerida');
    }

    // Validar que el miembro existe y pertenece al comité
    const { data: miembro } = await supabase
      .from('comite_miembros')
      .select('id, comite_id')
      .eq('id', dto.comite_miembro_id)
      .eq('comite_id', dto.comite_id)
      .single();

    if (!miembro) {
      throw new Error('Miembro no encontrado en este comité');
    }

    // Si hay proyecto, validar que pertenece al comité
    if (dto.proyecto_id) {
      const { data: proyecto } = await supabase
        .from('comite_proyectos')
        .select('id, comite_id')
        .eq('id', dto.proyecto_id)
        .eq('comite_id', dto.comite_id)
        .single();

      if (!proyecto) {
        throw new Error('Proyecto no encontrado en este comité');
      }
    }

    // Crear voto
    const { data, error } = await supabase
      .from('comite_votos')
      .insert({
        comite_id: dto.comite_id,
        comite_miembro_id: dto.comite_miembro_id,
        proyecto_id: dto.proyecto_id || null,
        concepto: dto.concepto.trim(),
        monto_total: dto.monto_total,
        fecha_limite: dto.fecha_limite,
        estado: 'activo',
        recaudado: 0,
        creado_por: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${dto.comite_id}/votos`);
    revalidatePath(`/dashboard/comites/${dto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${dto.comite_id}`);

    return {
      success: true,
      data,
      message: 'Voto creado exitosamente',
    };
  } catch (error) {
    console.error('Error al crear voto del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Actualiza un voto del comité
 */
export async function updateComiteVoto(
  votoId: string,
  dto: Partial<CreateComiteVotoDTO> & { estado?: 'activo' | 'completado' | 'vencido' | 'cancelado' }
): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener el voto
    const { data: voto } = await supabase
      .from('comite_votos')
      .select('comite_id')
      .eq('id', votoId)
      .single();

    if (!voto) {
      throw new Error('Voto no encontrado');
    }

    const { user, rol } = await verificarAccesoUsuarioComite(voto.comite_id);

    // Solo lider y tesorero pueden editar votos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para editar votos');
    }

    // Validaciones
    if (dto.monto_total !== undefined && dto.monto_total <= 0) {
      throw new Error('El monto total debe ser mayor a 0');
    }

    // Actualizar voto
    const updateData: any = {
      updated_at: new Date().toISOString(),
      ultima_actualizacion_por: user.id,
    };

    if (dto.concepto) updateData.concepto = dto.concepto.trim();
    if (dto.monto_total !== undefined) updateData.monto_total = dto.monto_total;
    if (dto.fecha_limite !== undefined) updateData.fecha_limite = dto.fecha_limite;
    if (dto.estado !== undefined) updateData.estado = dto.estado;
    if (dto.proyecto_id !== undefined) updateData.proyecto_id = dto.proyecto_id;

    const { data, error } = await supabase
      .from('comite_votos')
      .update(updateData)
      .eq('id', votoId)
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${voto.comite_id}/votos`);
    revalidatePath(`/dashboard/comites/${voto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${voto.comite_id}`);

    return {
      success: true,
      data,
      message: 'Voto actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar voto del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina (cancela) un voto del comité
 */
export async function deleteComiteVoto(votoId: string): Promise<OperationResult> {
  try {
    const supabase = await createClient();

    // Obtener el voto
    const { data: voto } = await supabase
      .from('comite_votos')
      .select('comite_id, recaudado')
      .eq('id', votoId)
      .single();

    if (!voto) {
      throw new Error('Voto no encontrado');
    }

    const { rol } = await verificarAccesoUsuarioComite(voto.comite_id);

    // Solo lider y tesorero pueden eliminar votos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para eliminar votos');
    }

    // No permitir eliminar si ya tiene pagos
    if (voto.recaudado > 0) {
      throw new Error('No se puede cancelar un voto que ya tiene pagos registrados');
    }

    // Cambiar estado a cancelado
    const { error } = await supabase
      .from('comite_votos')
      .update({
        estado: 'cancelado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', votoId);

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${voto.comite_id}/votos`);
    revalidatePath(`/dashboard/comites/${voto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${voto.comite_id}`);

    return {
      success: true,
      message: 'Voto cancelado exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar voto del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene los votos de un comité
 */
export async function getVotosComite(comiteId: string, filtros?: any): Promise<OperationResult<any[]>> {
  try {
    await verificarAccesoUsuarioComite(comiteId);
    const { data, error } = await getVotosComiteService({ comite_id: comiteId, ...filtros });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener votos del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Registra un pago a un voto usando la función SQL transaccional
 */
export async function registrarPagoComite(dto: RegistrarPagoDTO): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener el voto para verificar acceso al comité
    const { data: voto } = await supabase
      .from('comite_votos')
      .select('comite_id, monto_total, recaudado, estado')
      .eq('id', dto.comite_voto_id)
      .single();

    if (!voto) {
      throw new Error('Voto no encontrado');
    }

    const { user, rol } = await verificarAccesoUsuarioComite(voto.comite_id);

    // Solo tesorero puede registrar pagos
    if (!['admin', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para registrar pagos');
    }

    // Validaciones
    if (dto.monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    if (voto.estado !== 'activo') {
      throw new Error('No se pueden registrar pagos a votos inactivos');
    }

    const montoPendiente = voto.monto_total - voto.recaudado;
    if (dto.monto > montoPendiente) {
      throw new Error(`El monto excede el pendiente (${montoPendiente})`);
    }

    // Usar la función SQL transaccional
    const { data, error } = await supabase.rpc('registrar_pago_comite', {
      p_comite_voto_id: dto.comite_voto_id,
      p_monto: dto.monto,
      p_fecha_pago: dto.fecha_pago || new Date().toISOString().split('T')[0],
      p_metodo_pago: dto.metodo_pago || 'efectivo',
      p_nota: dto.nota || undefined,
      p_registrado_por: user.id,
    });

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${voto.comite_id}/votos`);
    revalidatePath(`/dashboard/comites/${voto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${voto.comite_id}`);

    return {
      success: true,
      data,
      message: 'Pago registrado exitosamente',
    };
  } catch (error) {
    console.error('Error al registrar pago del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// OFRENDAS - CRUD COMPLETO (Fase 8.B)
// =========================================

/**
 * Registra una ofrenda del comité
 */
export async function registrarComiteOfrenda(dto: RegistrarOfrendaDTO): Promise<OperationResult<any>> {
  try {
    const { user, rol } = await verificarAccesoUsuarioComite(dto.comite_id);

    // Lider, tesorero o admin pueden registrar ofrendas
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para registrar ofrendas');
    }

    const supabase = await createClient();

    // Validaciones
    if (!dto.concepto || dto.concepto.trim().length === 0) {
      throw new Error('El concepto es requerido');
    }

    if (dto.monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Si hay proyecto, validar que pertenece al comité
    if (dto.proyecto_id) {
      const { data: proyecto } = await supabase
        .from('comite_proyectos')
        .select('id, comite_id')
        .eq('id', dto.proyecto_id)
        .eq('comite_id', dto.comite_id)
        .single();

      if (!proyecto) {
        throw new Error('Proyecto no encontrado en este comité');
      }
    }

    // Crear ofrenda
    const { data, error } = await supabase
      .from('comite_ofrendas')
      .insert({
        comite_id: dto.comite_id,
        proyecto_id: dto.proyecto_id || null,
        concepto: dto.concepto.trim(),
        monto: dto.monto,
        fecha: dto.fecha || new Date().toISOString().split('T')[0],
        tipo: dto.tipo || 'ofrenda',
        nota: dto.nota?.trim() || null,
        registrado_por: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${dto.comite_id}/ofrendas`);
    revalidatePath(`/dashboard/comites/${dto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${dto.comite_id}`);

    return {
      success: true,
      data,
      message: 'Ofrenda registrada exitosamente',
    };
  } catch (error) {
    console.error('Error al registrar ofrenda del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Actualiza una ofrenda del comité
 */
export async function updateComiteOfrenda(
  ofrendaId: string,
  dto: Partial<RegistrarOfrendaDTO>
): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener la ofrenda
    const { data: ofrenda } = await supabase
      .from('comite_ofrendas')
      .select('comite_id')
      .eq('id', ofrendaId)
      .single();

    if (!ofrenda) {
      throw new Error('Ofrenda no encontrada');
    }

    const { rol } = await verificarAccesoUsuarioComite(ofrenda.comite_id);

    // Líder y tesorero pueden editar ofrendas
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para editar ofrendas');
    }

    // Validaciones
    if (dto.monto !== undefined && dto.monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Actualizar ofrenda
    const updateData: any = {};

    if (dto.concepto) updateData.concepto = dto.concepto.trim();
    if (dto.monto !== undefined) updateData.monto = dto.monto;
    if (dto.fecha !== undefined) updateData.fecha = dto.fecha;
    if (dto.tipo !== undefined) updateData.tipo = dto.tipo;
    if (dto.nota !== undefined) updateData.nota = dto.nota?.trim() || null;
    if (dto.proyecto_id !== undefined) updateData.proyecto_id = dto.proyecto_id;

    const { data, error } = await supabase
      .from('comite_ofrendas')
      .update(updateData)
      .eq('id', ofrendaId)
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${ofrenda.comite_id}/ofrendas`);
    revalidatePath(`/dashboard/comites/${ofrenda.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${ofrenda.comite_id}`);

    return {
      success: true,
      data,
      message: 'Ofrenda actualizada exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar ofrenda del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina una ofrenda del comité
 */
export async function deleteComiteOfrenda(ofrendaId: string): Promise<OperationResult> {
  try {
    const supabase = await createClient();

    // Obtener la ofrenda
    const { data: ofrenda } = await supabase
      .from('comite_ofrendas')
      .select('comite_id')
      .eq('id', ofrendaId)
      .single();

    if (!ofrenda) {
      throw new Error('Ofrenda no encontrada');
    }

    const { rol } = await verificarAccesoUsuarioComite(ofrenda.comite_id);

    // Líder, tesorero y admin pueden eliminar ofrendas
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para eliminar ofrendas');
    }

    // Eliminar ofrenda
    const { error } = await supabase.from('comite_ofrendas').delete().eq('id', ofrendaId);

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${ofrenda.comite_id}/ofrendas`);
    revalidatePath(`/dashboard/comites/${ofrenda.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${ofrenda.comite_id}`);

    return {
      success: true,
      message: 'Ofrenda eliminada exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar ofrenda del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene las ofrendas de un comité
 */
export async function getOfrendasComite(comiteId: string): Promise<OperationResult<any[]>> {
  try {
    await verificarAccesoUsuarioComite(comiteId);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('comite_ofrendas')
      .select('*')
      .eq('comite_id', comiteId)
      .order('fecha', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener ofrendas del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// GASTOS - CRUD COMPLETO (Fase 9.B)
// =========================================

/**
 * Registra un gasto del comité
 */
export async function registrarComiteGasto(dto: RegistrarGastoDTO): Promise<OperationResult<any>> {
  try {
    const { user, rol } = await verificarAccesoUsuarioComite(dto.comite_id);

    // Líder y tesorero pueden registrar gastos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para registrar gastos');
    }

    const supabase = await createClient();

    // Validaciones
    if (!dto.concepto || dto.concepto.trim().length === 0) {
      throw new Error('El concepto es requerido');
    }

    if (dto.monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Si hay proyecto, validar que pertenece al comité
    if (dto.proyecto_id) {
      const { data: proyecto } = await supabase
        .from('comite_proyectos')
        .select('id, comite_id')
        .eq('id', dto.proyecto_id)
        .eq('comite_id', dto.comite_id)
        .single();

      if (!proyecto) {
        throw new Error('Proyecto no encontrado en este comité');
      }
    }

    // Crear gasto
    const { data, error } = await supabase
      .from('comite_gastos')
      .insert({
        comite_id: dto.comite_id,
        proyecto_id: dto.proyecto_id || null,
        concepto: dto.concepto.trim(),
        monto: dto.monto,
        fecha: dto.fecha || new Date().toISOString().split('T')[0],
        metodo_pago: dto.metodo_pago || 'efectivo',
        comprobante: dto.comprobante?.trim() || null,
        nota: dto.nota?.trim() || null,
        registrado_por: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${dto.comite_id}/gastos`);
    revalidatePath(`/dashboard/comites/${dto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${dto.comite_id}`);

    return {
      success: true,
      data,
      message: 'Gasto registrado exitosamente',
    };
  } catch (error) {
    console.error('Error al registrar gasto del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Actualiza un gasto del comité
 */
export async function updateComiteGasto(gastoId: string, dto: Partial<RegistrarGastoDTO>): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener el gasto
    const { data: gasto } = await supabase
      .from('comite_gastos')
      .select('comite_id')
      .eq('id', gastoId)
      .single();

    if (!gasto) {
      throw new Error('Gasto no encontrado');
    }

    const { rol } = await verificarAccesoUsuarioComite(gasto.comite_id);

    // Líder y tesorero pueden editar gastos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para editar gastos');
    }

    // Validaciones
    if (dto.monto !== undefined && dto.monto <= 0) {
      throw new Error('El monto debe ser mayor a 0');
    }

    // Actualizar gasto
    const updateData: any = {};

    if (dto.concepto) updateData.concepto = dto.concepto.trim();
    if (dto.monto !== undefined) updateData.monto = dto.monto;
    if (dto.fecha !== undefined) updateData.fecha = dto.fecha;
    if (dto.metodo_pago !== undefined) updateData.metodo_pago = dto.metodo_pago;
    if (dto.comprobante !== undefined) updateData.comprobante = dto.comprobante?.trim() || null;
    if (dto.nota !== undefined) updateData.nota = dto.nota?.trim() || null;
    if (dto.proyecto_id !== undefined) updateData.proyecto_id = dto.proyecto_id;

    const { data, error } = await supabase
      .from('comite_gastos')
      .update(updateData)
      .eq('id', gastoId)
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${gasto.comite_id}/gastos`);
    revalidatePath(`/dashboard/comites/${gasto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${gasto.comite_id}`);

    return {
      success: true,
      data,
      message: 'Gasto actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar gasto del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina un gasto del comité
 */
export async function deleteComiteGasto(gastoId: string): Promise<OperationResult> {
  try {
    const supabase = await createClient();

    // Obtener el gasto
    const { data: gasto } = await supabase
      .from('comite_gastos')
      .select('comite_id')
      .eq('id', gastoId)
      .single();

    if (!gasto) {
      throw new Error('Gasto no encontrado');
    }

    const { rol } = await verificarAccesoUsuarioComite(gasto.comite_id);

    // Solo admin puede eliminar gastos
    if (rol !== 'admin') {
      throw new Error('Solo administradores pueden eliminar gastos');
    }

    // Eliminar gasto
    const { error } = await supabase.from('comite_gastos').delete().eq('id', gastoId);

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${gasto.comite_id}/gastos`);
    revalidatePath(`/dashboard/comites/${gasto.comite_id}/dashboard`);
    revalidatePath(`/dashboard/comites/${gasto.comite_id}`);

    return {
      success: true,
      message: 'Gasto eliminado exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar gasto del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene los gastos de un comité
 */
export async function getGastosComite(comiteId: string): Promise<OperationResult<any[]>> {
  try {
    await verificarAccesoUsuarioComite(comiteId);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('comite_gastos')
      .select('*')
      .eq('comite_id', comiteId)
      .order('fecha', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener gastos del comité:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// PRODUCTOS - CRUD COMPLETO (Sistema de Ventas)
// =========================================

/**
 * Crea un nuevo producto del proyecto
 */
export async function createProyectoProducto(dto: CreateProyectoProductoDTO): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener el proyecto para verificar acceso
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', dto.proyecto_id)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const { user, rol } = await verificarAccesoUsuarioComite(proyecto.comite_id);

    // Solo lider y tesorero pueden crear productos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para crear productos');
    }

    // Validaciones
    if (!dto.nombre || dto.nombre.trim().length === 0) {
      throw new Error('El nombre del producto es requerido');
    }

    if (dto.precio_unitario <= 0) {
      throw new Error('El precio debe ser mayor a cero');
    }

    // Crear producto
    const { data, error } = await supabase
      .from('proyecto_productos')
      .insert({
        proyecto_id: dto.proyecto_id,
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        precio_unitario: dto.precio_unitario,
        estado: 'activo',
        creado_por: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${proyecto.comite_id}/proyectos/${dto.proyecto_id}`);

    return {
      success: true,
      data,
      message: 'Producto creado exitosamente',
    };
  } catch (error) {
    console.error('Error al crear producto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Actualiza un producto del proyecto
 */
export async function updateProyectoProducto(
  productoId: string,
  dto: Partial<CreateProyectoProductoDTO> & { estado?: 'activo' | 'inactivo' }
): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener el producto para verificar acceso
    const { data: producto } = await supabase
      .from('proyecto_productos')
      .select('proyecto_id')
      .eq('id', productoId)
      .single();

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Obtener el comite_id desde el proyecto
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', producto.proyecto_id)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const comiteId = proyecto.comite_id;
    const { rol } = await verificarAccesoUsuarioComite(comiteId);

    // Solo lider y tesorero pueden editar productos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para editar productos');
    }

    // Validaciones
    if (dto.precio_unitario !== undefined && dto.precio_unitario <= 0) {
      throw new Error('El precio debe ser mayor a cero');
    }

    // Actualizar producto
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.nombre) updateData.nombre = dto.nombre.trim();
    if (dto.descripcion !== undefined) updateData.descripcion = dto.descripcion?.trim() || null;
    if (dto.precio_unitario !== undefined) updateData.precio_unitario = dto.precio_unitario;
    if (dto.estado !== undefined) updateData.estado = dto.estado;

    const { data, error } = await supabase
      .from('proyecto_productos')
      .update(updateData)
      .eq('id', productoId)
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${comiteId}/proyectos`);

    return {
      success: true,
      data,
      message: 'Producto actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina un producto del proyecto
 */
export async function deleteProyectoProducto(productoId: string): Promise<OperationResult> {
  try {
    const supabase = await createClient();

    // Obtener el producto para verificar acceso
    const { data: producto } = await supabase
      .from('proyecto_productos')
      .select('proyecto_id')
      .eq('id', productoId)
      .single();

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    // Obtener el comite_id desde el proyecto
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', producto.proyecto_id)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const comiteId = proyecto.comite_id;
    const { rol } = await verificarAccesoUsuarioComite(comiteId);

    // Solo lider y tesorero pueden eliminar productos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para eliminar productos');
    }

    // Verificar si tiene ventas asociadas
    const { data: ventas } = await supabase
      .from('proyecto_ventas')
      .select('id')
      .eq('producto_id', productoId)
      .limit(1);

    if (ventas && ventas.length > 0) {
      throw new Error('No se puede eliminar un producto con ventas asociadas. Puedes desactivarlo en su lugar.');
    }

    // Eliminar producto
    const { error } = await supabase
      .from('proyecto_productos')
      .delete()
      .eq('id', productoId);

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${comiteId}/proyectos`);

    return {
      success: true,
      message: 'Producto eliminado exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene los productos de un proyecto
 */
export async function getProductosProyecto(proyectoId: string): Promise<OperationResult<any[]>> {
  try {
    const supabase = await createClient();

    // Obtener el proyecto para verificar acceso
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', proyectoId)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    await verificarAccesoUsuarioComite(proyecto.comite_id);

    const { data, error } = await supabase
      .from('proyecto_productos')
      .select('*')
      .eq('proyecto_id', proyectoId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener productos del proyecto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// VENTAS - CRUD COMPLETO (Sistema de Ventas)
// =========================================

/**
 * Crea una nueva venta
 */
export async function createProyectoVenta(dto: CreateProyectoVentaDTO): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener el proyecto para verificar acceso
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', dto.proyecto_id)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const { user } = await verificarAccesoUsuarioComite(proyecto.comite_id);

    // Validaciones
    if (!dto.comprador_nombre || dto.comprador_nombre.trim().length === 0) {
      throw new Error('El nombre del comprador es requerido');
    }

    if (dto.cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a cero');
    }

    if (dto.precio_unitario <= 0) {
      throw new Error('El precio debe ser mayor a cero');
    }

    // Verificar que el producto existe y pertenece al proyecto
    const { data: producto } = await supabase
      .from('proyecto_productos')
      .select('id, proyecto_id, estado')
      .eq('id', dto.producto_id)
      .eq('proyecto_id', dto.proyecto_id)
      .single();

    if (!producto) {
      throw new Error('Producto no encontrado en este proyecto');
    }

    if (producto.estado !== 'activo') {
      throw new Error('El producto no está activo');
    }

    const valorTotal = dto.cantidad * dto.precio_unitario;

    // Determinar estado y monto pagado según el estado_pago
    const esPagado = dto.estado_pago === 'pagado';
    const estado = esPagado ? 'pagado' : 'pendiente';
    const montoPagado = esPagado ? valorTotal : 0;

    // Crear venta
    const { data, error } = await supabase
      .from('proyecto_ventas')
      .insert({
        proyecto_id: dto.proyecto_id,
        producto_id: dto.producto_id,
        comprador_nombre: dto.comprador_nombre.trim(),
        comprador_telefono: dto.comprador_telefono?.trim() || null,
        comprador_email: dto.comprador_email?.trim() || null,
        comprador_notas: dto.comprador_notas?.trim() || null,
        cantidad: dto.cantidad,
        precio_unitario: dto.precio_unitario,
        valor_total: valorTotal,
        monto_pagado: montoPagado,
        estado: estado,
        fecha_venta: dto.fecha_venta || new Date().toISOString().split('T')[0],
        registrado_por: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Si la venta está marcada como pagada, crear automáticamente el registro de pago
    if (esPagado && dto.metodo_pago && data) {
      const { error: pagoError } = await supabase
        .from('proyecto_pagos_ventas')
        .insert({
          venta_id: data.id,
          monto: valorTotal,
          fecha_pago: dto.fecha_venta || new Date().toISOString().split('T')[0],
          metodo_pago: dto.metodo_pago,
          notas: 'Pago registrado al momento de la venta',
          registrado_por: user.id,
        });

      if (pagoError) {
        console.error('Error al crear registro de pago:', pagoError);
        // No lanzar error, la venta ya fue creada exitosamente
      }
    }

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${proyecto.comite_id}/proyectos/${dto.proyecto_id}`);

    return {
      success: true,
      data,
      message: 'Venta registrada exitosamente',
    };
  } catch (error) {
    console.error('Error al crear venta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Actualiza una venta
 */
export async function updateProyectoVenta(
  ventaId: string,
  dto: Partial<CreateProyectoVentaDTO> & { estado?: 'pendiente' | 'pagado' | 'cancelado' }
): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener la venta para verificar acceso
    const { data: venta } = await supabase
      .from('proyecto_ventas')
      .select('proyecto_id')
      .eq('id', ventaId)
      .single();

    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    // Obtener el comite_id desde el proyecto
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', venta.proyecto_id)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const comiteId = proyecto.comite_id;
    const { rol } = await verificarAccesoUsuarioComite(comiteId);

    // Solo lider y tesorero pueden editar ventas
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para editar ventas');
    }

    // Actualizar venta
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.comprador_nombre) updateData.comprador_nombre = dto.comprador_nombre.trim();
    if (dto.comprador_telefono !== undefined) updateData.comprador_telefono = dto.comprador_telefono?.trim() || null;
    if (dto.comprador_email !== undefined) updateData.comprador_email = dto.comprador_email?.trim() || null;
    if (dto.comprador_notas !== undefined) updateData.comprador_notas = dto.comprador_notas?.trim() || null;
    if (dto.estado !== undefined) updateData.estado = dto.estado;

    // Si se actualiza cantidad o precio, recalcular valor_total
    if (dto.cantidad !== undefined || dto.precio_unitario !== undefined) {
      const ventaActual: any = venta;
      const nuevaCantidad = dto.cantidad || ventaActual.cantidad;
      const nuevoPrecio = dto.precio_unitario || ventaActual.precio_unitario;

      updateData.cantidad = nuevaCantidad;
      updateData.precio_unitario = nuevoPrecio;
      updateData.valor_total = nuevaCantidad * nuevoPrecio;
    }

    const { data, error } = await supabase
      .from('proyecto_ventas')
      .update(updateData)
      .eq('id', ventaId)
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${comiteId}/proyectos`);

    return {
      success: true,
      data,
      message: 'Venta actualizada exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Actualiza una venta (cantidad, precio unitario, total)
 */
export async function actualizarProyectoVenta(
  ventaId: string,
  data: { cantidad?: number; precio_unitario?: number; total?: number }
): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener la venta para verificar acceso
    const { data: venta } = await supabase
      .from('proyecto_ventas')
      .select('proyecto_id, estado, monto_pagado, valor_total')
      .eq('id', ventaId)
      .single();

    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    if (venta.estado === 'cancelado') {
      throw new Error('No se pueden editar ventas canceladas');
    }

    // Obtener el comite_id desde el proyecto
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', venta.proyecto_id)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    await verificarAccesoUsuarioComite(proyecto.comite_id);

    // Preparar datos a actualizar
    const updateData: any = {};
    
    if (data.cantidad !== undefined) {
      updateData.cantidad = data.cantidad;
    }
    
    if (data.precio_unitario !== undefined) {
      updateData.precio_unitario = data.precio_unitario;
    }
    
    if (data.total !== undefined) {
      updateData.valor_total = data.total;
    }

    // Validar que el nuevo total no sea menor al monto pagado
    const nuevoTotal = data.total || venta.valor_total || 0;
    if (nuevoTotal < venta.monto_pagado) {
      throw new Error('El nuevo total no puede ser menor al monto ya pagado');
    }

    // Actualizar venta
    const { data: updated, error } = await supabase
      .from('proyecto_ventas')
      .update(updateData)
      .eq('id', ventaId)
      .select()
      .single();

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${proyecto.comite_id}/proyectos`);

    return {
      success: true,
      data: updated,
      message: 'Venta actualizada exitosamente',
    };
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina una venta
 */
export async function deleteProyectoVenta(ventaId: string): Promise<OperationResult> {
  try {
    const supabase = await createClient();

    // Obtener la venta para verificar acceso
    const { data: venta } = await supabase
      .from('proyecto_ventas')
      .select('proyecto_id')
      .eq('id', ventaId)
      .single();

    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    // Obtener el comite_id desde el proyecto
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', venta.proyecto_id)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const comiteId = proyecto.comite_id;
    const { rol } = await verificarAccesoUsuarioComite(comiteId);

    // Solo lider y tesorero pueden eliminar ventas
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para eliminar ventas');
    }

    // Eliminar venta (los pagos se eliminan en cascada)
    const { error } = await supabase
      .from('proyecto_ventas')
      .delete()
      .eq('id', ventaId);

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${comiteId}/proyectos`);

    return {
      success: true,
      message: 'Venta eliminada exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene las ventas de un proyecto
 */
export async function getVentasProyecto(proyectoId: string): Promise<OperationResult<any[]>> {
  try {
    const supabase = await createClient();

    // Obtener el proyecto para verificar acceso
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', proyectoId)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    await verificarAccesoUsuarioComite(proyecto.comite_id);

    const { data, error } = await supabase
      .from('proyecto_ventas')
      .select(`
        *,
        proyecto_productos (
          id,
          nombre,
          precio_unitario
        )
      `)
      .eq('proyecto_id', proyectoId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener ventas del proyecto:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// =========================================
// PAGOS DE VENTAS - CRUD COMPLETO
// =========================================

/**
 * Registra un pago de venta
 */
export async function registrarPagoVenta(dto: RegistrarPagoVentaDTO): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener la venta para verificar acceso y validar
    const { data: venta } = await supabase
      .from('proyecto_ventas')
      .select('*')
      .eq('id', dto.venta_id)
      .single();

    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    if (venta.estado === 'cancelado') {
      throw new Error('No se pueden registrar pagos en ventas canceladas');
    }

    // Obtener el comite_id desde el proyecto
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', venta.proyecto_id)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const comiteId = proyecto.comite_id;
    const { user } = await verificarAccesoUsuarioComite(comiteId);

    // Validaciones
    if (dto.monto <= 0) {
      throw new Error('El monto debe ser mayor a cero');
    }

    const saldoPendiente = venta.valor_total - venta.monto_pagado;
    if (dto.monto > saldoPendiente) {
      throw new Error(`El monto excede el saldo pendiente ($${saldoPendiente.toLocaleString('es-CO')})`);
    }

    // Registrar pago
    const { data, error } = await supabase
      .from('proyecto_pagos_ventas')
      .insert({
        venta_id: dto.venta_id,
        monto: dto.monto,
        fecha_pago: dto.fecha_pago || new Date().toISOString().split('T')[0],
        metodo_pago: dto.metodo_pago || null,
        referencia: dto.referencia?.trim() || null,
        notas: dto.notas?.trim() || null,
        registrado_por: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // El trigger actualiza automáticamente el monto_pagado y el estado

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${comiteId}/proyectos`);

    return {
      success: true,
      data,
      message: 'Pago registrado exitosamente',
    };
  } catch (error) {
    console.error('Error al registrar pago de venta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene los pagos de una venta
 */
export async function getPagosVenta(ventaId: string): Promise<OperationResult<any[]>> {
  try {
    const supabase = await createClient();

    // Obtener la venta para verificar acceso
    const { data: venta } = await supabase
      .from('proyecto_ventas')
      .select('proyecto_id')
      .eq('id', ventaId)
      .single();

    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    // Obtener el comite_id desde el proyecto
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', venta.proyecto_id)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    await verificarAccesoUsuarioComite(proyecto.comite_id);

    const { data, error } = await supabase
      .from('proyecto_pagos_ventas')
      .select('*')
      .eq('venta_id', ventaId)
      .order('fecha_pago', { ascending: false });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error al obtener pagos de venta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Elimina un pago de venta
 */
export async function deletePagoVenta(pagoId: string): Promise<OperationResult> {
  try {
    const supabase = await createClient();

    // Obtener el pago para verificar acceso
    const { data: pago } = await supabase
      .from('proyecto_pagos_ventas')
      .select(`
        *,
        venta:proyecto_ventas(proyecto_id)
      `)
      .eq('id', pagoId)
      .single();

    if (!pago) {
      throw new Error('Pago no encontrado');
    }

    const ventaProyectoId = (pago as any).venta?.proyecto_id;

    // Obtener el comite_id desde el proyecto
    const { data: proyecto } = await supabase
      .from('comite_proyectos')
      .select('comite_id')
      .eq('id', ventaProyectoId)
      .single();

    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }

    const comiteId = proyecto.comite_id;
    const { rol } = await verificarAccesoUsuarioComite(comiteId);

    // Solo lider y tesorero pueden eliminar pagos
    if (!['admin', 'lider', 'tesorero'].includes(rol)) {
      throw new Error('No tienes permisos para eliminar pagos');
    }

    // Eliminar pago (el trigger actualiza automáticamente el monto_pagado)
    const { error } = await supabase
      .from('proyecto_pagos_ventas')
      .delete()
      .eq('id', pagoId);

    if (error) throw error;

    // Revalidar rutas
    revalidatePath(`/dashboard/comites/${comiteId}/proyectos`);

    return {
      success: true,
      message: 'Pago eliminado exitosamente',
    };
  } catch (error) {
    console.error('Error al eliminar pago de venta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Obtiene una venta específica con todos sus datos relacionados
 */
export async function getProyectoVenta(ventaId: string): Promise<OperationResult<any>> {
  try {
    const supabase = await createClient();

    // Obtener venta con datos relacionados
    const { data: venta, error } = await supabase
      .from('proyecto_ventas')
      .select(`
        *,
        proyecto_productos (
          id,
          nombre,
          precio_unitario,
          descripcion
        ),
        comite_proyectos (
          id,
          nombre,
          comite_id
        )
      `)
      .eq('id', ventaId)
      .single();

    if (error) throw error;

    if (!venta) {
      throw new Error('Venta no encontrada');
    }

    // Verificar acceso al comité
    await verificarAccesoUsuarioComite((venta.comite_proyectos as any).comite_id);

    return { success: true, data: venta };
  } catch (error) {
    console.error('Error al obtener venta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
