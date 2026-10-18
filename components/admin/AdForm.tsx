'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import Image from 'next/image';

import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });

interface AdFormProps {
    onSubmit: (data: {
        title: string;
        description: string;
        imageUrl: string;
        redirectUrl?: string;
        endDate: Date;
    }) => Promise<void>;
    isLoading?: boolean;
    onCancel: () => void;
}

export default function AdForm({ onSubmit, isLoading, onCancel }: AdFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        redirectUrl: '',
        endDate: '',
        imageUrl: '',
    });
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `ads/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);
            setFormData(prev => ({ ...prev, imageUrl: url }));
            setPreviewUrl(url);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.imageUrl || !formData.endDate) {
            alert('Please fill in all required fields');
            return;
        }

        await onSubmit({
            title: formData.title,
            description: formData.description,
            imageUrl: formData.imageUrl,
            redirectUrl: formData.redirectUrl || undefined,
            endDate: new Date(formData.endDate),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">New Advertisement</h3>

            <Input
                label="Ad Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Summer Sale"
                required
            />

            <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</label>
                <div className="prose-sm">
                    <RichTextEditor
                        value={formData.description}
                        onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                        placeholder="Enter advertisement description..."
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Banner Image</label>
                <div className="flex items-center gap-4">
                    <div className="relative w-32 h-20 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shrink-0">
                        {previewUrl ? (
                            <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 dark:text-slate-500 text-xs font-medium">No Image</div>
                        )}
                    </div>
                    <label className={`cursor-pointer px-4 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-slate-200 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm ${isUploading ? 'opacity-50' : ''}`}>
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                    </label>
                </div>
            </div>

            <Input
                label="Redirect URL (Optional)"
                value={formData.redirectUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                placeholder="https://example.com/promo"
            />

            <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">End Date</label>
                <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800/90 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium [color-scheme:light] dark:[color-scheme:dark]"
                    required
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={onCancel} className="!text-gray-800 dark:!text-gray-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold">
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading || isUploading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
                    Create Ad
                </Button>
            </div>
        </form>
    );
}

