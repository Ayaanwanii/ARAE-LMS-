'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgramFolders, useCreateProgramFolder, useDeleteProgramFolder } from '@/lib/hooks/useProgramFolders';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { formatDate } from '@/lib/utils/date';
import { toast } from '@/lib/stores/toastStore';

export default function ProgramFoldersPage() {
    const { profile } = useAuth();
    const { data: folders, isLoading } = useProgramFolders();
    const createFolder = useCreateProgramFolder();
    const deleteFolder = useDeleteProgramFolder();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderDescription, setNewFolderDescription] = useState('');

    if (!profile?.isOrganisation && !profile?.isSuperAdmin) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <Link href="/programs">
                        <Button>Back to Programs</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            toast.error('Please enter a folder name');
            return;
        }

        try {
            await createFolder.mutateAsync({
                name: newFolderName.trim(),
                description: newFolderDescription.trim()
            });
            toast.success('Folder created successfully');
            setIsCreateModalOpen(false);
            setNewFolderName('');
            setNewFolderDescription('');
        } catch (error) {
            console.error('Error creating folder:', error);
            toast.error('Failed to create folder');
        }
    };

    const handleDeleteFolder = async (folderId: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        if (confirm('Delete this folder? Programs will not be deleted.')) {
            try {
                await deleteFolder.mutateAsync(folderId);
                toast.success('Folder deleted');
            } catch (error) {
                console.error('Error deleting folder:', error);
                toast.error('Failed to delete folder');
            }
        }
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/programs" className="text-gray-500 hover:text-gray-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Folders</h1>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">Shareable collections of programs</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        New Folder
                    </Button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    </div>
                ) : folders && folders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {folders.map((folder) => (
                            <Link key={folder.id} href={`/programs/folders/${folder.id}`}>
                                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer group border border-white/20 dark:border-white/10 relative">
                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => handleDeleteFolder(folder.id, e)}
                                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                            {folder.name}
                                        </h3>
                                    </div>

                                    {folder.description && (
                                        <p className="text-gray-800 dark:text-gray-300 text-sm line-clamp-2 mb-3">{folder.description}</p>
                                    )}

                                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                        <span>{folder.programIds?.length || 0} items</span>
                                        <span>{folder.viewCount || 0} views</span>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-white/20 dark:border-white/10 flex items-center justify-between">
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            Created {formatDate(folder.createdAt)}
                                        </span>
                                        {folder.isShareable && (
                                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                </svg>
                                                Shareable
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-xl shadow-md border border-white/20 dark:border-white/10">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No folders yet</h3>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">Create folders to organize and share programs</p>
                        <Button className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
                            Create First Folder
                        </Button>
                    </div>
                )}
            </div>

            {/* Create Folder Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create Folder"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Folder Name *
                        </label>
                        <Input
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="e.g., Summer 2026 Programs"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description (Optional)
                        </label>
                        <textarea
                            value={newFolderDescription}
                            onChange={(e) => setNewFolderDescription(e.target.value)}
                            placeholder="Add a description for this folder..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateFolder}
                            isLoading={createFolder.isPending}
                        >
                            Create Folder
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
