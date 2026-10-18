/**
 * Firestore Hooks for Programs/Events
 * Custom React hooks for accessing and managing program data
 */

'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    where,
    DocumentSnapshot,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    increment,
    Timestamp,
    setDoc,
    runTransaction,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { EventProgram } from '../types/firestore';

const PROGRAMS_PER_PAGE = 12;

/**
 * Fetch all programs with infinite scroll
 */
export function usePrograms(filters?: {
    category?: string[];
    audience?: string[];
    type?: string;
    mode?: string;
    access?: string;
    archived?: boolean;
}) {
    return useInfiniteQuery({
        queryKey: ['programs', filters],
        queryFn: async ({ pageParam }) => {
            // Start with base collection reference
            let constraints: any[] = [];

            // Apply filters first
            if (filters?.category && filters.category.length > 0) {
                constraints.push(where('category', 'array-contains-any', filters.category));
            }
            if (filters?.audience && filters.audience.length > 0) {
                constraints.push(where('audience', 'array-contains-any', filters.audience));
            }
            if (filters?.type) {
                constraints.push(where('type', '==', filters.type));
            }
            if (filters?.mode && filters.mode !== 'all') {
                constraints.push(where('mode', '==', filters.mode));
            }
            if (filters?.access) {
                constraints.push(where('access', '==', filters.access));
            }
            if (filters?.archived === true) {
                constraints.push(where('archived', '==', true));
            }
            // Note: We don't filter for archived === false on server-side to avoid excluding legacy docs
            // that don't have the field. We'll handle that client-side or assume undefined is false.

            // Add ordering - use createdTime instead of createdBy for better compatibility
            // Only add orderBy if no array-contains filters (to avoid index requirements)
            // Also skip ordering if filtering by archived status OR access status to avoid composite index requirement
            if (!filters?.category && !filters?.audience && !filters?.archived && !filters?.access) {
                constraints.push(orderBy('createdTime', 'desc'));
            }

            // Add limit
            constraints.push(limit(PROGRAMS_PER_PAGE));

            // Pagination
            if (pageParam) {
                constraints.push(startAfter(pageParam));
            }

            const q = query(collection(db, 'event'), ...constraints);
            const snapshot = await getDocs(q);
            const programs: EventProgram[] = [];
            snapshot.forEach((doc) => {
                programs.push({ id: doc.id, ...doc.data() } as EventProgram);
            });

            return {
                programs,
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === PROGRAMS_PER_PAGE,
            };
        },
        initialPageParam: null as DocumentSnapshot | null,
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.lastDoc : undefined;
        },
    });
}

/**
 * Fetch a single program by ID
 */
export function useProgram(programId: string | null) {
    return useQuery({
        queryKey: ['program', programId],
        queryFn: async () => {
            if (!programId) return null;
            const docRef = doc(db, 'event', programId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                } as EventProgram;
            }
            return null;
        },
        enabled: !!programId,
    });
}

/**
 * Fetch programs created by current user
 */
export function useMyPrograms() {
    const user = auth.currentUser;

    return useQuery({
        queryKey: ['my-programs', user?.uid],
        queryFn: async () => {
            if (!user) return [];

            const userRef = doc(db, 'users', user.uid);
            const q = query(
                collection(db, 'event'),
                where('createdBy', '==', userRef),
                orderBy('createdBy', 'desc')
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as EventProgram[];
        },
        enabled: !!user,
    });
}

/**
 * Fetch programs user has joined
 */
export function useJoinedPrograms() {
    const user = auth.currentUser;

    return useQuery({
        queryKey: ['joined-programs', user?.uid],
        queryFn: async () => {
            if (!user) return [];

            const userRef = doc(db, 'users', user.uid);
            const q = query(
                collection(db, 'event'),
                where('joined', 'array-contains', userRef)
            );

            const snapshot = await getDocs(q);
            const programs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as EventProgram[];

            // Sort client-side to avoid Firestore composite index requirement
            return programs.sort((a, b) => {
                const timeA = a.createdTime?.toMillis() || 0;
                const timeB = b.createdTime?.toMillis() || 0;
                return timeB - timeA;
            });
        },
        enabled: !!user,
    });
}

/**
 * Create a new program
 */
export function useCreateProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (programData: Partial<EventProgram>) => {
            const user = auth.currentUser;
            if (!user) throw new Error('Must be logged in to create programs');

            const userRef = doc(db, 'users', user.uid);

            const newProgram = {
                ...programData,
                createdBy: userRef,
                whoCreated: true,
                joined: [],
                userJoined: 0,
                privateAccess: [],
                createdTime: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'event'), newProgram);
            return docRef.id;
        },
        onSuccess: () => {
            // Invalidate programs queries to refetch
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            queryClient.invalidateQueries({ queryKey: ['my-programs'] });
        },
    });
}

/**
 * Update an existing program
 */
export function useUpdateProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ programId, updates }: { programId: string; updates: Partial<EventProgram> }) => {
            const docRef = doc(db, 'event', programId);
            await updateDoc(docRef, {
                ...updates,
                editedTime: serverTimestamp(),
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            queryClient.invalidateQueries({ queryKey: ['program', variables.programId] });
            queryClient.invalidateQueries({ queryKey: ['my-programs'] });
        },
    });
}

/**
 * Delete a program
 */
export function useDeleteProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (programId: string) => {
            const docRef = doc(db, 'event', programId);
            await deleteDoc(docRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            queryClient.invalidateQueries({ queryKey: ['my-programs'] });
        },
    });
}

/**
 * Fetch user's progress for a specific program
 */
export function useProgramProgress(programId: string) {
    const { currentUser } = auth;
    const userId = currentUser?.uid;

    return useQuery({
        queryKey: ['program-progress', programId, userId],
        queryFn: async () => {
            if (!userId) return null;
            const docRef = doc(db, 'user_program_progress', `${userId}_${programId}`);
            const snapshot = await getDoc(docRef);
            return snapshot.exists() ? snapshot.data() : { completedEpisodes: [] };
        },
        enabled: !!userId && !!programId,
    });
}

/**
 * Toggle episode completion status
 */
export function useToggleEpisodeCompletion() {
    const queryClient = useQueryClient();
    const { currentUser } = auth;
    const userId = currentUser?.uid;

    return useMutation({
        mutationFn: async ({ programId, episodeId, isCompleted }: { programId: string; episodeId: string; isCompleted: boolean }) => {
            if (!userId) throw new Error('User not authenticated');

            const docRef = doc(db, 'user_program_progress', `${userId}_${programId}`);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                await updateDoc(docRef, {
                    completedEpisodes: isCompleted
                        ? arrayUnion(episodeId)
                        : arrayRemove(episodeId),
                    lastUpdated: serverTimestamp(),
                });
            } else {
                // Create document if it doesn't exist (only for marking as completed)
                if (isCompleted) {
                    await setDoc(docRef, {
                        userId,
                        programId,
                        completedEpisodes: [episodeId],
                        lastUpdated: serverTimestamp(),
                    });
                }
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['program-progress', variables.programId, userId] });
        },
    });
}

/**
 * Claim points for completing a program
 */
export function useClaimProgramPoints() {
    const queryClient = useQueryClient();
    const { currentUser } = auth;
    const userId = currentUser?.uid;

    return useMutation({
        mutationFn: async ({ programId, points }: { programId: string; points: number }) => {
            if (!userId) throw new Error('User not authenticated');

            const progressRef = doc(db, 'user_program_progress', `${userId}_${programId}`);
            const userRef = doc(db, 'users', userId);

            await runTransaction(db, async (transaction) => {
                const progressDoc = await transaction.get(progressRef);
                if (!progressDoc.exists()) {
                    throw new Error('Progress not found');
                }

                if (progressDoc.data().pointsClaimed) {
                    throw new Error('Points already claimed');
                }

                // Mark as claimed
                transaction.update(progressRef, {
                    pointsClaimed: true,
                    claimedAt: serverTimestamp(),
                });

                // Add points to user
                transaction.update(userRef, {
                    points: increment(points),
                });
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['program-progress', variables.programId, userId] });
            queryClient.invalidateQueries({ queryKey: ['user-profile'] }); // Refresh user points
        },
    });
}

/**
 * Submit quiz results
 */
export function useSubmitQuizResult() {
    const queryClient = useQueryClient();
    const { currentUser } = auth;
    const userId = currentUser?.uid;

    return useMutation({
        mutationFn: async ({ programId, episodeId, score, total, answers, totalPoints, timePerQuestion }: { programId: string; episodeId: string; score: number; total: number; answers: Record<string, number | string>; totalPoints?: number; timePerQuestion?: Record<string, number> }) => {
            if (!userId) throw new Error('User not authenticated');

            const docRef = doc(db, 'user_program_progress', `${userId}_${programId}`);
            const docSnap = await getDoc(docRef);

            const timestamp = Timestamp.now();
            let quizData: any = { score, total, answers, timestamp };

            // Add timer data if present
            if (totalPoints !== undefined) quizData.totalPoints = totalPoints;
            if (timePerQuestion) quizData.timePerQuestion = timePerQuestion;

            if (docSnap.exists()) {
                const existingData = docSnap.data();
                const existingQuizData = existingData.quizScores?.[episodeId];

                // Preserve first attempt scores for leaderboard
                if (existingQuizData) {
                    quizData.firstScore = existingQuizData.firstScore !== undefined
                        ? existingQuizData.firstScore
                        : existingQuizData.score;
                    quizData.firstTotalPoints = existingQuizData.firstTotalPoints !== undefined
                        ? existingQuizData.firstTotalPoints
                        : (existingQuizData.totalPoints !== undefined ? existingQuizData.totalPoints : totalPoints);
                } else {
                    quizData.firstScore = score;
                    if (totalPoints !== undefined) quizData.firstTotalPoints = totalPoints;
                }

                await updateDoc(docRef, {
                    completedEpisodes: arrayUnion(episodeId),
                    [`quizScores.${episodeId}`]: quizData,
                    lastUpdated: serverTimestamp(),
                });
            } else {
                // First ever progress for this program
                quizData.firstScore = score;
                if (totalPoints !== undefined) quizData.firstTotalPoints = totalPoints;

                await setDoc(docRef, {
                    userId,
                    programId,
                    completedEpisodes: [episodeId],
                    quizScores: {
                        [episodeId]: quizData
                    },
                    lastUpdated: serverTimestamp(),
                });
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['program-progress', variables.programId, userId] });
        },
    });
}

/**
 * Join a program
 */
export function useJoinProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (programId: string) => {
            const user = auth.currentUser;
            if (!user) throw new Error('Must be logged in to join programs');

            const userRef = doc(db, 'users', user.uid);
            const programRef = doc(db, 'event', programId);

            // Add user to program's joined array and update counts
            await updateDoc(programRef, {
                joined: arrayUnion(userRef),
                userJoined: arrayUnion(user.uid),
                userJoinedNumber: increment(1),
            });

            // Add program to user's joinedEventRef array
            await updateDoc(userRef, {
                joinedEventRef: arrayUnion(programRef),
                joinedEventNumber: increment(1),
            });
        },
        onSuccess: (_, programId) => {
            queryClient.invalidateQueries({ queryKey: ['program', programId] });
            queryClient.invalidateQueries({ queryKey: ['joined-programs'] });
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            queryClient.invalidateQueries({ queryKey: ['has-joined'] });
        },
    });
}

/**
 * Leave a program
 */
export function useLeaveProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (programId: string) => {
            const user = auth.currentUser;
            if (!user) throw new Error('Must be logged in');

            const userRef = doc(db, 'users', user.uid);
            const programRef = doc(db, 'event', programId);

            // Remove user from program's joined array and update counts
            await updateDoc(programRef, {
                joined: arrayRemove(userRef),
                userJoined: arrayRemove(user.uid),
                userJoinedNumber: increment(-1),
            });

            // Remove program from user's joinedEventRef array
            await updateDoc(userRef, {
                joinedEventRef: arrayRemove(programRef),
                joinedEventNumber: increment(-1),
            });
        },
        onSuccess: (_, programId) => {
            queryClient.invalidateQueries({ queryKey: ['program', programId] });
            queryClient.invalidateQueries({ queryKey: ['joined-programs'] });
            queryClient.invalidateQueries({ queryKey: ['programs'] });
            queryClient.invalidateQueries({ queryKey: ['has-joined'] });
        },
    });
}

/**
 * Check if user has joined a program
 */
export function useHasJoinedProgram(programId: string | null) {
    const user = auth.currentUser;

    return useQuery({
        queryKey: ['has-joined', programId, user?.uid],
        queryFn: async () => {
            console.log('useHasJoinedProgram running for:', programId);
            if (!programId || !user) return false;

            const programRef = doc(db, 'event', programId);
            const programSnap = await getDoc(programRef);

            if (!programSnap.exists()) return false;

            const programData = programSnap.data() as EventProgram;
            const userRef = doc(db, 'users', user.uid);

            // Check if userRef is in the joined array
            return programData.joined.some((ref) => ref.id === userRef.id);
        },
        enabled: !!programId && !!user,
    });
}

/**
 * Search programs by title or description
 */
export function useSearchPrograms(searchTerm: string) {
    return useQuery({
        queryKey: ['search-programs', searchTerm],
        queryFn: async () => {
            if (!searchTerm || searchTerm.length < 2) return [];

            // Note: Firestore doesn't support full-text search natively
            // This is a basic implementation. For production, consider Algolia or similar
            const q = query(
                collection(db, 'event'),
                orderBy('title'),
                limit(20)
            );

            const snapshot = await getDocs(q);
            const allPrograms = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as EventProgram[];

            // Client-side filtering (not ideal for large datasets)
            const searchLower = searchTerm.toLowerCase();
            return allPrograms.filter(
                (program) =>
                    program.title.toLowerCase().includes(searchLower) ||
                    program.description.toLowerCase().includes(searchLower)
            );
        },
        enabled: searchTerm.length >= 2,
    });
}

/**
 * Fetch total number of completed tasks/episodes for the current user
 */
export function useUserTotalProgress() {
    const { currentUser } = auth;
    const userId = currentUser?.uid;

    return useQuery({
        queryKey: ['user-total-progress', userId],
        queryFn: async () => {
            if (!userId) return 0;

            const q = query(
                collection(db, 'user_program_progress'),
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(q);
            let totalCompleted = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.completedEpisodes && Array.isArray(data.completedEpisodes)) {
                    totalCompleted += data.completedEpisodes.length;
                }
            });

            return totalCompleted;
        },
        enabled: !!userId,
    });
}

import { useAuth } from './useAuth';

/**
 * Fetch program statistics for admins
 */
export function useProgramStats(programId: string) {
    const { user, profile } = useAuth();

    // Basic admin check - in production, this should be more robust or handled by security rules
    const isAdmin = profile?.isOrganisation || profile?.isSuperAdmin || profile?.isSubAdmin;

    return useQuery({
        queryKey: ['program-stats', programId, user?.uid, 'v2'],
        queryFn: async () => {
            if (!user?.uid || !programId) return null;

            // 1. Fetch Program Details for total episodes and points
            const programRef = doc(db, 'event', programId);
            const programSnap = await getDoc(programRef);
            if (!programSnap.exists()) throw new Error('Program not found');
            const programData = programSnap.data() as EventProgram;

            // Verify ownership if sub-admin
            if (profile?.isSubAdmin && programData.createdBy.id !== user.uid) {
                return null;
            }

            const totalEpisodes = programData.episode?.length || 0;
            const totalParticipants = programData.userJoinedNumber || programData.userJoined?.length || 0;
            const rewardPoints = programData.rewardPoints || 0;

            // 2. Fetch All User Progress for this Program
            const q = query(
                collection(db, 'user_program_progress'),
                where('programId', '==', programId)
            );
            const snapshot = await getDocs(q);

            let completedCount = 0;
            let totalProgressSum = 0;
            let totalPointsDistributed = 0;
            const episodeDropOff: Record<string, number> = {};
            const userProgressList: any[] = [];
            const quizLeaderboardList: any[] = [];

            // Initialize drop-off counts
            programData.episode?.forEach(ep => {
                episodeDropOff[ep.title] = 0;
            });

            snapshot.forEach(doc => {
                const data = doc.data();
                const completedEpisodes = data.completedEpisodes || [];
                const progress = totalEpisodes > 0 ? (completedEpisodes.length / totalEpisodes) * 100 : 0;

                // Completion Rate
                if (completedEpisodes.length === totalEpisodes && totalEpisodes > 0) {
                    completedCount++;
                }

                // Average Progress
                totalProgressSum += progress;

                // Points Distributed
                if (data.pointsClaimed) {
                    totalPointsDistributed += rewardPoints;
                }

                // Episode Drop-off
                completedEpisodes.forEach((epId: string) => {
                    const epIndex = parseInt(epId);
                    if (!isNaN(epIndex) && programData.episode && programData.episode[epIndex]) {
                        const title = programData.episode[epIndex].title;
                        episodeDropOff[title] = (episodeDropOff[title] || 0) + 1;
                    }
                });

                userProgressList.push({
                    userId: data.userId,
                    progress,
                    completedEpisodes: completedEpisodes.length,
                    lastUpdated: data.lastUpdated,
                });

                // Quiz Leaderboard Logic
                if (data.quizScores) {
                    let totalScore = 0;
                    let totalQuestions = 0;
                    let totalPoints = 0;
                    let hasPointsData = false;
                    let totalTime = 0;
                    let questionCount = 0;

                    Object.values(data.quizScores).forEach((qs: any) => {
                        // Use firstScore for leaderboard if available, otherwise fallback to score
                        const leaderboardScore = qs.firstScore !== undefined ? qs.firstScore : (qs.score || 0);
                        totalScore += leaderboardScore;
                        totalQuestions += (qs.total || 0);

                        // Use firstTotalPoints for leaderboard if available
                        const leaderboardPoints = qs.firstTotalPoints !== undefined
                            ? qs.firstTotalPoints
                            : (qs.totalPoints !== undefined ? qs.totalPoints : 0);
                        totalPoints += leaderboardPoints;
                        if (qs.totalPoints !== undefined || qs.firstTotalPoints !== undefined) hasPointsData = true;

                        // Calculate average time per question
                        if (qs.timePerQuestion) {
                            Object.values(qs.timePerQuestion).forEach((t: any) => {
                                totalTime += (typeof t === 'number' ? t : 0);
                                questionCount++;
                            });
                        }
                    });

                    if (totalQuestions > 0) {
                        quizLeaderboardList.push({
                            userId: data.userId,
                            totalScore,
                            totalQuestions,
                            accuracy: (totalScore / totalQuestions) * 100,
                            totalPoints: hasPointsData ? totalPoints : undefined,
                            avgTimePerQuestion: questionCount > 0 ? Math.round(totalTime / questionCount) : undefined,
                            lastUpdated: data.lastUpdated,
                            rawQuizData: data.quizScores
                        });
                    }
                }
            });

            const completionRate = totalParticipants > 0 ? Math.round((completedCount / totalParticipants) * 100) : 0;
            const averageProgress = totalParticipants > 0 ? Math.round(totalProgressSum / totalParticipants) : 0;

            // Sort top performers - fetch ALL for client-side filtering
            const topPerformersRaw = userProgressList
                .sort((a, b) => b.progress - a.progress);

            // Sort quiz leaderboard - prioritize totalPoints (speed-based), fallback to totalScore
            const quizLeaderboardRaw = quizLeaderboardList
                .sort((a, b) => {
                    // If both have points data, sort by points
                    if (a.totalPoints !== undefined && b.totalPoints !== undefined) {
                        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
                    }
                    // If only one has points, that one goes first
                    if (a.totalPoints !== undefined && b.totalPoints === undefined) return -1;
                    if (a.totalPoints === undefined && b.totalPoints !== undefined) return 1;
                    // Fallback to raw score then accuracy
                    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                    return b.accuracy - a.accuracy;
                });

            // Helper to fetch user details
            const fetchUserDetails = async (items: any[]) => {
                return Promise.all(items.map(async (item) => {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', item.userId));
                        const userData = userDoc.exists() ? userDoc.data() : null;

                        return {
                            ...item,
                            displayName: userData?.displayName || 'Anonymous User',
                            photoUrl: userData?.photoUrl || '',
                            // Add fields for filtering
                            schoolName: userData?.schoolName || '',
                            countryRef: userData?.countryRef || '',
                            stateRef: userData?.stateRef || '',
                            age: userData?.age || 0,
                        };
                    } catch (e) {
                        console.error('Error fetching user:', e);
                        return {
                            ...item,
                            displayName: 'Anonymous User',
                            photoUrl: '',
                            schoolName: '',
                            countryRef: '',
                            stateRef: '',
                            age: 0,
                        };
                    }
                }));
            };

            const [topPerformers, quizLeaderboard] = await Promise.all([
                fetchUserDetails(topPerformersRaw),
                fetchUserDetails(quizLeaderboardRaw)
            ]);

            return {
                totalParticipants,
                completionRate,
                averageProgress,
                totalPointsDistributed,
                episodeDropOff,
                topPerformers, // Now returns full list with details
                quizLeaderboard, // Now returns full list with details
                totalEpisodes
            };
        },
        enabled: !!programId && !!user && !!isAdmin,
    });
}
/**
 * Fetch count of fully completed programs for the current user
 */
export function useCompletedProgramsCount() {
    const { currentUser } = auth;
    const userId = currentUser?.uid;

    return useQuery({
        queryKey: ['completed-programs-count', userId],
        queryFn: async () => {
            if (!userId) return 0;

            // 1. Get all programs the user has joined
            // We can reuse the logic from useJoinedPrograms but optimized for just IDs if possible, 
            // but for simplicity and consistency, let's query the 'joined' array on events.
            const userRef = doc(db, 'users', userId);
            const joinedQuery = query(
                collection(db, 'event'),
                where('joined', 'array-contains', userRef)
            );

            const joinedSnapshot = await getDocs(joinedQuery);
            const joinedPrograms = joinedSnapshot.docs.map(doc => ({
                id: doc.id,
                episodeCount: (doc.data().episode as any[])?.length || 0
            }));

            if (joinedPrograms.length === 0) return 0;

            // 2. Get progress for these programs
            // In a better structure, we might query user_program_progress where userId == currentUserId
            // and then match locally. This avoids N reads if we just fetch all progress docs for user.
            const progressQuery = query(
                collection(db, 'user_program_progress'),
                where('userId', '==', userId)
            );

            const progressSnapshot = await getDocs(progressQuery);
            const progressMap = new Map<string, number>(); // programId -> completedEpisodesCount

            progressSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.programId && Array.isArray(data.completedEpisodes)) {
                    progressMap.set(data.programId, data.completedEpisodes.length);
                }
            });

            // 3. Compare
            let completedCount = 0;
            joinedPrograms.forEach(program => {
                const completedEpisodes = progressMap.get(program.id) || 0;
                // Consider completed if all episodes are done AND there are episodes (avoids 0/0 edge case if needed, but 0/0 usually means empty program)
                // Let's assume a program with 0 episodes is "completed" if joined, or maybe not. 
                // Usually programs have content. Let's say if episodeCount > 0 and match.
                if (program.episodeCount > 0 && completedEpisodes >= program.episodeCount) {
                    completedCount++;
                }
            });

            return completedCount;
        },
        enabled: !!userId,
    });
}

/**
 * Fetch user's recent program access timestamps (for "Recents" sort)
 * Returns a Map of programId → lastAccessed millis
 */
export function useUserRecentPrograms() {
    const { currentUser } = auth;
    const userId = currentUser?.uid;

    return useQuery({
        queryKey: ['user-recent-programs', userId],
        queryFn: async () => {
            if (!userId) return new Map<string, number>();

            const q = query(
                collection(db, 'user_program_progress'),
                where('userId', '==', userId)
            );

            const snapshot = await getDocs(q);
            const recentMap = new Map<string, number>();

            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.programId) {
                    // Prefer lastAccessed, fallback to lastUpdated
                    const ts = data.lastAccessed || data.lastUpdated;
                    const millis = ts?.toMillis?.() || ts?.seconds * 1000 || 0;
                    recentMap.set(data.programId, millis);
                }
            });

            return recentMap;
        },
        enabled: !!userId,
    });
}

/**
 * Fetch feedback for a program
 */
export function useProgramFeedback(programId: string) {
    return useQuery({
        queryKey: ['program-feedback', programId],
        queryFn: async () => {
            if (!programId) return [];

            try {
                // Remove orderBy from Firestore query to avoid composite index requirement
                const q = query(
                    collection(db, 'program_feedback'),
                    where('programId', '==', programId)
                );

                const snapshot = await getDocs(q);
                const feedbackList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as any[];

                // Sort in-memory instead
                return feedbackList.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB.getTime() - dateA.getTime();
                });
            } catch (error) {
                console.error('Error fetching program feedback:', error);
                return [];
            }
        },
        enabled: !!programId,
    });
}

/**
 * Check if a specific user has submitted feedback for a program
 */
export function useUserFeedback(programId: string, userId: string | undefined) {
    return useQuery({
        queryKey: ['user-feedback', programId, userId],
        queryFn: async () => {
            if (!programId || !userId) return null;
            const docRef = doc(db, 'program_feedback', `${userId}_${programId}`);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? docSnap.data() : null;
        },
        enabled: !!programId && !!userId,
    });
}

/**
 * Submit feedback for a program
 */
export function useSubmitFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ programId, userId, rating, comment, userName, userEmail }: { programId: string; userId: string; rating: number; comment: string; userName: string; userEmail: string }) => {
            const docRef = doc(db, 'program_feedback', `${userId}_${programId}`);
            await setDoc(docRef, {
                programId,
                userId,
                rating,
                comment,
                userName,
                userEmail,
                createdAt: serverTimestamp(),
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['program-feedback', variables.programId] });
            queryClient.invalidateQueries({ queryKey: ['user-feedback', variables.programId, variables.userId] });
        },
    });
}
