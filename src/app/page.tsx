import React from 'react'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import {
  ProblemSection,
  SolutionSection,
  BenefitsSection,
  SecuritySection,
  HowItWorksSection,
  PricingSection,
  TestimonialSection,
  FAQSection,
  FinalCTASection,
} from '@/components/landing/LandingSections'

export default function Page() {
  return (
    <main className="min-h-screen landing-bg text-slate-50 antialiased relative overflow-hidden">
      <div className="landing-spotlight" aria-hidden="true">
        <div className="landing-blob-top" />
        <div className="landing-blob-bottom" />
      </div>
      <Navbar />
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <BenefitsSection />
      <SecuritySection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialSection />
      <FAQSection />
      <FinalCTASection />

      <footer className="border-t border-white/10 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-xl font-semibold">Sterling</div>
            <div className="text-sm text-white/70 mt-1">Plataforma de Gestión Financiera para Iglesias</div>
          </div>
          <nav className="flex gap-4 text-sm text-white/70">
            <a href="#contact">Contacto</a>
            <a href="#support">Soporte</a>
            <a href="#terms">Términos y Condiciones</a>
            <a href="#privacy">Política de Privacidad</a>
          </nav>
          <div className="text-sm text-white/60">© 2026 Sterling. Todos los derechos reservados.</div>
        </div>
      </footer>
    </main>
  )
}