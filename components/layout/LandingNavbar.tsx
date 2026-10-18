'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LandingNavbar() {
    const { user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
        { href: '/contacts', label: 'Contacts' },
    ];

    return (
        <nav className="absolute top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
                <div className="surface-card rounded-[28px] px-4 sm:px-6 h-16 sm:h-20 flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <Logo />
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link key={link.href} href={link.href} className="text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors font-medium">
                                {link.label}
                            </Link>
                        ))}

                        <Link href={user ? "/programs" : "/login"}>
                            <Button
                                variant="outline"
                                className="rounded-full px-6"
                            >
                                {user ? "DASHBOARD" : "GET STARTED"}
                            </Button>
                        </Link>
                    </div>

                    <button
                        type="button"
                        className="md:hidden inline-flex items-center justify-center rounded-full w-11 h-11 border border-slate-200 bg-white/80 text-slate-700 shadow-sm"
                        aria-label="Open menu"
                        onClick={() => setMobileOpen(true)}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="absolute right-3 left-3 top-3 surface-elevated rounded-[28px] p-4 animate-pop-in">
                        <div className="flex items-center justify-between mb-4">
                            <Logo />
                            <button
                                type="button"
                                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                                aria-label="Close menu"
                                onClick={() => setMobileOpen(false)}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="grid gap-2">
                            {navLinks.map((link) => (
                                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-2xl px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium">
                                    {link.label}
                                </Link>
                            ))}
                            <Link href={user ? '/programs' : '/login'} onClick={() => setMobileOpen(false)}>
                                <Button fullWidth size="lg" className="mt-2 rounded-2xl">
                                    {user ? 'Dashboard' : 'Get Started'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
