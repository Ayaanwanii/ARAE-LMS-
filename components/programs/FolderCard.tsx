/**
 * Folder Card component
 * Used in joined folders and folder listing
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { ProgramFolder } from '@/lib/types/firestore';
import { formatDate } from '@/lib/utils/date';

interface FolderCardProps {
    folder: ProgramFolder;
    href?: string;
}

export default function FolderCard({ folder, href }: FolderCardProps) {
    const totalItems = folder.programIds?.length || 0;
    const targetHref = href || `/shared/${folder.shareToken}`;

    return (
        <Link href={targetHref}>
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm p-6 hover:shadow-lg hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 border border-white/20 dark:border-white/10 group flex flex-col h-full">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/30 transition-colors shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {folder.name}
                        </h3>
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
                            {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
                        </p>
                    </div>
                </div>

                {folder.description && (
                    <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2 mb-4 flex-1">
                        {folder.description}
                    </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-white/10 dark:border-white/5 mt-auto">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight">
                        Created {formatDate(folder.createdAt)}
                    </span>
                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-sm group-hover:translate-x-1 transition-transform">
                        Explore
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
}
