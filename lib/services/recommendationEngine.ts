import { collection, doc, getDoc, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../firebase/config';
import { EventProgram, UserProfile } from '../types/firestore';

export interface UserFeatureProfile {
    userId: string;
    declaredInterests: string[];        // from users.interest[]
    implicitInterests: Map<string, number>; // category -> affinity score from joined programs
    joinedProgramIds: string[];         // programs user has joined
    completedProgramIds: string[];      // programs user has fully completed
    avgQuizScoreByCategory: Map<string, number>; // category -> avg score (0-100)
    overallAvgQuizScore: number;        // 0-100
    completionRate: number;             // 0-1
    totalProgramsJoined: number;
    age: number;
    role: string;
}

export interface ProgramRecommendation {
    program: EventProgram;
    score: number;                      // 0-1 final blended score
    reasons: RecommendationReason[];    // why this was recommended
    breakdown: {
        contentScore: number;
        collaborativeScore: number;
        performanceScore: number;
        popularityScore: number;
        recencyScore: number;
    };
}

export interface RecommendationReason {
    type: 'interest_match' | 'category_affinity' | 'similar_students' | 'skill_level' | 'trending' | 'new_content';
    text: string;                       // Human-readable reason
    confidence: number;                 // 0-1
}

/**
 * Normalizes text for comparison by lowercasing and trimming.
 */
function normalizeText(text: string): string {
    return text.toLowerCase().trim();
}

/**
 * Computes cosine similarity between two feature vectors.
 */
function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const [key, valA] of vecA.entries()) {
        const valB = vecB.get(key) || 0;
        dotProduct += valA * valB;
        normA += valA * valA;
    }

    for (const valB of vecB.values()) {
        normB += valB * valB;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes Jaccard similarity between two arrays of strings.
 */
function jaccardSimilarity(setA: string[], setB: string[]): number {
    const sA = new Set(setA);
    const sB = new Set(setB);
    let intersection = 0;
    for (const item of sA) {
        if (sB.has(item)) intersection++;
    }
    const union = sA.size + sB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}

/**
 * Builds a comprehensive feature profile for a given user.
 * @param userId - The ID of the user
 */
export async function buildUserFeatureProfile(userId: string): Promise<UserFeatureProfile> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? (userDoc.data() as UserProfile) : null;

    const declaredInterests = userData?.interest || [];
    const age = userData?.age || 0;
    const role = userData?.role || 'student';

    const progressRef = collection(db, 'user_program_progress');
    const q = query(progressRef, where('userId', '==', userId));
    const progressSnap = await getDocs(q);

    const joinedProgramIds: string[] = [];
    const completedProgramIds: string[] = [];
    const implicitInterests = new Map<string, number>();
    const categoryScores = new Map<string, { totalScore: number, count: number }>();
    
    let totalScore = 0;
    let totalQuizzes = 0;

    const programIdsToFetch = new Set<string>();
    progressSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.programId) {
            joinedProgramIds.push(data.programId);
            programIdsToFetch.add(data.programId);
        }
    });

    const programs = new Map<string, EventProgram>();
    const programIdsArray = Array.from(programIdsToFetch);
    
    // Batch fetch programs in chunks of 10
    for (let i = 0; i < programIdsArray.length; i += 10) {
        const chunk = programIdsArray.slice(i, i + 10);
        const eventQ = query(collection(db, 'event'), where(documentId(), 'in', chunk));
        const eventSnap = await getDocs(eventQ);
        eventSnap.forEach(eDoc => {
            programs.set(eDoc.id, eDoc.data() as EventProgram);
        });
    }

    progressSnap.forEach(pDoc => {
        const data = pDoc.data();
        const programId = data.programId;
        const program = programs.get(programId);
        if (!program) return;

        const completedEpisodes = data.completedEpisodes || [];
        const episodeCount = program.episode?.length || 0;
        const isCompleted = episodeCount > 0 && completedEpisodes.length >= episodeCount;
        
        if (isCompleted) {
            completedProgramIds.push(programId);
        }

        const weight = isCompleted ? 1.0 : 0.5;
        const categories = program.category || [];
        
        for (const cat of categories) {
            const normalizedCat = normalizeText(cat);
            const currentWeight = implicitInterests.get(normalizedCat) || 0;
            implicitInterests.set(normalizedCat, currentWeight + weight);
        }

        const quizScores = data.quizScores || {};
        for (const epId in quizScores) {
            const qs = quizScores[epId];
            if (qs && typeof qs.score === 'number' && qs.total > 0) {
                const percent = (qs.score / qs.total) * 100;
                totalScore += percent;
                totalQuizzes++;

                for (const cat of categories) {
                    const normalizedCat = normalizeText(cat);
                    const catStats = categoryScores.get(normalizedCat) || { totalScore: 0, count: 0 };
                    catStats.totalScore += percent;
                    catStats.count++;
                    categoryScores.set(normalizedCat, catStats);
                }
            }
        }
    });

    const avgQuizScoreByCategory = new Map<string, number>();
    for (const [cat, stats] of categoryScores.entries()) {
        avgQuizScoreByCategory.set(cat, stats.totalScore / stats.count);
    }

    const overallAvgQuizScore = totalQuizzes > 0 ? totalScore / totalQuizzes : 0;
    const totalProgramsJoined = joinedProgramIds.length;
    const completionRate = totalProgramsJoined > 0 ? completedProgramIds.length / totalProgramsJoined : 0;

    return {
        userId,
        declaredInterests,
        implicitInterests,
        joinedProgramIds,
        completedProgramIds,
        avgQuizScoreByCategory,
        overallAvgQuizScore,
        completionRate,
        totalProgramsJoined,
        age,
        role
    };
}

/**
 * Computes a content-based recommendation score for a program.
 */
export function computeContentScore(userProfile: UserFeatureProfile, program: EventProgram): { score: number, reasons: RecommendationReason[] } {
    const userVector = new Map<string, number>();
    
    for (const interest of userProfile.declaredInterests) {
        userVector.set(normalizeText(interest), 1.0);
    }

    for (const [cat, weight] of userProfile.implicitInterests.entries()) {
        const current = userVector.get(cat) || 0;
        userVector.set(cat, current + weight);
    }

    const programVector = new Map<string, number>();
    const programCategories = program.category || [];
    for (const cat of programCategories) {
        programVector.set(normalizeText(cat), 1.0);
    }

    let score = cosineSimilarity(userVector, programVector);
    const reasons: RecommendationReason[] = [];

    const audience = program.audience || [];
    for (const aud of audience) {
        if (normalizeText(aud) === normalizeText(userProfile.role)) {
            score = Math.min(1.0, score + 0.1);
            break;
        }
    }

    if (score > 0.5) {
        reasons.push({
            type: 'interest_match',
            text: `Matches your interest in ${programCategories[0] || 'this topic'}`,
            confidence: score
        });
    }

    return { score, reasons };
}

/**
 * Computes a collaborative filtering score based on other students' activities.
 */
export function computeCollaborativeScore(userProfile: UserFeatureProfile, program: EventProgram, allPrograms: EventProgram[]): { score: number, reasons: RecommendationReason[] } {
    let maxJaccard = 0;
    const reasons: RecommendationReason[] = [];
    const candidateJoined = program.userJoined || [];

    if (candidateJoined.length === 0 || allPrograms.length === 0) {
        return { score: 0, reasons };
    }

    for (const joinedProgram of allPrograms) {
        const overlap = jaccardSimilarity(joinedProgram.userJoined || [], candidateJoined);
        if (overlap > maxJaccard) {
            maxJaccard = overlap;
        }
    }

    if (maxJaccard > 0.1) {
        reasons.push({
            type: 'similar_students',
            text: 'Students who joined your programs also joined this',
            confidence: maxJaccard
        });
    }

    return { score: maxJaccard, reasons };
}

/**
 * Computes a performance-based score for a program.
 */
export function computePerformanceScore(userProfile: UserFeatureProfile, program: EventProgram): { score: number, reasons: RecommendationReason[] } {
    const reasons: RecommendationReason[] = [];
    let relevantAvgScore = userProfile.overallAvgQuizScore;
    let categoryMatchCount = 0;

    const categories = program.category || [];
    let sumScore = 0;
    for (const cat of categories) {
        const normCat = normalizeText(cat);
        if (userProfile.avgQuizScoreByCategory.has(normCat)) {
            sumScore += userProfile.avgQuizScoreByCategory.get(normCat)!;
            categoryMatchCount++;
        }
    }

    if (categoryMatchCount > 0) {
        relevantAvgScore = sumScore / categoryMatchCount;
    }

    if (relevantAvgScore === 0) {
        return { score: 0.5, reasons: [] }; // Neutral if no history
    }

    const episodes = program.episode || [];
    let quizCount = 0;
    let contentCount = 0;
    
    for (const ep of episodes) {
        if ((ep as any).type === 'quiz' || (ep as any).quiz) {
            quizCount++;
        } else {
            contentCount++;
        }
    }

    let score = 0.5;
    if (relevantAvgScore > 80 && quizCount > contentCount) {
        score = 0.8;
        reasons.push({ type: 'skill_level', text: 'Great match for your skill level (Advanced)', confidence: score });
    } else if (relevantAvgScore < 50 && contentCount >= quizCount) {
        score = 0.8;
        reasons.push({ type: 'skill_level', text: 'Great match for your skill level (Foundational)', confidence: score });
    } else if (relevantAvgScore >= 50 && relevantAvgScore <= 80) {
        score = 0.6;
        reasons.push({ type: 'skill_level', text: 'Appropriate for your current skill level', confidence: score });
    }

    return { score, reasons };
}

/**
 * Computes a popularity score with logarithmic scaling.
 */
export function computePopularityScore(program: EventProgram): number {
    const userJoinedNumber = program.userJoinedNumber || (program.userJoined?.length || 0);
    return Math.min(1, Math.log(1 + userJoinedNumber) / Math.log(1 + 100));
}

/**
 * Computes a recency score based on program creation time.
 */
export function computeRecencyScore(program: EventProgram): number {
    if (!program.createdTime) return 0;
    
    let createdDate: Date;
    if (typeof (program.createdTime as any).toDate === 'function') {
        createdDate = (program.createdTime as any).toDate();
    } else {
        createdDate = new Date(program.createdTime as any);
    }
    
    const now = new Date();
    const daysSinceCreation = Math.max(0, (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceCreation <= 30) {
        return 1.0;
    } else if (daysSinceCreation > 180) {
        return 0.2;
    }
    
    return 0.2 + 0.8 * Math.exp(-daysSinceCreation / 60);
}

/**
 * Gets personalized program recommendations for a user.
 * @param userId - The ID of the user
 * @param limit - Max number of recommendations to return
 */
export async function getRecommendations(userId: string, limit: number = 10): Promise<ProgramRecommendation[]> {
    const userProfile = await buildUserFeatureProfile(userId);

    const eventQ = query(collection(db, 'event'), where('archived', '==', false));
    const eventSnap = await getDocs(eventQ);
    const allPrograms: (EventProgram & { id: string })[] = [];
    
    eventSnap.forEach(docSnap => {
        const data = docSnap.data() as EventProgram;
        if (data.access !== 'private') {
        allPrograms.push({ ...data, id: docSnap.id } as EventProgram & { id: string });
        }
    });

    const joinedProgramsContext = allPrograms.filter(p => userProfile.joinedProgramIds.includes(p.id));
    const candidatePrograms = allPrograms.filter(p => !userProfile.joinedProgramIds.includes(p.id));

    const recommendations: ProgramRecommendation[] = [];
    const isColdStart = userProfile.declaredInterests.length === 0 && userProfile.joinedProgramIds.length === 0;

    for (const program of candidatePrograms) {
        const popularityScore = computePopularityScore(program);
        const recencyScore = computeRecencyScore(program);
        let contentScore = 0;
        let collaborativeScore = 0;
        let performanceScore = 0;
        const reasons: RecommendationReason[] = [];

        if (isColdStart) {
            const finalScore = (popularityScore * 0.5) + (recencyScore * 0.5);
            if (popularityScore > 0.7) {
                reasons.push({ type: 'trending', text: 'Popular among students', confidence: popularityScore });
            }
            if (recencyScore > 0.8) {
                reasons.push({ type: 'new_content', text: 'Recently added program', confidence: recencyScore });
            }
            
            recommendations.push({
                program,
                score: finalScore,
                reasons,
                breakdown: { contentScore, collaborativeScore, performanceScore, popularityScore, recencyScore }
            });
            continue;
        }

        const contentResult = computeContentScore(userProfile, program);
        contentScore = contentResult.score;
        reasons.push(...contentResult.reasons);

        const collabResult = computeCollaborativeScore(userProfile, program, joinedProgramsContext);
        collaborativeScore = collabResult.score;
        reasons.push(...collabResult.reasons);

        const perfResult = computePerformanceScore(userProfile, program);
        performanceScore = perfResult.score;
        reasons.push(...perfResult.reasons);

        if (popularityScore > 0.8) {
            reasons.push({ type: 'trending', text: 'Trending program', confidence: popularityScore });
        }
        if (recencyScore > 0.9) {
            reasons.push({ type: 'new_content', text: 'New content', confidence: recencyScore });
        }

        const finalScore = 
            (contentScore * 0.35) + 
            (collaborativeScore * 0.25) + 
            (performanceScore * 0.20) + 
            (popularityScore * 0.10) + 
            (recencyScore * 0.10);

        reasons.sort((a, b) => b.confidence - a.confidence);
        const uniqueReasons = Array.from(new Map(reasons.map(r => [r.text, r])).values()).slice(0, 3);

        recommendations.push({
            program,
            score: finalScore,
            reasons: uniqueReasons,
            breakdown: { contentScore, collaborativeScore, performanceScore, popularityScore, recencyScore }
        });
    }

    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, limit);
}
