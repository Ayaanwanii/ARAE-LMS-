/**
 * Programs List Page
 * Browse and search all available programs
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrograms, useUserRecentPrograms, useCompletedProgramsCount } from '@/lib/hooks/usePrograms';
import { useAuth } from '@/lib/hooks/useAuth';
import ProgramCard from '@/components/programs/ProgramCard';
import ProgramFilters, { SortOption } from '@/components/programs/ProgramFilters';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import RoleSelectionModal from '@/components/auth/RoleSelectionModal';
import { useUserLoginStreak } from '@/lib/hooks/useAttendance';
import { useRanks } from '@/lib/hooks/useRanks';
import RecommendedPrograms from '@/components/programs/RecommendedPrograms';

const CATEGORIES = [
    'All', 'Technology', 'Science', 'Mathematics', 'Language',
    'Arts', 'Sports', 'Music', 'Environment', 'History', 'Business', 'Finance', 'Health', 'Study Party',
];

export default function ProgramsPage() {
    const { profile } = useAuth();
    const { data: completedProgramsCount = 0 } = useCompletedProgramsCount();
    const { data: streak = 0 } = useUserLoginStreak(profile?.uid);
    const { data: ranks = [] } = useRanks();

    const currentRank = useMemo(() => {
        if (!ranks.length) return { name: 'Novice', iconUrl: '' };
        const idx = ranks.findIndex(r => completedProgramsCount >= r.min && completedProgramsCount <= (r.max === null ? Number.MAX_SAFE_INTEGER : r.max));
        return ranks[idx !== -1 ? idx : 0];
    }, [completedProgramsCount, ranks]);

    const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
    const [selectedMode, setSelectedMode] = useState<'all' | 'online' | 'offline'>('all');
    const [viewMode, setViewMode] = useState<'active' | 'private' | 'archived'>('active');
    const [searchTerm, setSearchTerm] = useState('');
    const [quickMenuOpen, setQuickMenuOpen] = useState(false);
    const quickMenuRef = useRef<HTMLDivElement>(null);
    const [sortBy, setSortBy] = useState<SortOption>(() => {
        if (typeof window !== 'undefined') {
            return (sessionStorage.getItem('programsSortBy') as SortOption) || 'newest';
        }
        return 'newest';
    });

    const handleSortChange = (sort: SortOption) => {
        setSortBy(sort);
        sessionStorage.setItem('programsSortBy', sort);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (quickMenuRef.current && !quickMenuRef.current.contains(event.target as Node)) {
                setQuickMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filters = {
        category: !selectedCategories.includes('All') ? selectedCategories : undefined,
        mode: selectedMode !== 'all' ? selectedMode : undefined,
        archived: viewMode === 'archived',
        access: viewMode === 'private' ? 'private' : (viewMode === 'active' ? 'public' : undefined),
    };
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePrograms(filters);
    const { data: recentMap } = useUserRecentPrograms();

    const allPrograms = data?.pages.flatMap((page: any) => page.programs) ?? [];

    const publicPrograms = allPrograms.filter((p: any) => {
        if (viewMode === 'active' && p.archived) return false;
        if (viewMode === 'active' && p.access === 'private') return false;

        if (viewMode === 'private' && p.access !== 'private') return false;
        if (viewMode === 'private' && p.archived) return false;

        if (viewMode !== 'archived' && viewMode !== 'private' && p.access === 'private') return false;

        if (profile?.role && profile.role !== 'user' && !profile.isSuperAdmin && !profile.isSubAdmin && !profile.isOrganisation) {
            const userRole = profile.role.toLowerCase();
            const programAudience = p.audience?.map((a: string) => a.toLowerCase()) || [];

            if (programAudience.length > 0 && !programAudience.includes('everyone')) {
                const hasMatch = programAudience.some((aud: string) => aud === userRole || aud === `${userRole}s`);
                if (!hasMatch) return false;
            }
        }

        return true;
    });

    const searchedPrograms = searchTerm
        ? publicPrograms.filter((p: any) =>
            p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : publicPrograms;

    const filteredPrograms = [...searchedPrograms].sort((a: any, b: any) => {
        switch (sortBy) {
            case 'newest': {
                const aTime = a.createdTime?.toMillis?.() || a.createdTime?.seconds * 1000 || 0;
                const bTime = b.createdTime?.toMillis?.() || b.createdTime?.seconds * 1000 || 0;
                return bTime - aTime;
            }
            case 'oldest': {
                const aTime = a.createdTime?.toMillis?.() || a.createdTime?.seconds * 1000 || 0;
                const bTime = b.createdTime?.toMillis?.() || b.createdTime?.seconds * 1000 || 0;
                return aTime - bTime;
            }
            case 'recents': {
                const aRecent = recentMap?.get(a.id) || 0;
                const bRecent = recentMap?.get(b.id) || 0;
                return bRecent - aRecent;
            }
            case 'popular': {
                const aPop = a.userJoinedNumber || a.userJoined?.length || 0;
                const bPop = b.userJoinedNumber || b.userJoined?.length || 0;
                return bPop - aPop;
            }
            case 'a-z':
                return (a.title || '').localeCompare(b.title || '');
            case 'z-a':
                return (b.title || '').localeCompare(a.title || '');
            default:
                return 0;
        }
    });

    const showQuickMenuItem = profile?.isOrganisation || profile?.isSuperAdmin || profile?.isSubAdmin;

    return (
        <div className="min-h-screen">
            <RoleSelectionModal />
            <header className="relative z-50 bg-white/40 dark:bg-white/5 backdrop-blur-md shadow-sm border-b border-transparent overflow-visible">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-[20px] font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-1">
                                Programs
                            </h1>
                            <p className="text-[15px] text-gray-800 dark:text-gray-200 font-medium max-w-2xl">
                                Explore our curated collection of educational programs designed to inspire.
                            </p>
                        </div>

                        <div className="relative z-[60] flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 ml-auto overflow-visible">
                            <div className="relative self-start sm:self-auto z-[60]" ref={quickMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setQuickMenuOpen((open) => !open)}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                                    aria-haspopup="menu"
                                    aria-expanded={quickMenuOpen}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                    Menu
                                </button>

                                {quickMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-64 rounded-3xl border border-white/20 dark:border-white/10 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-2xl overflow-hidden z-[70] animate-pop-in">
                                        <div className="p-2">
                                            <Link
                                                href="/programs/joined"
                                                onClick={() => setQuickMenuOpen(false)}
                                                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                </svg>
                                                Joined Programs
                                            </Link>

                                            <Link
                                                href="/programs/joined-folders"
                                                onClick={() => setQuickMenuOpen(false)}
                                                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                                </svg>
                                                Joined Folders
                                            </Link>

                                            {showQuickMenuItem && (
                                                <>
                                                    {(profile?.isOrganisation || profile?.isSuperAdmin) && (
                                                        <Link
                                                            href="/admin"
                                                            onClick={() => setQuickMenuOpen(false)}
                                                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                            Admin
                                                        </Link>
                                                    )}

                                                    {profile?.isSubAdmin && (
                                                        <Link
                                                            href="/programs/create"
                                                            onClick={() => setQuickMenuOpen(false)}
                                                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                            </svg>
                                                            Create
                                                        </Link>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-6 bg-white/50 dark:bg-gray-800/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm hover:shadow-md hover:bg-white/60 dark:hover:bg-gray-800/50 transition-all duration-300">
                                <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Global Streak</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-xl font-black text-gray-900 dark:text-white animate-pulse">{streak}</span>
                                        <span className="text-xl hover:scale-125 transition-transform duration-200 select-none" role="img" aria-label="streak">🔥</span>
                                    </div>
                                </div>

                                <div className="h-8 w-px bg-gray-300 dark:bg-white/20" />

                                <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-xl font-black text-gray-900 dark:text-white">{profile?.points || 0}</span>
                                        <span className="text-xl hover:scale-125 transition-transform duration-200 select-none" role="img" aria-label="points">🪙</span>
                                    </div>
                                </div>

                                <div className="h-8 w-px bg-gray-300 dark:bg-white/20" />

                                <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className="text-base font-black text-gray-900 dark:text-white capitalize">{currentRank.name}</span>
                                        {currentRank.iconUrl ? (
                                            <div className="w-5 h-5 relative select-none">
                                                <img src={currentRank.iconUrl} alt={currentRank.name} className="w-full h-full object-contain" />
                                            </div>
                                        ) : (
                                            <span className="text-lg hover:scale-125 transition-transform duration-200 select-none" role="img" aria-label="rank">🛡️</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="bg-white/20 dark:bg-white/5 backdrop-blur-md border-b border-transparent">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <input
                        type="text"
                        placeholder="Search programs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 backdrop-blur-md shadow-sm transition-all"
                    />
                </div>
            </div>

            <ProgramFilters
                categories={CATEGORIES}
                selectedCategories={selectedCategories}
                onCategoryChange={setSelectedCategories}
                selectedMode={selectedMode}
                onModeChange={setSelectedMode}
                selectedSort={sortBy}
                onSortChange={handleSortChange}
            />

            {(profile?.isOrganisation || profile?.isSuperAdmin || profile?.isSubAdmin) && (
                <div className="bg-white/20 dark:bg-white/5 backdrop-blur-md border-b border-white/10 dark:border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setViewMode('active')}
                                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${viewMode === 'active'
                                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Active Programs
                                </button>
                                <button
                                    onClick={() => setViewMode('private')}
                                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${viewMode === 'private'
                                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Private Programs
                                </button>
                                <button
                                    onClick={() => setViewMode('archived')}
                                    className={`pb-2 px-1 text-sm font-medium transition-colors relative ${viewMode === 'archived'
                                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Archived Programs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* AI-Powered Recommendations — shown for students only */}
                {!profile?.isOrganisation && !profile?.isSuperAdmin && !profile?.isSubAdmin && (
                    <RecommendedPrograms />
                )}

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    </div>
                ) : filteredPrograms.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPrograms.map((program: any) => (
                                <ProgramCard key={program.id} program={program} />
                            ))}
                        </div>

                        {hasNextPage && (
                            <div className="flex justify-center mt-8">
                                <Button
                                    onClick={() => fetchNextPage()}
                                    isLoading={isFetchingNextPage}
                                    variant="outline"
                                >
                                    Load More
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No programs found</h3>
                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter</p>
                    </div>
                )}
            </main>
        </div>
    );
}
