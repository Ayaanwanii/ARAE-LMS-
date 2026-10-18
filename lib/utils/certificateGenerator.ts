/**
 * Certificate Generator Utility
 * Handles PDF generation for certificates - both single and bulk
 */

import JSZip from 'jszip';
import { CERTIFICATE_FONTS } from '@/lib/constants/fonts';

// Element types supported on the certificate
export type ElementType = 'studentName' | 'schoolName' | 'date';

export interface CertificateElement {
    id: ElementType;
    label: string; // Display label
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    isVisible: boolean;
    maxWidth?: number; // Percentage 0-100
}

export interface CertificateConfig {
    templateUrl: string;
    elements: CertificateElement[];
    style: {
        fontSize: number;
        fontColor: string;
        fontFamily: string;
    };
    massDownloadEnabled?: boolean;
}

export interface GenerationProgress {
    current: number;
    total: number;
    currentName: string;
}

export interface CertificateData {
    studentName: string;
    schoolName?: string;
    date?: string;
}

/**
 * Fetches an image and returns its base64 representation along with dimensions
 */
async function fetchImageAsBase64(url: string): Promise<{ base64: string; width: number; height: number }> {
    if (!url) {
        throw new Error('No template image URL provided');
    }

    // If already a base64 Data URL
    if (url.startsWith('data:')) {
        return loadImageDimensions(url);
    }

    try {
        const proxied = await fetchCertificateTemplateDataUrl(url);
        return loadImageDimensions(proxied);
    } catch (err) {
        console.warn('Certificate template proxy failed, trying direct image fetch:', err);
    }

    // Try fetch API with CORS mode
    try {
        const response = await fetch(url, { mode: 'cors' });
        if (response.ok) {
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result !== 'string') {
                        reject(new Error('Failed to read certificate image data'));
                        return;
                    }
                    const resultBase64 = reader.result as string;
                    const img = new Image();
                    img.onload = () => resolve({
                        base64: resultBase64,
                        width: img.naturalWidth || 1000,
                        height: img.naturalHeight || 700
                    });
                    img.onerror = () => resolve({
                        base64: resultBase64,
                        width: 1000,
                        height: 700
                    });
                    img.src = resultBase64;
                };
                reader.onerror = () => reject(new Error('FileReader error while processing image blob'));
                reader.readAsDataURL(blob);
            });
        }
    } catch (err) {
        console.warn('Direct fetch for certificate template failed, using HTML Image fallback:', err);
    }

    // Fallback using HTML Image element & Canvas toDataURL
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const w = img.naturalWidth || 1000;
                const h = img.naturalHeight || 700;
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const dataURL = canvas.toDataURL('image/png');
                    resolve({ base64: dataURL, width: w, height: h });
                    return;
                }
            } catch (canvasErr) {
                console.warn('Canvas toDataURL failed:', canvasErr);
            }
            reject(new Error('Unable to convert certificate template image due to browser CORS security policies.'));
        };
        img.onerror = () => reject(new Error('Failed to load certificate template image URL.'));
        img.src = url;
    });
}

async function fetchCertificateTemplateDataUrl(url: string): Promise<string> {
    const response = await fetch(`/api/certificate/template-image?url=${encodeURIComponent(url)}`);
    const data = await response.json().catch(() => ({})) as { dataUrl?: string; error?: string };

    if (!response.ok || !data.dataUrl) {
        throw new Error(data.error || 'Unable to prepare certificate template image');
    }

    return data.dataUrl;
}

function loadImageDimensions(base64: string): Promise<{ base64: string; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const width = img.naturalWidth || 1000;
            const height = img.naturalHeight || 700;

            if (base64.startsWith('data:image/webp')) {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new Error('Unable to prepare certificate template image'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0);
                    resolve({
                        base64: canvas.toDataURL('image/png'),
                        width,
                        height
                    });
                    return;
                } catch (error) {
                    reject(error);
                    return;
                }
            }

            resolve({
                base64,
                width,
                height
            });
        };
        img.onerror = () => reject(new Error('Failed to load certificate template image'));
        img.src = base64;
    });
}

/**
 * Load a custom font into jsPDF
 */
async function loadFontForPDF(doc: any, fontName: string): Promise<void> {
    const fontDef = CERTIFICATE_FONTS.find(f => f.value.toLowerCase() === (fontName || '').toLowerCase());

    if (fontDef && fontDef.ttfUrl) {
        try {
            const fontRes = await fetch(fontDef.ttfUrl);
            if (!fontRes.ok) throw new Error(`Font fetch returned ${fontRes.status}`);
            const fontBlob = await fontRes.blob();

            const fontBase64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    if (!result || !result.includes(',')) {
                        reject(new Error('Invalid font DataURL'));
                        return;
                    }
                    resolve(result.split(',')[1]);
                };
                reader.onerror = () => reject(new Error('FileReader error loading font'));
                reader.readAsDataURL(fontBlob);
            });

            const fileName = `${fontDef.value.replace(/\s+/g, '')}-Regular.ttf`;
            doc.addFileToVFS(fileName, fontBase64);
            doc.addFont(fileName, fontDef.value, 'normal');
            doc.setFont(fontDef.value, 'normal');
            return;
        } catch (e) {
            console.error('Failed to load custom font, falling back to Helvetica:', e);
        }
    }

    try {
        const standardFont = (fontName || '').toLowerCase();
        if (['helvetica', 'times', 'courier'].includes(standardFont)) {
            doc.setFont(standardFont, 'normal');
        } else {
            doc.setFont('helvetica', 'normal');
        }
    } catch (e) {
        console.error('Error setting font, falling back to helvetica:', e);
        doc.setFont('helvetica', 'normal');
    }
}

/**
 * Sanitize a filename by removing/replacing invalid characters
 */
function sanitizeFilename(name: string): string {
    return name
        .trim()
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid chars
        .replace(/\s+/g, '_')          // Replace spaces with underscores
        .substring(0, 100);            // Limit length
}

/**
 * Generate a single certificate PDF
 * Returns the PDF as a Blob
 */
export async function generateCertificatePDF(
    config: CertificateConfig,
    data: CertificateData
): Promise<Blob> {
    if (!config || !config.templateUrl) {
        throw new Error('Certificate template configuration or image URL is missing.');
    }

    // Dynamically import jsPDF to reduce bundle size
    const { jsPDF } = await import('jspdf');

    // Fetch template image
    const { base64, width, height } = await fetchImageAsBase64(config.templateUrl);

    // Create PDF with exact image dimensions
    const orientation = width > height ? 'l' : 'p';
    const doc = new jsPDF({
        orientation,
        unit: 'px',
        format: [width, height],
        hotfixes: ['px_scaling']
    });

    // Load font
    const fontName = config.style?.fontFamily || 'Helvetica';
    await loadFontForPDF(doc, fontName);

    // Determine format from base64 string
    let format = 'PNG';
    if (base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/jpg')) {
        format = 'JPEG';
    } else if (base64.startsWith('data:image/webp')) {
        format = 'WEBP';
    }
    doc.addImage(base64, format, 0, 0, width, height);

    // Set common styles
    const fontSize = config.style?.fontSize || 60;
    const fontColor = config.style?.fontColor || '#000000';
    doc.setFontSize(fontSize);
    doc.setTextColor(fontColor);

    // Iterate through active elements and render them
    const elements = config.elements || [
        { id: 'studentName', label: '[Student Name]', x: 50, y: 40, isVisible: true, maxWidth: 80 },
        { id: 'schoolName', label: '[School Name]', x: 50, y: 50, isVisible: false, maxWidth: 80 },
        { id: 'date', label: '[Date]', x: 50, y: 60, isVisible: false, maxWidth: 40 },
    ];

    elements.forEach(element => {
        if (!element.isVisible) return;

        let text = '';
        switch (element.id) {
            case 'studentName':
                text = data.studentName;
                break;
            case 'schoolName':
                text = data.schoolName || '';
                break;
            case 'date':
                text = data.date || new Date().toLocaleDateString();
                break;
        }

        if (!text) return;

        const txtX = (element.x / 100) * width;
        const txtY = (element.y / 100) * height;
        const maxLineWidth = element.maxWidth ? (element.maxWidth / 100) * width : width;

        try {
            doc.text(text, txtX, txtY, {
                align: 'center',
                maxWidth: maxLineWidth
            });
        } catch (err) {
            console.error('Error drawing text on certificate PDF:', err);
        }
    });

    return doc.output('blob');
}

/**
 * Generate multiple certificates with progress callback
 * Uses chunked processing to prevent UI freeze
 */
export async function generateBulkCertificates(
    config: CertificateConfig,
    dataList: CertificateData[],
    onProgress?: (progress: GenerationProgress) => void
): Promise<Map<string, Blob>> {
    const results = new Map<string, Blob>();
    const total = dataList.length;
    const CHUNK_SIZE = 5; // Process 5 at a time with a small delay

    for (let i = 0; i < total; i++) {
        const item = dataList[i];
        if (!item.studentName) continue;

        try {
            onProgress?.({
                current: i + 1,
                total,
                currentName: item.studentName
            });

            const pdfBlob = await generateCertificatePDF(config, item);
            const filename = `${sanitizeFilename(item.studentName)}_certificate.pdf`;
            results.set(filename, pdfBlob);

            // Add a small delay every CHUNK_SIZE to let UI breathe
            if ((i + 1) % CHUNK_SIZE === 0 && i < total - 1) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } catch (error) {
            console.error(`Failed to generate certificate for ${item.studentName}:`, error);
            // Continue with remaining certificates
        }
    }

    return results;
}

/**
 * Create a ZIP file from multiple PDFs
 */
export async function createCertificateZip(
    certificates: Map<string, Blob>,
    zipFilename?: string
): Promise<Blob> {
    const zip = new JSZip();

    certificates.forEach((blob, filename) => {
        zip.file(filename, blob);
    });

    return await zip.generateAsync({ type: 'blob' });
}

/**
 * Parse CSV content and extract names and possibly school names
 */
export function parseCSVData(csvContent: string): CertificateData[] {
    const lines = csvContent.split('\n');
    const results: CertificateData[] = [];

    // Header analysis
    const headerRow = lines[0].toLowerCase();
    const headers = headerRow.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

    // Detect school column index
    const schoolKeywords = ['school', 'institution', 'university', 'college', 'academy'];
    const schoolColIndex = headers.findIndex(h => schoolKeywords.some(k => h.includes(k)));

    // Date is usually from system, but if CSV has it, we could use it. 
    // Plan says "fetch present date automatically from system", so we ignore CSV date for now unless required.

    // Iterate rows
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse line respecting quotes is complex, but simple split for now as per previous impl.
        // Ideally use PapaParse in component, but this helper is for fallback or simple text.
        // Actually the component uses PapaParse. This helper might be redundant if component does the work.
        // But for safe-keeping, let's allow it to handle basic CSV.

        const columns = line.split(',');
        // Note: Simple split breaks on commas inside quotes. 
        // Since MassCertificateGenerator uses PapaParse, this might just be a utility for types.

        const studentName = columns[0]?.trim().replace(/^["']|["']$/g, '');
        let schoolName: string | undefined = undefined;

        if (schoolColIndex > 0 && columns[schoolColIndex]) {
            schoolName = columns[schoolColIndex].trim().replace(/^["']|["']$/g, '');
        }

        if (studentName && studentName.length > 0) {
            results.push({
                studentName,
                schoolName,
                date: new Date().toLocaleDateString() // Default to today
            });
        }
    }

    return results;
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
