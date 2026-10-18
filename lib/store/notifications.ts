/**
 * Notification Store
 * Global state management for in-app notifications
 */

import { create } from 'zustand';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    createdAt: any; // Firestore timestamp
    link?: string;
    read?: boolean; // Virtual property for UI
}

interface NotificationState {
    notifications: Notification[];
    loading: boolean;
    lastReadTimestamp: number;
    dismissedIds: string[];
    subscribe: () => () => void;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
    markAsRead: (id: string) => void; // Locally marks as read (or updates timestamp if latest)
    markAllAsRead: () => void;
    dismissNotification: (id: string) => void;
    unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    loading: false,
    lastReadTimestamp: typeof window !== 'undefined' ? parseInt(localStorage.getItem('lastReadTimestamp') || '0') : 0,
    dismissedIds: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dismissedIds') || '[]') : [],

    subscribe: () => {
        set({ loading: true });
        const q = query(
            collection(db, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifications: Notification[] = [];
            snapshot.forEach((doc) => {
                // Ensure we map the data correctly, although direct spread works if fields match
                const data = doc.data();
                notifications.push({
                    id: doc.id,
                    type: data.type,
                    title: data.title,
                    message: data.message,
                    createdAt: data.createdAt,
                    link: data.link
                } as Notification);
            });
            set({ notifications, loading: false });
        });

        return unsubscribe;
    },

    addNotification: async (notification) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                ...notification,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error adding notification:', error);
        }
    },

    markAsRead: (id: string) => {
        // For individual read, we just update the specific item locally if we wanted per-item tracking
        // But for this simple implementation where we track "everything before X is read":
        // We will just verify if this is the latest notification, and if so, update the timestamp.
        // Or simpler: Just purely client-side logic for "read" visual state could be complex without user-specific docs.

        // Revised approach:
        // We really want to know if a specific notification is read. 
        // Without a subcollection for "user_reads", we can only rely on the "lastReadTimestamp".
        // So clicking a notification will just update the timestamp to *that* notification's time if it's newer.

        const notification = get().notifications.find(n => n.id === id);
        if (notification && notification.createdAt) {
            const notifTime = notification.createdAt.toMillis ? notification.createdAt.toMillis() : Date.now();
            const currentLastRead = get().lastReadTimestamp;

            if (notifTime > currentLastRead) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('lastReadTimestamp', notifTime.toString());
                }
                set({ lastReadTimestamp: notifTime });
            }
        }
    },

    markAllAsRead: () => {
        const now = Date.now();
        if (typeof window !== 'undefined') {
            localStorage.setItem('lastReadTimestamp', now.toString());
        }
        set({ lastReadTimestamp: now });
    },

    dismissNotification: (id: string) => {
        const { dismissedIds } = get();
        if (!dismissedIds.includes(id)) {
            const newDismissedIds = [...dismissedIds, id];
            if (typeof window !== 'undefined') {
                localStorage.setItem('dismissedIds', JSON.stringify(newDismissedIds));
            }
            set({ dismissedIds: newDismissedIds });
        }
    },

    unreadCount: () => {
        const { notifications, lastReadTimestamp, dismissedIds } = get();
        return notifications.filter(n => {
            if (dismissedIds.includes(n.id)) return false;
            const time = n.createdAt?.toMillis ? n.createdAt.toMillis() : 0;
            return time > lastReadTimestamp;
        }).length;
    },
}));
