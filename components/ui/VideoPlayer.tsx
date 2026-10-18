import React from 'react';

interface VideoPlayerProps {
    url: string;
    title?: string;
    className?: string;
}

export default function VideoPlayer({ url, title, className = '' }: VideoPlayerProps) {
    const getYoutubeVideoId = (url: string) => {
        // Handle standard watch URLs, short URLs, embed URLs, Shorts, and Live URLs
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)|(live\/))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);

        if (match && match[8].length === 11) {
            return match[8];
        }

        // Handle Shorts specifically if not caught above
        const shortsRegExp = /youtube\.com\/shorts\/([^#&?]*)/;
        const shortsMatch = url.match(shortsRegExp);
        if (shortsMatch && shortsMatch[1]) {
            return shortsMatch[1];
        }

        return null;
    };

    const videoId = getYoutubeVideoId(url);

    if (!videoId) {
        return (
            <div className={`bg-gray-100 rounded-lg p-4 text-center ${className}`}>
                <p className="text-gray-500 text-sm mb-2">Video preview not available</p>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium inline-flex items-center gap-1"
                >
                    Open in new tab
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        );
    }

    return (
        <div suppressHydrationWarning className={`relative w-full pt-[56.25%] bg-black rounded-lg overflow-hidden shadow-md ${className}`}>
            <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3`}
                title={title || "YouTube video player"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
            ></iframe>
        </div>
    );
}
