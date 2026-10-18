/**
 * News Detail Page
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useNewsArticle, useDeleteNews } from '@/lib/hooks/useNews';
import { useAuth } from '@/lib/hooks/useAuth';
import Button from '@/components/ui/Button';
import { format } from 'date-fns';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';

export default function NewsDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { profile } = useAuth();
    const { data: article, isLoading } = useNewsArticle(params.id as string);
    const { mutate: deleteNews, isPending: isDeleting } = useDeleteNews();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="bg-white/60 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 rounded-3xl text-center max-w-md shadow-xl">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Article Not Found</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">The article you are looking for does not exist or has been removed.</p>
                    <Link href="/news">
                        <Button variant="outline">Back to News</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const canManage = profile?.isOrganisation || profile?.isSuperAdmin || profile?.isSubAdmin;

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this article?')) {
            deleteNews(article.id, {
                onSuccess: () => {
                    router.push('/news');
                },
            });
        }
    };

    const date = article.createdAt && typeof (article.createdAt as any).toDate === 'function'
        ? (article.createdAt as any).toDate()
        : new Date(article.createdAt as any);

    return (
        <div className="min-h-screen bg-transparent pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                {/* Navigation & Actions */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <Link href="/news">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-white/10 border border-white/20 dark:border-white/10 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/20 transition-all shadow-sm">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to News
                        </span>
                    </Link>

                    {canManage && (
                        <div className="flex items-center gap-2">
                            <Link href={`/news/${article.id}/edit`}>
                                <Button size="sm" variant="outline" className="bg-white/60 dark:bg-white/10 border-white/20 dark:border-white/10 backdrop-blur-md text-slate-800 dark:text-slate-200">
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                </Button>
                            </Link>
                            <Button
                                size="sm"
                                variant="outline"
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20 backdrop-blur-md"
                                onClick={handleDelete}
                                isLoading={isDeleting}
                            >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </Button>
                        </div>
                    )}
                </div>

                {/* Hero / Header Card */}
                <div className="surface-card rounded-[28px] overflow-hidden mb-8 border border-white/20 dark:border-white/10 shadow-xl">
                    {article.coverImage ? (
                        <div className="relative h-64 sm:h-80 md:h-96 w-full">
                            <img
                                src={article.coverImage}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 md:p-10">
                                {article.tags && article.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {article.tags.map((tag, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-indigo-600/90 text-white text-xs font-bold rounded-full backdrop-blur-sm shadow-sm border border-indigo-400/30">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-md">
                                    {article.title}
                                </h1>
                                <div className="flex items-center gap-4 text-white/90 text-sm mt-4 font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md border border-white/20">
                                            {article.authorName?.charAt(0).toUpperCase() || 'A'}
                                        </div>
                                        <span>{article.authorName || 'Admin'}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{format(date, 'MMMM d, yyyy')}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 sm:p-8 md:p-10 bg-gradient-to-br from-indigo-900/60 via-slate-900/80 to-purple-900/60 backdrop-blur-xl border-b border-white/10">
                            {article.tags && article.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {article.tags.map((tag, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-full border border-indigo-500/30 backdrop-blur-sm">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mb-6">
                                {article.title}
                            </h1>
                            <div className="flex items-center gap-4 text-slate-300 text-sm font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                                        {article.authorName?.charAt(0).toUpperCase() || 'A'}
                                    </div>
                                    <span>{article.authorName || 'Admin'}</span>
                                </div>
                                <span>•</span>
                                <span>{format(date, 'MMMM d, yyyy')}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Article Content Container */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[28px] shadow-2xl p-6 sm:p-8 md:p-12 overflow-hidden">
                    {/* Summary Callout if available */}
                    {article.summary && (
                        <div className="mb-8 p-4 sm:p-6 bg-indigo-500/10 border-l-4 border-indigo-500 rounded-r-2xl backdrop-blur-sm">
                            <p className="text-base sm:text-lg font-medium text-indigo-900 dark:text-indigo-200 italic leading-relaxed">
                                "{article.summary}"
                            </p>
                        </div>
                    )}

                    {/* Main Article Body */}
                    <div
                        className="program-description prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 break-words overflow-hidden"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(article.content, {
                                ADD_TAGS: ['iframe'],
                                ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'width', 'height', 'target']
                            })
                        }}
                    />

                    {/* Gallery (if extra images exist) */}
                    {article.images && article.images.length > 0 && (
                        <div className="mt-12 pt-8 border-t border-white/20 dark:border-white/10">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Gallery</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {article.images.map((img, idx) => (
                                    <div key={idx} className="rounded-2xl overflow-hidden h-64 bg-slate-800/40 border border-white/10 shadow-md">
                                        <img
                                            src={img}
                                            alt={`Gallery image ${idx + 1}`}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
