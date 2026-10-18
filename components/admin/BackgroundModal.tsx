'use client';

import { useState, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useBackgrounds, useUpdateBackgrounds, SectionBackgrounds } from '@/lib/hooks/useBackgrounds';
import { uploadImage } from '@/lib/utils/storage';
import { toast } from '@/lib/stores/toastStore';

interface BackgroundModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SECTIONS: { key: keyof SectionBackgrounds; label: string }[] = [
    { key: 'programs', label: 'Programs' },
    { key: 'news', label: 'News' },
    { key: 'rewards', label: 'Rewards' },
    { key: 'calendar', label: 'Calendar' },
];

export default function BackgroundModal({ isOpen, onClose }: BackgroundModalProps) {
    const { data: backgrounds, isLoading } = useBackgrounds();
    const updateBackgrounds = useUpdateBackgrounds();
    const [uploadingSection, setUploadingSection] = useState<string | null>(null);

    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const handleFileChange = async (section: keyof SectionBackgrounds, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Reset input so the same file can be selected again if needed
        if (fileInputRefs.current[section]) {
            fileInputRefs.current[section]!.value = '';
        }

        try {
            setUploadingSection(section);
            const url = await uploadImage(file, 'backgrounds');
            await updateBackgrounds.mutateAsync({ [section]: url });
            toast.success(`${SECTIONS.find(s => s.key === section)?.label} background updated!`);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload background image');
        } finally {
            setUploadingSection(null);
        }
    };

    const handleRemove = async (section: keyof SectionBackgrounds) => {
        if (!confirm(`Remove background for ${SECTIONS.find(s => s.key === section)?.label}?`)) return;
        try {
            await updateBackgrounds.mutateAsync({ [section]: '' }); // Empty string or we could use FieldValue.delete() but empty string is fine
            toast.success('Background removed');
        } catch (error) {
            toast.error('Failed to remove background');
        }
    }

    const handleApplyToAll = async (sourceSection: keyof SectionBackgrounds) => {
        const sourceUrl = backgrounds?.[sourceSection];
        if (!sourceUrl) {
            toast.error(`No background set for ${SECTIONS.find(s => s.key === sourceSection)?.label}`);
            return;
        }

        if (!confirm(`Are you sure you want to apply the ${SECTIONS.find(s => s.key === sourceSection)?.label} background to ALL sections?`)) {
            return;
        }

        const updates = SECTIONS.reduce((acc, sec) => {
            acc[sec.key] = sourceUrl;
            return acc;
        }, {} as Record<string, string>);

        try {
            await updateBackgrounds.mutateAsync(updates);
            toast.success('Applied background unanimously to all sections!');
        } catch (error) {
            toast.error('Failed to update backgrounds');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Section Backgrounds" size="xl">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
                {/* Dark Mode Optimal Note */}
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3.5 flex items-start gap-3 text-sm text-indigo-200">
                    <svg className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>
                        <span className="font-semibold text-indigo-100">Tip:</span> Choosing a dark background image or deep color is optimal, as the platform interface is rendered for dark mode.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SECTIONS.map((section) => {
                            const currentBg = backgrounds?.[section.key];
                            const isUploading = uploadingSection === section.key;

                            return (
                                <div key={section.key} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col">
                                    {/* Preview Area */}
                                    <div 
                                        className="h-32 w-full bg-gray-100 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden"
                                        style={
                                            currentBg?.startsWith('#')
                                            ? { backgroundColor: currentBg }
                                            : currentBg ? { backgroundImage: `url(${currentBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}
                                        }
                                    >
                                        {!currentBg && (
                                            <div className="text-gray-400 dark:text-slate-500 flex flex-col items-center">
                                                <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                <span className="text-xs font-semibold uppercase tracking-wider">No Background</span>
                                            </div>
                                        )}
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Controls */}
                                    <div className="p-4 flex flex-col flex-1 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{section.label}</h3>
                                            {currentBg && (
                                                <button onClick={() => handleRemove(section.key)} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-semibold">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2 mt-auto">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                ref={(el) => { fileInputRefs.current[section.key] = el; }}
                                                onChange={(e) => handleFileChange(section.key, e)}
                                            />
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    className="flex-1 !text-gray-800 dark:!text-slate-200 !border-gray-300 dark:!border-slate-700 hover:!bg-gray-100 dark:hover:!bg-slate-800 font-semibold bg-white dark:bg-slate-800 shadow-sm"
                                                    size="sm"
                                                    onClick={() => fileInputRefs.current[section.key]?.click()}
                                                    disabled={isUploading || updateBackgrounds.isPending}
                                                >
                                                    {currentBg && !currentBg.startsWith('#') ? 'Change Image' : 'Upload Image'}
                                                </Button>
                                                <div className="relative w-10 h-9 shrink-0 rounded-xl border border-gray-300 dark:border-slate-700 overflow-hidden cursor-pointer hover:border-gray-400 dark:hover:border-slate-600 focus-within:ring-2 focus-within:ring-indigo-500 shadow-sm" title="Choose solid color">
                                                    <input
                                                        type="color"
                                                        value={currentBg?.startsWith('#') ? currentBg : '#ffffff'}
                                                        onChange={(e) => updateBackgrounds.mutateAsync({ [section.key]: e.target.value })}
                                                        disabled={isUploading || updateBackgrounds.isPending}
                                                        className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer"
                                                    />
                                                </div>
                                            </div>
                                            <Button 
                                                variant="primary" 
                                                fullWidth 
                                                size="sm"
                                                onClick={() => handleApplyToAll(section.key)}
                                                disabled={!currentBg || isUploading || updateBackgrounds.isPending}
                                                className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold ${!currentBg ? 'opacity-50' : ''}`}
                                            >
                                                Set for All
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                )}
            </div>
            
            <div className="mt-6 flex justify-end border-t border-gray-100 dark:border-white/10 pt-4">
                <Button variant="outline" onClick={onClose} className="dark:!text-white dark:border-white/20 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 font-medium">Done</Button>
            </div>
        </Modal>
    );
}
