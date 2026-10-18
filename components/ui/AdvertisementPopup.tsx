'use client';

import { useState, useEffect } from 'react';
import { useActiveAdvertisement } from '@/lib/hooks/useAdvertisements';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import DOMPurify from 'isomorphic-dompurify';

import { Advertisement } from '@/lib/types/firestore';

interface AdvertisementPopupProps {
    ad?: Advertisement;
    isOpen?: boolean;
    onClose?: () => void;
    isPreview?: boolean;
}

export default function AdvertisementPopup({ ad: propAd, isOpen: propIsOpen, onClose, isPreview = false }: AdvertisementPopupProps = {}) {
    const { data: activeAds, isLoading } = useActiveAdvertisement();
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [displayAd, setDisplayAd] = useState<Advertisement | null | undefined>(null);

    // Determines which ad to show
    useEffect(() => {
        if (isPreview) {
            setDisplayAd(propAd);
            return;
        }

        if (activeAds && Array.isArray(activeAds) && activeAds.length > 0 && !isLoading) {
            // Find the first ad that hasn't been seen
                const unseenAd = activeAds.find(ad => {
                const seenKey = `arae_ad_seen_${ad.id}`;
                return !sessionStorage.getItem(seenKey);
            });

            if (unseenAd) {
                setDisplayAd(unseenAd);
                const timer = setTimeout(() => {
                    setInternalIsOpen(true);
                }, 1000); // 1 second delay
                return () => clearTimeout(timer);
            }
        }
    }, [activeAds, isLoading, isPreview, propAd]);

    const ad = displayAd;
    const isOpen = isPreview ? propIsOpen : internalIsOpen;

    const handleDismiss = () => {
        if (isPreview) {
            onClose?.();
        } else {
            setInternalIsOpen(false);
                if (ad) {
                sessionStorage.setItem(`arae_ad_seen_${ad.id}`, 'true');
            }
        }
    };

    const handleClick = () => {
        if (ad?.redirectUrl) {
            window.open(ad.redirectUrl, '_blank');
        }
        handleDismiss();
    };

    if (!ad || !isOpen || !ad.imageUrl) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-300">

                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 z-10 p-1 bg-white/80 hover:bg-white rounded-full text-gray-500 hover:text-gray-700 transition"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Advertisement Image */}
                <div
                    className="relative w-full aspect-[4/3] cursor-pointer group"
                    onClick={handleClick}
                >
                    <Image
                        src={ad.imageUrl}
                        alt={ad.title}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                    {ad.redirectUrl && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    )}
                </div>

                {/* Footer / CTA (Optional, depending on design) */}
                <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{ad.title}</h3>

                    {/* Description */}
                    {ad.description && (
                        <div
                            className="text-gray-600 mb-4 prose-sm max-h-32 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ad.description) }}
                        />
                    )}

                    <div className="flex gap-3 justify-center">
                        {ad.redirectUrl && (
                            <Button onClick={handleClick}>Learn More</Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
