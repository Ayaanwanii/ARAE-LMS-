'use client';

import { useState } from 'react';
import { Timestamp, runTransaction, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Reward } from '@/lib/types/firestore';
import { toast } from '@/lib/stores/toastStore';
import Button from '@/components/ui/Button';
import DOMPurify from 'isomorphic-dompurify';

interface RedeemRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    reward: Reward | null;
    onSuccess: () => void;
    isRedeemed?: boolean;
}

export default function RedeemRewardModal({ isOpen, onClose, reward, onSuccess, isRedeemed = false }: RedeemRewardModalProps) {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!isOpen || !reward) return null;

    const userPoints = profile?.points || 0;
    const canAfford = userPoints >= reward.pointsCost;

    const handleRedeem = async () => {
        if (!user || !profile) return;
        if (!canAfford) {
            toast.error('Not enough points to redeem this reward');
            return;
        }

        setLoading(true);
        try {
            await runTransaction(db, async (transaction) => {
                // 1. Get fresh user data to ensure points are accurate
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error('User not found');
                }

                const currentPoints = userDoc.data().points || 0;
                if (currentPoints < reward.pointsCost) {
                    throw new Error('Insufficient points');
                }

                // 2. Create redemption record
                const redemptionRef = doc(collection(db, 'redemptions'));
                const redemptionData = {
                    id: redemptionRef.id,
                    userId: user.uid,
                    rewardId: reward.id,
                    rewardTitle: reward.title,
                    rewardImage: reward.image,
                    pointsCost: reward.pointsCost,
                    code: reward.code || null,
                    redeemedAt: Timestamp.now(),
                    status: 'active',
                    expiryDate: reward.expiryDate || null,
                    merchantName: reward.merchantName || null,
                    discountValue: reward.discountValue || null,
                };

                // 3. Deduct points and save redemption
                transaction.update(userRef, { points: currentPoints - reward.pointsCost });
                transaction.set(redemptionRef, redemptionData);
            });

            toast.success('Reward redeemed successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error redeeming reward:', error);
            toast.error(error.message || 'Failed to redeem reward');
        } finally {
            setLoading(false);
        }
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
                                src={reward.image}
                                alt={reward.title}
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
                        </div>

                        <div className="px-6 py-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-1">
                                        {reward.title}
                                    </h3>
                                    {reward.merchantName && (
                                        <p className="text-purple-400 font-semibold">{reward.merchantName}</p>
                                    )}
                                </div>
                                <div className="bg-purple-500/20 border border-purple-500/30 px-4 py-2 rounded-2xl">
                                    <span className="text-purple-300 font-black text-xl">{reward.pointsCost}</span>
                                    <span className="text-purple-400 text-xs ml-1 font-bold uppercase">pts</span>
                                </div>
                            </div>

                            <div className="prose max-w-none mb-8 text-slate-300 [&_*]:!text-slate-200">
                                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reward.description) }} />
                            </div>

                            <div className="border-t border-slate-800 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-slate-400 font-medium">Your Balance</span>
                                    <span className={`font-bold ${canAfford ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {userPoints} Points
                                    </span>
                                </div>

                                <div className="flex gap-3">
                                    {isRedeemed ? (
                                        <Button
                                            disabled
                                            className="w-full py-3 text.lg opacity-50 cursor-not-allowed bg-slate-800 text-slate-400 border-none rounded-xl"
                                        >
                                            Already Redeemed
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleRedeem}
                                            isLoading={loading}
                                            disabled={!canAfford}
                                            className={`w-full py-3 text-base font-bold rounded-xl ${!canAfford ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-400' : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'}`}
                                        >
                                            {canAfford ? 'Redeem Reward' : `Need ${reward.pointsCost - userPoints} more points`}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

