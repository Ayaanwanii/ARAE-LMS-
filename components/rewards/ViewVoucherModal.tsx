'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Redemption, Reward } from '@/lib/types/firestore';
import Button from '@/components/ui/Button';
import DOMPurify from 'isomorphic-dompurify';
import { format } from 'date-fns';

interface ViewVoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
    redemption: Redemption | null;
}

export default function ViewVoucherModal({ isOpen, onClose, redemption }: ViewVoucherModalProps) {
    const [rewardDescription, setRewardDescription] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRewardDetails = async () => {
            if (redemption?.rewardId) {
                setLoading(true);
                try {
                    const rewardDoc = await getDoc(doc(db, 'rewards', redemption.rewardId));
                    if (rewardDoc.exists()) {
                        setRewardDescription(rewardDoc.data().description);
                    }
                } catch (error) {
                    console.error('Error fetching reward details:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        if (isOpen && redemption) {
            fetchRewardDetails();
        } else {
            setRewardDescription('');
        }
    }, [isOpen, redemption]);

    if (!isOpen || !redemption) return null;

    const formatDate = (date: any) => {
        if (!date) return 'No expiry';
        // Handle Firestore Timestamp
        const d = date.toDate ? date.toDate() : new Date(date);
        return format(d, 'dd MMM yyyy');
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal Card */}
                <div className="inline-block align-bottom bg-slate-900 border border-white/10 rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-10 backdrop-blur-2xl">
                    <div className="bg-slate-900">
                        {/* Hero Image */}
                        <div className="relative h-64 w-full bg-slate-800">
                            <img
                                src={redemption.rewardImage}
                                alt={redemption.rewardTitle}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 bg-slate-950/80 hover:bg-slate-950 p-2 rounded-full text-slate-300 hover:text-white transition-colors border border-white/10"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <div className="absolute bottom-4 right-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase backdrop-blur-md">
                                Redeemed
                            </div>
                        </div>

                        <div className="px-6 py-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-1">
                                        {redemption.rewardTitle}
                                    </h3>
                                    {redemption.merchantName && (
                                        <p className="text-purple-400 font-semibold">{redemption.merchantName}</p>
                                    )}
                                </div>
                            </div>

                            {/* Voucher Code Section */}
                            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 mb-8 text-center">
                                {redemption.code ? (
                                    <>
                                        <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">Promo Code</p>
                                        <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-3 mb-2 inline-block min-w-[200px] shadow-lg">
                                            <p className="font-mono font-black text-2xl text-purple-400 select-all tracking-wider">
                                                {redemption.code}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-400">Click code to select & copy</p>
                                    </>
                                ) : (
                                    <div className="py-2">
                                        <p className="text-lg font-bold text-white mb-1">No Code Required</p>
                                        <p className="text-slate-400 text-sm">Simply show this voucher to the cashier to redeem.</p>
                                    </div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                                <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-xl">
                                    <p className="text-slate-400 text-xs mb-1">Redeemed On</p>
                                    <p className="font-bold text-white">{formatDate(redemption.redeemedAt)}</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/60 p-3.5 rounded-xl">
                                    <p className="text-slate-400 text-xs mb-1">Expires On</p>
                                    <p className={`font-bold ${redemption.expiryDate ? 'text-white' : 'text-emerald-400'}`}>
                                        {formatDate(redemption.expiryDate)}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            {loading ? (
                                <div className="animate-pulse space-y-2">
                                    <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                                    <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                                </div>
                            ) : rewardDescription ? (
                                <div className="prose max-w-none text-slate-300 text-sm [&_*]:!text-slate-200">
                                    <h4 className="text-white font-bold mb-2">Terms & Conditions</h4>
                                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rewardDescription) }} />
                                </div>
                            ) : null}

                            <div className="mt-8">
                                <Button onClick={onClose} className="w-full py-3 font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl">
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
