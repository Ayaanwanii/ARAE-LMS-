import React from 'react';
import { useStudentAnalytics } from '@/lib/hooks/useStudentAnalytics';
import StatCard from './StatCard';
import KnowledgeRadar from './KnowledgeRadar';
// Removed ActivityHeatmap import as requested
import ProgramDetailedStats from './ProgramDetailedStats'; // New component
import { formatDate } from '@/lib/utils/date';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface StudentAnalyticsDashboardProps {
    userId: string;
}

export default function StudentAnalyticsDashboard({ userId }: StudentAnalyticsDashboardProps) {
    const { data: analytics, isLoading, error } = useStudentAnalytics(userId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                Failed to load analytics data.
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* 1. Overview Vital Signs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Current Rank"
                    value={analytics.performance.currentRank}
                    subValue={`${analytics.activity.programsCompleted} Programs Completed`}
                    icon={<span className="text-2xl">🏆</span>}
                    color="purple"
                />
                <StatCard
                    title="Total Points"
                    value={analytics.performance.totalPoints}
                    subValue={`Avg Quiz Score: ${analytics.performance.avgQuizScore}%`}
                    icon={<span className="text-2xl">⚡</span>}
                    color="yellow"
                />
                <StatCard
                    title="Learning Time"
                    value={`${analytics.activity.learningHours} hrs`}
                    subValue={`${analytics.activity.programsJoined} Programs Joined`}
                    icon={<span className="text-2xl">⏱️</span>}
                    color="blue"
                />
                <StatCard
                    title="Growth Score"
                    value={`+${analytics.behavior.growthScore}%`}
                    subValue="Avg Improvement on Retry"
                    icon={<span className="text-2xl">📈</span>}
                    color="green"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Knowledge Radar - kept as it provides different insight */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Knowledge Profile</h3>
                        <KnowledgeRadar data={analytics.behavior.topInterests} />
                    </div>
                </div>

                {/* 3. Detailed Program Analysis - Replaces Heatmap & Simple Table */}
                <div className="lg:col-span-2 space-y-8">
                    <ProgramDetailedStats courses={analytics.courses} />
                </div>
            </div>
        </div>
    );
}
