import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    subValue?: string;
    icon?: React.ReactNode;
    color?: string; // 'purple' | 'yellow' | 'blue' | 'green' | 'indigo'
}

const COLOR_MAP: Record<string, { sub: string; iconBg: string }> = {
    purple: {
        sub: 'text-purple-600 dark:text-purple-300 font-bold',
        iconBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50',
    },
    yellow: {
        sub: 'text-amber-600 dark:text-amber-300 font-bold',
        iconBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50',
    },
    blue: {
        sub: 'text-blue-600 dark:text-blue-300 font-bold',
        iconBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50',
    },
    green: {
        sub: 'text-emerald-600 dark:text-emerald-300 font-bold',
        iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50',
    },
    indigo: {
        sub: 'text-indigo-600 dark:text-indigo-300 font-bold',
        iconBg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50',
    },
};

export default function StatCard({ title, value, subValue, icon, color = 'indigo' }: StatCardProps) {
    const colorStyle = COLOR_MAP[color] || COLOR_MAP.indigo;

    return (
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-white/10 flex items-start justify-between hover:shadow-xl transition-all duration-300">
            <div>
                <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    {value}
                </div>
                {subValue && (
                    <div className={`text-xs mt-1.5 ${colorStyle.sub}`}>
                        {subValue}
                    </div>
                )}
            </div>
            {icon && (
                <div className={`p-3 rounded-xl ${colorStyle.iconBg}`}>
                    {icon}
                </div>
            )}
        </div>
    );
}

