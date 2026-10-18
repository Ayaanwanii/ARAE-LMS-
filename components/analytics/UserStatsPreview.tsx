'use client';

import React from 'react';
import { useStudentAnalytics } from '@/lib/hooks/useStudentAnalytics';

interface UserStatsPreviewProps {
    userId: string;
}

/**
 * Compact inline stats preview for displaying user statistics within a list row.
 * Shows Current Rank, Total Points, Learning Time, and Growth Score.
 */
export default function UserStatsPreview({ userId }: UserStatsPreviewProps) {
    const { data: analytics, isLoading, error } = useStudentAnalytics(userId);

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-1 min-w-0">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-16 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
                    </div>
                ))}
            </div>
        );
    }

    // Error or no data state
    if (error || !analytics) {
        return (
            <div className="text-xs text-gray-400 italic">
                Stats unavailable
            </div>
        );
    }

    const stats = [
        {
            label: 'CURRENT RANK',
            value: analytics.performance.currentRank,
            subValue: `${analytics.activity.programsCompleted} Completed`,
            icon: '🏆',
            boxStyle: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40',
            subStyle: 'text-purple-600 dark:text-purple-300',
        },
        {
            label: 'TOTAL POINTS',
            value: analytics.performance.totalPoints.toLocaleString(),
            subValue: `Avg: ${analytics.performance.avgQuizScore}%`,
            icon: '⚡',
            boxStyle: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
            subStyle: 'text-amber-600 dark:text-amber-300',
        },
        {
            label: 'LEARNING TIME',
            value: `${analytics.activity.learningHours} hrs`,
            subValue: `${analytics.activity.programsJoined} Joined`,
            icon: '⏱️',
            boxStyle: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40',
            subStyle: 'text-blue-600 dark:text-blue-300',
        },
        {
            label: 'GROWTH SCORE',
            value: `+${analytics.behavior.growthScore}%`,
            subValue: 'Improvement',
            icon: '📈',
            boxStyle: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
            subStyle: 'text-emerald-600 dark:text-emerald-300',
        },
    ];

    return (
        <div className="flex items-stretch gap-2" onClick={(e) => e.stopPropagation()}>
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className={`flex-1 min-w-0 px-3 py-2 rounded-xl border ${stat.boxStyle}`}
                >
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{stat.icon}</span>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider truncate">
                            {stat.label}
                        </span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {stat.value}
                    </div>
                    <div className={`text-[10px] font-semibold ${stat.subStyle} truncate`}>
                        {stat.subValue}
                    </div>
                </div>
            ))}
        </div>
    );
}

