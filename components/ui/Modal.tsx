/**
 * Modal Component
 * Reusable modal dialog with overlay and animations
 */

'use client';

import { useEffect, ReactNode } from 'react';
import Button from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
}: ModalProps) {
    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-up">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-end sm:items-center justify-center p-3 sm:p-4">
                <div
                    className={`relative surface-elevated rounded-[28px] ${sizes[size]} w-full max-h-[92vh] overflow-hidden animate-pop-in`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {title && (
                        <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-white/10">
                            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-white transition"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(92vh-140px)]">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 p-5 sm:p-6 border-t border-white/10">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
