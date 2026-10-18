'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import { Reward, Redemption } from '@/lib/types/firestore';
import Button from '@/components/ui/Button';
import RewardCard from '@/components/rewards/RewardCard';
import CreateRewardModal from '@/components/rewards/CreateRewardModal';
import RedeemRewardModal from '@/components/rewards/RedeemRewardModal';
import ViewVoucherModal from '@/components/rewards/ViewVoucherModal';

export default function RewardsPage() {
    const { profile, user } = useAuth();
    const searchParams = useSearchParams();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'browse' | 'my-vouchers'>('browse');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null);

    const isAdmin = profile?.isOrganisation || profile?.isSuperAdmin || profile?.isSubAdmin;

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'my-vouchers') {
            setActiveTab('my-vouchers');
        }
    }, [searchParams]);

    useEffect(() => {
        // Fetch Rewards
        const qRewards = query(collection(db, 'rewards'), orderBy('createdAt', 'desc'));
        const unsubscribeRewards = onSnapshot(qRewards, (snapshot) => {
            const rewardsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Reward[];
            setRewards(rewardsData);
        });

        // Fetch User Redemptions
        let unsubscribeRedemptions = () => { };
        if (user) {
            const qRedemptions = query(
                collection(db, 'redemptions'),
                where('userId', '==', user.uid),
                orderBy('redeemedAt', 'desc')
            );
            unsubscribeRedemptions = onSnapshot(qRedemptions, (snapshot) => {
                const redemptionsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Redemption[];
                setRedemptions(redemptionsData);
            });
        }

        setLoading(false);

        return () => {
            unsubscribeRewards();
            unsubscribeRedemptions();
        };
    }, [user]);

    const filteredRewards = rewards.filter(reward =>
        reward.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reward.merchantName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRedemptions = redemptions.filter(redemption =>
        redemption.rewardTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        redemption.merchantName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const redeemedRewardIds = new Set(redemptions.map(r => r.rewardId));

    const handleRedeemClick = (reward: Reward) => {
        setSelectedReward(reward);
        setIsRedeemModalOpen(true);
    };

    const handleVoucherClick = (redemption: Redemption) => {
        setSelectedRedemption(redemption);
        setIsViewModalOpen(true);
    };

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md shadow-sm rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border border-white/20 dark:border-white/10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Vouchers</h1>
                        <p className="text-gray-800 dark:text-gray-200 font-medium mt-1">Redeem your points for exclusive rewards</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/50 dark:bg-white/10 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-white/10 flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Your Balance:</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">{profile?.points || 0} pts</span>
                        </div>
                        {isAdmin && (
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                Create Reward
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-200/50 dark:bg-white/5 p-1 rounded-xl mb-8 w-fit backdrop-blur-sm border border-white/10 dark:border-white/10">
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'browse'
                            ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-white/10'
                            }`}
                    >
                        Browse Rewards
                    </button>
                    <button
                        onClick={() => setActiveTab('my-vouchers')}
                        className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'my-vouchers'
                            ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-white/10'
                            }`}
                    >
                        My Vouchers
                    </button>
                </div>

                {/* Search */}
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm p-4 mb-8 border border-white/20 dark:border-white/10">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={activeTab === 'browse' ? "Search rewards..." : "Search my vouchers..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-white/20 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 outline-none transition backdrop-blur-md"
                        />
                        <svg
                            className="absolute left-4 top-3.5 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <>
                        {activeTab === 'browse' ? (
                            filteredRewards.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredRewards.map((reward) => (
                                        <RewardCard
                                            key={reward.id}
                                            reward={reward}
                                            canRedeem={true}
                                            isRedeemed={redeemedRewardIds.has(reward.id)}
                                            onRedeem={() => handleRedeemClick(reward)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No rewards found</h3>
                                    <p className="text-gray-500 mt-1">Try adjusting your search.</p>
                                </div>
                            )
                        ) : (
                            filteredRedemptions.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredRedemptions.map((redemption) => (
                                        <div
                                            key={redemption.id}
                                            onClick={() => handleVoucherClick(redemption)}
                                            className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 flex flex-col h-full cursor-pointer group"
                                        >
                                            <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800">
                                                <img
                                                    src={redemption.rewardImage}
                                                    alt={redemption.rewardTitle}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute top-3 right-3 bg-green-100/95 dark:bg-green-950/80 backdrop-blur-sm text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/30 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
                                                    Redeemed
                                                </div>
                                            </div>
                                            <div className="p-4 flex flex-col flex-grow">
                                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{redemption.rewardTitle}</h3>
                                                {redemption.merchantName && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{redemption.merchantName}</p>
                                                )}

                                                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/10">
                                                    {redemption.code ? (
                                                        <div className="bg-gray-50/60 dark:bg-white/5 p-3 rounded-lg text-center border border-gray-200/50 dark:border-white/10 group-hover:bg-indigo-50/80 dark:group-hover:bg-indigo-950/20 transition-colors">
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Promo Code</p>
                                                            <p className="font-mono font-bold text-lg text-indigo-600 dark:text-indigo-400 truncate">{redemption.code}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 italic py-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                            Click to view voucher
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No vouchers yet</h3>
                                    <p className="text-gray-500 mt-1">Redeem your points for rewards to see them here.</p>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>

            {/* Create Reward Modal */}
            <CreateRewardModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    // Refresh handled by snapshot
                }}
            />

            {/* Redeem Reward Modal */}
            <RedeemRewardModal
                isOpen={isRedeemModalOpen}
                onClose={() => {
                    setIsRedeemModalOpen(false);
                    setSelectedReward(null);
                }}
                reward={selectedReward}
                isRedeemed={selectedReward ? redeemedRewardIds.has(selectedReward.id) : false}
                onSuccess={() => {
                    setActiveTab('my-vouchers');
                }}
            />

            {/* View Voucher Modal */}
            <ViewVoucherModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedRedemption(null);
                }}
                redemption={selectedRedemption}
            />
        </div>
    );
}
