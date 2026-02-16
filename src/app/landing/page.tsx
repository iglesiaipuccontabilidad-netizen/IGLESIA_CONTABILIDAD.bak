'use client'

import React from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
    BarChart3,
    Users,
    ShieldCheck,
    Zap,
    CheckCircle2,
    TrendingUp,
    Smartphone,
    ChevronRight,
    Menu,
    X,
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    ArrowRight,
    MousePointer2,
    Lock,
    Globe,
    Sparkles
} from 'lucide-react'
import Link from 'next/link'

// --- Types ---
interface FeatureCardProps {
    title: string
    description: string
    icon: React.ReactNode
    className?: string
    delay?: number
}

// --- Components ---

const Navbar = () => {
    const [isOpen, setIsOpen] = React.useState(false)
    const { scrollY } = useScroll()
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        return scrollY.onChange((latest) => setIsScrolled(latest > 50))
    }, [scrollY])

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'py-3 glass-morphism shadow-xl' : 'py-6 bg-transparent'}`}>
            <div className="container-custom flex justify-between items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 group cursor-pointer"
                >
                    <div className="w-11 h-11 bg-gradient-to-br from-primary-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                        <BarChart3 className="text-white w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">Sterling</span>
                </motion.div>

                <div className="hidden md:flex items-center gap-10 font-bold text-slate-600">
                    {['Funcionalidades', 'Beneficios', 'Seguridad', 'Planes'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            className="text-sm uppercase tracking-widest hover:text-primary-600 transition-colors relative group"
                        >
                            {item}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full" />
                        </a>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <a href="/login" className="text-sm font-bold text-slate-700 hover:text-primary-600 transition-colors">Acceder</a>
                    <Link href="/login" className="px-7 py-3 rounded-full bg-primary-600 text-white text-sm font-black shadow-2xl shadow-primary-600/30 hover:bg-primary-700 transition transform hover:scale-105">Empezar Ahora</Link>
                </div>

                <button className="md:hidden p-2 text-slate-900" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="absolute top-full left-0 w-full bg-white border-b border-slate-100 p-8 md:hidden flex flex-col gap-6 shadow-2xl"
                    >
                        {['Funcionalidades', 'Beneficios', 'Seguridad', 'Planes'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase()}`} className="text-lg font-bold" onClick={() => setIsOpen(false)}>{item}</a>
                        ))}
                        <hr className="border-slate-100" />
                        <div className="flex flex-col gap-4">
                            <a href="/login" className="text-center font-bold py-2">Acceder</a>
                            <Link href="/login" className="text-center py-4 bg-primary-600 text-white rounded-2xl font-black">Empezar Ahora</Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}

const FloatingBadge = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay, duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        className={`absolute glass-card px-4 py-2 flex items-center gap-2 z-20 pointer-events-none ${className}`}
    >
        {children}
    </motion.div>
)

const PremiumDashboardMockup = () => {
    return (
        <div className="relative w-full max-w-2xl group perspective-1000">
            {/* Glow blobs behind */}
            <div className="glow-blob top-0 -left-20 bg-primary-400" />
            <div className="glow-blob bottom-0 -right-20 bg-cyan-400" />

            <motion.div
                style={{ rotateY: 2, rotateX: 1 }}
                whileHover={{ rotateY: 0, rotateX: 0, scale: 1.02 }}
                className="relative glass-card p-1 overflow-hidden transition-all duration-700"
            >
                <div className="bg-white/80 rounded-[22px] p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-6">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-amber-400" />
                                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                            </div>
                            <div className="h-4 w-32 bg-slate-100 rounded-full animate-pulse" />
                        </div>
                        <div className="px-5 py-1.5 rounded-full bg-primary-50 text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Live Preview</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        {[
                            { label: 'Recaudado', val: '$42,500', inc: '+12.5%', icon: <BarChart3 className="w-3 h-3" /> },
                            { label: 'Miembros', val: '1,240', inc: '+48 hoy', icon: <Users className="w-3 h-3" /> },
                        ].map((stat, i) => (
                            <div key={i} className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">{stat.icon}</div>
                                    <span className="text-[10px] font-black text-emerald-600">{stat.inc}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                <h4 className="text-2xl font-black text-slate-900">{stat.val}</h4>
                            </div>
                        ))}
                    </div>

                    <div className="relative h-60 bg-slate-50/50 rounded-[32px] border border-slate-100 p-8 flex flex-col justify-end overflow-hidden group-hover:bg-white transition-colors">
                        <div className="flex justify-between items-end h-full gap-3 relative z-10">
                            {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 100].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    transition={{ duration: 1.5, delay: i * 0.1, ease: 'circOut' }}
                                    className="flex-1 bg-gradient-to-t from-primary-600/20 to-primary-600 rounded-t-xl group-hover:from-primary-600/40 group-hover:to-cyan-400 transition-all duration-700"
                                />
                            ))}
                        </div>
                        {/* Grid lines */}
                        <div className="absolute inset-x-8 inset-y-8 flex flex-col justify-between pointer-events-none opacity-5">
                            {[1, 2, 3, 4].map((n) => <div key={n} className="w-full h-px bg-slate-900" />)}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Floating context badges */}
            <FloatingBadge className="-top-12 -left-12 lg:-left-20" delay={0.5}>
                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Pago recibido</p>
                    <p className="text-sm font-bold text-slate-900">+$250.00 USD</p>
                </div>
            </FloatingBadge>

            <FloatingBadge className="-bottom-8 -right-12 lg:-right-16" delay={1.2}>
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-lg">
                    <Users className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Nuevo Miembro</p>
                    <p className="text-sm font-bold text-slate-900">Familia Velasquez</p>
                </div>
            </FloatingBadge>
        </div>
    )
}

const FeatureCard = ({ title, description, icon, className, delay = 0 }: FeatureCardProps) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.8, ease: 'easeOut' }}
        whileHover={{ y: -10 }}
        className={`glass-card p-10 group relative overflow-hidden transition-all duration-500 ${className}`}
    >
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
            {icon}
        </div>
        <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center shadow-sm mb-10 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
            {icon}
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{title}</h3>
        <p className="text-slate-500 text-lg leading-relaxed">{description}</p>
        <div className="mt-8 flex items-center gap-2 text-primary-600 font-bold opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
            Explorar módulo <ArrowRight className="w-5 h-5" />
        </div>
    </motion.div>
)

export default function LandingPage() {
    return (
        <main className="min-h-screen bg-white selection:bg-primary-600 selection:text-white overflow-x-hidden">
            <Navbar />

            {/* --- Hero Section --- */}
            <section className="relative pt-44 pb-32 lg:pt-64 lg:pb-48 overflow-hidden bg-grid-slate-100">
                <div className="glow-top" />
                <div className="container-custom relative z-10 grid lg:grid-cols-2 gap-24 items-center">
                    <div className="max-w-3xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.25em] mb-10 shadow-2xl"
                        >
                            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                            Administración Visionaria
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="text-6xl lg:text-8xl font-black text-slate-900 leading-[1.05] tracking-tight mb-10"
                        >
                            Liderazgo <br />
                            <span className="text-gradient">Digital</span> para <br />
                            tu Iglesia.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                            className="text-2xl text-slate-500 leading-relaxed mb-12 max-w-xl font-medium"
                        >
                            Elevamos la gestión de miembros, votos y finanzas a un estándar de excelencia ministerial absoluta.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="flex flex-col sm:flex-row gap-6 mb-20"
                        >
                            <Link href="/login" className="px-10 py-5 rounded-[24px] bg-primary-600 text-white font-black text-xl shadow-2xl shadow-primary-500/40 hover:shadow-primary-500/60 transform hover:-translate-y-1.5 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group">
                                Solicitar Demo <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#features" className="px-10 py-5 rounded-[24px] bg-white border-2 border-slate-100 text-slate-900 font-bold text-xl hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center">
                                Explorar Tour
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="flex items-center gap-8"
                        >
                            <div className="flex -space-x-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 shadow-sm" />
                                ))}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 leading-tight">Confiado por</p>
                                <p className="text-sm text-slate-500 font-medium">85+ Iglesias Regionales</p>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="relative hidden lg:block"
                    >
                        <PremiumDashboardMockup />
                    </motion.div>
                </div>
            </section>

            {/* --- Features - Bento Grid --- */}
            <section id="funcionalidades" className="py-32 lg:py-56 bg-slate-900 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-[150px] -mr-96 -mt-96" />

                <div className="container-custom relative z-10">
                    <div className="grid lg:grid-cols-2 gap-20 items-end mb-32">
                        <div>
                            <h2 className="text-white text-5xl lg:text-7xl font-black tracking-tight leading-none mb-8">
                                Ingeniería aplicada al <span className="text-cyan-400">Reino.</span>
                            </h2>
                            <p className="text-slate-400 text-2xl leading-relaxed max-w-xl font-medium">
                                No es solo software. Es una plataforma blindada diseñada para la transparencia y el crecimiento orgánico de tu comunidad.
                            </p>
                        </div>
                        <div className="flex lg:justify-end">
                            <div className="p-8 glass-card border-white/5 bg-white/5 flex gap-8 items-center">
                                <div>
                                    <p className="text-[10px] uppercase font-black tracking-widest text-primary-400 mb-2">Seguridad</p>
                                    <p className="text-white font-bold leading-none">Cifrado de grado bancario</p>
                                </div>
                                <Lock className="text-white w-10 h-10 opacity-20" />
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-12 gap-8">
                        {/* Huge Card */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="md:col-span-8 glass-card p-12 lg:p-20 bg-primary-600 text-white border-primary-500/50 relative overflow-hidden min-h-[500px] flex flex-col justify-between"
                        >
                            <div className="relative z-10">
                                <Users className="w-16 h-16 mb-12" />
                                <h3 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight">Gestión de Membresía Inteligente</h3>
                                <p className="text-primary-100 text-2xl leading-relaxed max-w-2xl font-medium">
                                    Conoce a fondo tu congregación. Segmenta ministerios, familias y dones espirituales con un clic.
                                </p>
                            </div>
                            <div className="relative z-10 flex gap-4 mt-12">
                                <button className="px-8 py-4 bg-white text-primary-600 font-black rounded-2xl hover:bg-primary-50 transition-colors">Ver Demostración</button>
                                <button className="px-8 py-4 bg-primary-700 text-white font-black rounded-2xl hover:bg-primary-800 transition-colors">Tour Funcional</button>
                            </div>
                            {/* Decorative Grid */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-grid-slate-100 invert" />
                        </motion.div>

                        {/* Side Cards */}
                        <div className="md:col-span-4 flex flex-col gap-8">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex-1 glass-card p-10 bg-slate-800 border-white/5 text-white"
                            >
                                <ShieldCheck className="text-cyan-400 w-12 h-12 mb-8" />
                                <h4 className="text-3xl font-black mb-4">Transparencia</h4>
                                <p className="text-slate-400 font-medium">Backups automáticos en 4 regiones globales.</p>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex-1 glass-card p-10 bg-white border-white/5 text-slate-900"
                            >
                                <TrendingUp className="text-primary-600 w-12 h-12 mb-8" />
                                <h4 className="text-3xl font-black mb-4">Métricas</h4>
                                <p className="text-slate-500 font-medium">Visualización de crecimiento en tiempo real.</p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Trust & Stats --- */}
            <section id="beneficios" className="py-32 lg:py-48 bg-white">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-16 mb-40">
                        <div className="max-w-2xl">
                            <h2 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-8">Excelencia que inspira <span className="text-gradient">confianza.</span></h2>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed">
                                Las iglesias más organizadas eligen Sterling para eliminar el desorden administrativo y enfocarse en lo verdaderamente importante: las personas.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-10">
                            {[
                                { label: 'Tiempo Ahorrado', val: '40%', sub: 'Administrativo' },
                                { label: 'Uptime', val: '99.9%', sub: 'Garantizado' },
                            ].map((stat) => (
                                <div key={stat.label}>
                                    <p className="text-5xl lg:text-7xl font-black text-slate-900 mb-2">{stat.val}</p>
                                    <p className="text-sm font-bold text-primary-600 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-xs text-slate-400 font-bold">{stat.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard title="Reportes PDF" description="Certificados y balances profesionales listos para enviar por WhatsApp o Correo." icon={<BarChart3 />} />
                        <FeatureCard title="Control RLS" description="Aislamiento total de datos. Tu información nunca se mezcla con la de otros." icon={<Lock />} />
                        <FeatureCard title="Cloud Native" description="Accede desde tu laptop, tablet o celular con la misma velocidad y seguridad." icon={<Globe />} />
                    </div>
                </div>
            </section>

            {/* --- Final Call to Action --- */}
            <section id="planes" className="py-20 lg:py-32">
                <div className="container-custom">
                    <motion.div
                        whileHover={{ scale: 1.005 }}
                        className="bg-slate-900 rounded-[56px] p-12 lg:p-32 text-center relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
                    >
                        {/* Abstract Background */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-600 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-600 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
                        </div>

                        <div className="relative z-10 max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white mx-auto mb-12 shadow-2xl shadow-primary-500/50"
                            >
                                <MousePointer2 className="w-10 h-10" />
                            </motion.div>
                            <h2 className="text-5xl lg:text-7xl font-black text-white mb-8 tracking-tight">
                                Transforma tu administración <span className="text-primary-500 font-serif italic">hoy mismo.</span>
                            </h2>
                            <p className="text-xl lg:text-2xl text-slate-400 font-medium leading-relaxed mb-16">
                                Únete a las iglesias que ya están liderando con tecnología y transparencia. Sin compromisos iniciales complejos.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                                <Link href="/login" className="px-12 py-6 rounded-3xl bg-white text-slate-900 font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl">Empezar Gratis</Link>
                                <div className="flex flex-col items-center sm:items-start text-slate-500 font-bold">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="text-emerald-500 w-5 h-5" /> Soporte personalizado
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="text-emerald-500 w-5 h-5" /> Setup inicial asistido
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="relative py-32 bg-white overflow-hidden border-t border-slate-100">
                <div className="container-custom relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-20 mb-32">
                        {/* Brand Column */}
                        <div className="lg:col-span-4">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <BarChart3 className="text-white w-7 h-7" />
                                </div>
                                <span className="text-3xl font-black text-slate-900 tracking-tight">Sterling</span>
                            </div>
                            <p className="text-slate-500 text-xl font-medium leading-relaxed mb-10 max-w-sm">
                                Elevando la administración de la Iglesia Local a través de la transparencia, la tecnología y la excelencia ministerial.
                            </p>
                            <div className="flex gap-4">
                                {[
                                    { name: 'Facebook', icon: <Facebook className="w-5 h-5" /> },
                                    { name: 'Instagram', icon: <Instagram className="w-5 h-5" /> },
                                    { name: 'Twitter', icon: <Twitter className="w-5 h-5" /> },
                                    { name: 'Linkedin', icon: <Linkedin className="w-5 h-5" /> },
                                ].map((social) => (
                                    <a
                                        key={social.name}
                                        href="#"
                                        className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                        aria-label={social.name}
                                    >
                                        {social.icon}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Columns */}
                        <div className="lg:col-span-2">
                            <h5 className="text-slate-900 font-black mb-10 uppercase tracking-[0.2em] text-xs">Producto</h5>
                            <ul className="space-y-5 text-slate-500 font-bold text-sm">
                                <li><a href="#funcionalidades" className="hover:text-primary-600 transition-colors">Funcionalidades</a></li>
                                <li><a href="#beneficios" className="hover:text-primary-600 transition-colors">Beneficios</a></li>
                                <li><a href="#seguridad" className="hover:text-primary-600 transition-colors">Seguridad</a></li>
                                <li><a href="#planes" className="hover:text-primary-600 transition-colors">Planes</a></li>
                            </ul>
                        </div>

                        <div className="lg:col-span-2">
                            <h5 className="text-slate-900 font-black mb-10 uppercase tracking-[0.2em] text-xs">Recursos</h5>
                            <ul className="space-y-5 text-slate-500 font-bold text-sm">
                                <li><a href="#" className="hover:text-primary-600 transition-colors">Documentación</a></li>
                                <li><a href="#" className="hover:text-primary-600 transition-colors">Guía de Uso</a></li>
                                <li><a href="#" className="hover:text-primary-600 transition-colors">Blog Contable</a></li>
                                <li><a href="#" className="hover:text-primary-600 transition-colors">Soporte</a></li>
                            </ul>
                        </div>

                        <div className="lg:col-span-4">
                            <h5 className="text-slate-900 font-black mb-10 uppercase tracking-[0.2em] text-xs">Newsletter</h5>
                            <p className="text-slate-500 font-medium mb-8">Únete a 500+ administradores que reciben nuestros consejos semanales.</p>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="tu@email.com"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-[20px] px-8 py-5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold"
                                />
                                <button className="absolute right-2 top-2 bottom-2 px-8 rounded-[16px] bg-slate-900 text-white font-black text-sm hover:bg-primary-600 transition-all">
                                    Unirse
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-600" />
                            <p className="text-slate-900 text-sm font-black">
                                Sterling • <span className="text-slate-400 font-medium">IPUC Contabilidad Management</span>
                            </p>
                        </div>
                        <div className="flex gap-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <a href="#" className="hover:text-slate-900 transition-colors">Términos</a>
                            <a href="#" className="hover:text-slate-900 transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-slate-900 transition-colors">Cookies</a>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    )
}
