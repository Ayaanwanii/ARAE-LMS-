/**
 * Program Details Page
 * View program information, episodes, and join/leave
 */

'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useProgram, useJoinProgram, useLeaveProgram, useHasJoinedProgram, useProgramProgress, useToggleEpisodeCompletion, useClaimProgramPoints, useSubmitQuizResult, useUserFeedback, useSubmitFeedback, useUpdateProgram } from '@/lib/hooks/usePrograms';
import { useAuth } from '@/lib/hooks/useAuth';
import Button from '@/components/ui/Button';
import { formatDateWithTime } from '@/lib/utils/date';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from '@/lib/stores/toastStore';
import Modal from '@/components/ui/Modal';
import VideoPlayer from '@/components/ui/VideoPlayer';
import QuizPlayer from '@/components/programs/QuizPlayer';
import MassCertificateGenerator from '@/components/programs/MassCertificateGenerator';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { useBackgroundStore } from '@/lib/stores/backgroundStore';


export default function ProgramDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { profile } = useAuth();
    const { data: program, isLoading } = useProgram(id);
    const { data: hasJoined } = useHasJoinedProgram(id);
    const joinProgram = useJoinProgram();
    const leaveProgram = useLeaveProgram();
    const [resourceType, setResourceType] = useState<'url' | 'pdf' | 'photo' | 'video'>('url');
    const [activeTab, setActiveTab] = useState<'about' | 'resources' | 'episodes' | 'mass-certificates'>('about');
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);

    const { data: progress } = useProgramProgress(id);
    const toggleCompletion = useToggleEpisodeCompletion();
    const claimPoints = useClaimProgramPoints();
    const submitQuiz = useSubmitQuizResult();

    const [activeQuiz, setActiveQuiz] = useState<any | null>(null);

    const completedEpisodes = progress?.completedEpisodes || [];
    const totalEpisodes = program?.episode?.length || 0;
    const progressPercentage = totalEpisodes > 0 ? Math.round((completedEpisodes.length / totalEpisodes) * 100) : 0;
    const isProgramCompleted = totalEpisodes > 0 && completedEpisodes.length === totalEpisodes;
    const pointsClaimed = progress?.pointsClaimed || false;

    const { data: userFeedback } = useUserFeedback(id, profile?.uid);
    const submitFeedback = useSubmitFeedback();
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

    const { setOverrideBackground } = useBackgroundStore();
    const updateProgram = useUpdateProgram();

    // Apply program background override
    useEffect(() => {
        if (program?.background) {
            setOverrideBackground(program.background);
        } else {
            setOverrideBackground(null);
        }
        return () => {
            setOverrideBackground(null);
        };
    }, [program?.background, setOverrideBackground]);

    // Touch: record that the user viewed this program (for "Recents" sort)
    useEffect(() => {
        const userId = auth.currentUser?.uid;
        if (!userId || !id) return;

        const progressRef = doc(db, 'user_program_progress', `${userId}_${id}`);
        setDoc(progressRef, {
            userId,
            programId: id,
            lastAccessed: serverTimestamp(),
        }, { merge: true }).catch(() => { /* silent */ });
    }, [id]);

    const handleToggleEpisode = async (episodeId: string) => {
        const isCompleted = completedEpisodes.includes(episodeId);
        try {
            await toggleCompletion.mutateAsync({
                programId: id,
                episodeId,
                isCompleted: !isCompleted
            });
        } catch (error) {
            console.error('Error toggling episode completion:', error);
            toast.error('Failed to update progress');
        }
    };

    const handleClaimPoints = async () => {
        if (!program?.rewardPoints) return;
        try {
            await claimPoints.mutateAsync({
                programId: id,
                points: program.rewardPoints
            });
            toast.success(`Congratulations! You earned ${program.rewardPoints} points!`);
        } catch (error: any) {
            console.error('Error claiming points:', error);
            toast.error(error.message || 'Failed to claim points');
        }
    };

    const handleJoin = async () => {
        try {
            await joinProgram.mutateAsync(id);
            toast.success('Successfully joined the program!');
        } catch (error) {
            console.error('Error joining program:', error);
            toast.error('Failed to join program');
        }
    };

    const handleLeave = async () => {
        try {
            await leaveProgram.mutateAsync(id);
            toast.success('Successfully left the program');
            setIsLeaveModalOpen(false);
        } catch (error) {
            console.error('Error leaving program:', error);
            toast.error('Failed to leave program');
        }
    };

    const handleDownloadCertificate = async () => {
        if (!program?.certificate?.templateUrl) {
            toast.error('Certificate template image is not configured for this program.');
            return;
        }

        toast.info('Generating certificate...');

        try {
            const { generateCertificatePDF, downloadBlob } = await import('@/lib/utils/certificateGenerator');

            // Prepare data
            const certData = {
                studentName: profile?.displayName || profile?.email?.split('@')[0] || 'Student Name',
                schoolName: profile?.schoolName || '',
                date: new Date().toLocaleDateString()
            };

            const blob = await generateCertificatePDF(program.certificate as any, certData);

            const filename = `${(program.title || 'program').replace(/[^a-z0-9]/gi, '_').toLowerCase()}_certificate.pdf`;
            downloadBlob(blob, filename);
            toast.success('Certificate downloaded successfully!');
        } catch (error: any) {
            console.error('Certificate generation error:', error);
            toast.error(error?.message || 'Failed to generate certificate. Please try again.');
        }
    };



    const handleSubmitFeedback = async () => {
        if (feedbackRating === 0) {
            toast.error('Please select a rating');
            return;
        }
        if (!profile) return;

        setIsSubmittingFeedback(true);
        try {
            await submitFeedback.mutateAsync({
                programId: id,
                userId: profile.uid,
                rating: feedbackRating,
                comment: feedbackComment,
                userName: profile.displayName || 'Anonymous',
                userEmail: profile.email || ''
            });
            toast.success('Thank you for your feedback!');
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error('Failed to submit feedback');
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    // Auto-join logic
    const searchParams = useSearchParams();
    const action = searchParams.get('action');

    useEffect(() => {
        if (action === 'join' && !hasJoined && !isLoading && program) {
            handleJoin();
        }
    }, [action, hasJoined, isLoading, program]);

    if (isLoading || !program) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            {/* Header */}
            <div className="relative h-64 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
                {program.image ? (
                    <>
                        <Image
                            src={program.image}
                            alt={program.title}
                            fill
                            className="object-cover"
                            priority
                            unoptimized
                        />
                        {/* Gradient Overlay for Text Visibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                        <svg
                            className="w-32 h-32 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                        </svg>
                    </div>
                )}
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white drop-shadow-lg tracking-tight">{program.title}</h1>
                        <div className="flex gap-2 mt-4">
                            {program.category?.map((cat: string, index: number) => (
                                <span key={index} className="px-3 py-1 bg-white/90 backdrop-blur-sm border border-white/20 text-indigo-900 rounded-full text-sm font-bold shadow-sm">
                                    {cat}
                                </span>
                            ))}
                            {program.mode && (
                                <span className={`px-3 py-1 border rounded-full text-sm font-bold shadow-sm backdrop-blur-sm ${program.mode === 'online'
                                    ? 'bg-blue-50/90 border-blue-200 text-blue-800'
                                    : 'bg-orange-50/90 border-orange-200 text-orange-800'
                                    }`}>
                                    {program.mode.charAt(0).toUpperCase() + program.mode.slice(1)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Join Alert */}
                        {!hasJoined && (
                            <div className="bg-blue-50 dark:bg-blue-500/10 border-l-4 border-blue-500 dark:border-blue-500/30 p-4 mb-6 rounded-r-lg">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-blue-400 dark:text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Join this program to access exclusive <strong>Episodes</strong> and track your progress!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-xl shadow-md mb-6 overflow-hidden">
                            <div className="flex border-b border-white/20 dark:border-white/10">
                                <button
                                    onClick={() => setActiveTab('about')}
                                    className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'about'
                                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white/40 dark:bg-white/10'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/5'
                                        }`}
                                >
                                    About
                                </button>
                                <button
                                    onClick={() => setActiveTab('resources')}
                                    className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'resources'
                                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white/40 dark:bg-white/10'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/5'
                                        }`}
                                >
                                    Resources
                                </button>
                                {hasJoined && (
                                    <button
                                        onClick={() => setActiveTab('episodes')}
                                        className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'episodes'
                                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white/40 dark:bg-white/10'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        Episodes
                                    </button>
                                )}
                                {hasJoined && program.certificate?.massDownloadEnabled && (
                                    <button
                                        onClick={() => setActiveTab('mass-certificates')}
                                        className={`flex-1 py-4 text-sm font-medium text-center transition ${activeTab === 'mass-certificates'
                                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-white/40 dark:bg-white/10'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        Mass Certificates
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {activeTab === 'about' && (
                                    <div className="animate-fade-in">
                                        {program.video?.url && (
                                            <div className="mb-6 max-w-2xl mx-auto">
                                                <VideoPlayer url={program.video.url} title={program.title} />
                                            </div>
                                        )}
                                        <div
                                            className="program-description prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 font-medium leading-relaxed break-words overflow-hidden [overflow-wrap:anywhere]"
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(program.description || '', {
                                                    ADD_TAGS: ['iframe'],
                                                    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'width', 'height', 'target']
                                                })
                                            }}
                                        />
                                    </div>
                                )}



                                {activeTab === 'resources' && (
                                    <div className="animate-fade-in">

                                        {/* Resource Type Tabs */}
                                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                            {['url', 'pdf', 'photo', 'video'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setResourceType(type as any)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${resourceType === type
                                                        ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                                        : 'bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-white/10'
                                                        }`}
                                                >
                                                    {type.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="space-y-4">
                                            {program.resources?.filter((r: any) => r.type === resourceType).map((resource: any) => {
                                                const isYoutubeUrl = (url: string) => {
                                                    if (!url) return false;
                                                    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?)|(live\/))\??v?=?([^#&?]*).*/;
                                                    const match = url.match(regExp);
                                                    if (match && match[8].length === 11) return true;

                                                    const shortsRegExp = /youtube\.com\/shorts\/([^#&?]*)/;
                                                    const shortsMatch = url.match(shortsRegExp);
                                                    return !!(shortsMatch && shortsMatch[1]);
                                                };

                                                const isVideoLink = resourceType === 'url' && isYoutubeUrl(resource.url);

                                                if (resource.type === 'video' || isVideoLink) {
                                                    return (
                                                        <div key={resource.id} className="border border-white/20 dark:border-white/10 rounded-lg p-4 hover:shadow-sm transition bg-white/40 dark:bg-white/5 backdrop-blur-sm">
                                                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">{resource.title}</h3>
                                                            <VideoPlayer url={resource.url} title={resource.title} />
                                                        </div>
                                                    );
                                                }

                                                if (resource.type === 'photo') {
                                                    return (
                                                        <div key={resource.id} className="border border-white/20 dark:border-white/10 rounded-lg p-4 hover:shadow-sm transition bg-white/40 dark:bg-white/5 backdrop-blur-sm">
                                                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">{resource.title}</h3>
                                                            <div className="relative w-full pt-[56.25%] bg-gray-100/50 dark:bg-black/20 rounded-lg overflow-hidden shadow-sm">
                                                                {resource.url ? (
                                                                    <Image
                                                                        src={resource.url}
                                                                        alt={resource.title || 'Resource Image'}
                                                                        fill
                                                                        className="object-contain"
                                                                    />
                                                                ) : (
                                                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                                                                        No Image Available
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <a
                                                        key={resource.id}
                                                        href={resource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block border border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg p-4 hover:border-indigo-300 hover:shadow-sm transition"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${resourceType === 'url' ? 'bg-blue-50 text-blue-600' :
                                                                resourceType === 'pdf' ? 'bg-red-50 text-red-600' :
                                                                    resourceType === 'photo' ? 'bg-green-50 text-green-600' :
                                                                        'bg-purple-50 text-purple-600'
                                                                }`}>
                                                                {resourceType === 'url' && (
                                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                                    </svg>
                                                                )}
                                                                {resourceType === 'pdf' && (
                                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                                    </svg>
                                                                )}
                                                                {resourceType === 'photo' && (
                                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-gray-900 dark:text-white">{resource.title}</h3>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">{resource.url}</p>
                                                            </div>
                                                            <div className="ml-auto">
                                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </a>
                                                );
                                            })}
                                            {(!program.resources || program.resources.filter((r: any) => r.type === resourceType).length === 0) && (
                                                <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white/20 dark:bg-white/5 rounded-lg border border-dashed border-white/20 dark:border-white/10 backdrop-blur-sm animate-fade-in">
                                                    No {resourceType} resources available
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'episodes' && hasJoined && (
                                    <div className="animate-fade-in space-y-6">
                                        {/* Progress Bar */}
                                        <div className="bg-white/40 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-sm p-4 rounded-xl shadow-sm mb-6">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Progress</span>
                                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{progressPercentage}% Completed</span>
                                            </div>
                                            <div className="w-full bg-gray-200/50 dark:bg-white/10 rounded-full h-2.5">
                                                <div
                                                    className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                                                    style={{ width: `${progressPercentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                                                {completedEpisodes.length} of {totalEpisodes} tasks completed
                                            </p>

                                            {isProgramCompleted && program.rewardPoints && (
                                                <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10">
                                                    {pointsClaimed ? (
                                                        <div className="bg-green-500/10 dark:bg-green-500/5 text-green-700 dark:text-green-400 border border-green-500/20 px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            {program.rewardPoints} Points Claimed
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            fullWidth
                                                            onClick={handleClaimPoints}
                                                            isLoading={claimPoints.isPending}
                                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transform hover:scale-[1.02] transition-all"
                                                        >
                                                            <span className="flex items-center justify-center gap-2">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                                                </svg>
                                                                Claim {program.rewardPoints} Reward Points
                                                            </span>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {isProgramCompleted && program.certificate && (
                                                <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10">
                                                    <Button
                                                        fullWidth
                                                        variant="outline"
                                                        onClick={handleDownloadCertificate}
                                                        className="border-indigo-500/20 dark:border-indigo-400/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
                                                    >
                                                        <span className="flex items-center justify-center gap-2">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            Download Certificate
                                                        </span>
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Feedback Section */}
                                            {isProgramCompleted && (
                                                <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10">
                                                    {userFeedback ? (
                                                        <div className="bg-indigo-500/10 dark:bg-indigo-950/20 border border-indigo-500/20 p-4 rounded-xl backdrop-blur-sm">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Your Review</span>
                                                                <div className="flex gap-0.5">
                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                        <svg
                                                                            key={star}
                                                                            className={`w-4 h-4 ${star <= (userFeedback as any).rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{(userFeedback as any).comment}"</p>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm p-6 rounded-2xl border border-indigo-500/20 shadow-sm">
                                                            <div className="text-center mb-4">
                                                                <div className="text-2xl mb-1">🎉</div>
                                                                <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200">Congratulations!</h3>
                                                                <p className="text-sm text-indigo-600 dark:text-indigo-300">You've completed the program. We'd love to hear your thoughts!</p>
                                                            </div>

                                                            <div className="flex justify-center gap-2 mb-4">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        onClick={() => setFeedbackRating(star)}
                                                                        className="focus:outline-none transform hover:scale-110 transition-transform"
                                                                    >
                                                                        <svg
                                                                            className={`w-8 h-8 ${star <= feedbackRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <textarea
                                                                value={feedbackComment}
                                                                onChange={(e) => setFeedbackComment(e.target.value)}
                                                                placeholder="Tell us what you liked or how we can improve..."
                                                                className="w-full bg-white/60 dark:bg-white/5 border border-indigo-100/50 dark:border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white focus:border-transparent outline-none transition-all h-24 mb-4"
                                                            />

                                                            <Button
                                                                fullWidth
                                                                onClick={handleSubmitFeedback}
                                                                isLoading={isSubmittingFeedback}
                                                                disabled={feedbackRating === 0}
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                                                            >
                                                                Submit Review
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {program.episode && program.episode.length > 0 ? (
                                            program.episode.sort((a: any, b: any) => a.order - b.order).map((episode: any, index: number) => {
                                                const isLocked = index > 0 && !completedEpisodes.includes(String(index - 1));

                                                return (
                                                    <div key={index} className={`border rounded-xl p-4 transition backdrop-blur-sm ${completedEpisodes.includes(String(index)) ? 'border-green-500/20 bg-green-500/10 dark:bg-green-500/5' : 'border-white/20 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-md'
                                                        } ${isLocked ? 'opacity-60 bg-gray-500/10 dark:bg-black/10' : ''}`}>
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex flex-col md:flex-row gap-4">
                                                                {/* Content */}
                                                                <div className="flex-1">
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                                                    Task {episode.order}: {episode.title}
                                                                                    {isLocked && (
                                                                                        <span className="bg-gray-200/50 dark:bg-white/10 text-gray-600 dark:text-gray-300 p-1 rounded-full" title="Complete previous task to unlock">
                                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                                            </svg>
                                                                                        </span>
                                                                                    )}
                                                                                </h3>
                                                                                {episode.type === 'quiz' && (
                                                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                                                                                        Quiz
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div
                                                                                className="program-description text-sm line-clamp-2 mb-3 prose prose-sm max-w-none"
                                                                                dangerouslySetInnerHTML={{
                                                                                    __html: DOMPurify.sanitize(episode.description || '', {
                                                                                        ADD_TAGS: ['iframe'],
                                                                                        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'width', 'height', 'target']
                                                                                    })
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-4 ml-4">
                                                                            {episode.duration && (
                                                                                <span className="text-xs font-medium bg-gray-100/50 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                                                                                    {episode.duration} min
                                                                                </span>
                                                                            )}
                                                                            {episode.type !== 'quiz' && !isLocked && (
                                                                                <button
                                                                                    onClick={() => handleToggleEpisode(String(index))}
                                                                                    className={`p-1.5 rounded-full transition-colors ${completedEpisodes.includes(String(index))
                                                                                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30'
                                                                                        : 'bg-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/30'
                                                                                        }`}
                                                                                    title={completedEpisodes.includes(String(index)) ? "Mark as incomplete" : "Mark as complete"}
                                                                                >
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                                    </svg>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {!isLocked ? (
                                                                        <>
                                                                            {episode.type === 'quiz' ? (
                                                                                <div className="mt-4">
                                                                                    {completedEpisodes.includes(String(index)) ? (
                                                                                        <div className="flex items-center gap-4">
                                                                                            <div className="text-green-600 font-medium flex items-center gap-2">
                                                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                                </svg>
                                                                                                Quiz Completed
                                                                                            </div>
                                                                                            {progress?.quizScores?.[String(index)] && (
                                                                                                <>
                                                                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                                                        Score: {Math.round((progress.quizScores[String(index)].score / progress.quizScores[String(index)].total) * 100)}%
                                                                                                        {progress.quizScores[String(index)].totalPoints !== undefined && (
                                                                                                            <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                                                                                                                ({progress.quizScores[String(index)].totalPoints} pts)
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    <Button
                                                                                                        size="sm"
                                                                                                        variant="outline"
                                                                                                        onClick={() => setActiveQuiz({
                                                                                                            ...episode,
                                                                                                            id: String(index),
                                                                                                            reviewMode: true,
                                                                                                            userAnswers: progress.quizScores[String(index)].answers
                                                                                                        })}
                                                                                                    >
                                                                                                        Review Quiz
                                                                                                    </Button>
                                                                                                    <Button
                                                                                                        size="sm"
                                                                                                        onClick={() => setActiveQuiz({ ...episode, id: String(index) })}
                                                                                                    >
                                                                                                        Retry Quiz
                                                                                                    </Button>
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            onClick={() => setActiveQuiz({ ...episode, id: String(index) })}
                                                                                        >
                                                                                            Start Quiz
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    {episode.videoUrl && (
                                                                                        <div className="mt-4 mb-4">
                                                                                            <VideoPlayer url={episode.videoUrl} title={episode.title} />
                                                                                        </div>
                                                                                    )}

                                                                                    <div className="flex gap-2 mt-auto">
                                                                                        {episode.pdfUrl && (
                                                                                            <a href={episode.pdfUrl} target="_blank" rel="noopener noreferrer">
                                                                                                <Button size="sm" variant="outline">
                                                                                                    View PDF
                                                                                                </Button>
                                                                                            </a>
                                                                                        )}
                                                                                        {episode.gameUrl && (
                                                                                            <a href={episode.gameUrl} target="_blank" rel="noopener noreferrer">
                                                                                                <Button size="sm" variant="outline">
                                                                                                    <span className="flex items-center gap-1.5">
                                                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                                                                                        </svg>
                                                                                                        Play Game
                                                                                                    </span>
                                                                                                </Button>
                                                                                            </a>
                                                                                        )}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <div className="mt-4 p-3 bg-gray-100/50 dark:bg-black/20 rounded-lg text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                            </svg>
                                                                            Complete the previous task to unlock this episode.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white/20 dark:bg-white/5 rounded-lg border border-dashed border-white/20 dark:border-white/10 backdrop-blur-sm">
                                                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                                </svg>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No episodes yet</h3>
                                                <p className="mt-1">Episodes will appear here once they are added to the program.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'mass-certificates' && hasJoined && program.certificate?.massDownloadEnabled && (
                                    <div className="animate-fade-in">
                                        <MassCertificateGenerator
                                            programId={id}
                                            programTitle={program.title}
                                            certificateConfig={program.certificate}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-2xl shadow-md p-6 sticky top-4">


                            {/* Edit Button for Organizations and Sub-Admins */}
                            {(profile?.isOrganisation || profile?.isSuperAdmin || (profile?.isSubAdmin && program.createdBy.id === profile.uid)) && (
                                <>
                                    <Link href={`/programs/${id}/edit`}>
                                        <Button
                                            variant="outline"
                                            fullWidth
                                            size="lg"
                                            className="mb-4"
                                        >
                                            Edit Program
                                        </Button>
                                    </Link>
                                    <Link href={`/programs/${id}/participants`}>
                                        <Button
                                            variant="outline"
                                            fullWidth
                                            size="lg"
                                            className="mb-4"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Manage Participants
                                        </Button>
                                    </Link>
                                </>
                            )}

                            {/* Join/Leave Button */}
                            {hasJoined ? (
                                <Button
                                    variant="outline"
                                    fullWidth
                                    size="lg"
                                    onClick={() => setIsLeaveModalOpen(true)}
                                    isLoading={leaveProgram.isPending}
                                    className="mb-4"
                                >
                                    Leave Program
                                </Button>
                            ) : program.isLocked && program.access === 'public' && !(profile?.isOrganisation || profile?.isSuperAdmin || (profile?.isSubAdmin && program.createdBy.id === profile.uid)) ? (
                                <button
                                    onClick={() => setIsLockedModalOpen(true)}
                                    className="w-full mb-4 py-3 px-6 rounded-lg font-semibold text-amber-700 bg-amber-50 border-2 border-amber-300 hover:bg-amber-100 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Locked
                                </button>
                            ) : (
                                <Button
                                    fullWidth
                                    size="lg"
                                    onClick={handleJoin}
                                    isLoading={joinProgram.isPending}
                                    className="mb-4"
                                >
                                    Join Program
                                </Button>
                            )}

                            {/* Join Discussion Link */}
                            {hasJoined && (
                                <Link href={`/programs/${id}/chat`}>
                                    <Button variant="outline" fullWidth size="lg">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        Join Discussion
                                    </Button>
                                </Link>
                            )}

                            {/* View Stats Button (Admin Only) */}
                            {(profile?.isOrganisation || profile?.isSuperAdmin || (profile?.isSubAdmin && program.createdBy.id === profile.uid)) && (
                                <Link href={`/programs/${id}/stats`}>
                                    <Button variant="outline" fullWidth size="lg" className="mt-4">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        View Stats
                                    </Button>
                                </Link>
                            )}

                            {/* Stats */}
                            <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Participants</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {program.userJoinedNumber || program.userJoined?.length || 0}
                                    </span>
                                </div>
                                {program.duration && (
                                    <div className="flex justify-between items-center py-3 border-b border-white/10 dark:border-white/5 last:border-0">
                                        <span className="text-gray-600 dark:text-gray-300">Duration</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{program.duration} min</span>
                                    </div>
                                )}
                                {program.rewardPoints && (
                                    <div className="flex justify-between items-center py-3 border-b border-white/10 dark:border-white/5 last:border-0">
                                        <span className="text-gray-600 dark:text-gray-300">Reward Points</span>
                                        <span className="font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {program.rewardPoints}
                                        </span>
                                    </div>
                                )}
                                {program.startDate && (
                                    <div className="flex justify-between items-center py-3 border-b border-white/10 dark:border-white/5 last:border-0">
                                        <span className="text-gray-600 dark:text-gray-300">Start Date</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{formatDateWithTime(program.startDate, program.startTime)}</span>
                                    </div>
                                )}
                                {program.endDate && (
                                    <div className="flex justify-between items-center py-3 border-b border-white/10 dark:border-white/5 last:border-0">
                                        <span className="text-gray-600 dark:text-gray-300">End Date</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{formatDateWithTime(program.endDate, program.endTime)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <Modal
                isOpen={isLeaveModalOpen}
                onClose={() => setIsLeaveModalOpen(false)}
                title="Leave Program"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setIsLeaveModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleLeave}
                            isLoading={leaveProgram.isPending}
                        >
                            Leave Program
                        </Button>
                    </>
                }
            >
                <p className="text-gray-600">
                    Are you sure you want to leave this program? You will lose access to any private content and progress.
                </p>
            </Modal>

            {/* Locked Program Modal */}
            <Modal
                isOpen={isLockedModalOpen}
                onClose={() => setIsLockedModalOpen(false)}
                title="Program Locked"
                footer={
                    <Button onClick={() => setIsLockedModalOpen(false)}>
                        OK
                    </Button>
                }
            >
                <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <p className="text-gray-600">
                        This program is locked. To get access, please read the <strong>About</strong> section or contact the administrator.
                    </p>
                </div>
            </Modal>

            {/* Quiz Modal */}
            <Modal
                isOpen={!!activeQuiz}
                onClose={() => setActiveQuiz(null)}
                title={activeQuiz?.title || "Quiz"}
                size="lg"
            >
                {activeQuiz && (
                    <QuizPlayer
                        questions={activeQuiz.questions || []}
                        onCancel={() => setActiveQuiz(null)}
                        reviewMode={activeQuiz.reviewMode}
                        userAnswers={activeQuiz.userAnswers}
                        onComplete={async (score, total, answers, totalPoints, timePerQuestion) => {
                            try {
                                await submitQuiz.mutateAsync({
                                    programId: id,
                                    episodeId: activeQuiz.id,
                                    score,
                                    total,
                                    answers: answers || {},
                                    totalPoints,
                                    timePerQuestion,
                                });
                                const pointsMsg = totalPoints !== undefined ? ` (${totalPoints} pts)` : '';
                                toast.success(`Quiz completed! You scored ${score}/${total}${pointsMsg}`);
                                setActiveQuiz(null);
                            } catch (error) {
                                console.error("Failed to submit quiz:", error);
                                toast.error("Failed to save quiz results");
                            }
                        }}
                    />
                )}
            </Modal>
        </div >
    );
}
