/**
 * Edit News Page
 * Admin only page to edit existing blog posts/news
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useNewsArticle, useUpdateNews } from '@/lib/hooks/useNews';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToastStore } from '@/lib/stores/toastStore';
import { uploadImage } from '@/lib/utils/storage';
import Button from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function EditNewsPage() {
    const params = useParams();
    const router = useRouter();
    const { profile } = useAuth();
    const { data: article, isLoading } = useNewsArticle(params.id as string);
    const { addToast } = useToastStore();
    const { mutateAsync: updateNews, isPending } = useUpdateNews();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [summary, setSummary] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [currentCoverUrl, setCurrentCoverUrl] = useState('');
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [tags, setTags] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (article) {
            setTitle(article.title);
            setContent(article.content);
            setSummary(article.summary || '');
            setCurrentCoverUrl(article.coverImage || '');
            setTags(article.tags?.join(', ') || '');
            setIsPinned(article.isPinned || false);
        }
    }, [article]);

    // Redirect if not admin
    if (profile && !profile.isOrganisation && !profile.isSuperAdmin && !profile.isSubAdmin) {
        router.push('/news');
        return null;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (!article) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            setUploading(true);
            let coverImageUrl = currentCoverUrl;
            const galleryUrls: string[] = article.images || [];

            // Upload new cover image if selected
            if (coverImage) {
                coverImageUrl = await uploadImage(coverImage, 'news');
            }

            // Upload new gallery images
            for (const file of galleryImages) {
                const url = await uploadImage(file, 'news');
                galleryUrls.push(url);
            }

            // Update article
            await updateNews({
                articleId: article.id,
                updates: {
                    title,
                    content,
                    summary,
                    coverImage: coverImageUrl,
                    images: galleryUrls,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    isPinned,
                }
            });

            addToast('News article updated successfully!', 'success');
            router.push(`/news/${article.id}`);

        } catch (error: any) {
            console.error('Error updating news:', error);
            const errorMessage = error.message || 'Failed to update news article';
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
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit News Article</h1>
                        <p className="text-gray-600">Update your story.</p>
                    </div>
                    <Link href={`/news/${article.id}`}>
                        <Button variant="outline" className="dark:!text-gray-800 dark:!bg-white dark:!border-gray-300 text-gray-800 bg-white border-gray-300 shadow-sm">Cancel</Button>
                    </Link>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Article Title *
                            </label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 placeholder-gray-500 bg-white"
                            />
                        </div>

                        {/* Summary */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Short Summary
                            </label>
                            <textarea
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 placeholder-gray-500 bg-white"
                            />
                        </div>

                        {/* Cover Image */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cover Image
                            </label>

                            {currentCoverUrl && !coverImage && (
                                <div className="mb-4 relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                                    <img src={currentCoverUrl} alt="Current cover" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <p className="text-white font-medium">Current Cover Image</p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-colors">
                                <div className="space-y-1 text-center">
                                    {coverImage ? (
                                        <div className="relative">
                                            <span className="text-sm text-green-600 font-medium block mb-2">
                                                Selected: {coverImage.name}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setCoverImage(null)}
                                                className="text-xs text-red-500 hover:text-red-700 underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <div className="flex text-sm text-gray-600">
                                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                                    <span>Change Cover Image</span>
                                                    <input
                                                        type="file"
                                                        className="sr-only"
                                                        accept="image/*"
                                                        onChange={(e) => e.target.files?.[0] && setCoverImage(e.target.files[0])}
                                                    />
                                                </label>
                                            </div>
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
                                />
                            </div>
                        </div>

                        {/* Gallery Images */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Add More Gallery Images
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
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tags
                            </label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 placeholder-gray-500 bg-white"
                            />
                        </div>

                        {/* Pin Article */}
                        <div className="flex items-center">
                            <input
                                id="isPinned"
                                type="checkbox"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isPinned" className="ml-2 block text-sm font-medium text-gray-900">
                                Pin this article to the top
                            </label>
                        </div>

                        {/* Submit */}
                        <div className="pt-4 border-t border-gray-200 flex justify-end">
                            <Button
                                type="submit"
                                isLoading={uploading || isPending}
                                disabled={uploading || isPending}
                            >
                                {uploading ? 'Uploading Images...' : 'Update Article'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
