'use client';

import { use, useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import {
    useProgramFolder,
    useProgramsInFolder,
    useUpdateProgramFolder,
    useAddProgramsToFolder,
    useRemoveProgramFromFolder,
    useRegenerateShareToken,
    useDeleteProgramFolder,
} from '@/lib/hooks/useProgramFolders';
import { usePrograms } from '@/lib/hooks/usePrograms';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import SortableList from '@/components/ui/SortableList';
import { toast } from '@/lib/stores/toastStore';
import { formatDate } from '@/lib/utils/date';
import { uploadImage } from '@/lib/utils/storage';
import { useBackgroundStore } from '@/lib/stores/backgroundStore';

// ── Add Programs Modal ────────────────────────────────────────────────────────
function AddProgramsModal({
    isOpen, onClose, onAdd, existingProgramIds, isAdding
}: {
    isOpen: boolean; onClose: () => void; onAdd: (ids: string[]) => void;
    existingProgramIds: string[]; isAdding: boolean;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePrograms();
    const allPrograms = data?.pages.flatMap(p => p.programs) || [];
    const filtered = allPrograms.filter(p =>
        !existingProgramIds.includes(p.id) &&
        (!searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const toggle = (id: string) => {
        const s = new Set(selectedIds);
        if (s.has(id)) {
            s.delete(id);
        } else {
            s.add(id);
        }
        setSelectedIds(s);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Programs to Folder" size="lg">
            <div className="flex flex-col h-[60vh]">
                <div className="mb-4"><Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search programs..." autoFocus /></div>
                <div className="flex-1 overflow-y-auto space-y-2 min-h-0 border rounded-lg p-2">
                    {isLoading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                        : filtered.length === 0 ? <div className="text-center py-8 text-gray-500">No matching programs found.</div>
                            : filtered.map(p => (
                                <div key={p.id} onClick={() => toggle(p.id)} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border border-transparent transition">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedIds.has(p.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300'}`}>
                                        {selectedIds.has(p.id) && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded-md object-cover bg-gray-100" />}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.title}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${p.access === 'public' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{p.access === 'public' ? 'Public' : 'Private'}</span></div>
                                    </div>
                                </div>
                            ))}
                    {hasNextPage && <div className="pt-2 text-center"><button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="text-sm text-indigo-600">{isFetchingNextPage ? 'Loading...' : 'Load More'}</button></div>}
                </div>
                <div className="mt-4 flex justify-end gap-3 pt-2 border-t">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => { onAdd(Array.from(selectedIds)); setSelectedIds(new Set()); }} disabled={selectedIds.size === 0 || isAdding} isLoading={isAdding}>Add {selectedIds.size} Programs</Button>
                </div>
            </div>
        </Modal>
    );
}

// ── Item Row ──────────────────────────────────────────────────────────────────
function ItemRow({ thumbnail, title, subtitle, onRemove, sortableProps }: { thumbnail?: string | null; title: string; subtitle?: string; onRemove: () => void;
    sortableProps?: {
        setNodeRef: (node: HTMLElement | null) => void;
        attributes: Record<string, any>;
        listeners: Record<string, any> | undefined;
        style: React.CSSProperties;
    }
}) {
    return (
        <div ref={sortableProps?.setNodeRef} style={sortableProps?.style} className="flex items-center gap-4 p-4 border border-gray-100 dark:border-white/10 rounded-lg hover:border-gray-300 dark:hover:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-sm shadow-sm transition group">
            {sortableProps && (
                <div {...sortableProps.attributes} {...sortableProps.listeners} className="cursor-grab hover:bg-gray-50 dark:hover:bg-white/10 p-1 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded transition-colors touch-none">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>
                </div>
            )}
            <div className="h-12 w-12 flex-shrink-0 bg-gray-100 dark:bg-white/10 rounded-lg overflow-hidden">
                {thumbnail ? <img src={thumbnail} alt="" className="h-full w-full object-cover" /> : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{title}</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">Program</span>
                </div>
                {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{subtitle}</p>}
            </div>
            <button onClick={onRemove} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Remove from folder">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProgramFolderDetails({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { profile } = useAuth();

    const { data: folder, isLoading: folderLoading } = useProgramFolder(id);
    const { data: programs, isLoading: programsLoading } = useProgramsInFolder(folder?.programIds || []);

    const updateFolder = useUpdateProgramFolder();
    const addPrograms = useAddProgramsToFolder();
    const removeProgram = useRemoveProgramFromFolder();
    const regenerateToken = useRegenerateShareToken();
    const deleteFolder = useDeleteProgramFolder();

    const [addModal, setAddModal] = useState<'programs' | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editVideoUrl, setEditVideoUrl] = useState('');
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [bgUploadProgress, setBgUploadProgress] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);
    const { setOverrideBackground } = useBackgroundStore();

    useEffect(() => {
        if (folder?.background) {
            setOverrideBackground(folder.background);
        } else {
            setOverrideBackground(null);
        }
        
        return () => {
            setOverrideBackground(null);
        };
    }, [folder?.background, setOverrideBackground]);

    const handleThumbnailUpload = async (file: File) => {
        try {
            setUploadProgress(0);
            const url = await uploadImage(file, `folders/${id}/cover` as any, (progress) => setUploadProgress(progress));
            await updateFolder.mutateAsync({ folderId: id, updates: { coverImage: url } });
            toast.success('Cover image uploaded');
        } catch { toast.error('Failed to upload image'); }
        finally { setUploadProgress(null); }
    };

    const handleBackgroundUpload = async (file: File) => {
        try {
            setBgUploadProgress(0);
            const url = await uploadImage(file, `folders/${id}/background` as any, (progress) => setBgUploadProgress(progress));
            await updateFolder.mutateAsync({ folderId: id, updates: { background: url } });
            toast.success('Folder background updated');
        } catch { toast.error('Failed to upload background'); }
        finally { setBgUploadProgress(null); }
    };

    const handleRemoveThumbnail = async () => {
        try {
            await updateFolder.mutateAsync({ folderId: id, updates: { coverImage: '' } });
            toast.success('Cover image removed');
        } catch { toast.error('Failed to remove image'); }
    };

    const combinedItems = useMemo(() => {
        if (!programs) return [];
        const items = [
            ...(programs || []).map(p => ({ ...p, _itemType: 'program' as const, _title: p.title, _thumbnail: p.image, _subtitle: `${p.access === 'public' ? 'Public' : 'Private'} • ${p.type || 'Program'}` })),
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
    }, [programs, folder?.itemOrder]);

    if (folderLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
    if (!folder) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Folder Not Found</h2><Link href="/programs/folders"><Button>Back to Folders</Button></Link></div></div>;

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/shared/${folder.shareToken}` : '';
    const totalItems = folder.programIds?.length || 0;

    const handleCopyLink = () => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied to clipboard'); };
    const handleToggleShare = async () => {
        try { await updateFolder.mutateAsync({ folderId: id, updates: { isShareable: !folder.isShareable } }); toast.success(folder.isShareable ? 'Sharing disabled' : 'Sharing enabled'); }
        catch { toast.error('Failed to update settings'); }
    };
    const handleRegenerateToken = async () => {
        if (confirm('Are you sure? The old link will stop working immediately.')) {
            try { await regenerateToken.mutateAsync(id); toast.success('New link generated'); }
            catch { toast.error('Failed to generate new link'); }
        }
    };
    const handleDeleteFolder = async () => {
        if (confirm('Are you sure you want to delete this folder?')) {
            try { await deleteFolder.mutateAsync(id); toast.success('Folder deleted'); router.push('/programs/folders'); }
            catch { toast.error('Failed to delete folder'); }
        }
    };
    const handleSaveDetails = async () => {
        try { 
            await updateFolder.mutateAsync({ 
                folderId: id, 
                updates: { 
                    name: editName || folder.name, 
                    description: editDescription,
                    videoUrl: editVideoUrl 
                } 
            }); 
            setIsEditMode(false); 
            toast.success('Details updated'); 
        }
        catch { toast.error('Failed to update details'); }
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Nav */}
                <div className="mb-6">
                    <Link href="/programs/folders" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Back to Folders
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Folder Header */}
                        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-white/20 dark:border-white/10 p-6">
                            <div className="flex justify-between items-start mb-4">
                                {isEditMode ? (
                                    <div className="flex-1 space-y-3 mr-4">
                                        <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Folder Name" />
                                        <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" className="w-full px-4 py-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-gray-900 dark:text-white" rows={2} />
                                        <Input value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} placeholder="Video Link (YouTube/Vimeo)" />
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleSaveDetails} isLoading={updateFolder.isPending}>Save</Button>
                                            <Button size="sm" variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{folder.name}</h1>
                                        {folder.description && <p className="text-gray-800 dark:text-gray-300 mt-2">{folder.description}</p>}
                                        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span>{totalItems} items</span>
                                            <span>•</span>
                                            <span>Created {formatDate(folder.createdAt)}</span>
                                        </div>
                                    </div>
                                )}
                                {!isEditMode && (
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => { setEditName(folder.name); setEditDescription(folder.description || ''); setEditVideoUrl(folder.videoUrl || ''); setIsEditMode(true); }}>Edit</Button>
                                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleDeleteFolder}>Delete</Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Programs Section ── */}
                        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-white/20 dark:border-white/10 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">📚</span>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Programs</h2>
                                    <span className="text-sm text-gray-400">({folder.programIds?.length || 0})</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setAddModal('programs')}>Add Programs</Button>
                                </div>
                            </div>
                            {programsLoading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
                                : combinedItems.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50/50 dark:bg-white/5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                                        <p className="text-gray-500 dark:text-gray-400">No programs in this folder yet.</p>
                                        <div className="mt-3 flex gap-2 justify-center">
                                            <Button variant="outline" onClick={() => setAddModal('programs')}>Add Programs</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <SortableList
                                        items={combinedItems}
                                        keyExtractor={(item) => item.id}
                                        onReorder={async (newItems) => {
                                            const newOrder = newItems.map(item => item.id);
                                            try { await updateFolder.mutateAsync({ folderId: id, updates: { itemOrder: newOrder } }); } 
                                            catch { toast.error('Failed to save order'); }
                                        }}
                                        renderItem={(item, sortableProps) => (
                                            <ItemRow 
                                                key={item.id} 
                                                thumbnail={item._thumbnail} 
                                                title={item._title} 
                                                subtitle={item._subtitle} 
                                                onRemove={() => removeProgram.mutateAsync({ folderId: id, programId: item.id })}
                                                sortableProps={sortableProps} 
                                            />
                                        )}
                                    />
                                )}
                        </div>

                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Cover Image Card */}
                        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-white/20 dark:border-white/10 p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cover Image</h2>
                            {folder.coverImage ? (
                                <div className="space-y-3">
                                    <div className="relative rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                                        <img src={folder.coverImage} alt="Folder cover" className="w-full h-48 object-cover" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>Change</Button>
                                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleRemoveThumbnail}>Remove</Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-50'); }}
                                    onDragLeave={(e) => { e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50'); }}
                                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-50'); const f = e.dataTransfer.files[0]; if (f) handleThumbnailUpload(f); }}
                                >
                                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <p className="text-sm text-gray-500 font-medium">Click or drag an image to upload</p>
                                    <p className="text-xs text-gray-400 mt-1">Max 5MB • PNG, JPG, WebP</p>
                                </div>
                            )}
                            {uploadProgress !== null && (
                                <div className="mt-3">
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 text-center">{Math.round(uploadProgress)}% uploaded</p>
                                </div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(f); e.target.value = ''; }} />
                        </div>

                        {/* Page Background Card */}
                        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-white/20 dark:border-white/10 p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Page Background</h2>
                            {folder.background ? (
                                <div className="space-y-3">
                                    <div 
                                        className="h-32 w-full rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden relative flex items-center justify-center shadow-inner"
                                        style={
                                            folder.background.startsWith('#')
                                            ? { backgroundColor: folder.background }
                                            : { backgroundImage: `url(${folder.background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                        }
                                    >
                                        <div className="absolute inset-0 bg-black/10" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="flex-1" onClick={() => bgInputRef.current?.click()}>Change Image</Button>
                                        <div className="relative w-10 h-9 shrink-0 rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-indigo-500 shadow-sm" title="Choose solid color">
                                            <input
                                                type="color"
                                                value={folder.background.startsWith('#') ? folder.background : '#ffffff'}
                                                onChange={(e) => updateFolder.mutateAsync({ folderId: id, updates: { background: e.target.value } })}
                                                className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer"
                                            />
                                        </div>
                                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => updateFolder.mutateAsync({ folderId: id, updates: { background: '' } })}>Remove</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Override the global folders background for this specific folder.</p>
                                    <div className="flex gap-2">
                                        <Button variant="primary" size="sm" className="flex-1" onClick={() => bgInputRef.current?.click()}>Upload Image</Button>
                                        <div className="relative w-10 h-9 shrink-0 rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-indigo-500 shadow-sm" title="Choose solid color">
                                            <input
                                                type="color"
                                                value="#ffffff"
                                                onChange={(e) => updateFolder.mutateAsync({ folderId: id, updates: { background: e.target.value } })}
                                                className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {bgUploadProgress !== null && (
                                <div className="mt-3">
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${bgUploadProgress}%` }} />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 text-center">{Math.round(bgUploadProgress)}% uploaded</p>
                                </div>
                            )}
                            <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBackgroundUpload(f); e.target.value = ''; }} />
                        </div>

                        {/* Sharing Card */}
                        <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-white/20 dark:border-white/10 p-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Sharing</h2>
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Sharing</span>
                                <button onClick={handleToggleShare} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${folder.isShareable ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${folder.isShareable ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            {folder.isShareable ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Share Link</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 truncate font-mono">{shareUrl}</div>
                                            <Button onClick={handleCopyLink} variant="outline" size="sm">Copy</Button>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">Anyone with this link (who logs in) can view the contents.</div>
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                        <button onClick={handleRegenerateToken} className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            Regenerate Link
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">Sharing is currently disabled. Enable it to get a shareable link.</div>
                            )}
                        </div>

                        {/* Analytics Card */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Analytics</h2>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-indigo-600">{folder.viewCount || 0}</div>
                                    <div className="text-xs text-gray-500 mt-1">Total Views</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
                                    <div className="text-xs text-gray-500 mt-1">Total Items</div>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <div className="p-2 bg-indigo-50 rounded-lg">
                                    <div className="text-lg font-bold text-indigo-600">{folder.programIds?.length || 0}</div>
                                    <div className="text-xs text-gray-500">Programs</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modals */}
                <AddProgramsModal
                    isOpen={addModal === 'programs'} onClose={() => setAddModal(null)}
                    existingProgramIds={folder.programIds || []}
                    onAdd={async (ids) => { try { await addPrograms.mutateAsync({ folderId: id, programIds: ids }); toast.success(`${ids.length} programs added`); setAddModal(null); } catch { toast.error('Failed to add programs'); } }}
                    isAdding={addPrograms.isPending}
                />
            </div>
        </div>
    );
}
