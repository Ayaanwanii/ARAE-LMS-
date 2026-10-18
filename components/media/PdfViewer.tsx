/**
 * PDF Viewer Component
 * Embedded PDF viewer with download option
 */

'use client';

import Button from '@/components/ui/Button';

interface PdfViewerProps {
    src: string;
    title?: string;
    className?: string;
}

export default function PdfViewer({ src, title, className = '' }: PdfViewerProps) {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = src;
        link.download = title || 'document.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gray-100 border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <svg
                        className="w-6 h-6 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                    </svg>
                    <div>
                        <h3 className="font-semibold text-gray-900">{title || 'PDF Document'}</h3>
                        <p className="text-xs text-gray-600">PDF File</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleDownload}>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                        </svg>
                        Download
                    </Button>
                    <a href={src} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                            </svg>
                            Open in New Tab
                        </Button>
                    </a>
                </div>
            </div>

            {/* PDF Embed */}
            <div className="relative" style={{ height: '600px' }}>
                <iframe
                    src={`${src}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={title || 'PDF Document'}
                />
            </div>

            {/* Fallback for browsers that don't support iframe PDF viewing */}
            <noscript>
                <div className="p-6 text-center">
                    <p className="text-gray-600 mb-4">
                        Your browser doesn't support embedded PDFs. Please download the file to view it.
                    </p>
                    <Button onClick={handleDownload}>Download PDF</Button>
                </div>
            </noscript>
        </div>
    );
}
