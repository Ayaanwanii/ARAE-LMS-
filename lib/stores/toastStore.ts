/**
 * Toast Store
 * Global state management for toast notifications
 */

import { create } from 'zustand';

export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (message: string, type?: Toast['type'], duration?: number) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],

    addToast: (message, type = 'info', duration = 10000) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            toasts: [...state.toasts, { id, message, type, duration }],
        }));
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
    },
}));

// Helper functions for easy toast creation
export const toast = {
    success: (message: string, duration = 10000) => {
        useToastStore.getState().addToast(message, 'success', duration);
    },
    error: (message: string, duration = 10000) => {
        useToastStore.getState().addToast(message, 'error', duration);
    },
    info: (message: string, duration = 10000) => {
        useToastStore.getState().addToast(message, 'info', duration);
    },
    warning: (message: string, duration = 10000) => {
        useToastStore.getState().addToast(message, 'warning', duration);
    },
};
