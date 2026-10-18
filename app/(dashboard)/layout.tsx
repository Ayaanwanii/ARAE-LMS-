/**
 * Dashboard Layout
 * Protected layout with navigation for authenticated pages
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRecordAttendance } from '@/lib/hooks/useAttendance';
import NotificationBell from '@/components/ui/NotificationBell';
import Logo from '@/components/ui/Logo';
import AdvertisementPopup from '@/components/ui/AdvertisementPopup';
import { useBackgrounds } from '@/lib/hooks/useBackgrounds';

import { useBackgroundStore } from '@/lib/stores/backgroundStore';

const NAV_LINKS = [
    {
        href: '/programs', label: 'Programs',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    },
    {
        href: '/news', label: 'News',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
    },
    {
        href: '/rewards', label: 'Rewards',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>,
    },
    {
        href: '/calendar', label: 'Calendar',
        icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, profile, loading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: backgrounds } = useBackgrounds();
    const { overrideBackground } = useBackgroundStore();

    // Determine current section for background
    const currentSectionKey = useMemo(() => {
        const path = pathname.split('/')[1]; // e.g., 'programs' from '/programs/123'
        if (NAV_LINKS.some(link => link.href === `/${path}`)) {
            return path;
        }
        if (path === 'profile' || path === 'ranks') {
            return 'programs';
        }
        return null;
    }, [pathname]);

    const sectionBackground = currentSectionKey && backgrounds ? backgrounds[currentSectionKey as keyof typeof backgrounds] : null;
    const currentBackground = overrideBackground || sectionBackground;

    // Track attendance (heartbeat every 60s)
    useRecordAttendance();

    // Protect dashboard routes
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center hero-glow">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col relative transition-colors duration-500 app-shell">
            {/* Background Image Layer */}
            {currentBackground && (
                <>
                    <div 
                        className="fixed inset-0 z-0 transition-opacity duration-1000"
                        style={
                            currentBackground.startsWith('#')
                            ? { backgroundColor: currentBackground }
                            : {
                                backgroundImage: `url(${currentBackground})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundAttachment: 'fixed'
                            }
                        }
                    />
                    {/* Subtle Overlay to ensure readability while keeping the background visible */}
                    <div className="fixed inset-0 z-0 bg-white/10 dark:bg-black/35 pointer-events-none" />
                </>
            )}

            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="surface-card rounded-[28px] px-4 sm:px-5 h-16 flex justify-between items-center">
                        {/* Logo */}
                        <Link href="/programs" className="flex items-center">
                            <Logo />
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex items-center ml-8 space-x-8">
                            {NAV_LINKS.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    title={link.label}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${pathname === link.href || pathname.startsWith(link.href + '/')
                                            ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-white/10'
                                            : 'text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                                        }`}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <NotificationBell />

                            {/* Profile */}
                            <Link href="/profile">
                                <div className="flex items-center gap-2 cursor-pointer">
                                    {profile?.photoUrl ? (
                                        <img
                                            src={profile.photoUrl}
                                            alt={profile.displayName}
                                            className="w-8 h-8 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                            {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Hamburger Menu Button (Mobile Only) */}
                            <button
                                type="button"
                                className="md:hidden p-2 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10 focus:outline-none"
                                onClick={() => setIsMobileMenuOpen(true)}
                                aria-label="Open menu"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu Drawer */}
            <div
                className={`fixed top-3 right-3 bottom-3 w-[min(20rem,calc(100vw-1.5rem))] z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="surface-elevated h-full rounded-[28px] flex flex-col overflow-hidden">
                {/* Drawer Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <Logo />
                    <button
                        type="button"
                        className="p-2 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                        aria-label="Close menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Nav Links */}
                <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-colors ${pathname === link.href || pathname.startsWith(link.href + '/')
                                ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-slate-700 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {link.icon}
                            {link.label}
                        </Link>
                    ))}
                </nav>
                </div>
            </div>


            {/* Main Content */}
            <main className="relative z-10 flex-1 px-3 sm:px-4 pb-8 sm:pb-12">{children}</main>
            <AdvertisementPopup />
        </div>
    );
}
