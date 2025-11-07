'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Database } from '@/lib/database.types'
import styles from '@/styles/votos.module.css'

type TablaVotos = Database['public']['Tables']['votos']['Row']
type TablaMiembros = Database['public']['Tables']['miembros']['Row']

interface VotoConMiembro extends TablaVotos {
  miembro: Pick<TablaMiembros, 'id' | 'nombres' | 'apellidos' | 'cedula'>
}

interface VotosActivosTableProps {
  votos: VotoConMiembro[]
}

export default function VotosActivosTable({ votos }: VotosActivosTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const indexOfLastVoto = currentPage * itemsPerPage
  const indexOfFirstVoto = indexOfLastVoto - itemsPerPage
  const currentVotos = votos.slice(indexOfFirstVoto, indexOfLastVoto)

  const totalPages = Math.ceil(votos.length / itemsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      {votos.length === 0 ? (
        <p className="p-6 text-center text-gray-500">No hay votos activos que mostrar.</p>
      ) : (
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Propósito</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Miembro</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Monto Total</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Recaudado</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Fecha Límite</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Estado</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentVotos.map((voto) => (
              <tr key={voto.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <span className={styles.purpose}>{voto.proposito}</span>
                </td>
                <td className="px-6 py-4">
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>
                      {voto.miembro.nombres} {voto.miembro.apellidos}
                    </span>
                    <span className="text-sm text-gray-500">({voto.miembro.cedula})</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatCurrency(voto.monto_total)}
                </td>
                <td className="px-6 py-4">
                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill} 
                        style={{ 
                          width: `${(voto.recaudado || 0) / voto.monto_total * 100}%` 
                        }}
                      />
                    </div>
                    <span className={styles.progressText}>
                      {formatCurrency(voto.recaudado || 0)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(voto.fecha_limite)}
                </td>
                <td className="px-6 py-4">
                  <span className={`${styles.estadoBadge} ${styles[voto.estado]}`}>
                    {voto.estado}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className={styles.actions}>
                    <Link href={`/dashboard/votos/${voto.id}`} className={styles.btnSecondary}>
                      Ver Detalles
                    </Link>
                    <Link href={`/dashboard/pagos/nuevo?voto=${voto.id}`} className={styles.btnPrimary}>
                      Registrar Pago
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={currentPage === i + 1 ? styles.activePage : ''}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
