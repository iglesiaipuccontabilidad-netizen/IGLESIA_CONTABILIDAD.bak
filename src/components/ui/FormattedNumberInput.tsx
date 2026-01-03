"use client"

import { useState, useEffect, forwardRef } from "react"
import { DollarSign } from "lucide-react"

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur' | 'value'> {
  value?: string | number
  onChange?: any
  onBlur?: any
  label?: string
  error?: string
  required?: boolean
  helpText?: string
  showCurrency?: boolean
  showFormatted?: boolean
  min?: number
  max?: number
  quickAmounts?: number[]
}

export const FormattedNumberInput = forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  (
    {
      value = '',
      onChange,
      label,
      error,
      required,
      helpText,
      showCurrency = true,
      showFormatted = true,
      min,
      max,
      quickAmounts,
      className,
      disabled,
      placeholder = "0",
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    // Formatear número con separadores de miles
    const formatNumber = (num: number | string): string => {
      const numValue = typeof num === 'string' ? parseFloat(num) : num
      if (isNaN(numValue)) return ''
      return numValue.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    }

    // Actualizar valor mostrado cuando cambia el valor externo
    useEffect(() => {
      if (value !== '') {
        setDisplayValue(value.toString())
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      setDisplayValue(rawValue)
      // Pasar el evento completo para compatibilidad con react-hook-form
      onChange?.(e)
    }

    const handleQuickAmount = (amount: number) => {
      const strAmount = amount.toString()
      setDisplayValue(strAmount)
      // Crear un evento sintético para compatibilidad con react-hook-form
      if (onChange) {
        const syntheticEvent = {
          target: {
            name: props.name || '',
            value: strAmount
          }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

    const numValue = parseFloat(displayValue) || 0
    const isValid = !error && numValue > 0

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-bold text-slate-900 flex items-center gap-2">
            {showCurrency && (
              <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-3 h-3 text-emerald-600" />
              </div>
            )}
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
        )}

        <div className="space-y-3">
          {/* Input Principal */}
          <div className="relative">
            {showCurrency && (
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">
                $
              </span>
            )}
            <input
              ref={ref}
              type="number"
              step="0.01"
              value={displayValue}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              min={min}
              max={max}
              disabled={disabled}
              placeholder={placeholder}
              className={`
                w-full ${showCurrency ? 'pl-10' : 'pl-4'} pr-4 py-3 
                rounded-xl border-2 bg-white text-slate-900 font-semibold text-lg
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                placeholder:text-slate-400 placeholder:font-normal
                transition-all
                ${error ? "border-rose-300 bg-rose-50" : "border-slate-200 hover:border-slate-300"}
                ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}
                ${className || ''}
              `}
              {...props}
            />
          </div>

          {/* Visualización del Valor Formateado */}
          {showFormatted && numValue > 0 && (
            <div className={`
              flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all
              ${isValid 
                ? 'bg-gradient-to-r from-emerald-50 to-white border-emerald-200' 
                : 'bg-slate-50 border-slate-200'
              }
            `}>
              <div className="flex items-center gap-2">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isValid ? 'bg-emerald-500' : 'bg-slate-400'}
                `}>
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Valor Ingresado</p>
                  <p className={`text-xl font-black ${isValid ? 'text-emerald-600' : 'text-slate-900'}`}>
                    ${formatNumber(numValue)}
                  </p>
                </div>
              </div>
              
              {/* Contador visual de dígitos */}
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Dígitos</p>
                <p className="text-sm font-bold text-slate-700">
                  {Math.floor(numValue).toString().length} dígitos
                </p>
              </div>
            </div>
          )}

          {/* Botones de Montos Rápidos */}
          {quickAmounts && quickAmounts.length > 0 && !disabled && (
            <div>
              <p className="text-xs text-slate-600 font-semibold mb-2">⚡ Montos Rápidos:</p>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    className={`
                      px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all
                      ${displayValue === amount.toString()
                        ? 'bg-purple-500 text-white border-purple-600 shadow-lg'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50'
                      }
                    `}
                  >
                    ${formatNumber(amount)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mensaje de Error */}
        {error && (
          <p className="text-rose-600 text-xs font-semibold flex items-center gap-1 mt-2">
            <span className="w-1 h-1 rounded-full bg-rose-600" />
            {error}
          </p>
        )}

        {/* Texto de Ayuda */}
        {helpText && !error && (
          <p className="text-xs text-slate-500 font-medium mt-2 flex items-start gap-2">
            <span className="text-base">💡</span>
            {helpText}
          </p>
        )}
      </div>
    )
  }
)

FormattedNumberInput.displayName = 'FormattedNumberInput'
