'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

export default function AboutPage() {
    const { user } = useAuth();
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setActiveFaq(activeFaq === index ? null : index);
    };

    const pillars = [
        {
            title: 'Gamified Growth',
            description: 'Students earn reward points, maintain daily activity streaks, and climb leaderboard ranks while mastering essential life skills.',
            icon: (
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            gradient: 'from-indigo-500/20 via-purple-500/10 to-transparent',
            borderColor: 'border-indigo-500/30',
        },
        {
            title: 'Real-World Experience',
            description: 'Interactive episodes, downloadable toolkits, gameshows, and practical exercises designed for long-term retention and real application.',
            icon: (
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            gradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
            borderColor: 'border-purple-500/30',
        },
        {
            title: 'School & Enterprise Integration',
            description: 'Empowers organizations and educators with real-time attendance tracking, location-based reporting, and automated certificates.',
            icon: (
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
            borderColor: 'border-cyan-500/30',
        },
    ];

    const faqs = [
        {
            q: 'What is ARAE LMS?',
            a: 'ARAE LMS is an interactive educational platform designed to teach practical life skills, financial literacy, leadership, and digital fluency through gamified courses, real-world challenges, and community programs.',
        },
        {
            q: 'Who can use ARAE LMS?',
            a: 'Our platform caters to students of all ages, educators, schools, and corporate organizations looking to run engaging educational programs and track participant progress in real time.',
        },
        {
            q: 'How do reward points and ranks work?',
            a: 'As students complete episodes, quizzes, and maintain daily learning streaks, they earn experience points. These points elevate their global rank and can be redeemed for exclusive merchant rewards.',
        },
        {
            q: 'Can organizations create custom programs?',
            a: 'Yes! Organization admins and sub-admins can easily create custom programs, manage episodes, upload resources, design certificates, and track student attendance analytics.',
        },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-white relative overflow-hidden flex flex-col">
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 z-0 pointer-events-none"></div>
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[140px] z-0 pointer-events-none"></div>
            <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] z-0 pointer-events-none"></div>

            <LandingNavbar />

            {/* Main Content */}
            <main className="flex-1 pt-28 pb-20 relative z-10">
                {/* Hero Section */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6 max-w-4xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                            Empowering Tomorrow&apos;s Leaders
                        </div>

                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
                            Master Life Skills Through <br className="hidden sm:inline" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                Interactive Learning
                            </span>
                        </h1>

                        <p className="text-gray-300 text-lg sm:text-xl font-normal leading-relaxed max-w-3xl mx-auto">
                            ARAE LMS bridges the gap between traditional education and practical life preparation. We combine immersive story episodes, real-world challenges, and gamification to inspire lifelong growth.
                        </p>

                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href={user ? "/programs" : "/signup"}>
                                <Button size="lg" className="w-full sm:w-auto !bg-gradient-to-r !from-indigo-500 !to-purple-600 !text-white font-bold px-8 py-3.5 shadow-lg shadow-indigo-500/25 border-none">
                                    {user ? "Go to Dashboard" : "Start Learning Today"}
                                </Button>
                            </Link>
                            <Link href="/programs">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto border-indigo-400/50 text-indigo-200 hover:bg-indigo-900/40 hover:text-white px-8 py-3.5">
                                    Explore Programs
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </section>

                {/* Core Pillars / Mission */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                            Why Choose <span className="text-indigo-400">ARAE LMS</span>?
                        </h2>
                        <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
                            Designed from the ground up to keep learners engaged, motivated, and equipped for the real world.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {pillars.map((pillar, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.15 }}
                                className={`bg-gradient-to-b ${pillar.gradient} bg-white/5 backdrop-blur-xl border ${pillar.borderColor} rounded-3xl p-8 hover:border-indigo-400/50 transition-all duration-300 flex flex-col justify-between group`}
                            >
                                <div className="space-y-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {pillar.icon}
                                    </div>
                                    <h3 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                                        {pillar.title}
                                    </h3>
                                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                                        {pillar.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Our Story / Vision Statement */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900/80 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                                    Transforming Education Into An Unforgettable Adventure
                                </h2>
                                <p className="text-gray-300 leading-relaxed text-base sm:text-lg">
                                    Traditional learning often stops at theory. ARAE LMS was founded to give students hands-on experience through interactive storytelling, comics, decision-making games, and practical challenges.
                                </p>
                                <p className="text-gray-400 leading-relaxed text-sm sm:text-base">
                                    Whether learning financial independence, digital ethics, or collaborative problem-solving, our ecosystem ensures every milestone is celebrated with tangible rewards and recognized achievement.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">1</div>
                                    <h4 className="font-bold text-white text-base">Interactive Stories</h4>
                                    <p className="text-xs text-gray-400">Engaging narrative episodes and comics.</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">2</div>
                                    <h4 className="font-bold text-white text-base">Gamification</h4>
                                    <p className="text-xs text-gray-400">Ranks, streaks, and store vouchers.</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">3</div>
                                    <h4 className="font-bold text-white text-base">Live Analytics</h4>
                                    <p className="text-xs text-gray-400">Real-time attendance & country stats.</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-2">
                                    <div className="w-10 h-10 mx-auto rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold">4</div>
                                    <h4 className="font-bold text-white text-base">Certifications</h4>
                                    <p className="text-xs text-gray-400">Verifiable certificates of achievement.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center mb-12 space-y-3">
                        <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
                        <p className="text-gray-400 text-sm sm:text-base">Everything you need to know about ARAE LMS</p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all"
                            >
                                <button
                                    onClick={() => toggleFaq(idx)}
                                    className="w-full p-6 text-left font-semibold text-white flex justify-between items-center gap-4 hover:text-indigo-300 transition-colors"
                                >
                                    <span className="text-base sm:text-lg">{faq.q}</span>
                                    <svg
                                        className={`w-5 h-5 text-indigo-400 shrink-0 transform transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {activeFaq === idx && (
                                    <div className="px-6 pb-6 text-gray-300 text-sm sm:text-base leading-relaxed border-t border-white/5 pt-4">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Bottom Call To Action */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-10 sm:p-16 shadow-2xl space-y-6">
                        <h2 className="text-3xl sm:text-5xl font-black text-white">
                            Ready to Start Your Learning Journey?
                        </h2>
                        <p className="text-indigo-100 text-lg max-w-2xl mx-auto leading-relaxed">
                            Join thousands of students and institutions making education interactive, engaging, and rewarding.
                        </p>
                        <div className="pt-2">
                            <Link href={user ? "/programs" : "/login"}>
                                <Button size="lg" className="!bg-white !text-indigo-900 hover:!bg-indigo-50 border-none font-bold px-10 py-4 text-lg shadow-xl">
                                    {user ? "Go to Dashboard" : "Get Started Now"}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-[#111827] text-gray-400 py-16 border-t border-white/5 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        {/* Brand Column */}
                        <div className="md:col-span-2">
                            <Link href="/" className="inline-block mb-4">
                                <Logo size="text-2xl" />
                            </Link>
                            <p className="text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
                                ARAE LMS — Mastering life skills through interactive learning, real experiences, and corporate/school events.
                            </p>
                        </div>

                        {/* Navigation Column */}
                        <div>
                            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Navigation</h3>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                                </li>
                                <li>
                                    <Link href="/about" className="hover:text-white transition-colors text-indigo-400 font-semibold">About</Link>
                                </li>
                                <li>
                                    <Link href="/programs" className="hover:text-white transition-colors">Programs</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal Column */}
                        <div>
                            <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Legal</h3>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
                                </li>
                                <li>
                                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                        <p className="text-gray-500">
                            &copy; {new Date().getFullYear()} ARAE LMS. All rights reserved.
                        </p>
                        <p className="text-gray-500 flex items-center gap-1">
                            Made with <span className="text-red-500 animate-pulse">❤️</span> for future leaders.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
