/**
 * Recommendation Reason Badge
 * Displays why a program was recommended with an icon and text.
 */

'use client';

import { ReasonType } from '@/lib/hooks/useRecommendations';

interface RecommendationReasonBadgeProps {
    type: ReasonType;
    text: string;
    confidence: number;
    compact?: boolean;
}

const REASON_STYLES: Record<ReasonType, { icon: string; gradient: string; border: string }> = {
    interest_match: {
        icon: '🎯',
        gradient: 'from-violet-500/20 to-indigo-500/20 dark:from-violet-500/30 dark:to-indigo-500/30',
        border: 'border-violet-300/40 dark:border-violet-400/30',
    },
    category_affinity: {
        icon: '📊',
        gradient: 'from-blue-500/20 to-cyan-500/20 dark:from-blue-500/30 dark:to-cyan-500/30',
        border: 'border-blue-300/40 dark:border-blue-400/30',
    },
    similar_students: {
        icon: '👥',
        gradient: 'from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/30 dark:to-teal-500/30',
        border: 'border-emerald-300/40 dark:border-emerald-400/30',
    },
    skill_level: {
        icon: '📈',
        gradient: 'from-amber-500/20 to-orange-500/20 dark:from-amber-500/30 dark:to-orange-500/30',
        border: 'border-amber-300/40 dark:border-amber-400/30',
    },
    trending: {
        icon: '🔥',
        gradient: 'from-rose-500/20 to-pink-500/20 dark:from-rose-500/30 dark:to-pink-500/30',
        border: 'border-rose-300/40 dark:border-rose-400/30',
    },
    new_content: {
        icon: '✨',
        gradient: 'from-fuchsia-500/20 to-purple-500/20 dark:from-fuchsia-500/30 dark:to-purple-500/30',
        border: 'border-fuchsia-300/40 dark:border-fuchsia-400/30',
    },
};

export default function RecommendationReasonBadge({
    type,
    text,
    confidence,
    compact = false,
}: RecommendationReasonBadgeProps) {
    const style = REASON_STYLES[type] || REASON_STYLES.interest_match;

    if (compact) {
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium
                    bg-gradient-to-r ${style.gradient} border ${style.border}
                    text-gray-700 dark:text-gray-200 backdrop-blur-sm`}
                title={`${text} (${Math.round(confidence * 100)}% confidence)`}
            >
                <span className="text-xs">{style.icon}</span>
                <span className="truncate max-w-[120px]">{text}</span>
            </span>
        );
    }

    return (
        <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                bg-gradient-to-r ${style.gradient} border ${style.border}
                text-gray-700 dark:text-gray-200 backdrop-blur-sm
                transition-all duration-200 hover:scale-[1.02]`}
        >
            <span className="text-sm">{style.icon}</span>
            <span>{text}</span>
            {confidence >= 0.7 && (
                <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-green-400 dark:bg-green-500 animate-pulse" />
            )}
        </div>
    );
}
