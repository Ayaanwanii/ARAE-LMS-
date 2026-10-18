import { Reward } from '@/lib/types/firestore';
import { format } from 'date-fns';

interface RewardCardProps {
    reward: Reward;
    onRedeem?: (reward: Reward) => void;
    canRedeem?: boolean;
    isRedeemed?: boolean;
}

export default function RewardCard({ reward, onRedeem, canRedeem = false, isRedeemed = false }: RewardCardProps) {
    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    return (
        <div
            onClick={() => onRedeem?.(reward)}
            className="surface-card lift-card rounded-[28px] overflow-hidden flex flex-col h-full cursor-pointer group"
        >
            {/* Image Section */}
            <div className="relative h-48 w-full bg-gradient-to-br from-amber-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
                <img
                    src={reward.image}
                    alt={reward.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {reward.discountValue && (
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-white/40 dark:border-white/10">
                        <span className="text-indigo-600 dark:text-indigo-300 font-bold text-sm">
                            {reward.discountValue}
                        </span>
                    </div>
                )}
                {reward.isNew && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold uppercase">
                        New
                    </div>
                )}
                {isRedeemed && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="bg-white/90 dark:bg-black/90 text-gray-900 dark:text-white px-4 py-2 rounded-full font-bold shadow-lg transform -rotate-12 border-2 border-gray-900 dark:border-white">
                            REDEEMED
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1" title={reward.title}>
                            {reward.title}
                        </h3>
                        {reward.merchantName && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{reward.merchantName}</p>
                        )}
                    </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 flex-grow" title={stripHtml(reward.description)}>
                    {stripHtml(reward.description)}
                </p>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-200/70 dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-950/50 flex items-center justify-center">
                            <span className="text-yellow-600 dark:text-yellow-400 text-xs">★</span>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{reward.pointsCost}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">points</span>
                    </div>

                    {reward.viewCount !== undefined && (
                        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{reward.viewCount}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
