'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgram, useProgramStats, useProgramFeedback } from '@/lib/hooks/usePrograms';
import { useCertificateStatsSummary, CertificateLogEntry } from '@/lib/hooks/useCertificateLogs';
import Button from '@/components/ui/Button';
import TextResponsesViewer from '@/components/programs/TextResponsesViewer';

export default function ProgramStatsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { profile, loading: authLoading } = useAuth();
    const { data: program, isLoading: isProgramLoading } = useProgram(id);
    const { data: stats, isLoading: isStatsLoading, error: statsError } = useProgramStats(id);
    const { totalGenerated, logs: certificateLogs, isLoading: isCertLogsLoading } = useCertificateStatsSummary(id);
    const { data: feedbacks, isLoading: isFeedbackLoading } = useProgramFeedback(id);

    const [activeTab, setActiveTab] = useState<'overview' | 'leaders' | 'quizzes' | 'feedback'>('overview');

    const exportCertLogCSV = (log: CertificateLogEntry) => {
        if (!log.studentNames || log.studentNames.length === 0) {
            alert("No student names found for this generation.");
            return;
        }

        const rows = log.studentNames.map(name => ({
            "Student Name": name,
            "Generation Date": log.generatedAt?.toDate ? log.generatedAt.toDate().toLocaleString() : 'N/A'
        }));

        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const timestamp = log.generatedAt?.toDate ? log.generatedAt.toDate().getTime() : Date.now();
        link.setAttribute("href", url);
        link.setAttribute("download", `certificate_generation_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter State
    const [filters, setFilters] = useState({
        country: '',
        state: '',
        school: '',
        ageRange: '',
    });

    // Extract Unique Options from ALL data (combine topPerformers and quizLeaderboard users to get full range of options)
    const { uniqueCountries, uniqueStates, uniqueSchools } = useMemo(() => {
        if (!stats) return { uniqueCountries: [], uniqueStates: [], uniqueSchools: [] };

        const allUsers = [...(stats.topPerformers || []), ...(stats.quizLeaderboard || [])];
        const countries = new Set<string>();
        const states = new Set<string>();
        const schools = new Set<string>();

        allUsers.forEach((u: any) => {
            if (u.countryRef) countries.add(u.countryRef);
            if (u.stateRef) states.add(u.stateRef);
            if (u.schoolName) schools.add(u.schoolName);
        });

        return {
            uniqueCountries: Array.from(countries).sort(),
            uniqueStates: Array.from(states).sort(),
            uniqueSchools: Array.from(schools).sort(),
        };
    }, [stats]);

    // Apply Filters
    const filterList = (list: any[]) => {
        if (!list) return [];
        return list.filter((user: any) => {
            if (filters.country && user.countryRef !== filters.country) return false;
            if (filters.state && user.stateRef !== filters.state) return false;
            if (filters.school && user.schoolName !== filters.school) return false;

            if (filters.ageRange) {
                const age = user.age || 0;
                if (filters.ageRange === 'under-12' && age >= 12) return false;
                if (filters.ageRange === '12-15' && (age < 12 || age > 15)) return false;
                if (filters.ageRange === '16-18' && (age < 16 || age > 18)) return false;
                if (filters.ageRange === '18-plus' && age < 18) return false;
            }
            return true;
        });
    };

    const filteredTopPerformers = useMemo(() => filterList(stats?.topPerformers || []), [stats?.topPerformers, filters]);
    const filteredQuizLeaderboard = useMemo(() => filterList(stats?.quizLeaderboard || []), [stats?.quizLeaderboard, filters]);

    // CSV Export for Course Completion
    const exportProgressCSV = () => {
        if (!stats?.topPerformers) return;
        
        const usersToExport = filteredTopPerformers.length > 0 ? filteredTopPerformers : stats.topPerformers;
        
        if (usersToExport.length === 0) {
            alert("No data to export.");
            return;
        }

        const rows = usersToExport.map((user: any) => ({
            "User Name": user.displayName || 'Anonymous User',
            "Email": user.email || '',
            "Country": user.countryRef || '',
            "State": user.stateRef || '',
            "School": user.schoolName || '',
            "Age": user.age || '',
            "Progress (%)": Math.round(user.progress || 0),
            "Completed Tasks": user.completedEpisodes || 0
        }));
        
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `course_completion_leaders.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // CSV Export for Quizzes
    const exportQuizCSV = (userId?: string) => {
        if (!stats?.quizLeaderboard || !program?.episode) return;
        
        let usersToExport = stats.quizLeaderboard;
        if (userId) {
            usersToExport = usersToExport.filter((u: any) => u.userId === userId);
        }
        
        const rows: any[] = [];
        
        usersToExport.forEach((user: any) => {
            if (!user.rawQuizData) return;
            
            Object.keys(user.rawQuizData).forEach((epIndexStr) => {
                const epIndex = parseInt(epIndexStr);
                const quizAttempt = user.rawQuizData[epIndexStr];
                const episode = program.episode?.[epIndex];
                if (!episode || episode.type !== 'quiz' || !quizAttempt.answers) return;
                
                const ts = quizAttempt.timestamp;
                const dateObj = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
                const timestampStr = dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('en-US') : '';

                // Build a lookup from question ID to question data for the current episode
                const questionMap = new Map<string, any>();
                (episode.questions || []).forEach((q: any) => {
                    questionMap.set(q.id, q);
                });

                // Also build a positional array of questions for fallback matching
                const questionsByIndex = episode.questions || [];

                // Track which answers we've already exported
                const exportedAnswerKeys = new Set<string>();

                // First pass: try to match answers to current episode questions by ID
                questionsByIndex.forEach((q: any) => {
                    const givenAnswerRaw = quizAttempt.answers[q.id];
                    if (givenAnswerRaw === undefined) return;
                    
                    exportedAnswerKeys.add(q.id);
                    let givenAnswerText = String(givenAnswerRaw);
                    let isCorrect = 'N/A';
                    
                    if (q.type === 'multiple_choice') {
                       givenAnswerText = q.options[givenAnswerRaw as number] || String(givenAnswerRaw);
                       isCorrect = givenAnswerRaw === q.correctOption ? 'Yes' : 'No';
                    }
                    
                    rows.push({
                        "User Name": user.displayName || 'Anonymous User',
                        "Country": user.countryRef || '',
                        "School": user.schoolName || '',
                        "Episode": episode.title || `Episode ${epIndex + 1}`,
                        "Question": q.text,
                        "Type": q.type === 'short_answer' ? 'Short Answer' : q.type === 'paragraph' ? 'Paragraph' : 'Multiple Choice',
                        "Given Answer": givenAnswerText,
                        "Is Correct": isCorrect,
                        "Timestamp": timestampStr
                    });
                });

                // Second pass: export any remaining answers that didn't match current question IDs
                // This handles cases where questions were edited/re-created with new IDs after users took the quiz
                const unmatchedAnswerKeys = Object.keys(quizAttempt.answers).filter(key => !exportedAnswerKeys.has(key));
                
                if (unmatchedAnswerKeys.length > 0) {
                    unmatchedAnswerKeys.forEach((answerKey, idx) => {
                        const givenAnswerRaw = quizAttempt.answers[answerKey];
                        
                        // Try to match by position to a current question for context
                        const positionalQuestion = questionsByIndex[idx];
                        let givenAnswerText = String(givenAnswerRaw);
                        let questionText = positionalQuestion?.text || `Question (ID: ${answerKey.substring(0, 8)}...)`;
                        let questionType = positionalQuestion?.type || (typeof givenAnswerRaw === 'number' ? 'multiple_choice' : 'text');
                        let isCorrect = 'N/A';
                        
                        if (typeof givenAnswerRaw === 'number' && positionalQuestion?.type === 'multiple_choice') {
                            givenAnswerText = positionalQuestion.options?.[givenAnswerRaw] || String(givenAnswerRaw);
                            isCorrect = givenAnswerRaw === positionalQuestion.correctOption ? 'Yes' : 'No';
                        }
                        
                        rows.push({
                            "User Name": user.displayName || 'Anonymous User',
                            "Country": user.countryRef || '',
                            "School": user.schoolName || '',
                            "Episode": episode.title || `Episode ${epIndex + 1}`,
                            "Question": questionText,
                            "Type": questionType === 'short_answer' ? 'Short Answer' : questionType === 'paragraph' ? 'Paragraph' : 'Multiple Choice',
                            "Given Answer": givenAnswerText,
                            "Is Correct": isCorrect,
                            "Timestamp": timestampStr
                        });
                    });
                }
            });
        });
        
        if (rows.length === 0) {
            alert("No responses to export.");
            return;
        }
        
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `quiz_responses${userId ? `_${userId}` : ''}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Wait for auth to be ready before showing "not available"
    // If auth is loading, or if we're authenticated but stats query is still loading (or disabled pending profile), show loading
    const isLoading = authLoading || isProgramLoading || (!!profile && isStatsLoading);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400" />
            </div>
        );
    }

    // Check permissions
    const isAdmin = profile?.isOrganisation || profile?.isSuperAdmin || profile?.isSubAdmin;
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access Denied</h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-2">You do not have permission to view this page.</p>
                    <Link href={`/programs/${id}`}>
                        <Button variant="outline" className="mt-4">Back to Program</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!program || !stats) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center transition-colors">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-slate-400 mb-4">Stats not available</p>
                    {statsError && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-2 max-w-md mx-auto">
                            Error: {statsError.message}
                        </p>
                    )}
                    <Link href={`/programs/${id}`}>
                        <Button variant="outline" className="mt-4">Back to Program</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Program Statistics</h1>
                    </div>
                    <Link href={`/programs/${id}`}>
                        <Button variant="outline">Back to Program</Button>
                    </Link>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                        <div className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Participants</div>
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalParticipants}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                        <div className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Completion Rate</div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completionRate}%</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                        <div className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Average Progress</div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.averageProgress}%</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                        <div className="text-sm font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Points Distributed</div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalPointsDistributed}</div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-gray-200 dark:border-slate-800/60 mb-8 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Engagement & Overview', icon: '📊' },
                        { id: 'leaders', label: 'Leaderboards', icon: '🏆' },
                        { id: 'quizzes', label: 'Quiz Responses', icon: '📝' },
                        { id: 'feedback', label: 'User Feedback', icon: '💬' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-500/10'
                                : 'border-transparent text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800/40'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                            {tab.id === 'feedback' && feedbacks && feedbacks.length > 0 && (
                                <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-[10px] ml-1">
                                    {feedbacks.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Episode Engagement</h2>
                                <div className="space-y-4">
                                    {Object.entries(stats.episodeDropOff).map(([title, count]: [string, any], index) => {
                                        const percentage = stats.totalParticipants > 0 ? (count / stats.totalParticipants) * 100 : 0;
                                        return (
                                            <div key={index}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-gray-700 dark:text-slate-300 truncate max-w-xs" title={title}>{title}</span>
                                                    <span className="text-gray-500 dark:text-slate-400">{count} completed ({Math.round(percentage)}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2.5">
                                                    <div
                                                        className="bg-indigo-500 dark:bg-indigo-400 h-2.5 rounded-full"
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.keys(stats.episodeDropOff).length === 0 && (
                                        <p className="text-gray-500 dark:text-slate-500 text-center py-8">No episode data available</p>
                                    )}
                                </div>
                            </div>

                            {program.certificate?.massDownloadEnabled && (
                                <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-500/15 rounded-lg">
                                                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Certificate Generation Stats</h2>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">Bulk certificate activity</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-purple-50 dark:bg-purple-500/15 rounded-lg text-right">
                                            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalGenerated}</span>
                                            <p className="text-[10px] text-purple-500 dark:text-purple-400 uppercase font-bold tracking-wider">Total Generated</p>
                                        </div>
                                    </div>

                                    {isCertLogsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 dark:border-purple-400" />
                                        </div>
                                    ) : certificateLogs.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 dark:bg-slate-800/60">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Certs</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                                                    {certificateLogs.slice(0, 10).map((log, index) => (
                                                        <tr key={log.id || index} className="hover:bg-gray-50 dark:hover:bg-slate-800/40">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center text-xs font-bold">
                                                                        {log.generatedBy.name?.charAt(0) || '?'}
                                                                    </div>
                                                                    <div className="text-xs">
                                                                        <p className="font-bold text-gray-900 dark:text-white">{log.generatedBy.name || 'Unknown'}</p>
                                                                        <p className="text-gray-500 dark:text-slate-400">{log.generatedBy.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">
                                                                {log.generatedAt?.toDate ? log.generatedAt.toDate().toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button
                                                                    onClick={() => exportCertLogCSV(log)}
                                                                    className="px-2 py-1 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-full hover:bg-purple-100 dark:hover:bg-purple-500/25 transition"
                                                                >
                                                                    {log.count} names
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center py-8 text-gray-500 dark:text-slate-500 text-sm italic">No bulk generations yet</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'leaders' && (
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Filters</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Country</label>
                                        <select
                                            value={filters.country}
                                            onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
                                            className="w-full text-sm border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                        >
                                            <option value="">All Countries</option>
                                            {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">State</label>
                                        <select
                                            value={filters.state}
                                            onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                                            className="w-full text-sm border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                        >
                                            <option value="">All States</option>
                                            {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">School</label>
                                        <select
                                            value={filters.school}
                                            onChange={(e) => setFilters(prev => ({ ...prev, school: e.target.value }))}
                                            className="w-full text-sm border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                        >
                                            <option value="">All Schools</option>
                                            {uniqueSchools.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">Age Group</label>
                                        <select
                                            value={filters.ageRange}
                                            onChange={(e) => setFilters(prev => ({ ...prev, ageRange: e.target.value }))}
                                            className="w-full text-sm border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white rounded-lg focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                        >
                                            <option value="">All Ages</option>
                                            <option value="under-12">Under 12</option>
                                            <option value="12-15">12-15</option>
                                            <option value="16-18">16-18</option>
                                            <option value="18-plus">18+</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Completion Leaders</h2>
                                        <button onClick={exportProgressCSV} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Export CSV</button>
                                    </div>
                                    <div className="space-y-3">
                                        {filteredTopPerformers.slice(0, 10).map((user: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 text-center text-xs font-bold text-gray-400 dark:text-slate-500">{index + 1}</span>
                                                    <div className="text-xs">
                                                        <p className="font-bold text-gray-900 dark:text-white">{user.displayName}</p>
                                                        <p className="text-gray-500 dark:text-slate-400">{user.schoolName}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{Math.round(user.progress)}%</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-slate-500">{user.completedEpisodes} tasks</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quiz Rankings</h2>
                                        <button onClick={() => exportQuizCSV()} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Export CSV</button>
                                    </div>
                                    <div className="space-y-3">
                                        {filteredQuizLeaderboard.slice(0, 10).map((user: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 text-center text-xs font-bold text-gray-400 dark:text-slate-500">{index + 1}</span>
                                                    <div className="text-xs">
                                                        <p className="font-bold text-gray-900 dark:text-white">{user.displayName}</p>
                                                        <p className="text-gray-500 dark:text-slate-400">Acc: {Math.round(user.accuracy)}%</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {user.totalPoints !== undefined && (
                                                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/15 px-2 py-1 rounded-lg">{user.totalPoints} pts</span>
                                                    )}
                                                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{user.totalScore}/{user.totalQuestions}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'quizzes' && (
                        <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                            {program.episode && (
                                <TextResponsesViewer
                                    programId={id}
                                    episodes={program.episode}
                                />
                            )}
                        </div>
                    )}

                    {activeTab === 'feedback' && (
                        <div className="space-y-8">
                            <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">User Feedback</h2>
                                {isFeedbackLoading ? (
                                    <div className="flex justify-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400" />
                                    </div>
                                ) : feedbacks && feedbacks.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {feedbacks.map((fb: any) => (
                                            <div key={fb.id} className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/60 hover:shadow-lg dark:hover:shadow-black/30 transition-shadow">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                                                            {fb.userName?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{fb.userName}</p>
                                                            <p className="text-[10px] text-gray-500 dark:text-slate-400">{fb.userEmail}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <svg key={star} className={`w-4 h-4 ${star <= fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-slate-700'}`} viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-900/60 rounded-xl p-4 border border-gray-100 dark:border-slate-700/40 min-h-[80px]">
                                                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed italic">
                                                        {fb.comment ? `"${fb.comment}"` : "No comment left."}
                                                    </p>
                                                </div>
                                                <div className="mt-3 text-[10px] text-gray-400 dark:text-slate-500 text-right font-medium">
                                                    {fb.createdAt?.toDate ? fb.createdAt.toDate().toLocaleString() : 'Just now'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700/60">
                                        <div className="text-4xl mb-4 text-gray-300 dark:text-slate-600">💬</div>
                                        <h3 className="text-lg font-bold text-gray-400 dark:text-slate-500">No Feedback Yet</h3>
                                        <p className="text-sm text-gray-400 dark:text-slate-500">Reviews will appear here once users complete the program.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
