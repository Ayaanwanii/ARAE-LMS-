'use client';

import { useState, useEffect, useCallback } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { uploadImage } from '@/lib/utils/storage';
import { toast } from '@/lib/stores/toastStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface CreateRewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateRewardModal({ isOpen, onClose, onSuccess }: CreateRewardModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        pointsCost: '',
        discountValue: '',
        merchantName: '',
        code: '',
        expiryDate: '',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState('');

    const resetForm = useCallback(() => {
        setFormData({
            title: '',
            description: '',
            pointsCost: '',
            discountValue: '',
            merchantName: '',
            code: '',
            expiryDate: '',
        });
        setImageFile(null);
        setImagePreview('');
    }, []);

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen, resetForm]);

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            if (!formData.title || !formData.pointsCost || !imageFile) {
                toast.warning('Please fill in all required fields and upload an image', 5000);
                setLoading(false);
                return;
            }

            // Upload image
            const imageUrl = await uploadImage(imageFile, 'rewards');

            // Create reward document
            const rewardData = {
                title: formData.title,
                description: formData.description,
                pointsCost: parseInt(formData.pointsCost),
                discountValue: formData.discountValue,
                merchantName: formData.merchantName,
                code: formData.code,
                image: imageUrl,
                createdBy: user.uid,
                createdAt: Timestamp.now(),
                isActive: true,
                viewCount: 0,
                isNew: true,
                expiryDate: formData.expiryDate ? Timestamp.fromDate(new Date(formData.expiryDate)) : null,
            };

            await addDoc(collection(db, 'rewards'), rewardData);

            toast.success('Reward created successfully!', 5000);

            // Trigger global notification
            try {
                // We reuse the existing db instance since it's already imported
                const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');

                await addDoc(collection(db, 'notifications'), {
                    type: 'success',
                    title: 'New Reward Added!',
                    message: `Redeem your points for "${formData.title}" - available now!`,
                    link: '/rewards',
                    createdAt: serverTimestamp(),
                });
            } catch (notifError) {
                console.error('Failed to send notification', notifError);
            }

            resetForm();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating reward:', error);
            toast.error('Failed to create reward', 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={handleClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal Card */}
                <div className="inline-block align-bottom bg-slate-900 border border-white/10 rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-10 p-6 sm:p-8 backdrop-blur-2xl">
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            Create New Reward
                        </h3>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Reward Title"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Free Coffee"
                        />

                        <Input
                            label="Merchant Name"
                            value={formData.merchantName}
                            onChange={(e) => setFormData({ ...formData, merchantName: e.target.value })}
                            placeholder="e.g. Starbucks"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Points Cost"
                                type="number"
                                required
                                value={formData.pointsCost}
                                onChange={(e) => setFormData({ ...formData, pointsCost: e.target.value })}
                                placeholder="e.g. 500"
                            />
                            <Input
                                label="Discount Value"
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                placeholder="e.g. 10% OFF"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">Description</label>
                            <div className="dark-quill mb-4">
                                <ReactQuill
                                    theme="snow"
                                    value={formData.description}
                                    onChange={(value) => setFormData({ ...formData, description: value })}
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, false] }],
                                            ['bold', 'italic', 'underline', 'strike'],
                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                            ['link'],
                                            ['clean']
                                        ],
                                    }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Promo Code (Optional)"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="e.g. SUMMER2024"
                            />
                            <div>
                                <label className="block text-sm font-semibold text-slate-200 mb-2">Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-800/90 text-white border border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition font-medium [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-200 mb-2">
                                Reward Image <span className="text-pink-500">*</span>
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="block w-full text-sm text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer bg-slate-800/50 p-2 rounded-2xl border border-slate-700"
                            />
                            {imagePreview && (
                                <div className="mt-3 relative rounded-2xl overflow-hidden border border-slate-700 h-36">
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-800 mt-6">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <Button
                                type="submit"
                                isLoading={loading}
                                className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 border-none text-sm"
                            >
                                Create Reward
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
