'use client';

import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { QuizQuestion } from '@/lib/types/firestore';

interface TextResponsesViewerProps {
    programId: string;
    episodes: any[];
}

interface TextResponse {
    userId: string;
    displayName: string;
    photoUrl: string;
    episodeIndex: number;
    episodeTitle: string;
    questionId: string;
    questionText: string;
    questionType: 'short_answer' | 'paragraph';
    answer: string;
    timestamp?: any;
}

function useTextResponses(programId: string, episodes: any[]) {
    return useQuery({
        queryKey: ['text-responses', programId],
        queryFn: async () => {
            // Find quiz episodes that have text-based questions
            const quizEpisodes: { index: number; title: string; questions: QuizQuestion[] }[] = [];
            episodes.forEach((ep, index) => {
                if (ep.type === 'quiz' && ep.questions) {
                    const textQuestions = ep.questions.filter(
                        (q: QuizQuestion) => q.type === 'short_answer' || q.type === 'paragraph'
                    );
                    if (textQuestions.length > 0) {
                        quizEpisodes.push({ index, title: ep.title, questions: textQuestions });
                    }
                }
            });

            if (quizEpisodes.length === 0) return [];

            // Fetch all user progress for this program
            const q = query(
                collection(db, 'user_program_progress'),
                where('programId', '==', programId)
            );
            const snapshot = await getDocs(q);

            const responses: TextResponse[] = [];

            // Process each user's progress
            for (const progressDoc of snapshot.docs) {
                const data = progressDoc.data();
                const userId = data.userId;

                // Fetch user details
                let displayName = 'Anonymous User';
                let photoUrl = '';
                try {
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        displayName = userData.displayName || 'Anonymous User';
                        photoUrl = userData.photoUrl || '';
                    }
                } catch (e) {
                    // Ignore
                }

                // Check each quiz episode for text answers
                for (const ep of quizEpisodes) {
                    const quizData = data.quizScores?.[String(ep.index)];
                    if (!quizData?.answers) continue;

                    // Track which answer keys we've already processed
                    const processedKeys = new Set<string>();

                    // First pass: match by question ID
                    for (const question of ep.questions) {
                        const answer = quizData.answers[question.id];
                        if (typeof answer === 'string' && answer.trim().length > 0) {
                            processedKeys.add(question.id);
                            responses.push({
                                userId,
                                displayName,
                                photoUrl,
                                episodeIndex: ep.index,
                                episodeTitle: ep.title,
                                questionId: question.id,
                                questionText: question.text,
                                questionType: question.type as 'short_answer' | 'paragraph',
                                answer,
                                timestamp: quizData.timestamp,
                            });
                        }
                    }

                    // Second pass: check for text answers with mismatched IDs
                    // (happens when questions were edited/re-created with new IDs after users took the quiz)
                    const unmatchedKeys = Object.keys(quizData.answers).filter(key => !processedKeys.has(key));
                    for (const answerKey of unmatchedKeys) {
                        const answer = quizData.answers[answerKey];
                        if (typeof answer === 'string' && answer.trim().length > 0) {
                            // Try to find a matching text question by position
                            const idx = unmatchedKeys.indexOf(answerKey);
                            const positionalQuestion = ep.questions[idx];
                            responses.push({
                                userId,
                                displayName,
                                photoUrl,
                                episodeIndex: ep.index,
                                episodeTitle: ep.title,
                                questionId: answerKey,
                                questionText: positionalQuestion?.text || `Text Question (ID: ${answerKey.substring(0, 8)}...)`,
                                questionType: (positionalQuestion?.type as 'short_answer' | 'paragraph') || 'paragraph',
                                answer,
                                timestamp: quizData.timestamp,
                            });
                        }
                    }
                }
            }

            return responses;
        },
        enabled: episodes.length > 0,
    });
}

export default function TextResponsesViewer({ programId, episodes }: TextResponsesViewerProps) {
    const { data: responses, isLoading } = useTextResponses(programId, episodes);
    const [selectedEpisode, setSelectedEpisode] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Get unique episodes that have text responses
    const episodesWithResponses = useMemo(() => {
        if (!responses) return [];
        const seen = new Set<string>();
        return responses
            .filter(r => {
                if (seen.has(r.episodeTitle)) return false;
                seen.add(r.episodeTitle);
                return true;
            })
            .map(r => ({ index: r.episodeIndex, title: r.episodeTitle }));
    }, [responses]);

    // Filter responses
    const filteredResponses = useMemo(() => {
        if (!responses) return [];
        return responses.filter(r => {
            if (selectedEpisode !== 'all' && String(r.episodeIndex) !== selectedEpisode) return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                if (
                    !r.displayName.toLowerCase().includes(term) &&
                    !r.answer.toLowerCase().includes(term) &&
                    !r.questionText.toLowerCase().includes(term)
                ) return false;
            }
            return true;
        });
    }, [responses, selectedEpisode, searchTerm]);

    // Group by question
    const groupedByQuestion = useMemo(() => {
        const groups: Record<string, { questionText: string; questionType: string; episodeTitle: string; responses: TextResponse[] }> = {};
        filteredResponses.forEach(r => {
            const key = `${r.episodeIndex}-${r.questionId}`;
            if (!groups[key]) {
                groups[key] = {
                    questionText: r.questionText,
                    questionType: r.questionType,
                    episodeTitle: r.episodeTitle,
                    responses: [],
                };
            }
            groups[key].responses.push(r);
        });
        return Object.values(groups);
    }, [filteredResponses]);

    // Check if there are any text questions in episodes at all
    const hasTextQuestions = episodes.some(ep =>
        ep.type === 'quiz' && ep.questions?.some((q: QuizQuestion) => q.type === 'short_answer' || q.type === 'paragraph')
    );

    const exportTextCSV = (userId?: string) => {
        if (!responses || responses.length === 0) return;

        let toExport = responses;
        if (userId) {
            toExport = toExport.filter(r => r.userId === userId);
        }

        const rows = toExport.map(r => {
            const ts = r.timestamp;
            const dateObj = ts?.toDate ? ts.toDate() : (ts ? new Date(ts) : null);

            return {
                "User Name": r.displayName || 'Anonymous User',
                "Episode": r.episodeTitle,
                "Question": r.questionText,
                "Type": r.questionType === 'short_answer' ? 'Short Answer' : 'Paragraph',
                "Response": r.answer,
                "Timestamp": dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('en-US') : ''
            };
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
        link.setAttribute("download", `text_responses${userId ? `_${userId}` : ''}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!hasTextQuestions) return null;

    return (
        <div className="mt-8 bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl rounded-xl shadow-sm dark:shadow-black/20 p-6 border border-gray-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-500/15 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Text Responses</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Short answer and paragraph responses from students</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {responses && (
                        <button
                            onClick={() => exportTextCSV()}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Export All
                        </button>
                    )}
                    {responses && (
                        <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-500/15 rounded-lg">
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{responses.length}</span>
                            <span className="text-xs text-blue-500 dark:text-blue-400/80 ml-1">total responses</span>
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
                </div>
            ) : !responses || responses.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-slate-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <p>No text responses submitted yet</p>
                </div>
            ) : (
                <>
                    {/* Filters row */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <select
                            value={selectedEpisode}
                            onChange={(e) => setSelectedEpisode(e.target.value)}
                            className="text-sm border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        >
                            <option value="all">All Episodes</option>
                            {episodesWithResponses.map(ep => (
                                <option key={ep.index} value={String(ep.index)}>{ep.title}</option>
                            ))}
                        </select>
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by student name, question, or response..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                            />
                        </div>
                    </div>

                    {/* Responses grouped by question */}
                    <div className="space-y-6">
                        {groupedByQuestion.map((group, gIdx) => (
                            <div key={gIdx} className="border border-gray-200 dark:border-slate-700/60 rounded-lg overflow-hidden">
                                {/* Question header */}
                                <div className="bg-gray-50 dark:bg-slate-800/60 px-4 py-3 border-b border-gray-200 dark:border-slate-700/60">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${group.questionType === 'short_answer'
                                                ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400'
                                                : 'bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400'
                                            }`}>
                                            {group.questionType === 'short_answer' ? 'Short Answer' : 'Paragraph'}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-slate-500">from {group.episodeTitle}</span>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white">{group.questionText}</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{group.responses.length} response{group.responses.length > 1 ? 's' : ''}</p>
                                </div>

                                {/* Individual responses */}
                                <div className="divide-y divide-gray-100 dark:divide-slate-800/60">
                                    {group.responses.map((response, rIdx) => (
                                        <div key={rIdx} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition">
                                            <div className="flex items-start gap-3">
                                                {/* Avatar */}
                                                <div className="flex-shrink-0">
                                                    {response.photoUrl ? (
                                                        <img src={response.photoUrl} alt="" className="w-8 h-8 rounded-full" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-500/15 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                                                                {response.displayName.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{response.displayName}</p>
                                                    <p className="text-sm text-gray-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{response.answer}</p>
                                                </div>
                                                {/* Action */}
                                                <div className="pl-3 border-l border-gray-100 dark:border-slate-700/60 flex-shrink-0">
                                                    <button
                                                        onClick={() => exportTextCSV(response.userId)}
                                                        className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/15 transition"
                                                        title="Export All Text Responses for User"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredResponses.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-slate-500">
                            <p>No responses match your filters</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
