import { Suspense } from 'react'

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-4 rounded-lg bg-gray-50 flex items-center gap-3">
        <div className="animate-spin h-5 w-5 text-blue-500 border-2 border-blue-500 rounded-full border-t-transparent" />
        <span className="text-sm text-gray-600">Cargando...</span>
      </div>
    </div>
  )
}

function MiembroForm() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Editar Miembro</h1>
      {/* Formulario de edición */}
    </div>
  )
}

export default function MiembroFormPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MiembroForm />
    </Suspense>
  )
}
