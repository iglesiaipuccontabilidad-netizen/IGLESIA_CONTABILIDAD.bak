'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-slate-700 hover:text-primary-700 px-3 py-2 rounded-md text-sm font-medium">
    {children}
  </a>
)

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <motion.header className="w-full bg-transparent sticky top-0 z-40 transition-shadow duration-300 will-change-transform" aria-hidden={false} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="#" className="text-2xl font-semibold text-white tracking-tight hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded">Sterling</a>
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary navigation">
            <a href="#features" className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Características</a>
            <a href="#security" className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Seguridad</a>
            <a href="#plans" className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Planes</a>
            <a href="#faq" className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Preguntas frecuentes</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="inline-flex items-center px-5 py-2 rounded-full bg-primary-600 text-white text-sm font-semibold shadow-lg hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-300 transition transform hover:scale-105">Solicitar demostración</Link>
          <a href="#contact" className="hidden sm:inline text-sm text-white/80 hover:text-white">Contactar asesor</a>

          <button aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen((s) => !s)} className="md:hidden p-2 rounded-md text-white/80 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/20"> 
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation panel */}
      {open && (
        <div className="md:hidden px-4 pb-4">
          <nav className="flex flex-col gap-2 bg-white/6 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-sm">
            <a href="#features" onClick={() => setOpen(false)} className="py-2 px-3 rounded-md text-white/90 hover:bg-white/5">Características</a>
            <a href="#security" onClick={() => setOpen(false)} className="py-2 px-3 rounded-md text-white/90 hover:bg-white/5">Seguridad</a>
            <a href="#plans" onClick={() => setOpen(false)} className="py-2 px-3 rounded-md text-white/90 hover:bg-white/5">Planes</a>
            <a href="#faq" onClick={() => setOpen(false)} className="py-2 px-3 rounded-md text-white/90 hover:bg-white/5">Preguntas frecuentes</a>
            <div className="border-t border-white/10 mt-2 pt-3 flex flex-col gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-primary-600 text-white text-sm font-semibold shadow-lg hover:bg-primary-700 transition transform hover:scale-105">Solicitar demostración</Link>
              <a href="#contact" onClick={() => setOpen(false)} className="text-sm text-white/80 text-center">Contactar asesor</a>
            </div>
          </nav>
        </div>
      )}
    </motion.header>
  )
}
