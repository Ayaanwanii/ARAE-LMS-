'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

// MUST be outside component to prevent ReactQuill infinite re-render loop
const FORMATS = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'indent',
    'align',
    'link',
    'image',
];

const RICH_TEXT_IMAGE_FOLDER = 'attachments/rich-text-images';

function getRichTextImagePath(fileName: string) {
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    return `${RICH_TEXT_IMAGE_FOLDER}/${Date.now()}_${sanitizedName}`;
}

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import('react-quill-new');
        // Need to return a component that forwards ref
        return function QuillWrapper({ forwardedRef, ...props }: any) {
            return <RQ ref={forwardedRef} {...props} />;
        };
    },
    {
        ssr: false,
        loading: () => <div className="h-48 w-full bg-gray-50 animate-pulse rounded-lg" />,
    }
);

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    className?: string;
    enableImageUpload?: boolean;
}

// Image Link Modal Component
function ImageLinkModal({
    isOpen,
    onClose,
    onSave,
    currentUrl
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (url: string) => void;
    currentUrl: string;
}) {
    const [url, setUrl] = useState(currentUrl);

    useEffect(() => {
        setUrl(currentUrl);
    }, [currentUrl]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Link to Image</h3>
                <p className="text-sm text-gray-500 mb-3">
                    Enter a URL to make this image clickable
                </p>
                <input
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none mb-4"
                    autoFocus
                />
                <div className="flex gap-3 justify-end">
                    {currentUrl && (
                        <button
                            onClick={() => onSave('')}
                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                            Remove Link
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(url)}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder,
    label,
    required,
    className,
    enableImageUpload = true,
}: RichTextEditorProps) {
    const quillRef = useRef<any>(null);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
    const [currentImageLink, setCurrentImageLink] = useState('');

    // Image upload handler
    const imageHandler = useCallback(() => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;

            const quill = quillRef.current?.getEditor?.();
            if (!quill) return;

            const range = quill.getSelection(true);
            quill.insertText(range.index, 'Uploading image...', { italic: true, color: '#9ca3af' });

            try {
                const storageRef = ref(storage, getRichTextImagePath(file.name));
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                quill.deleteText(range.index, 'Uploading image...'.length);
                quill.insertEmbed(range.index, 'image', url, 'user');
                quill.setSelection(range.index + 1, 0);
            } catch (error) {
                console.error('Image upload failed:', error);
                quill.deleteText(range.index, 'Uploading image...'.length);
                alert('Failed to upload image. Please try again.');
            }
        };
    }, []);

    // Modules with custom image handler
    const modules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ color: [] }, { background: [] }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ indent: '-1' }, { indent: '+1' }],
                    [{ align: [] }],
                    ['link', 'image'],
                    ['clean'],
                ],
                handlers: enableImageUpload
                    ? {
                        image: imageHandler,
                    }
                    : {},
            },
            clipboard: {
                matchVisual: false,
            },
        }),
        [imageHandler, enableImageUpload]
    );

    // Use a ref to track the last value to prevent infinite loops
    const lastValueRef = useRef(value);

    // Handle paste events for image pasting
    useEffect(() => {
        if (!enableImageUpload) return;

        const quill = quillRef.current?.getEditor?.();
        if (!quill) return;

        const handlePaste = async (e: ClipboardEvent) => {
            const clipboardData = e.clipboardData;
            if (!clipboardData) return;

            const items = clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = items[i].getAsFile();
                    if (!file) continue;

                    const range = quill.getSelection(true);
                    quill.insertText(range.index, 'Uploading...', { italic: true, color: '#9ca3af' });

                    try {
                        const storageRef = ref(storage, getRichTextImagePath('pasted_image.png'));
                        await uploadBytes(storageRef, file);
                        const url = await getDownloadURL(storageRef);

                        quill.deleteText(range.index, 'Uploading...'.length);
                        quill.insertEmbed(range.index, 'image', url, 'user');
                        quill.setSelection(range.index + 1, 0);
                    } catch (error) {
                        console.error('Paste image upload failed:', error);
                        quill.deleteText(range.index, 'Uploading...'.length);
                    }
                    break;
                }
            }
        };

        const editorContainer = quill.root;
        editorContainer.addEventListener('paste', handlePaste);

        return () => {
            editorContainer.removeEventListener('paste', handlePaste);
        };
    }, [enableImageUpload]);

    // Handle image click to add/edit link
    useEffect(() => {
        const quill = quillRef.current?.getEditor?.();
        if (!quill) return;

        const handleImageClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Check if clicked element is an image
            if (target.tagName === 'IMG') {
                e.preventDefault();
                e.stopPropagation();

                const img = target as HTMLImageElement;
                setSelectedImage(img);

                // Check if image is wrapped in a link
                const parentLink = img.closest('a');
                setCurrentImageLink(parentLink?.getAttribute('href') || '');
                setShowLinkModal(true);
            }
        };

        const editorContainer = quill.root;
        editorContainer.addEventListener('click', handleImageClick);

        return () => {
            editorContainer.removeEventListener('click', handleImageClick);
        };
    }, []);

    // Handle saving image link
    const handleSaveImageLink = useCallback((linkUrl: string) => {
        if (!selectedImage) return;

        const quill = quillRef.current?.getEditor?.();
        if (!quill) return;

        const parentLink = selectedImage.closest('a');

        // Get current HTML content
        let currentHtml = quill.root.innerHTML;

        if (linkUrl) {
            // Add or update link around image
            if (parentLink) {
                // Update existing link
                parentLink.setAttribute('href', linkUrl);
                parentLink.setAttribute('target', '_blank');
            } else {
                // Wrap image in new link
                const imgHtml = selectedImage.outerHTML;
                const linkedImgHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${imgHtml}</a>`;
                currentHtml = currentHtml.replace(imgHtml, linkedImgHtml);
                onChange(currentHtml);
            }
        } else {
            // Remove link from image
            if (parentLink) {
                parentLink.replaceWith(selectedImage);
                // Force update
                onChange(quill.root.innerHTML);
            }
        }

        setShowLinkModal(false);
        setSelectedImage(null);
        setCurrentImageLink('');
    }, [selectedImage, onChange]);

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <ReactQuill
                    forwardedRef={quillRef}
                    theme="snow"
                    value={value}
                    onChange={(content: string) => {
                        if (content !== lastValueRef.current) {
                            lastValueRef.current = content;
                            onChange(content);
                        }
                    }}
                    modules={modules}
                    formats={FORMATS}
                    placeholder={placeholder}
                    className={`quill-email-editor ${className || ''}`}
                />
            </div>

            {/* Image Link Modal */}
            <ImageLinkModal
                isOpen={showLinkModal}
                onClose={() => {
                    setShowLinkModal(false);
                    setSelectedImage(null);
                }}
                onSave={handleSaveImageLink}
                currentUrl={currentImageLink}
            />

            <style jsx global>{`
                .quill-email-editor .ql-container {
                    min-height: 300px;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                }
                .quill-email-editor .ql-editor {
                    min-height: 300px;
                    padding: 16px;
                }
                .quill-email-editor .ql-editor img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                    margin: 8px 0;
                    cursor: pointer;
                    transition: outline 0.2s;
                }
                .quill-email-editor .ql-editor img:hover {
                    outline: 2px solid #6366f1;
                    outline-offset: 2px;
                }
                .quill-email-editor .ql-editor a img {
                    outline: 2px dashed #10b981;
                    outline-offset: 2px;
                }
                .quill-email-editor .ql-editor a img:hover {
                    outline: 2px solid #10b981;
                }
                
                /* Light Mode Quill Styles */
                .quill-email-editor .ql-toolbar {
                    border: none;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb;
                }
                .quill-email-editor .ql-toolbar .ql-stroke {
                    stroke: #374151;
                }
                .quill-email-editor .ql-toolbar .ql-fill {
                    fill: #374151;
                }
                .quill-email-editor .ql-toolbar .ql-picker {
                    color: #374151;
                }
                .quill-email-editor .ql-toolbar .ql-picker-options {
                    background-color: #ffffff;
                    color: #374151;
                }
                .quill-email-editor .ql-container {
                    border: none;
                    background-color: #ffffff;
                }
                .quill-email-editor .ql-editor {
                    color: #111827;
                    background-color: #ffffff;
                }
                .quill-email-editor .ql-editor.ql-blank::before {
                    color: #9ca3af;
                    font-style: normal;
                }

                /* Dark Mode & Media Query Quill Styles */
                @media (prefers-color-scheme: dark) {
                    .quill-email-editor .ql-toolbar {
                        background-color: #1e293b !important;
                        border-bottom-color: #334155 !important;
                    }
                    .quill-email-editor .ql-toolbar .ql-stroke {
                        stroke: #cbd5e1 !important;
                    }
                    .quill-email-editor .ql-toolbar .ql-fill {
                        fill: #cbd5e1 !important;
                    }
                    .quill-email-editor .ql-toolbar .ql-picker {
                        color: #cbd5e1 !important;
                    }
                    .quill-email-editor .ql-toolbar .ql-picker-options {
                        background-color: #1e293b !important;
                        color: #cbd5e1 !important;
                        border-color: #334155 !important;
                    }
                    .quill-email-editor .ql-container,
                    .quill-email-editor .ql-editor {
                        background-color: #1e293b !important;
                        color: #f8fafc !important;
                    }
                    .quill-email-editor .ql-editor,
                    .quill-email-editor .ql-editor * {
                        color: #f8fafc !important;
                        background-color: transparent !important;
                    }
                    .quill-email-editor .ql-editor.ql-blank::before {
                        color: #94a3b8 !important;
                    }
                }

                .dark .quill-email-editor .ql-toolbar {
                    background-color: #1e293b !important;
                    border-bottom-color: #334155 !important;
                }
                .dark .quill-email-editor .ql-toolbar .ql-stroke {
                    stroke: #cbd5e1 !important;
                }
                .dark .quill-email-editor .ql-toolbar .ql-fill {
                    fill: #cbd5e1 !important;
                }
                .dark .quill-email-editor .ql-toolbar .ql-picker {
                    color: #cbd5e1 !important;
                }
                .dark .quill-email-editor .ql-toolbar .ql-picker-options {
                    background-color: #1e293b !important;
                    color: #cbd5e1 !important;
                    border-color: #334155 !important;
                }
                .dark .quill-email-editor .ql-container,
                .dark .quill-email-editor .ql-editor {
                    background-color: #1e293b !important;
                    color: #f8fafc !important;
                }
                .dark .quill-email-editor .ql-editor,
                .dark .quill-email-editor .ql-editor * {
                    color: #f8fafc !important;
                    background-color: transparent !important;
                }
                .dark .quill-email-editor .ql-editor.ql-blank::before {
                    color: #94a3b8 !important;
                }

                /* Compact variant for episode descriptions */
                .episode-description-editor .ql-container {
                    min-height: 150px;
                }
                .episode-description-editor .ql-editor {
                    min-height: 150px;
                }
            `}</style>

            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 font-medium">
                💡 Tip: Click on any image to add a clickable link. Images with links show a green border.
            </p>

        </div>
    );
}
