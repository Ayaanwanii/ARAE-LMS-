/**
 * Joined Programs Page
 * Display programs the user has joined
 */

'use client';

import { useState } from 'react';
import { useJoinedPrograms } from '@/lib/hooks/usePrograms';
import ProgramCard from '@/components/programs/ProgramCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function JoinedProgramsPage() {
    const { data: joinedPrograms, isLoading } = useJoinedPrograms();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPrograms = joinedPrograms?.filter((p: any) =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="relative z-50 bg-white/40 dark:bg-white/5 backdrop-blur-md shadow-sm border-b border-transparent overflow-visible">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-[20px] font-bold uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-1">
                                Joined Programs
                            </h1>
                            <p className="text-[15px] text-gray-800 dark:text-gray-200 font-medium max-w-2xl">
                                Programs you are participating in
                            </p>
                        </div>
                        <Link href="/programs">
                            <Button variant="outline" className="text-gray-800 dark:text-white border-gray-300 dark:border-white/20 bg-white/80 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 font-medium shadow-sm transition">
                                Back to All Programs
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Bar */}
                <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 dark:border-white/10 shadow-sm mb-8">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search your programs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm font-medium shadow-sm transition"
                        />
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-300 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Programs Grid / Empty State */}
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    </div>
                ) : filteredPrograms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPrograms.map((program: any) => (
                            <ProgramCard key={program.id} program={program} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/60 dark:bg-white/10 backdrop-blur-md rounded-3xl border border-white/30 dark:border-white/10 shadow-sm p-8 max-w-xl mx-auto">
                        <div className="bg-indigo-50 dark:bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                            <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Joined Programs</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm max-w-sm mx-auto mb-6">
                            You haven't joined any programs yet. Browse available programs and start participating!
                        </p>
                        <div>
                            <Link href="/programs">
                                <Button className="px-6 py-2.5 shadow-md shadow-indigo-500/20">
                                    Browse Programs
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
