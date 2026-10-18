/**
 * Image Viewer Component
 * Modal viewer for images with zoom and navigation
 */

'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Image from 'next/image';

interface ImageViewerProps {
    images: string[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function ImageViewer({
    images,
    initialIndex = 0,
    isOpen,
    onClose,
}: ImageViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);

    const currentImage = images[currentIndex];

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setIsZoomed(false);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setIsZoomed(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') goToPrevious();
        if (e.key === 'ArrowRight') goToNext();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="relative" onKeyDown={handleKeyDown} tabIndex={0}>
                {/* Image Container */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                    <div
                        className={`relative ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                        onClick={() => setIsZoomed(!isZoomed)}
                    >
                        <Image
                            src={currentImage}
                            alt={`Image ${currentIndex + 1}`}
                            width={isZoomed ? 1920 : 800}
                            height={isZoomed ? 1080 : 600}
                            className={`w-full h-auto ${isZoomed ? 'scale-150' : ''} transition-transform duration-300`}
                        />
                    </div>
                </div>

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Image Counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full text-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}

                {/* Zoom Indicator */}
                <div className="mt-4 text-center text-sm text-gray-600">
                    {isZoomed ? 'Click to zoom out' : 'Click to zoom in'}
                </div>
            </div>
        </Modal>
    );
}
