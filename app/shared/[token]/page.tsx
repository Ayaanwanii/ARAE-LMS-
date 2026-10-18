'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSharedFolder, useJoinFolder, useHasJoinedFolder } from '@/lib/hooks/useProgramFolders';
import { useFolderAnalytics } from '@/lib/hooks/useFolderAnalytics';
import { useBackgrounds } from '@/lib/hooks/useBackgrounds';
import { formatDate } from '@/lib/utils/date';
import { getEmbedUrl } from '@/lib/utils/helpers';
import Link from 'next/link';
import { toast } from '@/lib/stores/toastStore';
import Button from '@/components/ui/Button';

function stripHtml(html: string | undefined | null): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
}

export default function SharedFolderPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const { data, isLoading, error } = useSharedFolder(token);
    const joinFolder = useJoinFolder();
    const { data: hasJoined } = useHasJoinedFolder(data?.folder?.id || '');
    const { data: backgrounds } = useBackgrounds();
    const currentBackground = data?.folder?.background || backgrounds?.programs;

    const handleJoinFolder = async () => {
        if (!data?.folder?.id) return;
        try {
            await joinFolder.mutateAsync(data.folder.id);
            toast.success('Successfully joined the folder!');
        } catch (err: any) {
            console.error('Error joining folder:', err);
            toast.error(err.message || 'Failed to join folder');
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            const returnUrl = encodeURIComponent(window.location.pathname);
            router.push(`/login?returnUrl=${returnUrl}`);
        }
    }, [user, authLoading, router]);

    const combinedItems = useMemo(() => {
        if (!data) return [];
        const { folder, programs } = data;
        if (!programs) return [];
        const items = [
            ...(programs || []).map((p: any) => ({ ...p, _title: p.title, _thumbnail: p.image })),
        ];
        
        if (folder?.itemOrder && folder.itemOrder.length > 0) {
            items.sort((a, b) => {
                const indexA = folder.itemOrder!.indexOf(a.id);
                const indexB = folder.itemOrder!.indexOf(b.id);
                const posA = indexA === -1 ? Infinity : indexA;
                const posB = indexB === -1 ? Infinity : indexB;
                return posA - posB;
            });
        }
        return items;
    }, [data]);

    useEffect(() => {
        if (data && user && token) {
            fetch(`/api/programs/shared/${token}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, userEmail: user.email })
            }).catch(err => console.error('Failed to record view', err));
        }
    }, [data, user, token]);

    const { data: analytics } = useFolderAnalytics(user?.uid, data?.programs || []);

    if (authLoading || isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
    if (!user) return null;
    if (error || !data) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center p-8 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-md max-w-md mx-4 border border-white/20">
                <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Folder Not Found</h2>
                <p className="text-gray-600 mb-6">{error ? (error as Error).message : 'The folder link might be invalid or expired.'}</p>
                <Link href="/"><Button fullWidth>Go to Home</Button></Link>
            </div>
        </div>
    );

    const { folder, programs } = data;
    const totalItems = programs.length;
    const embedUrl = folder?.videoUrl ? getEmbedUrl(folder.videoUrl) : null;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0f172a] relative">
            {/* Background Image Layer */}
            {currentBackground && (
                <>
                    <div 
                        className="fixed inset-0 z-0 transition-opacity duration-1000"
                        style={
                            currentBackground.startsWith('#')
                            ? { backgroundColor: currentBackground }
                            : {
                                backgroundImage: `url(${currentBackground})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundAttachment: 'fixed'
                            }
                        }
                    />
                    <div className="fixed inset-0 z-0 bg-white/10 dark:bg-black/20 pointer-events-none" />
                </>
            )}

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header className="bg-white/40 dark:bg-white/5 backdrop-blur-md shadow-sm border-b border-white/20 dark:border-white/10 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <img src="/icon.png" alt="Logo" className="h-8 w-8" />
                            <span className="font-bold text-gray-900 dark:text-white">ARAE LMS</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">Logged in as {user.email}</span>
                            <Link href="/"><Button variant="outline" size="sm" className="bg-white/50 dark:bg-white/10 dark:text-white dark:border-white/20">Dashboard</Button></Link>
                        </div>
                    </div>
                </header>

                <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
                    <div className="w-full space-y-8">
                        {/* Folder Info */}
                    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden mb-8 border border-white/20 dark:border-white/10">
                        {embedUrl ? (
                            <div className="flex flex-col lg:flex-row min-h-[400px]">
                                {/* Video Section */}
                                <div className="lg:w-3/5 w-full bg-black flex items-center justify-center relative aspect-video lg:aspect-auto">
                                    <iframe
                                        src={embedUrl}
                                        className="absolute inset-0 w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                                {/* Info Section */}
                                <div className="lg:w-2/5 w-full p-8 flex flex-col justify-center text-left">
                                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">{folder.name}</h1>
                                    {folder.description && <p className="text-gray-800 dark:text-gray-200 mb-6 line-clamp-4">{folder.description}</p>}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <span>{totalItems} Items</span>
                                            <span>•</span>
                                            <span>Created {formatDate(folder.createdAt)}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {programs.length > 0 && <span className="text-xs bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-medium shadow-sm">{programs.length} Programs</span>}
                                        </div>

                                        <div className="pt-2">
                                            {hasJoined ? (
                                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-500/10 px-4 py-2 rounded-xl border border-green-100 dark:border-green-500/20 w-fit">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Joined
                                                </div>
                                            ) : (
                                                <Button 
                                                    onClick={handleJoinFolder}
                                                    isLoading={joinFolder.isPending}
                                                    className="shadow-lg shadow-indigo-500/20"
                                                >
                                                    Join Folder
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Default Layout */}
                                {folder.coverImage && (
                                    <div className="w-full h-48 sm:h-64 md:h-80 overflow-hidden">
                                        <img src={folder.coverImage} alt={folder.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="p-8 text-center">
                                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">{folder.name}</h1>
                                    {folder.description && <p className="text-lg text-gray-800 dark:text-gray-200 max-w-2xl mx-auto">{folder.description}</p>}
                                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span>{totalItems} Items</span>
                                        <span>•</span>
                                        <span>Created {formatDate(folder.createdAt)}</span>
                                    </div>
                                    {/* Item type pills */}
                                    <div className="mt-3 flex items-center justify-center gap-2">
                                        {programs.length > 0 && <span className="text-xs bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-bold shadow-sm">{programs.length} Programs</span>}
                                    </div>

                                    <div className="mt-8">
                                        {hasJoined ? (
                                            <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-500/10 px-6 py-3 rounded-2xl border border-green-100 dark:border-green-500/20">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Joined
                                            </div>
                                        ) : (
                                            <Button 
                                                onClick={handleJoinFolder}
                                                isLoading={joinFolder.isPending}
                                                size="lg"
                                                className="shadow-xl shadow-indigo-500/20 px-12"
                                            >
                                                Join Folder
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                {/* User Individual Analytics */}
                {analytics && (
                    <div className="mb-8 flex flex-col gap-4">
                        {/* Programs Completed Stepper (Full Width) */}
                        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-white/20 dark:border-white/10 p-8 relative overflow-hidden group hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 w-full flex flex-col items-center">
                                <div className="flex items-center justify-between w-full mb-8">
                                    <div className="flex flex-col">
                                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">{analytics.programsCompletedPercent}%</h3>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Programs Completed</p>
                                    </div>
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                </div>
                                
                                {/* Stepper UI */}
                                <div className="w-full flex items-center justify-between relative px-2 mb-2">
                                    {analytics.programsStatus.length > 0 ? (
                                        <>
                                            {/* Background track line */}
                                            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-2.5 bg-gray-100 dark:bg-white/10 rounded-full z-0 shadow-inner" />
                                            
                                            {/* Foreground progress line */}
                                            <div 
                                                className="absolute left-6 top-1/2 -translate-y-1/2 h-2.5 bg-indigo-500 rounded-full z-0 transition-all duration-1000 ease-out shadow-sm"
                                                style={{ 
                                                    width: `calc((100% - 3rem) * ${Math.max(0, analytics.programsCompletedPercent) / 100})` 
                                                }}
                                            />

                                            {/* Start Node */}
                                            <div className="relative z-10 flex flex-col items-center w-12 group cursor-default">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm ring-4 ring-white dark:ring-[#0f172a]">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                                <div className="absolute top-10 text-center">
                                                    <span className="text-[10px] font-bold text-indigo-500 uppercase">Start</span>
                                                </div>
                                            </div>

                                            {/* End Node */}
                                            <div className="relative z-10 flex flex-col items-center w-12 group cursor-default">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ring-4 ring-white dark:ring-[#0f172a] transition-all duration-700 ${analytics.programsCompletedPercent === 100 ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-white/10'}`}>
                                                    {analytics.programsCompletedPercent === 100 ? (
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    ) : (
                                                        <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
                                                    )}
                                                </div>
                                                <div className="absolute top-10 text-center">
                                                    <span className={`text-[10px] font-bold uppercase transition-colors duration-700 ${analytics.programsCompletedPercent === 100 ? 'text-indigo-500' : 'text-gray-400'}`}>Finish</span>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full text-center text-xs text-gray-400 font-medium py-4">No programs available</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Login Streak */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-white/20 dark:border-white/10 p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                                    </div>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{analytics.streak} <span className="text-xl text-gray-400">Days</span></h3>
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Login Streak</p>
                                </div>
                        </div>
                        </div>
                    </div>
                )}
                    </div>

                {/* View Toggle Bar */}
                <div className="mt-12 mb-8 flex justify-end">
                    <div className="inline-flex items-center bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-xl p-1.5 gap-1.5 border border-white/20 dark:border-white/10 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105' : 'text-gray-800 dark:text-white hover:bg-white/20'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                            Grid View
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105' : 'text-gray-800 dark:text-white hover:bg-white/20'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            List View
                        </button>
                    </div>
                </div>

                {/* ── Programs Section ── */}
                {combinedItems.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-5">
                            <span className="text-xl">📚</span>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Programs</h2>
                            <span className="text-sm text-gray-400 dark:text-gray-500">({combinedItems.length})</span>
                        </div>
                        {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {combinedItems.map((item: any) => {
                                const href = `/programs/${item.id}`;
                                return (
                                    <Link key={item.id} href={href}>
                                        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-xl shadow-md overflow-hidden hover:shadow-xl hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 group h-full flex flex-col border border-white/20 dark:border-white/10 hover:border-indigo-200/50">
                                            <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                {item._thumbnail ? (
                                                    <img src={item._thumbnail} alt={item._title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    {item.mode && (
                                                        <span className={`px-2 py-1 rounded-md text-[10px] font-semibold backdrop-blur-md ${item.mode === 'online' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30' : 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-800/30'}`}>
                                                            {item.mode === 'online' ? 'Online' : 'Offline'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="flex gap-2 mb-2 items-center flex-wrap">
                                                    <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-400/20">
                                                        Program
                                                    </span>
                                                    {item.category?.slice(0, 1).map((cat: string, i: number) => (
                                                        <span key={i} className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10 px-2 py-1 rounded-full">{cat}</span>
                                                    ))}
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item._title}</h3>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4 flex-1">{stripHtml(item.description)}</p>
                                                <div className="mt-auto pt-4 border-t border-gray-200/60 dark:border-white/10 flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">View Details</span>
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/10 flex items-center justify-center transition group-hover:bg-indigo-600 group-hover:text-white">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                        ) : (
                        <div className="space-y-3">
                            {combinedItems.map((item: any) => {
                                const href = `/programs/${item.id}`;
                                return (
                                    <Link key={item.id} href={href}>
                                        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-xl shadow-sm overflow-hidden hover:shadow-md hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 group flex items-center border border-white/20 dark:border-white/10 hover:border-indigo-200/50">
                                            <div className="w-24 h-24 sm:w-32 sm:h-24 flex-shrink-0 relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                {item._thumbnail ? (
                                                    <img src={item._thumbnail} alt={item._title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 px-4 py-3 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="text-base font-bold text-gray-900 dark:text-white truncate transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item._title}</h3>
                                                    {item.mode && (
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex-shrink-0 ${item.mode === 'online' ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'bg-green-50/80 dark:bg-green-900/30 text-green-700 dark:text-green-300'}`}>
                                                            {item.mode === 'online' ? 'Online' : 'Offline'}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex-shrink-0 text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/10">
                                                        Program
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-1">{stripHtml(item.description)}</p>
                                                <div className="flex gap-1.5 mt-1.5">
                                                    {item.category?.slice(0, 2).map((cat: string, i: number) => (
                                                        <span key={i} className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{cat}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="pr-4 flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/10 flex items-center justify-center transition group-hover:bg-indigo-600 group-hover:text-white">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                        )}
                    </div>
                )}
            </main>
            </div>
        </div>
    );
}
