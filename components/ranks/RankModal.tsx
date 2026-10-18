'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Rank } from '@/lib/types/firestore';
import { useAddRank, useUpdateRank, useDeleteRank } from '@/lib/hooks/useManageRanks';
import { uploadImage } from '@/lib/utils/storage';
import Image from 'next/image';

interface RankModalProps {
    isOpen: boolean;
    onClose: () => void;
    rank?: Rank | null; // If provided, we are editing
}

export default function RankModal({ isOpen, onClose, rank }: RankModalProps) {
    const isEditing = !!rank;
    const addRank = useAddRank();
    const updateRank = useUpdateRank();

    const [formData, setFormData] = useState<Partial<Rank>>({
        name: '',
        min: 0,
        max: null,
        iconUrl: '',
        order: 0,
    });

    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (rank) {
            setFormData(rank);
            setPreviewUrl(rank.iconUrl || null);
        } else {
            setFormData({
                name: '',
                min: 0,
                max: null,
                iconUrl: '',
                order: 0,
            });
            setPreviewUrl(null);
        }
    }, [rank, isOpen]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadImage(file, 'ranks');
            setFormData(prev => ({ ...prev, iconUrl: url }));
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

        if (!formData.iconUrl) {
            alert('Please upload a rank icon image');
            return;
        }

        try {
            if (isEditing && rank?.id) {
                await updateRank.mutateAsync({ id: rank.id, ...formData });
            } else {
                await addRank.mutateAsync(formData as Omit<Rank, 'id'>);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save rank:', error);
        }
    };

    const [isDeleting, setIsDeleting] = useState(false);
    const deleteRank = useDeleteRank();

    const handleDelete = async () => {
        if (!rank?.id || !confirm('Are you sure you want to delete this rank? This action cannot be undone.')) return;

        setIsDeleting(true);
        try {
            await deleteRank.mutateAsync(rank.id);
            onClose();
        } catch (error) {
            console.error('Failed to delete rank:', error);
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold mb-4">{isEditing ? 'Edit Rank' : 'Add New Rank'}</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Min Programs</label>
                            <input
                                type="number"
                                required
                                value={formData.min}
                                onChange={(e) => setFormData({ ...formData, min: parseInt(e.target.value) })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Programs</label>
                            <input
                                type="number"
                                placeholder="Infinity"
                                value={formData.max ?? ''}
                                onChange={(e) => setFormData({ ...formData, max: e.target.value ? parseInt(e.target.value) : null })}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty for Infinity</p>
                        </div>
                    </div>

                    {/* Rank Icon Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rank Icon</label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200 flex-shrink-0">
                                {previewUrl ? (
                                    <Image src={previewUrl} alt="Rank icon preview" fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs text-center px-1">No Image</div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                    {isUploading ? 'Uploading...' : previewUrl ? 'Change Image' : 'Upload Image'}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                </label>
                                <p className="text-xs text-gray-500">Recommended: Square image (e.g. 200×200)</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Order</label>
                        <input
                            type="number"
                            required
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <div>
                            {isEditing && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="!text-red-600 !border-red-200 hover:!bg-red-50"
                                    onClick={handleDelete}
                                    isLoading={isDeleting}
                                >
                                    Delete
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={addRank.isPending || updateRank.isPending || isUploading}>
                                {isEditing ? 'Save Changes' : 'Create Rank'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
