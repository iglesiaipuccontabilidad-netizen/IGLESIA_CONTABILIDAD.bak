'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { createMember } from '@/app/api/miembros/actions'

export default function NuevoMiembroForm() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault()
      setLoading(true)
      setError('')

      const formData = new FormData(e.currentTarget)

      await createMember(formData)

      router.push('/dashboard/miembros')
      router.refresh()
    } catch (err: any) {
      console.error('Error:', err)
      setError('Error al guardar: ' + (err.message || 'No se pudo crear el miembro'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-50 via-slate-50 to-cyan-50 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-16 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute bottom-24 right-24 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-200/10 blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full lg:w-2/3">
            <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-8 shadow-soft backdrop-blur">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-gradient-to-br from-primary-400 to-blue-500 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-gradient-to-tr from-cyan-400 to-primary-400 blur-3xl" />
              </div>

              <div className="relative mb-10 flex flex-col gap-3">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-100/80 bg-primary-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 shadow-sm">
                  Nuevo miembro
                </span>
                <h1 className="text-3xl font-bold text-slate-900">Registrar miembro</h1>
                <p className="max-w-xl text-sm text-slate-600">
                  Completa los datos indispensables de la persona. Podrás ampliar la información desde su perfil más adelante.
                </p>
              </div>

              {error && (
                <div className="relative mb-8 overflow-hidden rounded-2xl border border-rose-200/70 bg-rose-50/80 p-4 text-sm text-rose-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">!</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="relative space-y-10">
                <section className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128V18A4.5 4.5 0 0010.5 13.5h-1A4.5 4.5 0 005 18v1.128M19.5 21v-1.377a2.25 2.25 0 00-.702-1.631 4.875 4.875 0 00-3.423-1.367" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Información personal</h2>
                      <p className="text-xs text-slate-500">Nombre y documento</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="nombres" className="text-sm font-medium text-slate-700">Nombres <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        id="nombres"
                        name="nombres"
                        className="input bg-white focus:ring-primary-500 focus:ring-2 focus:border-transparent"
                        placeholder="Ej. Juan David"
                        required
                        minLength={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="apellidos" className="text-sm font-medium text-slate-700">Apellidos <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        id="apellidos"
                        name="apellidos"
                        className="input bg-white focus:ring-primary-500 focus:ring-2 focus:border-transparent"
                        placeholder="Ej. Aguilar Pérez"
                        required
                        minLength={2}
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                      <label htmlFor="cedula" className="text-sm font-medium text-slate-700">Cédula <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        id="cedula"
                        name="cedula"
                        className="input bg-white focus:ring-primary-500 focus:ring-2 focus:border-transparent"
                        pattern="[0-9]{8,12}"
                        title="Ingrese un número de cédula válido (8-12 dígitos)"
                        placeholder="Sin puntos ni espacios"
                        required
                      />
                      <p className="text-xs text-slate-500">Entre 8 y 12 números.</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 8.25h.008v.008H8.25V8.25zm0 7.5h.008v.008H8.25v-.008zm7.5-7.5h.008v.008H15.75V8.25zm0 7.5h.008v.008H15.75v-.008z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Contacto</h2>
                      <p className="text-xs text-slate-500">Datos opcionales</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <label htmlFor="telefono" className="font-medium text-slate-700">Teléfono</label>
                        <span className="text-xs text-slate-400">Opcional</span>
                      </div>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        className="input bg-white focus:ring-primary-500 focus:ring-2 focus:border-transparent"
                        placeholder="Ej. 3001234567"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <label htmlFor="email" className="font-medium text-slate-700">Correo electrónico</label>
                        <span className="text-xs text-slate-400">Opcional</span>
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="input bg-white focus:ring-primary-500 focus:ring-2 focus:border-transparent"
                        placeholder="Ej. juan@correo.com"
                      />
                    </div>
                  </div>
                </section>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-600">i</span>
                    <span>Los datos pueden editarse después del registro.</span>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="btn btn-md btn-ghost border border-slate-200 text-slate-600 hover:bg-slate-100"
                      disabled={loading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-md bg-gradient-to-r from-primary-500 via-primary-600 to-cyan-500 text-white shadow-md shadow-primary-500/20 hover:shadow-lg disabled:opacity-60"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Guardando...</span>
                        </div>
                      ) : (
                        'Crear miembro'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <aside className="w-full lg:w-1/3">
            <div className="sticky top-24 space-y-6">
              <div className="space-y-4 rounded-3xl border border-white/60 bg-white/90 p-6 shadow-soft backdrop-blur">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Recordatorios rápidos</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  {[
                    'Nombre y cédula son obligatorios.',
                    'Teléfono y correo son opcionales.',
                    'Puedes ampliar la ficha del miembro después.'
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}