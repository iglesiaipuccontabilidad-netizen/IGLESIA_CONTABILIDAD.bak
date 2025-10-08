'use client'

import { signup } from '../login/actions'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'

export default function RegistroPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Registro de Miembro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Completa tus datos para crear una cuenta
          </p>
        </div>

        <ErrorBoundary
          fallback={
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                Ha ocurrido un error al registrarse
              </div>
            </div>
          }
        >
          <form className="mt-8 space-y-6" action={async (formData: FormData) => {
            const result = await signup(formData)
            if (result.success) {
              router.push(result.redirect)
            }
          }}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="nombres" className="block text-sm font-medium text-gray-700">
                  Nombres
                </label>
                <input
                  id="nombres"
                  name="nombres"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Juan David"
                />
              </div>

              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700">
                  Apellidos
                </label>
                <input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Pérez García"
                />
              </div>

              <div>
                <label htmlFor="cedula" className="block text-sm font-medium text-gray-700">
                  Cédula
                </label>
                <input
                  id="cedula"
                  name="cedula"
                  type="text"
                  required
                  pattern="[0-9]{8,10}"
                  className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="1234567890"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="3001234567"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Mínimo 8 caracteres
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Registrarse
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="flex-1 justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        </ErrorBoundary>
      </div>
    </div>
  )
}