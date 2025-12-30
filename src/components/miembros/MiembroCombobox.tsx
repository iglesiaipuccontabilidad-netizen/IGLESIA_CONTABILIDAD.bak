'use client'

import { Fragment, useState } from 'react'
import { Combobox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { Database } from '@/lib/database.types'

type TablaMiembros = Database['public']['Tables']['miembros']['Row']

interface MiembroComboboxProps {
  miembros: Pick<TablaMiembros, 'id' | 'nombres' | 'apellidos'>[]
  value: string
  onChange: (miembroId: string | null) => void
  disabled?: boolean
  placeholder?: string
}

export function MiembroCombobox({ 
  miembros,
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccionar miembro...'
}: MiembroComboboxProps) {
  const [query, setQuery] = useState('')

  const filteredMiembros = query === ''
    ? miembros
    : miembros.filter((miembro) => {
        const searchStr = `${miembro.nombres} ${miembro.apellidos}`.toLowerCase()
        return searchStr.includes(query.toLowerCase())
      })

  const selectedMiembro = miembros.find(m => m.id === value)

  return (
    <Combobox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-gray-300 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
          <Combobox.Input
            className="w-full border-none py-2 pl-10 pr-10 leading-5 text-gray-900 focus:ring-0"
            placeholder={placeholder}
            displayValue={(miembroId: string) => {
              const miembro = miembros.find(m => m.id === miembroId)
              return miembro 
                ? `${miembro.nombres} ${miembro.apellidos}`
                : ''
            }}
            onChange={(event) => setQuery(event.target.value)}
          />
          <MagnifyingGlassIcon
            className="h-5 w-5 text-gray-400 absolute left-3 top-2.5"
            aria-hidden="true"
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center px-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery('')}
        >
          <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
            {filteredMiembros.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                No se encontraron resultados.
              </div>
            ) : (
              filteredMiembros.map((miembro) => (
                <Combobox.Option
                  key={miembro.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                    }`
                  }
                  value={miembro.id}
                >
                  {({ selected, active }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {miembro.nombres} {miembro.apellidos}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? 'text-white' : 'text-indigo-600'
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  )
}