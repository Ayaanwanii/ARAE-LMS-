/**
 * News Page
 * Displays a list of news articles/blogs
 */

'use client';

import { useState } from 'react';
import { useNews } from '@/lib/hooks/useNews';
import { useAuth } from '@/lib/hooks/useAuth';
import NewsCard from '@/components/news/NewsCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function NewsPage() {
    const { profile } = useAuth();
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, isError } = useNews();

    const allNews = data?.pages.flatMap((page) => page.news) ?? [];

    const canCreateNews = profile?.isOrganisation || profile?.isSuperAdmin || profile?.isSubAdmin;

    return (
        <div className="min-h-screen bg-transparent text-gray-900 dark:text-white transition-colors pb-12">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 mb-8">
                <div className="surface-card rounded-[28px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/20 dark:border-white/10 shadow-xl">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                            News & Updates
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 font-medium max-w-2xl">
                            Stay updated with the latest events, stories, and announcements from our community.
                        </p>
                    </div>

                    {canCreateNews && (
                        <Link href="/news/create">
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Post
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isError ? (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 mb-8">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Error loading news</h3>
                                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                                    <p>{error?.message}</p>
                                    {error?.message?.includes('index') && (
                                        <p className="mt-2 font-semibold">
                                            This query requires a Firestore index. Please check the console for the creation link.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    </div>
                ) : allNews.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {allNews.map((article) => (
                                <NewsCard key={article.id} article={article} />
                            ))}
                        </div>

                        {hasNextPage && (
                            <div className="flex justify-center mt-12">
                                <Button
                                    onClick={() => fetchNextPage()}
                                    isLoading={isFetchingNextPage}
                                    variant="outline"
                                    className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"
                                >
                                    Load More Stories
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-white/10">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-slate-700">
                            <svg className="w-8 h-8 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No news yet</h3>
                        <p className="text-gray-500 dark:text-slate-400 font-medium">Check back later for updates and stories.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
