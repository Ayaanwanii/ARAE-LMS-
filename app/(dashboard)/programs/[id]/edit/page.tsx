/**
 * Edit Program Page
 * Update existing program details
 */

'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgram, useUpdateProgram, useDeleteProgram } from '@/lib/hooks/usePrograms';
import { uploadImage, uploadPDF } from '@/lib/utils/storage';
import { toast } from '@/lib/stores/toastStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Link from 'next/link';
import QuizBuilder from '@/components/programs/QuizBuilder';
import Papa from 'papaparse';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableCompactEpisodeItem } from '@/components/programs/SortableCompactEpisodeItem';

import CertificateDesigner from '@/components/programs/CertificateDesigner';
import Modal from '@/components/ui/Modal';

const CATEGORIES = ['Technology', 'Science', 'Mathematics', 'Language', 'Arts', 'Sports', 'Music', 'Environment', 'History', 'Business', 'Finance', 'Health', 'Cooking', 'Study Party'];
const AUDIENCES = ['Students', 'Teachers', 'Parents', 'Professionals', 'Everyone'];

export default function EditProgramPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const { profile } = useAuth();
    const { data: program, isLoading } = useProgram(id);
    const updateProgram = useUpdateProgram();
    const deleteProgram = useDeleteProgram();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: [] as string[],
        audience: [] as string[],
        duration: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        access: 'public' as 'public' | 'private',
        mode: 'online' as 'online' | 'offline',
        rewardPoints: '',
        episode: [] as any[], // Will contain _id for DnD
        resources: [] as any[],
        certificate: undefined as any,
        isLocked: false,
        videoUrl: '',
        background: '',
    });

    const [activeTab, setActiveTab] = useState<'details' | 'episodes' | 'resources' | 'certificate'>('details');

    const [isArranging, setIsArranging] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setFormData((prev) => {
                const oldIndex = prev.episode.findIndex((item) => item._id === active.id);
                const newIndex = prev.episode.findIndex((item) => item._id === over.id);

                const newEpisodes = arrayMove(prev.episode, oldIndex, newIndex).map((ep, index) => ({
                    ...ep,
                    order: index + 1,
                }));

                return {
                    ...prev,
                    episode: newEpisodes,
                };
            });
        }
    };

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');
    const [uploading, setUploading] = useState(false);

    const [bgImageFile, setBgImageFile] = useState<File | null>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setBgImageFile(file);
            setFormData(prev => ({
                ...prev,
                background: URL.createObjectURL(file)
            }));
        }
    };

    // Import Playlist State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importPlaylistUrl, setImportPlaylistUrl] = useState('');
    const [importing, setImporting] = useState(false);

    const handleImportPlaylist = async () => {
        if (!importPlaylistUrl) return;

        const regExp = /^.*(youtu.be\/|list=)([^#\&\?]*).*/;
        const match = importPlaylistUrl.match(regExp);
        const playlistId = (match && match[2]);

        if (!playlistId) {
            toast.error('Invalid YouTube Playlist URL');
            return;
        }

        setImporting(true);
        toast.info('Fetching playlist items...');

        try {
            const response = await fetch(`/api/youtube/playlist?playlistId=${playlistId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch playlist');
            }

            setFormData(prev => ({
                ...prev,
                episode: [
                    ...(prev.episode || []),
                    ...data.items.map((item: any, idx: number) => ({
                        title: item.title,
                        description: item.description || '',
                        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
                        pdfUrl: '',
                        gameUrl: '',
                        duration: 0,
                        order: (prev.episode?.length || 0) + idx + 1,
                        _id: crypto.randomUUID(),
                    }))
                ]
            }));

            toast.success(`Imported ${data.items.length} videos!`);
            setIsImportModalOpen(false);
            setImportPlaylistUrl('');
        } catch (error: any) {
            console.error('Playlist import error:', error);
            toast.error(error.message);
        } finally {
            setImporting(false);
        }
    };

    useEffect(() => {
        if (program) {
            setFormData({
                title: program.title || '',
                description: program.description || '',
                category: program.category || [],
                audience: program.audience || [],
                duration: String(program.duration || ''),
                startDate: program.startDate || '',
                startTime: program.startTime || '',
                endDate: program.endDate || '',
                endTime: program.endTime || '',
                access: (program.access as 'public' | 'private') || 'public',
                mode: (program.mode as 'online' | 'offline') || 'online',
                rewardPoints: String(program.rewardPoints || ''),
                episode: (program.episode || []).map((ep: any) => ({
                    ...ep,
                    _id: ep._id || crypto.randomUUID(),
                })),
                resources: program.resources || [],
                certificate: program.certificate,
                isLocked: program.isLocked || false,
                videoUrl: program.video?.url || '',
                background: program.background || '',
            });
            setImagePreview(program.image || '');
            // Initialize episodes with _id for DnD
        }
    }, [program]);

    if (isLoading || !program) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    const canEdit = profile?.isOrganisation ||
        profile?.isSuperAdmin ||
        (profile?.isSubAdmin && program.createdBy.id === profile.uid);

    if (!canEdit) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600 mb-6">You do not have permission to edit this program</p>
                    <Link href={`/programs/${id}`}>
                        <Button>Back to Program</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const toggleCategory = (cat: string) => {
        setFormData(prev => ({
            ...prev,
            category: prev.category.includes(cat)
                ? prev.category.filter(c => c !== cat)
                : [...prev.category, cat]
        }));
    };

    const toggleAudience = (aud: string) => {
        setFormData(prev => ({
            ...prev,
            audience: prev.audience.includes(aud)
                ? prev.audience.filter(a => a !== aud)
                : [...prev.audience, aud]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            let imageUrl = program.image;
            if (imageFile) {
                imageUrl = await uploadImage(imageFile, 'programs');
            }

            let backgroundUrl = formData.background;
            if (bgImageFile) {
                backgroundUrl = await uploadImage(bgImageFile, 'programs');
            }

            // Upload resource images and PDFs
            const processedResources = await Promise.all(formData.resources.map(async (resource) => {
                const { file, ...resourceWithoutFile } = resource; // Destructure to remove file property

                if (file) {
                    try {
                        let resourceUrl = '';
                        if (resource.type === 'photo') {
                            resourceUrl = await uploadImage(file, 'programs');
                        } else if (resource.type === 'pdf') {
                            resourceUrl = await uploadPDF(file, 'programs');
                        }
                        return { ...resourceWithoutFile, url: resourceUrl };
                    } catch (err) {
                        console.error(`Failed to upload file for resource ${resource.title}`, err);
                        toast.error(`Failed to upload file for resource: ${resource.title}`);
                        return resourceWithoutFile;
                    }
                }
                return resourceWithoutFile;
            }));

            // Prepare updates object, excluding certificate if undefined
            const { certificate, ...restFormData } = formData;
            const updates: any = {
                ...restFormData,
                image: imageUrl,
                background: backgroundUrl,
                duration: parseInt(formData.duration) || 0,
                rewardPoints: parseInt(formData.rewardPoints) || 0,
                resources: processedResources,
                episode: formData.episode.map(({ _id, ...rest }) => rest), // Remove _id before saving
                video: {
                    url: formData.videoUrl,
                },
            };

            // Only include certificate if it's defined (null is allowed for deletion)
            if (certificate !== undefined) {
                updates.certificate = certificate;
            }

            await updateProgram.mutateAsync({
                programId: id,
                updates,
            });

            toast.success('Program updated successfully!', 5000);
            router.push(`/programs/${id}`);
        } catch (error) {
            console.error('Error updating program:', error);
            toast.error('Failed to update program', 5000);
        } finally {
            setUploading(false);
        }
    };

    const sanitizeFileName = (name: string) =>
        name.replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_');

    const triggerDownload = (csvString: string, fileName: string) => {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportEpisodes = () => {
        const regularEpisodes = (formData.episode || []).filter(ep => ep.type !== 'quiz');
        if (regularEpisodes.length === 0) {
            toast.error('No episodes to export');
            return;
        }
        // Strip HTML tags from rich text content for clean CSV output
        const stripHtml = (html: string) => {
            if (!html) return '';
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return doc.body.textContent || '';
        };
        const data = regularEpisodes.map(ep => ({
            'Order': ep.order || '',
            'Title': ep.title || '',
            'Description': stripHtml(ep.description || ''),
            'Video URL': ep.videoUrl || '',
            'PDF URL': ep.pdfUrl || '',
            'Duration (min)': ep.duration || 0,
        }));
        const csv = Papa.unparse(data);
        const fileName = `${sanitizeFileName(formData.title || 'Program')}_Episodes.csv`;
        triggerDownload(csv, fileName);
        toast.success('Episodes exported successfully');
    };

    const handleExportQuiz = (episode: any, quizNumber: number) => {
        const questions = episode.questions || [];
        if (questions.length === 0) {
            toast.error('No questions to export');
            return;
        }
        const correctLetters = ['A', 'B', 'C', 'D'];
        const data = questions.map((q: any) => ({
            'Question': q.text || '',
            'Answer A': q.options?.[0] || '',
            'Answer B': q.options?.[1] || '',
            'Answer C': q.options?.[2] || '',
            'Answer D': q.options?.[3] || '',
            'Correct Answer': q.type === 'multiple_choice' || !q.type
                ? (correctLetters[q.correctOption] || '')
                : '',
            'Type': q.type || 'multiple_choice',
        }));
        const csv = Papa.unparse(data);
        const fileName = `${sanitizeFileName(formData.title || 'Program')}_Quiz_${quizNumber}.csv`;
        triggerDownload(csv, fileName);
        toast.success('Quiz exported successfully');
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this program? This action cannot be undone.')) {
            try {
                await deleteProgram.mutateAsync(id);
                router.push('/programs');
            } catch (error) {
                console.error('Error deleting program:', error);
                alert('Failed to delete program');
            }
        }
    };

    const handleArchive = async () => {
        const isArchived = program.archived;
        const action = isArchived ? 'unarchive' : 'archive';
        if (confirm(`Are you sure you want to ${action} this program?`)) {
            try {
                await updateProgram.mutateAsync({
                    programId: id,
                    updates: { archived: !isArchived }
                });
                toast.success(`Program ${action}d successfully!`, 5000);
                router.push('/programs');
            } catch (error) {
                console.error(`Error ${action}ing program:`, error);
                toast.error(`Failed to ${action} program`, 5000);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white py-8 transition-colors">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Edit Program</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-1 font-medium">Update your program details</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-white/10 space-y-6">
                    <div className="flex border-b border-gray-200 dark:border-slate-800 mb-8 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'details'
                                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-700'
                                }`}
                        >
                            Details
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('episodes')}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'episodes'
                                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-700'
                                }`}
                        >
                            Episodes
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('resources')}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'resources'
                                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-700'
                                }`}
                        >
                            Resources
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('certificate')}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'certificate'
                                ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-700'
                                }`}
                        >
                            Certificate
                        </button>
                    </div>

                    {/* Details Tab */}
                    <div className={activeTab === 'details' ? 'block' : 'hidden'}>
                        <div className="space-y-6">
                            <Input
                                label="Program Title"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />

                            <Input
                                label="Promo Video URL (YouTube)"
                                value={formData.videoUrl}
                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />

                            <RichTextEditor
                                label="Description"
                                required
                                value={formData.description}
                                onChange={(value) => setFormData({ ...formData, description: value })}
                                placeholder="Describe your program..."
                            />

                            {/* Access Type Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-3">Access Type</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, access: 'public' })}
                                        className={`p-4 border-2 rounded-xl transition ${formData.access === 'public'
                                            ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                                            : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-gray-300 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <svg className={`w-6 h-6 ${formData.access === 'public' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-bold ${formData.access === 'public' ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-white'}`}>
                                                    Public
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 font-medium">
                                                    Anyone can view and join
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, access: 'private' })}
                                        className={`p-4 border-2 rounded-xl transition ${formData.access === 'private'
                                            ? 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-950/40'
                                            : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-gray-300 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <svg className={`w-6 h-6 ${formData.access === 'private' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-bold ${formData.access === 'private' ? 'text-purple-900 dark:text-purple-200' : 'text-gray-900 dark:text-white'}`}>
                                                    Private
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 font-medium">
                                                    Only invited users can access
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Locked Toggle (only for public programs) */}
                            {formData.access === 'public' && (
                                <div className="mt-3 p-4 border-2 border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isLocked}
                                            onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                                            className="mt-1 h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                <p className="font-bold text-gray-900 dark:text-white">Lock this program</p>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 font-medium">
                                                Users can view but cannot self-join. Only admin-added participants get access.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* Program Mode Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-3">Program Mode</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, mode: 'online' })}
                                        className={`p-4 border-2 rounded-xl transition ${formData.mode === 'online'
                                            ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40'
                                            : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-gray-300 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <svg className={`w-6 h-6 ${formData.mode === 'online' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-bold ${formData.mode === 'online' ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-white'}`}>
                                                    Online
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 font-medium">
                                                    Virtual program held online
                                                </p>
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, mode: 'offline' })}
                                        className={`p-4 border-2 rounded-xl transition ${formData.mode === 'offline'
                                            ? 'border-orange-600 dark:border-amber-500 bg-orange-50 dark:bg-amber-950/40'
                                            : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-gray-300 dark:hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <svg className={`w-6 h-6 ${formData.mode === 'offline' ? 'text-orange-600 dark:text-amber-400' : 'text-gray-400 dark:text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div className="text-left">
                                                <p className={`font-bold ${formData.mode === 'offline' ? 'text-orange-900 dark:text-amber-200' : 'text-gray-900 dark:text-white'}`}>
                                                    Offline
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 font-medium">
                                                    In-person program at a location
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-2">Cover Image</label>
                                {imagePreview && (
                                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl mb-4 border border-gray-200 dark:border-slate-700" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="block w-full text-sm text-gray-600 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950/80 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-1">Page Background</label>
                                <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 font-medium">Set a custom background color or upload a background image for the program page.</p>
                                
                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    <div 
                                        className="h-24 w-full sm:w-48 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden relative flex items-center justify-center shadow-inner shrink-0 bg-gray-50 dark:bg-slate-800"
                                        style={
                                            formData.background
                                            ? (formData.background.startsWith('#')
                                                ? { backgroundColor: formData.background }
                                                : { backgroundImage: `url(${formData.background})`, backgroundSize: 'cover', backgroundPosition: 'center' })
                                            : {}
                                        }
                                    >
                                        {!formData.background && (
                                            <span className="text-xs text-gray-400 dark:text-slate-500 font-semibold">Default Background</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm" 
                                            className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"
                                            onClick={() => bgInputRef.current?.click()}
                                        >
                                            {formData.background && !formData.background.startsWith('#') ? 'Change Image' : 'Upload Image'}
                                        </Button>
                                        
                                        <div className="relative w-10 h-9 shrink-0 rounded-xl border border-gray-300 dark:border-slate-700 overflow-hidden cursor-pointer hover:border-gray-400 dark:hover:border-slate-600 focus-within:ring-2 focus-within:ring-indigo-500 shadow-sm" title="Choose solid color">
                                            <input
                                                type="color"
                                                value={formData.background?.startsWith('#') ? formData.background : '#ffffff'}
                                                onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                                                className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer"
                                            />
                                        </div>
                                        
                                        {formData.background && (
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm" 
                                                className="text-red-600 border-red-200 hover:bg-red-50 dark:!text-red-400 dark:!border-red-900/50 dark:hover:!bg-red-950/40 font-bold" 
                                                onClick={() => setFormData({ ...formData, background: '' })}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <input 
                                    ref={bgInputRef} 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleBgImageChange} 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-2">Categories</label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => toggleCategory(cat)}
                                            className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition ${formData.category.includes(cat)
                                                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm'
                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Audience */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-2">Target Audience</label>
                                <div className="flex flex-wrap gap-2">
                                    {AUDIENCES.map(aud => (
                                        <button
                                            key={aud}
                                            type="button"
                                            onClick={() => toggleAudience(aud)}
                                            className={`px-3.5 py-1.5 rounded-xl text-sm font-bold transition ${formData.audience.includes(aud)
                                                ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-sm'
                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {aud}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Input
                                    label="Duration (minutes)"
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="e.g. 60"
                                    required
                                />
                                <div className="mt-4">
                                    <Input
                                        label="Reward Points"
                                        type="number"
                                        value={formData.rewardPoints}
                                        onChange={(e) => setFormData({ ...formData, rewardPoints: e.target.value })}
                                        placeholder="e.g. 100"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="Start Date"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                    <Input
                                        label="Start Time"
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        label="End Date"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                    <Input
                                        label="End Time"
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Episodes Tab */}
                    <div className={activeTab === 'episodes' ? 'block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Episodes</h3>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"
                                            onClick={handleExportEpisodes}
                                            disabled={!formData.episode?.some(ep => ep.type !== 'quiz')}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Export CSV
                                            </span>
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"
                                            onClick={() => setIsImportModalOpen(true)}
                                        >
                                            <span className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                                </svg>
                                                Import Playlist
                                            </span>
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    episode: [
                                                        ...(prev.episode || []),
                                                        {
                                                            title: '',
                                                            description: '',
                                                            videoUrl: '',
                                                            pdfUrl: '',
                                                            gameUrl: '',
                                                            duration: 0,
                                                            order: (prev.episode?.length || 0) + 1,
                                                            _id: Math.random().toString(36).substr(2, 9),
                                                        }
                                                    ]
                                                }));
                                                toast.success('New episode added');
                                            }}
                                        >
                                            Add Episode
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    episode: [
                                                        ...(prev.episode || []),
                                                        {
                                                            title: 'New Quiz',
                                                            description: '',
                                                            type: 'quiz',
                                                            questions: [],
                                                            order: (prev.episode?.length || 0) + 1,
                                                            _id: Math.random().toString(36).substr(2, 9),
                                                        }
                                                    ]
                                                }));
                                                toast.success('New quiz added');
                                            }}
                                        >
                                            Add Quiz
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant={isArranging ? "primary" : "outline"}
                                            className={isArranging ? "bg-indigo-600 text-white font-bold" : "!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"}
                                            onClick={() => setIsArranging(!isArranging)}
                                        >
                                            {isArranging ? "Done Arranging" : "Arrange Sequence"}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {isArranging ? (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div className="bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-700">
                                                <SortableContext
                                                    items={formData.episode?.map(e => e._id) || []}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {formData.episode?.map((episode, index) => (
                                                        <SortableCompactEpisodeItem
                                                            key={episode._id}
                                                            id={episode._id}
                                                            index={index}
                                                            title={episode.title}
                                                            type={episode.type || 'video'}
                                                        />
                                                    ))}
                                                </SortableContext>
                                                {(!formData.episode || formData.episode.length === 0) && (
                                                    <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-2 font-medium">No episodes added yet.</p>
                                                )}
                                            </div>
                                        </DndContext>
                                    ) : (
                                        <div className="space-y-6">
                                            {formData.episode?.map((episode, index) => (
                                                <div key={index} className="bg-gray-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-gray-200 dark:border-slate-700">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                                                {episode.type === 'quiz' ? 'Quiz' : 'Episode'} {index + 1}
                                                            </h4>
                                                            {episode.type === 'quiz' && (
                                                                <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-full border border-purple-200 dark:border-purple-800/50">Quiz</span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newEpisodes = formData.episode?.filter((_, i) => i !== index);
                                                                setFormData({ ...formData, episode: newEpisodes });
                                                            }}
                                                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs font-bold"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <Input
                                                            label="Episode Title"
                                                            value={episode.title}
                                                            onChange={(e) => {
                                                                const newEpisodes = [...(formData.episode || [])];
                                                                newEpisodes[index] = { ...episode, title: e.target.value };
                                                                setFormData({ ...formData, episode: newEpisodes });
                                                            }}
                                                            placeholder={episode.type === 'quiz' ? "e.g., Final Assessment" : "e.g., Introduction to the Course"}
                                                        />

                                                        {episode.type !== 'quiz' && (
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                    <Input
                                                                        label="Video URL"
                                                                        value={episode.videoUrl}
                                                                        onChange={(e) => {
                                                                            const newEpisodes = [...(formData.episode || [])];
                                                                            newEpisodes[index] = { ...episode, videoUrl: e.target.value };
                                                                            setFormData({ ...formData, episode: newEpisodes });
                                                                        }}
                                                                        placeholder="https://vimeo.com/..."
                                                                    />
                                                                    <Input
                                                                        label="PDF URL (Optional)"
                                                                        value={episode.pdfUrl}
                                                                        onChange={(e) => {
                                                                            const newEpisodes = [...(formData.episode || [])];
                                                                            newEpisodes[index] = { ...episode, pdfUrl: e.target.value };
                                                                            setFormData({ ...formData, episode: newEpisodes });
                                                                        }}
                                                                        placeholder="https://..."
                                                                    />
                                                                    <Input
                                                                        label="Game URL (Optional)"
                                                                        value={episode.gameUrl || ''}
                                                                        onChange={(e) => {
                                                                            const newEpisodes = [...(formData.episode || [])];
                                                                            newEpisodes[index] = { ...episode, gameUrl: e.target.value };
                                                                            setFormData({ ...formData, episode: newEpisodes });
                                                                        }}
                                                                        placeholder="https://..."
                                                                    />
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <Input
                                                                        label="Duration (minutes)"
                                                                        type="number"
                                                                        value={episode.duration}
                                                                        onChange={(e) => {
                                                                            const newEpisodes = [...(formData.episode || [])];
                                                                            newEpisodes[index] = { ...episode, duration: parseInt(e.target.value) || 0 };
                                                                            setFormData({ ...formData, episode: newEpisodes });
                                                                        }}
                                                                    />
                                                                </div>

                                                                <RichTextEditor
                                                                    label="Description"
                                                                    value={episode.description}
                                                                    onChange={(value) => {
                                                                        const newEpisodes = [...(formData.episode || [])];
                                                                        newEpisodes[index] = { ...episode, description: value };
                                                                        setFormData({ ...formData, episode: newEpisodes });
                                                                    }}
                                                                    placeholder="Brief description of this episode..."
                                                                    className="episode-description-editor"
                                                                />
                                                            </div>
                                                        )}

                                                        {episode.type === 'quiz' && (
                                                            <div className="mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
                                                                <QuizBuilder
                                                                    questions={episode.questions || []}
                                                                    onChange={(questions) => {
                                                                        const newEpisodes = [...(formData.episode || [])];
                                                                        newEpisodes[index] = { ...episode, questions };
                                                                        setFormData({ ...formData, episode: newEpisodes });
                                                                    }}
                                                                />
                                                                {(episode.questions?.length || 0) > 0 && (
                                                                    <div className="mt-3 flex justify-end">
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"
                                                                            onClick={() => {
                                                                                const quizNumber = formData.episode
                                                                                    .slice(0, index + 1)
                                                                                    .filter(ep => ep.type === 'quiz').length;
                                                                                handleExportQuiz(episode, quizNumber);
                                                                            }}
                                                                        >
                                                                            <span className="flex items-center gap-1.5">
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                                </svg>
                                                                                Export Quiz CSV
                                                                            </span>
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!formData.episode || formData.episode.length === 0) && (
                                                <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4 font-medium">No episodes added yet.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resources Tab */}
                    <div className={activeTab === 'resources' ? 'block' : 'hidden'}>
                        <div className="space-y-6">
                            <div className="border-t border-gray-200 dark:border-slate-800 pt-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Resources</h3>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                resources: [
                                                    ...(prev.resources || []),
                                                    { id: crypto.randomUUID(), title: '', type: 'url', url: '' }
                                                ]
                                            }));
                                            toast.success('New resource added');
                                        }}
                                    >
                                        Add Resource
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {formData.resources?.map((resource, index) => (
                                        <div key={resource.id} className="flex gap-4 items-start bg-gray-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-gray-200 dark:border-slate-700">
                                            <div className="flex-1 space-y-4">
                                                <Input
                                                    label="Title"
                                                    value={resource.title}
                                                    onChange={(e) => {
                                                        const newResources = [...(formData.resources || [])];
                                                        newResources[index] = { ...resource, title: e.target.value };
                                                        setFormData({ ...formData, resources: newResources });
                                                    }}
                                                    placeholder="Resource Title"
                                                />
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-2">Type</label>
                                                        <select
                                                            value={resource.type}
                                                            onChange={(e) => {
                                                                const newResources = [...(formData.resources || [])];
                                                                newResources[index] = { ...resource, type: e.target.value as any };
                                                                setFormData({ ...formData, resources: newResources });
                                                            }}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium"
                                                        >
                                                            <option value="url">URL Link</option>
                                                            <option value="pdf">PDF Document</option>
                                                            <option value="photo">Photo</option>
                                                            <option value="video">Video</option>
                                                        </select>
                                                    </div>
                                                    <Input
                                                        label="URL"
                                                        value={resource.url}
                                                        onChange={(e) => {
                                                            const newResources = [...(formData.resources || [])];
                                                            newResources[index] = { ...resource, url: e.target.value };
                                                            setFormData({ ...formData, resources: newResources });
                                                        }}
                                                        placeholder="https://..."
                                                    />
                                                    {(resource.type === 'photo' || resource.type === 'pdf') && (
                                                        <div className="col-span-2">
                                                            <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-2">
                                                                Upload {resource.type === 'photo' ? 'Photo' : 'PDF'}
                                                            </label>
                                                            <input
                                                                type="file"
                                                                accept={resource.type === 'photo' ? "image/*" : "application/pdf"}
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        const newResources = [...(formData.resources || [])];
                                                                        newResources[index] = {
                                                                            ...resource,
                                                                            file: file,
                                                                        };
                                                                        setFormData({ ...formData, resources: newResources });
                                                                    }
                                                                }}
                                                                className="block w-full text-sm text-gray-600 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950/80 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900 cursor-pointer"
                                                            />
                                                            {resource.file && (
                                                                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 font-bold">
                                                                    Selected: {resource.file.name}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newResources = formData.resources?.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, resources: newResources });
                                                }}
                                                className="mt-8 text-red-500 hover:text-red-700 dark:hover:text-red-400"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    {(!formData.resources || formData.resources.length === 0) && (
                                        <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4 font-medium">No resources added yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Certificate Tab */}
                    <div className={activeTab === 'certificate' ? 'block' : 'hidden'}>
                        <CertificateDesigner
                            value={formData.certificate}
                            onChange={(newVal) => setFormData({ ...formData, certificate: newVal })}
                        />
                    </div>

                    <div className="flex gap-4 mt-8">
                        <Link href={`/programs/${id}`} className="flex-1">
                            <Button type="button" variant="outline" className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm" fullWidth>Cancel</Button>
                        </Link>
                        <Button type="submit" fullWidth isLoading={uploading || updateProgram.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">
                            Save Changes
                        </Button>
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-slate-800 mt-8 space-y-4">
                        <Button
                            type="button"
                            variant="outline"
                            fullWidth
                            onClick={handleArchive}
                            isLoading={updateProgram.isPending}
                            className="border-orange-400 dark:border-amber-500/50 text-orange-600 dark:text-amber-400 hover:bg-orange-50 dark:hover:bg-amber-950/30 font-bold bg-white dark:bg-slate-800"
                        >
                            {program.archived ? 'Unarchive Program' : 'Archive Program'}
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            fullWidth
                            onClick={handleDelete}
                            isLoading={deleteProgram.isPending}
                            className="border-red-400 dark:border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold bg-white dark:bg-slate-800"
                        >
                            Delete Program
                        </Button>
                    </div>
                </form>
            </div>

            <Modal
                isOpen={isImportModalOpen}
                onClose={() => !importing && setIsImportModalOpen(false)}
                title="Import YouTube Playlist"
                footer={
                    <>
                        <Button
                            variant="outline"
                            className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"
                            onClick={() => setIsImportModalOpen(false)}
                            disabled={importing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImportPlaylist}
                            isLoading={importing}
                            disabled={!importPlaylistUrl}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                        >
                            Import Videos
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                        Enter the URL of a public YouTube playlist. We'll automatically fetch all videos, titles, and descriptions.
                    </p>
                    <Input
                        label="Playlist URL"
                        placeholder="https://www.youtube.com/playlist?list=..."
                        value={importPlaylistUrl}
                        onChange={(e) => setImportPlaylistUrl(e.target.value)}
                        required
                    />
                </div>
            </Modal>
        </div>
    );

}
