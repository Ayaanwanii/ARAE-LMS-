'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Logo from '@/components/ui/Logo';

export default function ContactsPage() {
    const contactMethods = [
        {
            title: 'Email Us',
            description: 'Our team typically responds within 24 hours on business days.',
            value: 'info@arae.education',
            actionText: 'Send an Email →',
            href: 'mailto:info@arae.education',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
            ),
            gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
            borderColor: 'border-indigo-500/30 hover:border-indigo-400/60',
            iconColor: 'text-indigo-400',
            badge: 'Fast Response',
        },
        {
            title: 'Call Us',
            description: 'Speak directly with our support team Mon–Fri, 9:00 AM – 6:00 PM (MYT).',
            value: '+60 11-1130 1578',
            actionText: 'Call Phone Number →',
            href: 'tel:+60111301578',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
            ),
            gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
            borderColor: 'border-purple-500/30 hover:border-purple-400/60',
            iconColor: 'text-purple-400',
            badge: 'Direct Line',
        },
        {
            title: 'Visit Headquarters',
            description: 'Walk-ins welcome by appointment at our headquarters.',
            value: 'Kuala Lumpur, Malaysia',
            actionText: 'Open in Maps →',
            href: 'https://maps.google.com/?q=Kuala+Lumpur+Malaysia',
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
            ),
            gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
            borderColor: 'border-cyan-500/30 hover:border-cyan-400/60',
            iconColor: 'text-cyan-400',
            badge: 'Main Office',
        },
    ];

    const socials = [
        {
            name: 'Instagram',
            handle: '@arae.education',
            href: 'https://instagram.com/arae.education',
            gradient: 'from-pink-500/20 to-purple-500/20',
            borderColor: 'border-pink-500/30',
            textColor: 'text-pink-400',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
            ),
        },
        {
            name: 'LinkedIn',
            handle: 'ARAE Education',
            href: 'https://linkedin.com/company/arae-education',
            gradient: 'from-blue-500/20 to-indigo-500/20',
            borderColor: 'border-blue-500/30',
            textColor: 'text-blue-400',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            ),
        },
        {
            name: 'Facebook',
            handle: 'ARAE Education',
            href: 'https://facebook.com/arae.education',
            gradient: 'from-indigo-500/20 to-cyan-500/20',
            borderColor: 'border-indigo-500/30',
            textColor: 'text-indigo-400',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            ),
        },
        {
            name: 'TikTok',
            handle: '@arae.education',
            href: 'https://tiktok.com/@arae.education',
            gradient: 'from-purple-500/20 to-rose-500/20',
            borderColor: 'border-purple-500/30',
            textColor: 'text-purple-400',
            icon: (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white relative overflow-hidden flex flex-col">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 z-0 pointer-events-none"></div>
            <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[140px] z-0 pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] z-0 pointer-events-none"></div>

            <LandingNavbar />

            {/* Main Content */}
            <main className="flex-1 pt-28 pb-20 relative z-10">
                {/* Page Header */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-5 max-w-3xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">
                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                            Get In Touch
                        </div>

                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
                            We&apos;d Love To{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400">
                                Connect With You
                            </span>
                        </h1>

                        <p className="text-gray-300 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
                            Whether you have questions about our educational programs, corporate partnerships, or institutional programs — reach out directly through any of our channels below.
                        </p>
                    </motion.div>
                </section>

                {/* Primary Contact Cards Grid */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {contactMethods.map((method, idx) => (
                            <motion.a
                                key={idx}
                                href={method.href}
                                target={method.href.startsWith('http') ? '_blank' : undefined}
                                rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.12 }}
                                className={`relative bg-gradient-to-b ${method.gradient} bg-white/5 backdrop-blur-xl border ${method.borderColor} rounded-3xl p-8 transition-all duration-300 group cursor-pointer block shadow-2xl hover:-translate-y-1.5`}
                            >
                                {/* Badge */}
                                <div className="absolute top-6 right-6 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/10 text-gray-300">
                                    {method.badge}
                                </div>

                                <div className="space-y-5">
                                    <div className={`w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center ${method.iconColor} group-hover:scale-110 transition-transform shadow-lg`}>
                                        {method.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2">{method.title}</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed min-h-[40px]">{method.description}</p>
                                    </div>
                                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                        <span className={`font-bold ${method.iconColor} text-base`}>
                                            {method.value}
                                        </span>
                                        <span className="text-xs font-semibold text-gray-400 group-hover:text-white transition-colors">
                                            {method.actionText}
                                        </span>
                                    </div>
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </section>

                {/* Secondary Info Section: Business Hours + Social Channels */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Business Hours & Office Location */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col justify-between"
                        >
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">Business Hours</h3>
                                            <p className="text-xs text-gray-400">Malaysian Standard Time (MYT / UTC+8)</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                        Support Active
                                    </span>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                                        <span className="text-gray-300 font-medium">Monday – Friday</span>
                                        <span className="text-white font-bold bg-white/10 px-3 py-1 rounded-xl text-sm">9:00 AM – 6:00 PM</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                                        <span className="text-gray-300 font-medium">Saturday</span>
                                        <span className="text-white font-bold bg-white/10 px-3 py-1 rounded-xl text-sm">10:00 AM – 2:00 PM</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3">
                                        <span className="text-gray-300 font-medium">Sunday & Public Holidays</span>
                                        <span className="text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-xl text-sm">Closed</span>
                                    </div>
                                </div>
                            </div>

                            {/* Help Box */}
                            <div className="mt-8 pt-6 border-t border-white/10 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl p-5 border border-purple-500/20 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Looking for platform details?</h4>
                                    <p className="text-xs text-gray-300 mt-0.5">
                                        Explore our <Link href="/about" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2">About Page</Link> to learn more about ARAE LMS programs and mission.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Social Ecosystem Grid */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.15 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Follow Our Socials</h3>
                                        <p className="text-xs text-gray-400">Stay up to date with workshops, news, & community events</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    {socials.map((social) => (
                                        <a
                                            key={social.name}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`bg-gradient-to-r ${social.gradient} bg-white/5 backdrop-blur-md border ${social.borderColor} hover:border-white/40 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 group`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center ${social.textColor} group-hover:scale-110 transition-transform shrink-0`}>
                                                {social.icon}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{social.name}</h4>
                                                <p className="text-xs text-gray-400 truncate">{social.handle}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                                <span>Official Educational Media Channels</span>
                                <span className="font-semibold text-purple-400">#ARAELMS</span>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Interactive Map Embed */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative"
                    >
                        <div className="absolute top-4 left-4 z-10 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
                            <span className="text-xs font-bold text-white">ARAE Headquarters — Kuala Lumpur, Malaysia</span>
                        </div>
                        <iframe
                            title="ARAE LMS Location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d253985.5312827802!2d101.59585565!3d3.1385036!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc362abd08e7d3%3A0x232e1ff540d86c4a!2sKuala%20Lumpur%2C%20Federal%20Territory%20of%20Kuala%20Lumpur%2C%20Malaysia!5e0!3m2!1sen!2s!4v1689619200000!5m2!1sen!2s"
                            width="100%"
                            height="380"
                            style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(0.9) contrast(0.9)' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                    </motion.div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-[#111827] text-gray-400 py-16 border-t border-white/5 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <Link href="/" className="inline-block mb-4">
                                <Logo size="text-2xl" />
                            </Link>
                            <p className="text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
                                ARAE LMS — Mastering life skills through interactive learning, real experiences, and corporate/school events.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Navigation</h3>
                            <ul className="space-y-3 text-sm">
                                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
                                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                                <li><Link href="/contacts" className="hover:text-white transition-colors text-indigo-400 font-semibold">Contacts</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Legal</h3>
                            <ul className="space-y-3 text-sm">
                                <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                        <p className="text-gray-500">&copy; {new Date().getFullYear()} ARAE LMS. All rights reserved.</p>
                        <p className="text-gray-500 flex items-center gap-1">
                            Made with <span className="text-red-500 animate-pulse">❤️</span> for future leaders.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
