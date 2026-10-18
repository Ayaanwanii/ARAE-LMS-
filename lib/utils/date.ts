/**
 * Date and Time Utilities
 * Helper functions for date formatting and manipulation
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | Date | undefined): Date | null {
    if (!timestamp) return null;
    if (timestamp instanceof Date) return timestamp;
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    return null;
}

/**
 * Format date to readable string
 */
export function formatDate(date: Timestamp | Date | undefined, format: 'short' | 'long' = 'short'): string {
    const dateObj = timestampToDate(date);
    if (!dateObj) return '';

    if (format === 'short') {
        return dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }

    return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

/**
 * Format date and time
 */
export function formatDateTime(date: Timestamp | Date | undefined): string {
    const dateObj = timestampToDate(date);
    if (!dateObj) return '';

    return dateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Timestamp | Date | undefined): string {
    const dateObj = timestampToDate(date);
    if (!dateObj) return '';

    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    if (diffWeek < 4) return `${diffWeek} ${diffWeek === 1 ? 'week' : 'weeks'} ago`;
    if (diffMonth < 12) return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
    return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
}

/**
 * Check if date is in the past
 */
export function isPast(date: Timestamp | Date | undefined): boolean {
    const dateObj = timestampToDate(date);
    if (!dateObj) return false;
    return dateObj.getTime() < Date.now();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Timestamp | Date | undefined): boolean {
    const dateObj = timestampToDate(date);
    if (!dateObj) return false;
    return dateObj.getTime() > Date.now();
}

/**
 * Format duration in minutes to readable string
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format date string with optional time string
 * @param dateStr Date string in YYYY-MM-DD format
 * @param timeStr Optional time string in HH:MM format
 * @returns Formatted string like "Dec 3, 2025 at 10:00 AM"
 */
export function formatDateWithTime(dateStr: string, timeStr?: string): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

    if (!timeStr) return formattedDate;

    // Parse time string (HH:MM format)
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const formattedTime = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;

    return `${formattedDate} at ${formattedTime}`;
}
