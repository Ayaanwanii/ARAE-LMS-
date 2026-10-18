import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCompactEpisodeItemProps {
    id: string;
    index: number;
    title: string;
    type: 'video' | 'quiz' | string;
}

export function SortableCompactEpisodeItem({ id, index, title, type }: SortableCompactEpisodeItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`
                flex items-center gap-4 p-3 mb-2 rounded-xl border bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-colors
                ${isDragging ? 'shadow-lg border-indigo-500 ring-2 ring-indigo-500/30' : 'border-gray-200 dark:border-slate-700'}
            `}
        >
            {/* Drag Handle */}
            <div className="text-gray-400 dark:text-slate-500">
                <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                    <circle cx="2" cy="2" r="1.5" />
                    <circle cx="8" cy="2" r="1.5" />
                    <circle cx="2" cy="8" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="2" cy="14" r="1.5" />
                    <circle cx="8" cy="14" r="1.5" />
                </svg>
            </div>

            {/* Index Badge */}
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 text-xs font-bold text-gray-700 dark:text-slate-300">
                {index + 1}
            </div>

            {/* Content Info */}
            <div className="flex-1 flex items-center gap-3">
                <span className={`
                    px-2.5 py-0.5 text-xs rounded-lg font-bold capitalize
                    ${type === 'quiz' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'}
                `}>
                    {type === 'quiz' ? 'Quiz' : 'Episode'}
                </span>

                <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {title || (type === 'quiz' ? 'Untitled Quiz' : 'Untitled Episode')}
                </span>
            </div>
        </div>
    );
}

