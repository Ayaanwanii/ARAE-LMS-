import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { uploadImage } from '@/lib/utils/storage';
import { toast } from '@/lib/stores/toastStore';
import Input from '@/components/ui/Input';
import { CERTIFICATE_FONTS } from '@/lib/constants/fonts';
import { CertificateConfig, CertificateElement, ElementType } from '@/lib/utils/certificateGenerator';

interface CertificateDesignerProps {
    value?: CertificateConfig;
    onChange: (value: CertificateConfig) => void;
}

const DEFAULT_ELEMENTS: CertificateElement[] = [
    { id: 'studentName', label: '[Student Name]', x: 50, y: 40, isVisible: true, maxWidth: 80 },
    { id: 'schoolName', label: '[School Name]', x: 50, y: 50, isVisible: false, maxWidth: 80 },
    { id: 'date', label: '[Date]', x: 50, y: 60, isVisible: false, maxWidth: 40 },
];

const SUPPORTED_TEMPLATE_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

export default function CertificateDesigner({ value, onChange }: CertificateDesignerProps) {
    const [config, setConfig] = useState<CertificateConfig>({
        templateUrl: value?.templateUrl || '',
        elements: value?.elements || DEFAULT_ELEMENTS,
        style: value?.style || {
            fontSize: 60,
            fontColor: '#000000',
            fontFamily: 'Helvetica',
        },
        massDownloadEnabled: value?.massDownloadEnabled || false,
    });

    const [isUploading, setIsUploading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Font Picker State
    const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
    const [fontSearch, setFontSearch] = useState('');
    const fontPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            // Ensure elements exist if migrating from old config
            const mergedElements = value.elements || DEFAULT_ELEMENTS;
            setConfig({ ...value, elements: mergedElements });
        }
    }, [value]);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight,
                });
            }
        };

        window.addEventListener('resize', updateSize);
        // Initial measurement after image load
        const img = containerRef.current?.querySelector('img');
        if (img) {
            if (img.complete) updateSize();
            img.onload = updateSize;
        }

        return () => window.removeEventListener('resize', updateSize);
    }, [config.templateUrl]);

    // Handle outside click for font picker
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fontPickerRef.current && !fontPickerRef.current.contains(event.target as Node)) {
                setIsFontPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load Google Fonts for Preview
    useEffect(() => {
        const font = CERTIFICATE_FONTS.find(f => f.value === config.style.fontFamily);
        if (font && font.type === 'google' && font.googleFontName) {
            const linkId = `font-${font.googleFontName}`;
            if (!document.getElementById(linkId)) {
                const link = document.createElement('link');
                link.id = linkId;
                link.href = `https://fonts.googleapis.com/css2?family=${font.googleFontName}&display=swap`;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
        }
    }, [config.style.fontFamily]);


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!SUPPORTED_TEMPLATE_TYPES.includes(file.type)) {
            toast.error('Please upload a PNG, JPG, or PDF certificate template.');
            e.target.value = '';
            return;
        }

        setIsUploading(true);
        try {
            let fileToUpload = file;

            // Handle PDF conversion
            if (file.type === 'application/pdf') {
                toast.info('Converting PDF to image...');

                // Dynamically import pdfjs
                const pdfjs = await import('pdfjs-dist');
                // Set worker source to unpkg which reliably hosts the exact version
                pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1);

                const viewport = page.getViewport({ scale: 2 }); // Scale 2 for better quality
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) throw new Error('Could not create canvas context');

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                } as any).promise;

                // Convert canvas to blob
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                if (!blob) throw new Error('Failed to convert PDF to image');

                fileToUpload = new File([blob], file.name.replace('.pdf', '.png'), { type: 'image/png' });
            }

            const url = await uploadImage(fileToUpload, 'certificates');
            const newConfig = { ...config, templateUrl: url };
            setConfig(newConfig);
            onChange(newConfig);
            toast.success('Certificate template uploaded');
        } catch (error) {
            console.error('Failed to upload certificate template:', error);
            toast.error('Failed to upload template');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragEnd = (event: any, info: any, elementId: string) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const element = event.target.getBoundingClientRect();

        // Calculate the center position of the dragged element relative to the container
        const relativeX = element.left - rect.left + (element.width / 2);
        const relativeY = element.top - rect.top + (element.height / 2);

        const percentageX = (relativeX / rect.width) * 100;
        const percentageY = (relativeY / rect.height) * 100;

        const newElements = config.elements.map(el =>
            el.id === elementId
                ? {
                    ...el,
                    x: Math.max(0, Math.min(100, percentageX)),
                    y: Math.max(0, Math.min(100, percentageY))
                }
                : el
        );

        const newConfig = { ...config, elements: newElements };
        setConfig(newConfig);
        onChange(newConfig);
    };

    const toggleElementVisibility = (elementId: string) => {
        const newElements = config.elements.map(el =>
            el.id === elementId ? { ...el, isVisible: !el.isVisible } : el
        );
        const newConfig = { ...config, elements: newElements };
        setConfig(newConfig);
        onChange(newConfig);
    };

    const updateElementMaxWidth = (elementId: string, newWidth: number) => {
        const newElements = config.elements.map(el =>
            el.id === elementId ? { ...el, maxWidth: newWidth } : el
        );
        const newConfig = { ...config, elements: newElements };
        setConfig(newConfig);
        onChange(newConfig);
    };

    const updateStyle = (key: keyof CertificateConfig['style'], val: string | number) => {
        const newConfig = {
            ...config,
            style: { ...config.style, [key]: val },
        };
        setConfig(newConfig);
        onChange(newConfig);
    };

    // Filter fonts for search
    const filteredFonts = CERTIFICATE_FONTS.filter(font =>
        font.label.toLowerCase().includes(fontSearch.toLowerCase())
    );

    return (
        <div className="space-y-6 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 bg-gray-50 dark:bg-slate-900/60">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Certificate Designer</h3>

            {/* Variable Toggles */}
            <div className="flex flex-wrap gap-4 mb-4">
                {config.elements.map(el => (
                    <label key={el.id} className="inline-flex items-center space-x-2 cursor-pointer bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors">
                        <input
                            type="checkbox"
                            checked={el.isVisible}
                            onChange={() => toggleElementVisibility(el.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">{el.label.replace(/[\[\]]/g, '')}</span>
                    </label>
                ))}
            </div>

            {!config.templateUrl ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-12 text-center bg-white dark:bg-slate-800/40">
                    <div className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500 mb-4">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-600 dark:text-slate-300 mt-2">Upload a certificate background template (PNG, JPG, PDF)</p>
                </div>
            ) : (
                <div
                    ref={containerRef}
                    className="relative w-full overflow-hidden border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm bg-slate-950"
                >
                    <img
                        src={config.templateUrl}
                        alt="Certificate Template"
                        className="w-full h-auto block"
                        onLoad={() => {
                            if (containerRef.current) {
                                setContainerSize({
                                    width: containerRef.current.offsetWidth,
                                    height: containerRef.current.offsetHeight,
                                });
                            }
                        }}
                    />

                    {config.elements.map(element => (
                        element.isVisible && (
                            <motion.div
                                key={element.id}
                                drag
                                dragMomentum={false}
                                dragConstraints={containerRef}
                                onDragEnd={(e, info) => handleDragEnd(e, info, element.id)}
                                initial={{
                                    left: `${element.x}%`,
                                    top: `${element.y}%`,
                                }}
                                animate={{
                                    left: `${element.x}%`,
                                    top: `${element.y}%`,
                                }}
                                style={{
                                    position: 'absolute',
                                    x: '-50%',
                                    y: '-50%',
                                    cursor: 'move',
                                    // Font styling
                                    color: config.style.fontColor,
                                    fontSize: `${config.style.fontSize}px`,
                                    fontFamily: config.style.fontFamily,
                                    fontWeight: 'normal',
                                    // Width & Wrapping Logic
                                    width: element.maxWidth ? `${element.maxWidth}%` : 'auto',
                                    maxWidth: '100%',
                                    textAlign: 'center',
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word',
                                    lineHeight: 1.2,
                                    zIndex: 10,
                                    userSelect: 'none',
                                    touchAction: 'none',
                                    // Visual feedback
                                    border: '1px dashed rgba(99, 102, 241, 0.4)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                }}
                            >
                                <div className="relative w-full h-full p-1 group">
                                    {element.label}

                                    {/* Resize Handle */}
                                    <div
                                        className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-4 h-8 bg-white border border-gray-400 rounded cursor-ew-resize shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                            const startX = e.clientX;
                                            const startWidthPercent = element.maxWidth || 20;

                                            // Initial width measurement if width is auto
                                            let currentPixelWidth = 0;
                                            if (e.currentTarget.parentElement?.parentElement) {
                                                currentPixelWidth = e.currentTarget.parentElement.parentElement.offsetWidth;
                                            }

                                            const containerWidth = containerRef.current?.offsetWidth || 1;

                                            const handlePointerMove = (moveEvent: PointerEvent) => {
                                                const deltaPixels = moveEvent.clientX - startX;
                                                const deltaPercent = (deltaPixels / containerWidth) * 100;

                                                let basePercent = startWidthPercent;
                                                if (!element.maxWidth && currentPixelWidth) {
                                                    basePercent = (currentPixelWidth / containerWidth) * 100;
                                                }

                                                const newWidth = Math.max(10, Math.min(100, basePercent + deltaPercent));
                                                updateElementMaxWidth(element.id, newWidth);
                                            };

                                            const handlePointerUp = () => {
                                                document.removeEventListener('pointermove', handlePointerMove);
                                                document.removeEventListener('pointerup', handlePointerUp);
                                            };

                                            document.addEventListener('pointermove', handlePointerMove);
                                            document.addEventListener('pointerup', handlePointerUp);
                                        }}
                                    >
                                        <div className="h-4 w-0.5 bg-gray-300"></div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Upload Template
                    </label>
                    <input
                        type="file"
                        accept="image/png, image/jpeg, application/pdf"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-600 dark:text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950/60 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100 transition-colors cursor-pointer"
                    />
                    <p className="mt-1.5 text-xs font-medium text-gray-600 dark:text-slate-400">Recommended size: A4 Landscape (3508x2480px) or PDF.</p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Font Size (px)"
                            type="number"
                            value={config.style.fontSize}
                            onChange={(e) => updateStyle('fontSize', parseInt(e.target.value) || 12)}
                        />
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Font Color</label>
                            <input
                                type="color"
                                value={config.style.fontColor}
                                onChange={(e) => updateStyle('fontColor', e.target.value)}
                                className="w-full h-[42px] p-1 border border-gray-300 dark:border-slate-700 rounded-xl cursor-pointer bg-white dark:bg-slate-800"
                            />
                        </div>
                    </div>

                    {/* Font Picker */}
                    <div className="relative" ref={fontPickerRef}>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Font Style</label>
                        <button
                            type="button"
                            onClick={() => setIsFontPickerOpen(!isFontPickerOpen)}
                            className="w-full text-left px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex justify-between items-center text-gray-900 dark:text-white font-medium"
                        >
                            <span style={{ fontFamily: config.style.fontFamily }}>
                                {CERTIFICATE_FONTS.find(f => f.value === config.style.fontFamily)?.label || config.style.fontFamily}
                            </span>
                            <svg className="w-5 h-5 text-gray-400 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isFontPickerOpen && (
                            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-hidden flex flex-col">
                                <div className="p-2 border-b border-gray-200 dark:border-slate-700">
                                    <input
                                        type="text"
                                        placeholder="Search fonts..."
                                        value={fontSearch}
                                        onChange={(e) => setFontSearch(e.target.value)}
                                        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        autoFocus
                                    />
                                </div>
                                <div className="overflow-y-auto flex-1">
                                    {filteredFonts.map((font) => (
                                        <button
                                            key={font.value}
                                            type="button"
                                            onClick={() => {
                                                updateStyle('fontFamily', font.value);
                                                setIsFontPickerOpen(false);
                                                setFontSearch('');
                                            }}
                                            className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700/80 flex items-center justify-between transition-colors ${config.style.fontFamily === font.value ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-gray-800 dark:text-slate-200'
                                                }`}
                                        >
                                            <span style={{ fontFamily: font.value, fontSize: '1.05em' }}>
                                                {font.label}
                                            </span>
                                            {config.style.fontFamily === font.value && (
                                                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                    {filteredFonts.length === 0 && (
                                        <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                                            No fonts found
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 p-4 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Upload a blank certificate image. Enable the variables you need (Name, School, Date) and drag them to the correct position.
                </p>
            </div>

            {/* Mass Download Toggle */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4 bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Enable Mass Certificate Download</h4>
                        <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mt-1">
                            When enabled, participants can upload a CSV with student names and download certificates in bulk as a ZIP file.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const newConfig = { ...config, massDownloadEnabled: !config.massDownloadEnabled };
                            setConfig(newConfig);
                            onChange(newConfig);
                        }}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${config.massDownloadEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-700'
                            }`}
                        role="switch"
                        aria-checked={config.massDownloadEnabled}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${config.massDownloadEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>
                {config.massDownloadEnabled && (
                    <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm font-bold">Mass download enabled</span>
                        </div>
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                            The system will automatically attempt to find "School Name" columns in the CSV if you have enabled that variable.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
