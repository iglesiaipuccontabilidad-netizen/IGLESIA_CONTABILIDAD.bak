"use client"

import { useState } from "react"
import { X, AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const variantClasses = {
    danger: {
      icon: "text-rose-600",
      bg: "bg-rose-50",
      button: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500",
    },
    warning: {
      icon: "text-amber-600",
      bg: "bg-amber-50",
      button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
    },
    info: {
      icon: "text-blue-600",
      bg: "bg-blue-50",
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    },
  }

  const classes = variantClasses[variant]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in-0 duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full ${classes.bg} flex items-center justify-center flex-shrink-0`}>
              <AlertTriangle className={`w-6 h-6 ${classes.icon}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {title}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              px-4 py-2 rounded-lg text-white transition-colors
              disabled:opacity-50 flex items-center gap-2
              ${classes.button}
            `}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
