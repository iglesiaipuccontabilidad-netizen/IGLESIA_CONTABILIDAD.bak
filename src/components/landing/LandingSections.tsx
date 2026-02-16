'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function ProblemSection() {
  return (
    <section id="problem" className="bg-slate-50 py-14">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-slate-900">La gestión financiera no debería depender de hojas de cálculo y cuadernos.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ul className="space-y-3 text-slate-700 list-disc pl-5">
            <li>Información dispersa en archivos y papeles</li>
            <li>Dificultad para hacer seguimiento a compromisos</li>
            <li>Reportes manuales que consumen tiempo</li>
            <li>Falta de claridad para la directiva</li>
            <li>Riesgo de pérdida de información</li>
          </ul>
          <div className="flex items-center text-slate-700">Una iglesia organizada transmite confianza y responsabilidad.</div>
        </div>
      </div>
    </section>
  )
}

export function SolutionSection() {
  const Feature = ({ title, desc }: { title: string; desc: string }) => (
    <motion.div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100" whileHover={{ y: -6, scale: 1.01 }} transition={{ duration: 0.22 }}>
      <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
    </motion.div>
  )

  return (
    <section id="features" className="py-14">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-slate-900">Sterling fue creado específicamente para la administración financiera de iglesias locales.</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Feature title="Gestión de Miembros" desc="Registro organizado y búsqueda rápida." />
          <Feature title="Control de Compromisos" desc="Seguimiento claro del avance financiero." />
          <Feature title="Registro de Pagos" desc="Historial detallado y actualizado en tiempo real." />
          <Feature title="Reportes Institucionales" desc="Exportación profesional en PDF y Excel." />
          <Feature title="Control de Accesos" desc="Roles definidos para administración y tesorería." />
          <Feature title="Implementación Acompañada" desc="Onboarding y soporte en la configuración inicial." />
        </div>
      </div>
    </section>
  )
}

export function BenefitsSection() {
  return (
    <section id="benefits" className="bg-gradient-to-b from-white to-slate-50 py-14">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">Más que software, una herramienta de confianza.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Mayor transparencia financiera</h4>
            <p className="mt-2 text-sm text-slate-600">Visibilidad clara en todos los movimientos.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Reducción de errores manuales</h4>
            <p className="mt-2 text-sm text-slate-600">Controles y validaciones que evitan inconsistencias.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Ahorro de tiempo administrativo</h4>
            <p className="mt-2 text-sm text-slate-600">Automatiza reportes y conciliaciones.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Información centralizada y segura</h4>
            <p className="mt-2 text-sm text-slate-600">Todo en un solo lugar con respaldo en la nube.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Acceso desde cualquier dispositivo</h4>
            <p className="mt-2 text-sm text-slate-600">Diseño responsivo y experiencia móvil optimizada.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <h4 className="font-semibold">Soporte y acompañamiento</h4>
            <p className="mt-2 text-sm text-slate-600">Acompañamiento en la implementación y formación.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function SecuritySection() {
  return (
    <section id="security" className="py-14">
      <div className="max-w-6xl mx-auto px-6 grid gap-8 lg:grid-cols-2 items-center">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Infraestructura moderna y segura.</h3>
          <p className="mt-4 text-slate-600 max-w-prose">Sterling utiliza tecnología confiable y medidas de seguridad diseñadas para proteger la información financiera de cada iglesia.</p>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li className="flex items-start gap-3"><span className="text-success-600 mt-1">●</span> Supabase (Postgres) — aislamiento por organización</li>
            <li className="flex items-start gap-3"><span className="text-success-600 mt-1">●</span> Autenticación segura y control de roles</li>
            <li className="flex items-start gap-3"><span className="text-success-600 mt-1">●</span> Despliegue en Vercel con backups en la nube</li>
          </ul>
          <p className="mt-4 text-slate-700 font-medium">Cada iglesia opera en un entorno privado e independiente.</p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-500">Confiado por</div>
            <div className="flex gap-4 items-center">
              <div className="h-8 w-auto flex items-center text-slate-400">
                <svg width="64" height="20" viewBox="0 0 511 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect width="511" height="128" fill="transparent"></rect>
                  <text x="0" y="96" fill="#64748b" fontFamily="sans-serif" fontSize="36">Supabase</text>
                </svg>
              </div>
              <div className="h-8 w-auto flex items-center text-slate-400">
                <svg width="72" height="20" viewBox="0 0 200 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <text x="0" y="24" fill="#64748b" fontFamily="sans-serif" fontSize="18">Vercel</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="text-sm text-slate-500">Características de seguridad</div>
          <ul className="mt-4 space-y-3 text-slate-700">
            <li>Aislamiento de datos por iglesia</li>
            <li>Autenticación segura</li>
            <li>Control de roles y permisos</li>
            <li>Respaldo y restauración en la nube</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export function HowItWorksSection() {
  return (
    <section id="how" className="bg-slate-50 py-14">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h3 className="text-2xl font-semibold text-slate-900">Implementación simple y acompañada.</h3>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="p-5 bg-white rounded-lg border border-slate-100">
            <div className="font-semibold">1️⃣ Creamos el espacio digital de tu iglesia</div>
          </div>
          <div className="p-5 bg-white rounded-lg border border-slate-100">
            <div className="font-semibold">2️⃣ Configuramos usuarios y permisos</div>
          </div>
          <div className="p-5 bg-white rounded-lg border border-slate-100">
            <div className="font-semibold">3️⃣ Inicias el registro con acompañamiento</div>
          </div>
        </div>
        <p className="mt-6 text-slate-600">Esto posiciona servicio, no solo software.</p>
      </div>
    </section>
  )
}

export function PricingSection() {
  const Plan = ({ name, price, bullets }: { name: string; price: string; bullets: string[] }) => (
    <motion.div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100" whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.25 }}>
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="text-lg font-semibold">{name}</h4>
        <div className="text-sm text-slate-500">{price}</div>
      </div>
      <ul className="mt-4 space-y-2 text-slate-700">
        {bullets.map((b) => (
          <li key={b}>• {b}</li>
        ))}
      </ul>
      <div className="mt-6">
        <a href="#contact" className="inline-flex items-center px-4 py-2 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Solicitar información</a>
      </div>
    </motion.div>
  )

  return (
    <section id="plans" className="py-14">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h3 className="text-2xl font-semibold text-slate-900">Planes</h3>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <Plan name="Plan Esencial" price="Hasta 200 miembros" bullets={["Gestión de compromisos y pagos", "Reportes básicos", "Soporte por correo"]} />
          <Plan name="Plan Profesional" price="Miembros ilimitados" bullets={["Reportes avanzados", "Personalización con logo institucional", "Soporte prioritario"]} />
        </div>
      </div>
    </section>
  )
}

export function TestimonialSection() {
  return (
    <section id="testimonials" className="bg-white py-14">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <blockquote className="text-lg italic text-slate-700">“Sterling nos permitió organizar la tesorería y generar reportes con claridad y orden.”</blockquote>
        <div className="mt-4 text-sm font-medium text-slate-600">— Tesorería, Iglesia Local</div>
      </div>
    </section>
  )
}

export function FAQSection() {
  const Item = ({ q, a }: { q: string; a: string }) => (
    <details className="p-4 bg-slate-50 rounded-lg border border-slate-100">
      <summary className="cursor-pointer font-semibold">{q}</summary>
      <div className="mt-2 text-slate-600">{a}</div>
    </details>
  )

  return (
    <section id="faq" className="py-14">
      <div className="max-w-4xl mx-auto px-6">
        <h3 className="text-2xl font-semibold text-slate-900">Preguntas frecuentes</h3>
        <div className="mt-6 grid gap-4">
          <Item q="¿Es difícil de usar?" a="No. Está diseñado para ser intuitivo." />
          <Item q="¿Funciona en celular?" a="Sí, es totalmente adaptable." />
          <Item q="¿Los datos están protegidos?" a="Sí. Cada iglesia tiene su entorno privado." />
          <Item q="¿Recibimos acompañamiento?" a="Sí, brindamos orientación en la implementación." />
        </div>
      </div>
    </section>
  )
}

export function FinalCTASection() {
  return (
    <motion.section id="final-cta" className="bg-gradient-to-r from-primary-50 to-cyan-50 py-16" initial={{ y: 10, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h3 className="text-3xl font-extrabold text-slate-900">Lleva la administración financiera de tu iglesia a un nivel profesional.</h3>
        <p className="mt-4 text-slate-600">Agenda una reunión y conoce cómo Sterling puede implementarse en tu iglesia.</p>
        <div className="mt-6">
          <Link href="/login" className="inline-flex px-6 py-3 rounded-full bg-primary-600 text-white font-semibold shadow-lg hover:bg-primary-700 transition transform hover:scale-105">Solicitar demostración</Link>
        </div>
      </div>
    </motion.section>
  )
}
