'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { Key, Copy, Check } from 'lucide-react'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
  userId: string
  onSuccess: () => void
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  userEmail,
  userId,
  onSuccess
}: ResetPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleReset = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/usuarios/${userId}/reset-password`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al resetear la contraseña')
      }

      setNewPassword(data.temporaryPassword)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resetear la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (newPassword) {
      await navigator.clipboard.writeText(newPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setNewPassword(null)
    setError(null)
    setCopied(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Resetear Contraseña"
      size="md"
    >
      <div className="space-y-4">
        {!newPassword ? (
          <>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                ¿Deseas generar una nueva contraseña temporal para:
              </p>
              <p className="text-base font-semibold text-gray-900 mb-4">
                {userEmail}
              </p>
              <p className="text-xs text-gray-500">
                Se generará una contraseña aleatoria que podrás copiar y enviar al usuario.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Generando...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    Generar Contraseña
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Contraseña temporal generada exitosamente
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-2">Nueva contraseña temporal:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-lg font-mono font-bold text-gray-900 bg-white px-3 py-2 rounded border border-gray-300">
                    {newPassword}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copiar contraseña"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">
                  <strong>Importante:</strong> Guarda esta contraseña de forma segura. 
                  No podrás verla nuevamente. El usuario deberá cambiarla en su próximo inicio de sesión.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
