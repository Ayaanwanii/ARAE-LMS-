'use client';

import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableListProps<T> {
    items: T[];
    onReorder: (newItems: T[]) => void;
    keyExtractor: (item: T) => string;
    renderItem: (
        item: T, 
        sortableProps: {
            setNodeRef: (node: HTMLElement | null) => void;
            attributes: Record<string, any>;
            listeners: Record<string, any> | undefined;
            style: React.CSSProperties;
        }
    ) => React.ReactNode;
}

export default function SortableList<T>({ items, onReorder, keyExtractor, renderItem }: SortableListProps<T>) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => keyExtractor(item) === active.id);
            const newIndex = items.findIndex((item) => keyExtractor(item) === over.id);
            const newItems = arrayMove(items, oldIndex, newIndex);
            onReorder(newItems);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map((item) => keyExtractor(item))}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {items.map((item) => (
                        <SortableItem key={keyExtractor(item)} id={keyExtractor(item)} item={item} renderItem={renderItem} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableItem<T>({ id, item, renderItem }: { id: string, item: T, renderItem: SortableListProps<T>['renderItem'] }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: transform ? 50 : 'auto',
    };

    return <>{renderItem(item, { setNodeRef, attributes, listeners, style })}</>;
}
