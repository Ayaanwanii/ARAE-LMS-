import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableEpisodeItemProps {
    id: string;
    children: React.ReactNode;
}

export function SortableEpisodeItem({ id, children }: SortableEpisodeItemProps) {
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
        position: 'relative' as const,
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className="flex gap-2 group">
            <div
                {...attributes}
                {...listeners}
                className="mt-6 p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex flex-col justify-center gap-1 rounded hover:bg-gray-100 h-8 self-start transition-colors"
                title="Drag to reorder"
            >
                {/* Drag Handle Icon (6 dots) */}
                <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                    <circle cx="2" cy="2" r="1.5" />
                    <circle cx="8" cy="2" r="1.5" />
                    <circle cx="2" cy="8" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="2" cy="14" r="1.5" />
                    <circle cx="8" cy="14" r="1.5" />
                </svg>
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
