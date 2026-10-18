/**
 * Create News Page
 * Admin only page to create new blog posts/news
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateNews } from '@/lib/hooks/useNews';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToastStore } from '@/lib/stores/toastStore';
import { uploadImage } from '@/lib/utils/storage';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function CreateNewsPage() {
    const router = useRouter();
    const { profile } = useAuth();
    const { addToast } = useToastStore();
    const { mutateAsync: createNews, isPending } = useCreateNews();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [tags, setTags] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Redirect if not admin
    if (profile && !profile.isOrganisation && !profile.isSuperAdmin && !profile.isSubAdmin) {
        router.push('/news');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            setUploading(true);
            let coverImageUrl = '';
            const galleryUrls: string[] = [];

            // Upload cover image
            if (coverImage) {
                coverImageUrl = await uploadImage(coverImage, 'news');
            }

            // Upload gallery images
            for (const file of galleryImages) {
                const url = await uploadImage(file, 'news');
                galleryUrls.push(url);
            }

            // Create article
            const newsId = await createNews({
                title,
                content,
                summary,
                coverImage: coverImageUrl,
                images: galleryUrls,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                authorName: profile?.displayName || 'Admin',
                authorRole: profile?.role || 'admin',
                isPublished: true,
                isPinned,
            });

            addToast('News article published successfully!', 'success');

            // Trigger global notification
            try {
                const { app } = await import('@/lib/firebase/config');
                const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                const db = getFirestore(app);

                await addDoc(collection(db, 'notifications'), {
                    type: 'info',
                    title: 'Breaking News',
                    message: `Read our latest story: "${title}"`,
                    link: `/news/${newsId}`,
                    createdAt: serverTimestamp(),
                });
            } catch (notifError) {
                console.error('Failed to send notification', notifError);
            }

            router.push('/news');

        } catch (error: any) {
            console.error('Error creating news:', error);
            const errorMessage = error.message || 'Failed to create news article';
            addToast(errorMessage, 'error');

            if (errorMessage.includes('permission')) {
                addToast('Permission denied. Please check your storage rules.', 'error');
            }
        } finally {
            setUploading(false);
        }
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div className="min-h-screen bg-transparent text-gray-900 dark:text-white py-8 transition-colors">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Create News Article</h1>
                        <p className="text-gray-600 dark:text-slate-400 mt-1 font-medium">Share updates, events, and stories with the community.</p>
                    </div>
                    <Link href="/news">
                        <Button variant="outline" className="!text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm">Cancel</Button>
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-1.5">
                                Article Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium placeholder-gray-400 dark:placeholder-slate-500 outline-none"
                                placeholder="Enter a catchy title"
                            />
                        </div>

                        {/* Summary */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-1.5">
                                Short Summary
                            </label>
                            <textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium placeholder-gray-400 dark:placeholder-slate-500 outline-none"
                                placeholder="Brief description for the card preview (optional)"
                            />
                        </div>

                        {/* Cover Image */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-1.5">
                                Cover Image
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-800/40 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors">
                                <div className="space-y-1 text-center">
                                    {coverImage ? (
                                        <div className="relative">
                                            <span className="text-sm text-emerald-600 dark:text-emerald-400 font-bold block mb-2">
                                                Selected: {coverImage.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setCoverImage(null)}
                                                className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <div className="flex text-sm text-gray-600 dark:text-slate-400 font-medium">
                                                <label className="relative cursor-pointer rounded-md font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none">
                                                    <span>Upload a file</span>
                                                    <input
                                                        type="file"
                                                        className="sr-only"
                                                        accept="image/*"
                                                        onChange={(e) => e.target.files?.[0] && setCoverImage(e.target.files[0])}
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-slate-500">PNG, JPG, GIF up to 5MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-1.5">
                                Content *
                            </label>
                            <div className="dark-quill rounded-xl overflow-hidden shadow-sm">
                                <ReactQuill
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    modules={modules}
                                    className="h-64 mb-12"
                                />
                            </div>
                        </div>

                        {/* Gallery Images */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-1.5">
                                Gallery Images (Optional)
                            </label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setGalleryImages(Array.from(e.target.files));
                                    }
                                }}
                                className="block w-full text-sm text-gray-600 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950/80 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900 cursor-pointer"
                            />
                            {galleryImages.length > 0 && (
                                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 font-medium">
                                    {galleryImages.length} images selected
                                </p>
                            )}
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 dark:text-slate-200 mb-1.5">
                                Tags
                            </label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium placeholder-gray-400 dark:placeholder-slate-500 outline-none"
                                placeholder="Event, Workshop, Community (comma separated)"
                            />
                        </div>

                        {/* Pin Article */}
                        <div className="flex items-center">
                            <input
                                id="isPinned"
                                type="checkbox"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                            />
                            <label htmlFor="isPinned" className="ml-2.5 block text-sm font-bold text-gray-900 dark:text-white">
                                Pin this article to the top
                            </label>
                        </div>

                        {/* Submit */}
                        <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                            <Button
                                type="submit"
                                isLoading={uploading || isPending}
                                disabled={uploading || isPending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md"
                            >
                                {uploading ? 'Uploading Images...' : 'Publish Article'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
