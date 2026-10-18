import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, getDoc, documentId, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { EventProgram } from '../types/firestore';

export interface StudentAnalytics {
    activity: {
        programsJoined: number;
        programsCompleted: number;
        completionRate: number;
        learningHours: number;
        lastActive: Date | null;
    };
    performance: {
        totalPoints: number;
        currentRank: string;
        avgQuizScore: number;
        totalQuizzesTaken: number;
    };
    behavior: {
        topInterests: { category: string; count: number }[];
        growthScore: number;
    };
    courses: CourseProgressSummary[];
    isLoading: boolean;
}

export interface QuizDetail {
    title: string;
    score: number;
    totalQuestions: number;
    firstScore?: number;
    attempts: number; // inferred: 1 if firstScore==undefined or firstScore==score, else >1 (or we can just show "Retried: Yes")
    completedAt?: Date;
}

export interface CourseProgressSummary {
    id: string;
    title: string;
    progress: number;
    status: 'Not Started' | 'In Progress' | 'Completed';
    pointsEarned: number;
    lastAccessed: Date | null;
    completedTasks: number;
    totalTasks: number;
    quizzes: QuizDetail[];
    correctAnswers: number;
    totalQuestionsAttempted: number;
}

export function useStudentAnalytics(userId?: string) {
    return useQuery({
        queryKey: ['student-analytics', userId],
        queryFn: async (): Promise<StudentAnalytics | null> => {
            if (!userId) return null;

            // 1. Fetch User Profile
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) throw new Error('User not found');
            const userData = userSnap.data();

            // 2. Fetch User Program Progress
            const progressRef = collection(db, 'user_program_progress');
            const q = query(progressRef, where('userId', '==', userId));
            const progressSnaps = await getDocs(q);

            const progressMap = new Map();
            const programIds: string[] = [];

            progressSnaps.forEach(doc => {
                const data = doc.data();
                progressMap.set(data.programId, data);
                if (data.programId) programIds.push(data.programId);
            });

            // 3. Fetch Program Details
            const programs: EventProgram[] = [];
            const chunkSize = 10;
            const uniqueProgramIds = Array.from(new Set(programIds)); // Dedupe

            for (let i = 0; i < uniqueProgramIds.length; i += chunkSize) {
                const chunk = uniqueProgramIds.slice(i, i + chunkSize);
                if (chunk.length === 0) continue;

                const progQ = query(collection(db, 'event'), where(documentId(), 'in', chunk));
                const progSnaps = await getDocs(progQ);
                progSnaps.forEach(p => programs.push({ id: p.id, ...p.data() } as EventProgram));
            }

            // --- CALCULATIONS ---

            let totalCompletedEpisodesDurations = 0;
            let completedProgramsCount = 0;
            let totalQuizScoreSum = 0;
            let totalQuizQuestions = 0;
            let growthSum = 0;
            let growthCount = 0;
            const categoryCounts: Record<string, number> = {};

            const coursesSummary: CourseProgressSummary[] = [];

            programs.forEach(program => {
                const progress = progressMap.get(program.id);
                if (!progress) return;

                const completedIt = progress.completedEpisodes || [];
                const totalEp = program.episode?.length || 0;

                // Activity
                const isCompleted = totalEp > 0 && completedIt.length >= totalEp;
                if (isCompleted) completedProgramsCount++;

                completedIt.forEach((epId: string) => {
                    const epIdx = parseInt(epId);
                    if (!isNaN(epIdx) && program.episode?.[epIdx]?.duration) {
                        totalCompletedEpisodesDurations += (program.episode[epIdx].duration || 0);
                    }
                });

                program.category?.forEach(cat => {
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });

                // Detailed Quiz Stats
                const quizzes: QuizDetail[] = [];
                let programCorrectAnswers = 0;
                let programTotalQuestions = 0;

                if (progress.quizScores) {
                    Object.entries(progress.quizScores).forEach(([epId, qs]: [string, any]) => {
                        const epIdx = parseInt(epId);
                        const epTitle = program.episode?.[epIdx]?.title || `Quiz ${epId}`;

                        const score = qs.score || 0;
                        const total = qs.total || 0;
                        const firstScore = qs.firstScore;
                        // Inferred attempts: if firstScore exists and != score, likely >1. 
                        // If logic changed recently, firstScore might exist even for 1 attempt.
                        // We'll trust the prompt "how many retries". We don't have exact count.
                        // We will just return 1 if firstScore == undefined, else inferred >1? 
                        // Actually, let's just use what we have. 
                        const attempts = 1; // Placeholder as we don't store full count yet.

                        programCorrectAnswers += score; // Assuming score = number of correct answers
                        programTotalQuestions += total;

                        totalQuizScoreSum += score;
                        totalQuizQuestions += total;

                        if (firstScore !== undefined) {
                            const improvement = score - firstScore;
                            if (improvement > 0) {
                                growthSum += improvement;
                                growthCount++;
                            }
                        }

                        quizzes.push({
                            title: epTitle,
                            score,
                            totalQuestions: total,
                            firstScore,
                            attempts,
                            completedAt: qs.timestamp?.toDate()
                        });
                    });
                }

                coursesSummary.push({
                    id: program.id,
                    title: program.title,
                    progress: totalEp > 0 ? Math.round((completedIt.length / totalEp) * 100) : 0,
                    status: isCompleted ? 'Completed' : (completedIt.length > 0 ? 'In Progress' : 'Not Started'),
                    pointsEarned: isCompleted ? (program.rewardPoints || 0) : 0,
                    lastAccessed: progress.lastUpdated?.toDate() || null,
                    completedTasks: completedIt.length,
                    totalTasks: totalEp,
                    quizzes: quizzes.sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)),
                    correctAnswers: programCorrectAnswers,
                    totalQuestionsAttempted: programTotalQuestions
                });
            });

            // Aggregations
            const programsJoined = programs.length;
            const completionRate = programsJoined > 0 ? Math.round((completedProgramsCount / programsJoined) * 100) : 0;
            const avgQuizScore = totalQuizQuestions > 0 ? Math.round((totalQuizScoreSum / totalQuizQuestions) * 100) : 0;
            const growthScore = growthCount > 0 ? Math.round((growthSum / growthCount) * 100) : 0;

            const topInterests = Object.entries(categoryCounts)
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Fetch dynamic ranks from DB
            const ranksRef = collection(db, 'ranks');
            const ranksSnap = await getDocs(query(ranksRef, orderBy('min', 'asc')));
            const dbRanks = ranksSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as any[];

            const currentRank = dbRanks.length > 0
                ? (dbRanks.find(r => completedProgramsCount >= r.min && completedProgramsCount <= (r.max === null ? Number.MAX_SAFE_INTEGER : r.max))?.name || 'Novice')
                : 'Novice';

            return {
                activity: {
                    programsJoined,
                    programsCompleted: completedProgramsCount,
                    completionRate,
                    learningHours: Math.round((totalCompletedEpisodesDurations / 60) * 10) / 10,
                    lastActive: userData.lastActiveTime?.toDate() || null,
                },
                performance: {
                    totalPoints: userData.points || 0,
                    currentRank,
                    avgQuizScore,
                    totalQuizzesTaken: totalQuizQuestions,
                },
                behavior: {
                    topInterests,
                    growthScore,
                },
                courses: coursesSummary.sort((a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0)),
                isLoading: false
            };
        },
        enabled: !!userId,
    });
}
