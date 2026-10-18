/**
 * Toast Notification Component
 * Auto-dismissing notifications with customizable duration
 */

'use client';

import { useEffect, useState } from 'react';
import { useToastStore, Toast as ToastType } from '@/lib/stores/toastStore';

function ToastItem({ toast }: { toast: ToastType }) {
    const { removeToast } = useToastStore();
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
            setProgress(remaining);
        }, 50);

        const timeout = setTimeout(() => {
            removeToast(toast.id);
        }, toast.duration);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [toast, removeToast]);

    const colors = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    const progressColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };

    const icons = {
        success: (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        info: (
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    return (
        <div className={`relative max-w-md w-full ${colors[toast.type]} border rounded-2xl shadow-xl p-4 transition-all duration-300 animate-slide-in backdrop-blur-xl pointer-events-auto`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
                <div className="flex-1">
                    <p className="text-sm font-medium">{toast.message}</p>
                </div>
                <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10 rounded-b-2xl overflow-hidden">
                <div
                    className={`h-full ${progressColors[toast.type]} transition-all ease-linear`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

export default function ToastContainer() {
    const { toasts } = useToastStore();

    return (
        <div className="fixed top-3 left-3 right-3 sm:left-auto sm:top-4 sm:right-4 z-50 pointer-events-none space-y-3" suppressHydrationWarning>
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} />
            ))}
        </div>
    );
}
