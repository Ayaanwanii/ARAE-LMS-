/**
 * Schedule / Calendar Page
 * Displays a list view of all programs with dates
 */

'use client';

import { usePrograms } from '@/lib/hooks/usePrograms';
import { useRouter } from 'next/navigation';
import { EventProgram } from '@/lib/types/firestore';
import { format, isPast, isFuture, compareAsc, parseISO } from 'date-fns';
import Link from 'next/link';

export default function CalendarPage() {
    // Fetch ALL programs (not just joined ones)
    const { data, isLoading } = usePrograms();

    // Extract all programs from all pages
    const allPrograms = data?.pages?.flatMap(page => page.programs) || [];

    // Process and sort programs - only those with start and end dates
    const sortedPrograms = allPrograms
        .filter((p: EventProgram) => p.startDate && p.endDate) // Must have both start and end date
        .sort((a: EventProgram, b: EventProgram) => {
            // Sort by date ascending
            return new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime();
        });

    const upcomingEvents = sortedPrograms.filter((p: EventProgram) =>
        new Date(p.startDate!).getTime() >= new Date().setHours(0, 0, 0, 0)
    );

    const pastEvents = sortedPrograms.filter((p: EventProgram) =>
        new Date(p.startDate!).getTime() < new Date().setHours(0, 0, 0, 0)
    ).reverse(); // Most recent past events first

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    const EventItem = ({ program }: { program: EventProgram }) => {
        const startDate = new Date(program.startDate!);
        const isOnline = program.mode === 'online';

        return (
            <Link href={`/programs/${program.id}`}>
                <div className="group bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-slate-800 p-4 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center">
                    {/* Date Badge */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:border-indigo-100 dark:group-hover:border-indigo-800/50 transition-colors">
                        <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                            {format(startDate, 'MMM')}
                        </span>
                        <span className="text-xl font-extrabold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                            {format(startDate, 'd')}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">
                                {program.title}
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${isOnline
                                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-800/50'
                                : 'bg-orange-50 dark:bg-amber-950/80 text-orange-700 dark:text-amber-300 border-orange-100 dark:border-amber-800/50'
                                }`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400 font-medium">
                            {program.duration && (
                                <div className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {program.duration} min
                                </div>
                            )}
                            {program.location?.address && (
                                <div className="flex items-center gap-1 truncate max-w-[200px]">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="truncate">{program.location.address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:block text-gray-300 dark:text-slate-600 group-hover:text-indigo-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white transition-colors">
            <header className="bg-white/40 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm border-b border-gray-200 dark:border-white/10">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Your Schedule</h1>
                    <p className="text-gray-600 dark:text-slate-400 font-medium mt-1">All programs and events with scheduled dates.</p>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Upcoming Events */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-6 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming</h2>
                    </div>

                    {upcomingEvents.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingEvents.map((program: EventProgram) => (
                                <EventItem key={program.id} program={program} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-dashed border-gray-300 dark:border-slate-700">
                            <div className="bg-gray-50 dark:bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-200 dark:border-slate-700">
                                <svg className="w-6 h-6 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-gray-900 dark:text-white font-bold">No upcoming events</h3>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 font-medium">Check back later for new programs!</p>
                            <Link href="/programs">
                                <button className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-sm">
                                    Browse Programs &rarr;
                                </button>
                            </Link>
                        </div>
                    )}
                </section>

                {/* Past Events */}
                {pastEvents.length > 0 && (
                    <section className="pt-6 border-t border-gray-200 dark:border-slate-800">
                        <div className="flex items-center gap-2 mb-4 opacity-75">
                            <div className="w-1.5 h-6 bg-gray-400 dark:bg-slate-600 rounded-full"></div>
                            <h2 className="text-xl font-bold text-gray-700 dark:text-slate-300">Past Events</h2>
                        </div>
                        <div className="space-y-3 opacity-75 grayscale-[50%] hover:grayscale-0 transition-all duration-500">
                            {pastEvents.map((program: EventProgram) => (
                                <EventItem key={program.id} program={program} />
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
