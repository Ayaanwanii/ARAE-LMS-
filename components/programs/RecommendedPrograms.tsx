/**
 * Recommended Programs Section
 * AI-powered personalized program recommendations displayed as a
 * horizontally-scrollable carousel with reason badges and match scores.
 */

'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecommendations, useRecommendationReasons, ProgramRecommendation } from '@/lib/hooks/useRecommendations';
import RecommendationReasonBadge from './RecommendationReasonBadge';
import { truncate, stripHtml } from '@/lib/utils/helpers';

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function RecommendationSkeleton() {
    return (
        <div className="flex gap-5 overflow-hidden px-1">
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="min-w-[300px] max-w-[300px] rounded-[24px] overflow-hidden
                        bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10
                        backdrop-blur-md animate-pulse"
                >
                    <div className="h-40 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/30 dark:to-purple-900/30" />
                    <div className="p-4 space-y-3">
                        <div className="h-4 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-1/2 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="flex gap-2">
                            <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Single Recommendation Card ──────────────────────────────────────────────

function RecommendationCard({ recommendation, index }: { recommendation: ProgramRecommendation; index: number }) {
    const { program, score, reasons } = recommendation;
    const { primaryReason, primaryIcon, secondaryReason, secondaryIcon } = useRecommendationReasons(reasons);
    const matchPercent = Math.round(score * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <Link href={`/programs/${recommendation.programId}`}>
                <div
                    className="min-w-[300px] max-w-[300px] rounded-[24px] overflow-hidden cursor-pointer
                        bg-white/60 dark:bg-white/[0.06] border border-white/30 dark:border-white/10
                        backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20
                        hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/10
                        hover:border-indigo-300/40 dark:hover:border-indigo-400/30
                        hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full"
                >
                    {/* Image with match score overlay */}
                    <div className="relative h-40 bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950 overflow-hidden">
                        {program.image ? (
                            <img
                                src={program.image}
                                alt={program.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-12 h-12 text-indigo-300 dark:text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                        )}

                        {/* Match Score Badge */}
                        <div className="absolute top-3 right-3">
                            <div
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md border
                                    ${matchPercent >= 70
                                        ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-700 dark:text-emerald-300'
                                        : matchPercent >= 40
                                            ? 'bg-amber-500/20 border-amber-300/40 text-amber-700 dark:text-amber-300'
                                            : 'bg-blue-500/20 border-blue-300/40 text-blue-700 dark:text-blue-300'
                                    }`}
                            >
                                {matchPercent}% match
                            </div>
                        </div>

                        {/* AI Badge */}
                        <div className="absolute top-3 left-3">
                            <div className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider
                                bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white
                                backdrop-blur-md shadow-lg shadow-violet-500/20">
                                AI Pick
                            </div>
                        </div>

                        {/* Bottom gradient */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col gap-2">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {program.title}
                        </h3>

                        {program.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                {typeof stripHtml === 'function' ? stripHtml(program.description) : program.description}
                            </p>
                        )}

                        {/* Reason badges */}
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
                            {reasons.slice(0, 2).map((reason, i) => (
                                <RecommendationReasonBadge
                                    key={i}
                                    type={reason.type}
                                    text={reason.text}
                                    confidence={reason.confidence}
                                    compact
                                />
                            ))}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5 mt-1">
                            <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
                                {(program as any).episodeCount != null && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        {(program as any).episodeCount} episodes
                                    </span>
                                )}
                                {program.episode?.length != null && (program as any).episodeCount == null && (
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        {program.episode.length} episodes
                                    </span>
                                )}
                                <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {program.userJoinedNumber || 0}
                                </span>
                            </div>
                            {program.rewardPoints ? (
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                    🪙 {program.rewardPoints} pts
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RecommendedPrograms() {
    const { data, isLoading, isError } = useRecommendations(10);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showAll, setShowAll] = useState(false);

    const recommendations = data?.recommendations || [];

    // Don't render anything if there are no recommendations and not loading
    if (!isLoading && recommendations.length === 0) return null;

    // Don't render if error
    if (isError) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const scrollAmount = 320;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    return (
        <section className="mb-8">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">
                                Recommended for You
                            </h2>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                AI-curated based on your interests & performance
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scroll Arrows */}
                {!isLoading && recommendations.length > 3 && (
                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={() => scroll('left')}
                            className="w-8 h-8 rounded-xl bg-white/60 dark:bg-white/10 border border-white/30 dark:border-white/10
                                backdrop-blur-md flex items-center justify-center
                                hover:bg-white/80 dark:hover:bg-white/20 transition-colors
                                text-gray-600 dark:text-gray-300"
                            aria-label="Scroll left"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-8 h-8 rounded-xl bg-white/60 dark:bg-white/10 border border-white/30 dark:border-white/10
                                backdrop-blur-md flex items-center justify-center
                                hover:bg-white/80 dark:hover:bg-white/20 transition-colors
                                text-gray-600 dark:text-gray-300"
                            aria-label="Scroll right"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <RecommendationSkeleton />
            ) : (
                <div
                    ref={scrollRef}
                    className="flex gap-5 overflow-x-auto pb-4 px-1 scrollbar-hide"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {recommendations.map((rec, index) => (
                        <RecommendationCard
                            key={rec.programId}
                            recommendation={rec}
                            index={index}
                        />
                    ))}
                </div>
            )}

            {/* Metadata footer */}
            {data?.metadata && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>
                        {data.metadata.totalReturned} of {data.metadata.totalCandidates} programs matched • 
                        Personalized with AI
                    </span>
                </div>
            )}
        </section>
    );
}
