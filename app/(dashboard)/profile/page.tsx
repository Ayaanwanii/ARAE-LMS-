/**
 * Profile Page
 * View and manage user profile
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useSignOut } from '@/lib/hooks/useAuth';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/date';
import { useUserTotalProgress, useCompletedProgramsCount } from '@/lib/hooks/usePrograms';
import { useUserRedemptionCount } from '@/lib/hooks/useUsers';
import { useMemo } from 'react';
import { useRanks } from '@/lib/hooks/useRanks';

export default function ProfilePage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const signOut = useSignOut();
    const { data: totalTasksCompleted } = useUserTotalProgress();
    const { data: redemptionCount } = useUserRedemptionCount();
    const { data: completedProgramsCount = 0 } = useCompletedProgramsCount();
    const { data: ranks = [] } = useRanks();

    const currentRank = useMemo(() => {
        if (!ranks.length) return 'Novice';
        const rank = ranks.find(r => completedProgramsCount >= r.min && completedProgramsCount <= (r.max === null ? Number.MAX_SAFE_INTEGER : r.max));
        return rank ? rank.name : 'Novice';
    }, [completedProgramsCount, ranks]);

    const handleSignOut = async () => {
        await signOut.mutateAsync();
        router.push('/login');
    };

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {profile.photoUrl ? (
                                <img src={profile.photoUrl} alt={profile.displayName} className="w-20 h-20 rounded-full" />
                            ) : (
                                <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                    {profile.displayName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.displayName}</h1>
                                <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
                            </div>
                        </div>
                        <Button 
                            variant="outline" 
                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/40 bg-white/80 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold shadow-sm" 
                            onClick={handleSignOut} 
                            isLoading={signOut.isPending}
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl shadow-md p-6 text-center">
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{profile.joinedEventNumber || 0}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Programs Joined</div>
                    </div>
                    <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl shadow-md p-6 text-center">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{profile.age || 0}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Age</div>
                    </div>
                    <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl shadow-md p-6 text-center">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">{profile.interest?.length || 0}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Interests</div>
                    </div>
                </div>

                {/* Player Stats */}
                <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Player Stats</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform duration-200 border border-indigo-100/50 dark:border-indigo-800/30">
                            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-455 mb-2">{profile.points || 0}</div>
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Points</div>
                        </div>
                        <div className="bg-purple-50/60 dark:bg-purple-950/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform duration-200 border border-purple-100/50 dark:border-purple-800/30">
                            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">{totalTasksCompleted || 0}</div>
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tasks Completed</div>
                        </div>
                        <Link href="/rewards?tab=my-vouchers" className="block">
                            <div className="bg-pink-50/60 dark:bg-pink-950/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform duration-200 border border-pink-100/50 dark:border-pink-800/30 cursor-pointer h-full">
                                <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">{redemptionCount || 0}</div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rewards Redeemed</div>
                            </div>
                        </Link>
                        <Link href="/ranks" className="block">
                            <div className="bg-amber-50/60 dark:bg-amber-950/30 rounded-xl p-6 text-center transform hover:scale-105 transition-transform duration-200 border border-amber-100/50 dark:border-amber-800/30 cursor-pointer h-full">
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-2 mt-2">{currentRank}</div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Rank</div>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Profile Information</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Role</p>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">{profile.role || 'User'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">School/Institution</p>
                            <p className="font-medium text-gray-900 dark:text-white">{profile.schoolName || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Gender</p>
                            <p className="font-medium text-gray-900 dark:text-white capitalize">{profile.gender || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Phone Number</p>
                            <p className="font-medium text-gray-900 dark:text-white">{profile.phoneNumber || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Member Since</p>
                            <p className="font-medium text-gray-900 dark:text-white">{formatDate(profile.createdTime)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Country</p>
                            <p className="font-medium text-gray-900 dark:text-white">{profile.countryRef || 'Not set'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">State</p>
                            <p className="font-medium text-gray-900 dark:text-white">{profile.stateRef || 'Not set'}</p>
                        </div>
                    </div>
                </div>

                {/* Interests */}
                {profile.interest && profile.interest.length > 0 && (
                    <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Interests</h2>
                        <div className="flex flex-wrap gap-2">
                            {profile.interest.map((interest, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/30 rounded-full text-sm font-medium"
                                >
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
