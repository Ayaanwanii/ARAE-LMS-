/**
 * Program Card Component
 * Displays program information in a card format
 */

'use client';


import Link from 'next/link';
import { EventProgram } from '@/lib/types/firestore';
import { formatDate, formatDuration } from '@/lib/utils/date';
import { truncate, stripHtml } from '@/lib/utils/helpers';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgramProgress } from '@/lib/hooks/usePrograms';

interface ProgramCardProps {
    program: EventProgram;
}

export default function ProgramCard({ program }: ProgramCardProps) {
    const { user } = useAuth();
    const isJoined = user && Array.isArray(program.userJoined) && program.userJoined.includes(user.uid);
    const { data: progress } = useProgramProgress(isJoined && program.id ? program.id : '');

    const percentCompleted = progress
        ? Math.round((((progress.completedEpisodes?.length || 0)) / (program.episode?.length || 1)) * 100)
        : 0;

    return (
        <Link href={`/programs/${program.id}`}>
            <div className="surface-card lift-card rounded-[28px] overflow-hidden group cursor-pointer flex flex-col h-full">
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-indigo-100 via-white to-cyan-100 dark:from-indigo-950 dark:via-slate-900 dark:to-cyan-950 overflow-hidden">
                    {program.image ? (
                        <>
                            <img
                                src={program.image}
                                alt={program.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none'; // Hide broken image to show debug
                                    const errDiv = document.createElement('div');
                                    errDiv.className = 'absolute inset-0 p-2 bg-red-100/90 dark:bg-red-950/90 overflow-auto text-[10px] text-red-700 dark:text-red-300 font-mono';
                                    errDiv.innerHTML = `<strong>Error:</strong><br/>${program.image}`;
                                    e.currentTarget.parentElement?.appendChild(errDiv);
                                }}
                            />
                        </>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                                className="w-16 h-16 text-indigo-300 dark:text-indigo-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                            </svg>
                        </div>
                    )}

                    {/* Category Badge */}
                    {program.category && program.category.length > 0 && (
                        <div className="absolute top-3 right-3">
                            <span className="inline-block px-3 py-1 bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm text-indigo-600 dark:text-indigo-300 text-xs font-semibold rounded-full shadow-sm border border-white/40 dark:border-white/10">
                                {program.category[0]}
                            </span>
                        </div>
                    )}

                    {/* Progress Bar for Joined Programs */}
                    {isJoined && (
                        <>
                            <div className="absolute bottom-3 right-2 px-2 py-0.5 text-[10px] font-medium text-white bg-black/60 backdrop-blur-md rounded-full shadow-sm border border-white/10">
                                {percentCompleted}%
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 dark:bg-gray-800">
                                <div
                                    className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 ease-out"
                                    style={{ width: `${percentCompleted}%` }}
                                />
                            </div>
                        </>
                    )}

                    {/* Locked Badge */}
                    {program.isLocked && program.access !== 'private' && (
                        <div className="absolute bottom-3 left-3 bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Locked
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex flex-col flex-grow">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {program.title}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 flex-grow">
                        {truncate(stripHtml(program.description), 100)}
                    </p>

                    {/* Meta Information */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto">
                        <div className="flex items-center gap-4">
                            {/* Participants */}
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                </svg>
                                <span>{program.userJoinedNumber || program.userJoined?.length || 0} joined</span>
                            </div>

                            {/* Duration */}
                            {program.duration > 0 && (
                                <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>{formatDuration(program.duration)}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {/* Mode Badge */}
                            {program.mode && (
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${program.mode === 'online'
                                        ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/30'
                                        : 'bg-orange-50/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/30'
                                        }`}
                                >
                                    {program.mode.charAt(0).toUpperCase() + program.mode.slice(1)}
                                </span>
                            )}
                            {/* Access Type */}
                            <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${program.access === 'public' || !program.access
                                    ? 'bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-800/30'
                                    : 'bg-purple-50/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-800/30'
                                    }`}
                            >
                                {program.access ? program.access.charAt(0).toUpperCase() + program.access.slice(1) : 'Public'}
                            </span>
                        </div>
                    </div>

                    {/* Episodes Count */}
                    {program.episode && program.episode.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-white/10">
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                    />
                                </svg>
                                <span>{program.episode.length} episodes</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
