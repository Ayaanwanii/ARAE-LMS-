/**
 * Admin Ads Management Page
 */

'use client';

import { useState } from 'react';
import { useAdvertisements, useCreateAdvertisement, useUpdateAdvertisement, useDeleteAdvertisement } from '@/lib/hooks/useAdvertisements';
import { useAuth } from '@/lib/hooks/useAuth';
import Button from '@/components/ui/Button';
import AdForm from '@/components/admin/AdForm';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import AdvertisementPopup from '@/components/ui/AdvertisementPopup';

export default function AdminAdsPage() {
    const { profile } = useAuth();
    const { data: ads, isLoading } = useAdvertisements();
    const createAd = useCreateAdvertisement();
    const updateAd = useUpdateAdvertisement();
    const deleteAd = useDeleteAdvertisement();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [previewAd, setPreviewAd] = useState<any>(null);

    // Initial loading or access check could go here
    if (!profile?.isOrganisation && !profile?.isSuperAdmin) {
        return <div className="p-8 text-center">Access Denied</div>;
    }

    const handleCreate = async (data: { title: string; description: string; imageUrl: string; redirectUrl?: string; endDate: Date }) => {
        try {
            await createAd.mutateAsync(data);
            setShowCreateForm(false);
        } catch (error) {
            console.error(error);
            alert('Failed to create ad');
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        await updateAd.mutateAsync({ id, updates: { isActive: !currentStatus } });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this ad?')) {
            await deleteAd.mutateAsync(id);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advertisement Management</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 font-medium">Manage popup advertisements</p>
                    </div>
                    {!showCreateForm && (
                        <div className="flex gap-3">
                            <Link href="/admin">
                                <Button variant="outline" className="!text-gray-800 dark:!text-gray-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold">
                                    Back to Dashboard
                                </Button>
                            </Link>
                            <Button onClick={() => setShowCreateForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                + New Advertisement
                            </Button>
                        </div>
                    )}
                </div>

                {showCreateForm && (
                    <div className="mb-8">
                        <AdForm
                            onSubmit={handleCreate}
                            isLoading={createAd.isPending}
                            onCancel={() => setShowCreateForm(false)}
                        />
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-12 text-gray-600 dark:text-gray-300 font-medium">Loading advertisements...</div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                            <thead className="bg-gray-100 dark:bg-slate-800/80">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Banner</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Stats</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                                {ads?.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400 font-medium">
                                            No advertisements found.
                                        </td>
                                    </tr>
                                )}
                                {ads?.map((ad) => {
                                    const endDate = ad.endDate instanceof Timestamp ? ad.endDate.toDate() : new Date(ad.endDate);
                                    const isExpired = endDate < new Date();

                                    return (
                                        <tr key={ad.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="relative w-24 h-14 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
                                                    <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" unoptimized />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{ad.title}</div>
                                                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate max-w-[200px] mt-0.5">
                                                    {ad.redirectUrl || 'No redirect'}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 font-medium">
                                                    Ends: {format(endDate, 'MMM d, yyyy')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${!ad.isActive ? 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 border-gray-300 dark:border-slate-700' :
                                                    isExpired ? 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50' :
                                                        'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                                                    }`}>
                                                    {!ad.isActive ? 'Disabled' : isExpired ? 'Expired' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 font-medium">
                                                -
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => setPreviewAd(ad)}
                                                        className="text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold"
                                                    >
                                                        Preview
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(ad.id, ad.isActive)}
                                                        className={ad.isActive ? 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-semibold' : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold'}
                                                    >
                                                        {ad.isActive ? 'Disable' : 'Enable'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(ad.id)}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Preview Modal */}
                {previewAd && (
                    <AdvertisementPopup
                        ad={previewAd}
                        isOpen={true}
                        isPreview={true}
                        onClose={() => setPreviewAd(null)}
                    />
                )}
            </div>
        </div>
    );
}
