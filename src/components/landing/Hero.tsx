'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

function DashboardMockup() {
  return (
    <div className="w-full max-w-xl glass-card p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="h-4 w-28 bg-white/20 rounded-md mb-2" />
          <div className="text-sm text-white/75">Sterling • Panel financiero</div>
        </div>
        <div className="h-8 w-20 bg-primary-50 text-primary-700 flex items-center justify-center rounded-lg font-semibold text-sm">Org A</div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-3 bg-white/10 rounded-lg">
          <div className="text-xs text-white/70">Total comprometido</div>
          <div className="mt-2 text-lg font-semibold">$32,450</div>
        </div>
        <div className="p-3 bg-white/10 rounded-lg">
          <div className="text-xs text-white/70">Total recaudado</div>
          <div className="mt-2 text-lg font-semibold text-success-600">$18,200</div>
        </div>
        <div className="p-3 bg-white/10 rounded-lg">
          <div className="text-xs text-white/70">Compromisos activos</div>
          <div className="mt-2 text-lg font-semibold">28</div>
        </div>
      </div>

      <div className="h-32 bg-gradient-to-r from-primary-50 to-cyan-50 rounded-lg p-3">
        <svg viewBox="0 0 100 30" className="w-full h-full">
          <polyline fill="none" stroke="#2563eb" strokeWidth="2" points="0,22 10,18 20,12 30,10 40,8 50,10 60,6 70,8 80,6 90,4 100,2" />
        </svg>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-16 lg:py-28 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 items-center">
        <motion.div className="md:col-span-1 lg:col-span-6 animate-slide-up" initial={{ y: 12, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">Administración financiera clara, segura y profesional para tu iglesia.</h1>
          <p className="mt-6 text-lg text-white/80 max-w-prose">Sterling organiza miembros, compromisos y pagos en una plataforma diseñada para brindar orden, transparencia y confianza.</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link id="demo" href="/login" className="btn-landing">Solicitar demostración</Link>
            <a href="#contact" className="landing-cta-outline">Contactar asesor</a>
          </div>

          <p className="mt-4 text-sm text-white/70">Implementación sencilla con acompañamiento personalizado.</p>

          <div className="mt-6 flex flex-wrap gap-3 items-center text-sm text-white/70">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-3 py-2 rounded-full">
              <svg className="w-4 h-4 text-success-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15H7v-1.414l8.293-8.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Implementación con acompañamiento
            </div>
            <div className="text-white/40">•</div>
            <div className="text-white/70">Posicionamiento profesional — sin prueba gratuita</div>
          </div>
        </motion.div>

        <div className="md:col-span-1 lg:col-span-6 flex justify-center lg:justify-end">
          <motion.div className="transform scale-100 lg:scale-105 w-full max-w-md sm:max-w-lg lg:max-w-xl" initial={{ scale: 0.98, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.02 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
            <DashboardMockup />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
