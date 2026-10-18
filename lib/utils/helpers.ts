/**
 * General Utility Functions
 * Various helper functions for the application
 */

/**
 * Truncate text to specified length
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Strip HTML tags from string and decode HTML entities
 */
export function stripHtml(html: string): string {
    if (!html) return '';
    // First strip HTML tags
    let text = html.replace(/<[^>]*>?/gm, '');
    // Then decode common HTML entities
    const entities: Record<string, string> = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&mdash;': '—',
        '&ndash;': '–',
        '&hellip;': '…',
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™',
    };
    // Replace all known entities
    for (const [entity, char] of Object.entries(entities)) {
        text = text.replace(new RegExp(entity, 'gi'), char);
    }
    // Handle numeric entities like &#160;
    text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    // Handle hex entities like &#x00A0;
    text = text.replace(/&#x([0-9A-Fa-f]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
    // Collapse all whitespace and non-breaking spaces
    return text.replace(/[\s\u00A0]+/g, ' ').trim();
}

/**
 * Capitalize first letter of string
 */
export function capitalize(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
    if (!name || name.trim().length === 0) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate random color for avatar backgrounds
 */
export function getColorForString(str: string): string {
    // Handle undefined, null, or empty strings
    if (!str || str.length === 0) {
        return 'bg-gray-500'; // Default color
    }

    const colors = [
        'bg-red-500',
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500',
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check if string is valid URL
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extract YouTube video ID from URL
 */
export function getYouTubeVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * Convert standard video URL to embed URL (YouTube/Vimeo)
 */
export function getEmbedUrl(url: string): string | null {
    if (!url) return null;
    
    // YouTube
    const ytId = getYouTubeVideoId(url);
    if (ytId) return `https://www.youtube.com/embed/${ytId}`;
    
    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    
    return url;
}

/**
 * Generate slug from text
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Generate random ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

/**
 * Download file from URL
 */
export function downloadFile(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
