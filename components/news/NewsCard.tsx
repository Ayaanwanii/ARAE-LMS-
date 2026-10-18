import Link from 'next/link';
import { NewsArticle } from '@/lib/types/firestore';
import { format } from 'date-fns';
import { truncate, stripHtml } from '@/lib/utils/helpers';

interface NewsCardProps {
    article: NewsArticle;
}

export default function NewsCard({ article }: NewsCardProps) {
    // Handle Firestore Timestamp or Date object
    const date = article.createdAt && typeof (article.createdAt as any).toDate === 'function'
        ? (article.createdAt as any).toDate()
        : new Date(article.createdAt as any);

    const snippetText = truncate(stripHtml(article.summary || article.content), 140);

    return (
        <Link href={`/news/${article.id}`} className="group block h-full">
            <div className="surface-card lift-card rounded-[28px] overflow-hidden h-full flex flex-col">
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-slate-100 via-white to-indigo-100 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
                    {article.coverImage ? (
                        <img
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-200 dark:text-indigo-800">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                    {article.isPinned && (
                        <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-semibold px-2 py-1 rounded shadow-sm flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Pinned
                        </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-950/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm border border-white/40 dark:border-white/10">
                        {format(date, 'MMM d, yyyy')}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-md border border-indigo-100/50 dark:border-indigo-800/30">
                            News
                        </span>
                        {article.tags && article.tags.length > 0 && (
                            <span className="px-2 py-1 bg-gray-100/80 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-md border border-gray-200/50 dark:border-gray-700/30">
                                {article.tags[0]}
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {article.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-grow">
                        {snippetText}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/70 dark:border-white/10 mt-auto">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200/50 dark:border-indigo-800/30">
                                {article.authorName?.charAt(0) || 'A'}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {article.authorName || 'Admin'}
                            </span>
                        </div>
                        <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            Read More
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
