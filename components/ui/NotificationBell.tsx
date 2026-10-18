/**
 * Notification Bell Component
 * Displays unread notification count and notification dropdown
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/lib/store/notifications';
import { getRelativeTime } from '@/lib/utils/date';

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead, subscribe, lastReadTimestamp, dismissedIds, dismissNotification } =
        useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Filter out dismissed notifications
    const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

    const unread = unreadCount();



    // Subscribe to notifications on mount
    useEffect(() => {
        const unsubscribe = subscribe();
        return () => unsubscribe();
    }, [subscribe]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = (notification: any) => {
        markAsRead(notification.id);
        if (notification.link) {
            router.push(notification.link);
            setIsOpen(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return (
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'error':
                return (
                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => {
                    if (!isOpen) {
                        markAllAsRead();
                    }
                    setIsOpen(!isOpen);
                }}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unread > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white">Notifications</h3>
                        {notifications.length > 0 && unread > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {visibleNotifications.length > 0 ? (
                            visibleNotifications.map((notification) => {
                                const isUnread = (notification.createdAt?.toMillis ? notification.createdAt.toMillis() : 0) > lastReadTimestamp;
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`relative p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${isUnread ? 'bg-indigo-500/10' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            {getIcon(notification.type)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <p className="text-sm font-semibold text-white">
                                                        {notification.title}
                                                    </p>
                                                    {isUnread && (
                                                        <span className="w-2 h-2 bg-indigo-400 rounded-full ml-2 mt-1 flex-shrink-0" />
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dismissNotification(notification.id);
                                                    }}
                                                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 p-1 rounded-full hover:bg-white/10 transition-colors"
                                                    title="Dismiss"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <p className="text-sm text-gray-400 mt-1 pr-6">{notification.message}</p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {getRelativeTime(notification.createdAt?.toDate ? notification.createdAt.toDate() : notification.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                <p className="mt-2 text-sm text-gray-400">No notifications yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
