/**
 * Recommendation Hooks
 * React Query hooks for fetching personalized program recommendations
 * from the AI-driven recommendation engine API.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { EventProgram } from '../types/firestore';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ReasonType =
    | 'interest_match'
    | 'category_affinity'
    | 'similar_students'
    | 'skill_level'
    | 'trending'
    | 'new_content';

export interface RecommendationReason {
    type: ReasonType;
    text: string;
    confidence: number;
}

export interface ProgramRecommendation {
    programId: string;
    program: EventProgram;
    score: number;
    reasons: RecommendationReason[];
    breakdown: {
        contentScore: number;
        collaborativeScore: number;
        performanceScore: number;
        popularityScore: number;
        recencyScore: number;
    };
}

export interface RecommendationsResponse {
    recommendations: ProgramRecommendation[];
    metadata: {
        userId: string;
        computedAt: string;
        totalCandidates: number;
        totalReturned: number;
    };
}

// ─── Reason Icon Map ─────────────────────────────────────────────────────────

const REASON_ICONS: Record<ReasonType, string> = {
    interest_match: '🎯',
    category_affinity: '📊',
    similar_students: '👥',
    skill_level: '📈',
    trending: '🔥',
    new_content: '✨',
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Fetch personalized program recommendations for the current user.
 * Results are cached for 5 minutes to avoid excessive recomputation.
 *
 * @param limit - Maximum number of recommendations to return (default: 10)
 */
export function useRecommendations(limit: number = 10) {
    const { user } = useAuth();

    return useQuery<RecommendationsResponse>({
        queryKey: ['recommendations', user?.uid, limit],
        queryFn: async () => {
            const res = await fetch(
                `/api/recommendations?userId=${user!.uid}&limit=${limit}`
            );

            if (!res.ok) {
                throw new Error(`Recommendation API error: ${res.status}`);
            }

            return res.json();
        },
        enabled: !!user?.uid,
        staleTime: 5 * 60 * 1000, // 5 minutes — recommendations evolve slowly
        refetchOnWindowFocus: false,
        retry: 1, // Retry once on failure
    });
}

/**
 * Utility hook that formats recommendation reasons for display.
 * Returns the top 2 most confident reasons with their icons.
 *
 * @param reasons - Array of recommendation reasons from the API
 */
export function useRecommendationReasons(reasons: RecommendationReason[]) {
    if (!reasons || reasons.length === 0) {
        return {
            primaryReason: 'Recommended for you',
            primaryIcon: '✨',
            secondaryReason: undefined,
            secondaryIcon: undefined,
        };
    }

    const sorted = [...reasons].sort((a, b) => b.confidence - a.confidence);
    const primary = sorted[0];
    const secondary = sorted.length > 1 ? sorted[1] : undefined;

    return {
        primaryReason: primary.text,
        primaryIcon: REASON_ICONS[primary.type] || '✨',
        secondaryReason: secondary?.text,
        secondaryIcon: secondary ? REASON_ICONS[secondary.type] || '📊' : undefined,
    };
}
