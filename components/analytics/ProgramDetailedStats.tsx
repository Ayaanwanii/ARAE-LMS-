import React, { useState } from 'react';
import { CourseProgressSummary, QuizDetail } from '@/lib/hooks/useStudentAnalytics';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils/date';

interface ProgramDetailedStatsProps {
    courses: CourseProgressSummary[];
}

export default function ProgramDetailedStats({ courses }: ProgramDetailedStatsProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Program Progress & Analysis</h3>
                <span className="text-sm font-medium text-gray-500 dark:text-slate-400">{courses.length} programs enrolled</span>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-slate-800">
                {courses.map((course) => (
                    <div key={course.id} className="group">
                        {/* Summary Header - Always Visible */}
                        <div
                            className={`p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${expandedId === course.id ? 'bg-gray-50 dark:bg-slate-800/40' : ''}`}
                            onClick={() => toggleExpand(course.id)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{course.title}</h4>
                                    <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Last accessed: {course.lastAccessed ? formatDate(new Date(course.lastAccessed)) : 'Never'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${course.status === 'Completed' ? 'bg-green-100 dark:bg-green-950/80 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/50' :
                                            course.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50' :
                                                'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 border border-gray-200 dark:border-slate-700'
                                        }`}>
                                        {course.status}
                                    </span>
                                    {expandedId === course.id ? (
                                        <svg className="w-5 h-5 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    )}
                                </div>
                            </div>

                            {/* High-Level Stats Grid inside Header Row */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <p className="text-xs uppercase text-gray-500 dark:text-slate-400 font-bold">Progress</p>
                                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{course.progress}%</p>
                                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                                        <div className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full" style={{ width: `${course.progress}%` }} />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <p className="text-xs uppercase text-gray-500 dark:text-slate-400 font-bold">Tasks</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{course.completedTasks} <span className="text-sm text-gray-400 dark:text-slate-500 font-normal">/ {course.totalTasks}</span></p>
                                </div>
                                <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <p className="text-xs uppercase text-gray-500 dark:text-slate-400 font-bold">Correct Answers</p>
                                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{course.correctAnswers} <span className="text-sm text-gray-400 dark:text-slate-500 font-normal">/ {course.totalQuestionsAttempted}</span></p>
                                </div>
                                <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <p className="text-xs uppercase text-gray-500 dark:text-slate-400 font-bold">Points Earned</p>
                                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{course.pointsEarned}</p>
                                </div>
                            </div>
                        </div>

                        {/* Collapsible Details */}
                        {expandedId === course.id && (
                            <div className="px-6 pb-6 bg-gray-50 dark:bg-slate-900/60 border-t border-gray-200 dark:border-slate-800 animate-fade-in">
                                <h5 className="font-bold text-gray-900 dark:text-white mt-4 mb-3">Quiz Analysis</h5>
                                {course.quizzes.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700">
                                            <thead className="bg-gray-100 dark:bg-slate-800/80">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Quiz Title</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Score</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Questions</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">First Attempt</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Retried?</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-slate-300 uppercase">Completed</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                                                {course.quizzes.map((quiz, idx) => {
                                                    const isRetried = quiz.firstScore !== undefined && quiz.firstScore !== quiz.score;
                                                    const improvement = isRetried ? quiz.score - (quiz.firstScore || 0) : 0;

                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                            <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">{quiz.title}</td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className={`font-bold ${(quiz.score / quiz.totalQuestions) >= 0.8 ? 'text-emerald-600 dark:text-emerald-400' :
                                                                        (quiz.score / quiz.totalQuestions) >= 0.5 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                                                                    }`}>
                                                                    {quiz.score}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 font-medium">{quiz.totalQuestions}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400 font-medium">{quiz.firstScore ?? '-'}</td>
                                                            <td className="px-4 py-3 text-sm">
                                                                {isRetried ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                                                                        Yes, +{improvement} pts
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 dark:text-slate-500 text-xs font-medium">No</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-right text-gray-500 dark:text-slate-400 font-medium">
                                                                {quiz.completedAt ? formatDate(new Date(quiz.completedAt)) : '-'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500 dark:text-slate-400 italic p-4 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 text-center font-medium">
                                        No quizzes attempted in this program yet.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {courses.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-slate-400 font-medium">
                        No programs joined yet.
                    </div>
                )}
            </div>
        </div>
    );
}

