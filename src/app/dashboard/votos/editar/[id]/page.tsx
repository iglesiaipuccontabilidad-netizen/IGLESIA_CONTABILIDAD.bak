'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getVotoById, updateVoto } from '@/app/actions/votos-actions'
import { getAllPropositos } from '@/app/actions/propositos-actions'
import type { VotoDetalle } from '@/types/votos'

export default function EditarVotoPage() {
  const router = useRouter()
  const params = useParams()
  const votoId = params.id as string

  const [voto, setVoto] = useState<VotoDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propositos, setPropositos] = useState<Array<{ id: string; nombre: string; descripcion: string | null }>>([])

  const [formData, setFormData] = useState({
    proposito_id: '',
    proposito_personalizado: '',
    monto_total: '',
    fecha_limite: '',
    estado: 'activo'
  })

  useEffect(() => {
    cargarVoto()
    cargarPropositos()
  }, [votoId])

  const cargarVoto = async () => {
    try {
      setLoading(true)
      const { data, error } = await getVotoById(votoId)

      if (error || !data) {
        setError('No se pudo cargar el voto')
        return
      }

      setVoto(data)
      setFormData({
        proposito_id: data.proposito_id || '',
        proposito_personalizado: data.proposito_id ? '' : (data.proposito || ''),
        monto_total: data.monto_total.toString(),
        fecha_limite: data.fecha_limite.split('T')[0],
        estado: data.estado
      })
    } catch (err) {
      console.error('Error al cargar voto:', err)
      setError('Error al cargar el voto')
    } finally {
      setLoading(false)
    }
  }

  const cargarPropositos = async () => {
    try {
      const { data, error } = await getAllPropositos()
      if (error) {
        console.error('Error al cargar propósitos:', error)
        return
      }
      if (data) {
        setPropositos(data)
      }
    } catch (err) {
      console.error('Error al cargar propósitos:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que se haya seleccionado o escrito un propósito
    const propositoFinal = formData.proposito_id ? 
      propositos.find(p => p.id === formData.proposito_id)?.nombre || '' : 
      formData.proposito_personalizado

    if (!propositoFinal || !formData.monto_total || !formData.fecha_limite) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      setGuardando(true)
      setError(null)

      const resultado = await updateVoto(votoId, {
        proposito: propositoFinal,
        proposito_id: formData.proposito_id || null,
        monto_total: parseFloat(formData.monto_total),
        fecha_limite: formData.fecha_limite,
        estado: formData.estado as 'activo' | 'completado' | 'vencido'
      })

      if (!resultado.success) {
        setError('Error al actualizar el voto')
        return
      }

      router.push('/dashboard/votos')
    } catch (err) {
      console.error('Error al guardar:', err)
      setError('Error al guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-slate-600">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        <p className="text-sm font-medium">Cargando voto...</p>
      </div>
    )
  }

  if (error && !voto) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="text-red-500 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-semibold">{error}</p>
        </div>
        <Link href="/dashboard/votos" className="btn btn-primary">
          Volver a votos
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-50 via-slate-50 to-cyan-50 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 right-20 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl"></div>
        <div className="absolute bottom-24 left-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <Link
            href="/dashboard/votos"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Volver a votos
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 bg-clip-text text-transparent">
            Editar Voto
          </h1>
          <p className="text-sm text-slate-600">
            Modifica los detalles del voto de {voto?.miembro ? `${voto.miembro.nombres} ${voto.miembro.apellidos}` : 'Sin asignar'}
          </p>
        </div>

        {/* Formulario */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="proposito" className="block text-sm font-semibold text-slate-700 mb-2">
                Propósito *
              </label>
              <select
                id="proposito"
                value={formData.proposito_id}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  proposito_id: e.target.value,
                  proposito_personalizado: e.target.value ? '' : formData.proposito_personalizado
                })}
                className="input w-full mb-2"
              >
                <option value="">Seleccionar propósito existente...</option>
                {propositos.map((proposito) => (
                  <option key={proposito.id} value={proposito.id}>
                    {proposito.nombre}
                  </option>
                ))}
              </select>
              
              <div className="text-sm text-slate-500 mb-2">O</div>
              
              <input
                type="text"
                id="proposito_personalizado"
                value={formData.proposito_personalizado}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  proposito_personalizado: e.target.value,
                  proposito_id: e.target.value ? '' : formData.proposito_id
                })}
                className="input w-full"
                placeholder="Escribir propósito personalizado"
                disabled={!!formData.proposito_id}
              />
              <p className="mt-1 text-xs text-slate-500">
                Selecciona un propósito existente o escribe uno personalizado
              </p>
            </div>

            <div>
              <label htmlFor="monto_total" className="block text-sm font-semibold text-slate-700 mb-2">
                Monto total *
              </label>
              <input
                type="number"
                id="monto_total"
                value={formData.monto_total}
                onChange={(e) => setFormData({ ...formData, monto_total: e.target.value })}
                className="input w-full"
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Monto recaudado actual: ${parseFloat(voto?.recaudado?.toString() || '0').toLocaleString('es-CO')}
              </p>
            </div>

            <div>
              <label htmlFor="fecha_limite" className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha límite *
              </label>
              <input
                type="date"
                id="fecha_limite"
                value={formData.fecha_limite}
                onChange={(e) => setFormData({ ...formData, fecha_limite: e.target.value })}
                className="input w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="estado" className="block text-sm font-semibold text-slate-700 mb-2">
                Estado *
              </label>
              <select
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="input w-full"
                required
              >
                <option value="activo">Activo</option>
                <option value="completado">Completado</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={guardando}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardando ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </button>
              <Link
                href="/dashboard/votos"
                className="btn bg-slate-100 text-slate-700 hover:bg-slate-200 flex-1 text-center"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>

        {/* Info del miembro */}
        {voto?.miembro && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Información del miembro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Nombre:</span>
                <p className="font-semibold text-slate-900">{voto.miembro.nombres} {voto.miembro.apellidos}</p>
              </div>
              <div>
                <span className="text-slate-600">Progreso:</span>
                <p className="font-semibold text-slate-900">{voto.progreso}%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
