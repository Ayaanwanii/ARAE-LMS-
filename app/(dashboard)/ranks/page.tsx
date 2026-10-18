'use client';

import { useAuth, useIsSuperAdmin } from '@/lib/hooks/useAuth';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { useCompletedProgramsCount } from '@/lib/hooks/usePrograms';
import { useRanks } from '@/lib/hooks/useRanks';
import RankModal from '@/components/ranks/RankModal';
import { Rank } from '@/lib/types/firestore';
import { useAddRank } from '@/lib/hooks/useManageRanks';
import Image from 'next/image';

export default function RanksPage() {
    const { profile } = useAuth();
    const isSuperAdmin = useIsSuperAdmin();
    const { data: completedProgramsCount = 0 } = useCompletedProgramsCount();
    const { data: ranks = [], isLoading } = useRanks();
    const addRank = useAddRank();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRank, setEditingRank] = useState<Rank | null>(null);

    // Seed logic for when no ranks exist
    const handleSeed = async () => {
        if (!confirm('Are you sure you want to initialize default ranks?')) return;

        const defaultRanks = [
            { name: 'Novice', min: 0, max: 9, iconUrl: '', order: 1 },
            { name: 'Explorer', min: 10, max: 29, iconUrl: '', order: 2 },
            { name: 'Achiever', min: 30, max: 59, iconUrl: '', order: 3 },
            { name: 'Master', min: 60, max: null, iconUrl: '', order: 4 },
        ];

        try {
            for (const rank of defaultRanks) {
                await addRank.mutateAsync(rank);
            }
            alert('Ranks initialized!');
        } catch (error) {
            console.error(error);
            alert('Failed to initialize ranks.');
        }
    };

    const currentRankIndex = useMemo(() => {
        if (!ranks.length) return -1;
        // Find the highest rank met
        return ranks.findIndex(r => completedProgramsCount >= r.min && completedProgramsCount <= (r.max === null ? Number.MAX_SAFE_INTEGER : r.max));
    }, [completedProgramsCount, ranks]);

    const currentRank = ranks[currentRankIndex !== -1 ? currentRankIndex : 0];
    const nextRank = ranks.length > 0 ? (currentRankIndex !== -1 ? ranks[currentRankIndex + 1] : ranks[0]) : null;

    const progress = useMemo(() => {
        if (!currentRank || !nextRank) return 100;
        const range = nextRank.min - currentRank.min;
        const current = completedProgramsCount - currentRank.min;
        return Math.min(100, Math.max(0, (current / range) * 100));
    }, [completedProgramsCount, currentRank, nextRank]);

    const programsToNext = nextRank ? nextRank.min - completedProgramsCount : 0;

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ranking System</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Level up by completing programs!</p>
                    </div>
                    <div className="flex gap-2">
                        {isSuperAdmin && (
                            <Button onClick={() => { setEditingRank(null); setIsModalOpen(true); }}>
                                Add Rank
                            </Button>
                        )}
                        <Link href="/profile">
                            <Button variant="outline" className="!text-gray-800 dark:!text-gray-850 !border-gray-300 dark:!border-gray-300 hover:!bg-gray-50 dark:hover:!bg-gray-100">Back to Profile</Button>
                        </Link>
                    </div>
                </div>

                {isSuperAdmin && ranks.length === 0 && (
                    <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg">
                        <p className="text-yellow-700 dark:text-yellow-405 mb-2">No ranks defined. Initialize defaults?</p>
                        <Button onClick={handleSeed} variant="outline" className="text-yellow-700 dark:text-yellow-400 border-yellow-700 hover:bg-yellow-100">
                            Seed Default Ranks
                        </Button>
                    </div>
                )}

                {/* Current Status Card */}
                {ranks.length > 0 && currentRank ? (
                    <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-bl-full -mr-16 -mt-16 opacity-50 pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-inner border-4 border-gray-200 dark:border-gray-700 overflow-hidden relative">
                                {currentRank.iconUrl ? (
                                    <Image src={currentRank.iconUrl} alt={currentRank.name} fill className="object-cover" unoptimized />
                                ) : (
                                    <span className="text-6xl text-gray-400 dark:text-gray-500">{currentRank.name.charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Rank</h2>
                                <div className="text-4xl font-black text-gray-900 dark:text-white mb-2">{currentRank.name}</div>
                                <div className="text-gray-600 dark:text-gray-300 font-medium">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{completedProgramsCount}</span> Programs Completed
                                </div>
                            </div>
                            {nextRank && (
                                <div className="w-full md:w-1/3">
                                    <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        <span>Progress to {nextRank.name}</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner border border-transparent dark:border-white/5">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out rounded-full"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                                        Need <span className="font-bold text-indigo-600 dark:text-indigo-400">{programsToNext}</span> more program{programsToNext !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 mb-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No ranking data available.</p>
                    </div>
                )}

                {/* Rank Tiers */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Rank Tiers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {ranks.map((rank, index) => {
                        const isUnlocked = index <= (currentRankIndex !== -1 ? currentRankIndex : 0);
                        const isNext = index === (currentRankIndex !== -1 ? currentRankIndex : 0) + 1;

                        return (
                            <div
                                key={rank.id}
                                className={`
                                    relative rounded-xl p-6 border-2 transition-all duration-300 backdrop-blur-md group
                                    ${isUnlocked 
                                        ? 'bg-white/60 hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10 border-indigo-100/50 dark:border-white/10 shadow-md' 
                                        : 'bg-gray-50/40 dark:bg-black/20 border-gray-200/50 dark:border-white/5 opacity-60 grayscale'
                                    }
                                    ${isNext ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 ring-offset-2 dark:ring-offset-[#0f172a]' : ''}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-sm overflow-hidden relative border border-gray-200 dark:border-gray-700">
                                        {rank.iconUrl ? (
                                            <Image src={rank.iconUrl} alt={rank.name} fill className="object-cover" unoptimized />
                                        ) : (
                                            <span className="text-3xl text-gray-400 dark:text-gray-500">{rank.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className={`text-lg font-bold ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {rank.name}
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                            {rank.min} - {rank.max === null ? '∞' : rank.max} Programs
                                        </p>
                                    </div>

                                    {/* Edit Button for Super Admin */}
                                    {isSuperAdmin && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingRank(rank); setIsModalOpen(true); }}
                                                className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-gray-800 rounded-full shadow-sm border border-transparent dark:border-white/10"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}

                                    {isUnlocked && (
                                        <div className="ml-auto">
                                            <div className="bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/30 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                Unlocked
                                            </div>
                                        </div>
                                    )}
                                    {isNext && (
                                        <div className="ml-auto">
                                            <div className="bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/30 px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse">
                                                Next Goal
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <RankModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                rank={editingRank}
            />
        </div>
    );
}
