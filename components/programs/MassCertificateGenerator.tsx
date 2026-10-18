/**
 * Mass Certificate Generator Component
 * Allows users to upload CSV with student names and download bulk certificates
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import Papa from 'papaparse';
import Button from '@/components/ui/Button';
import { toast } from '@/lib/stores/toastStore';
import {
    generateBulkCertificates,
    createCertificateZip,
    downloadBlob,
    CertificateConfig,
    GenerationProgress,
    CertificateData,
} from '@/lib/utils/certificateGenerator';
import { useLogCertificateGeneration } from '@/lib/hooks/useCertificateLogs';

interface MassCertificateGeneratorProps {
    programId: string;
    programTitle: string;
    certificateConfig: CertificateConfig;
}

export default function MassCertificateGenerator({
    programId,
    programTitle,
    certificateConfig,
}: MassCertificateGeneratorProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [parsedData, setParsedData] = useState<CertificateData[]>([]);
    const [csvFileName, setCsvFileName] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState<GenerationProgress | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const logGeneration = useLogCertificateGeneration();

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            processCSVFile(file);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processCSVFile(file);
        }
    }, []);

    const processCSVFile = (file: File) => {
        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a CSV file');
            return;
        }

        setCsvFileName(file.name);

        Papa.parse(file, {
            header: true, // Use header row to find columns
            skipEmptyLines: true,
            complete: (results) => {
                // Heuristic to find Name and School columns
                const fields = results.meta.fields || [];

                // Find Student Name Column (first column or matches "name")
                let nameField = fields.find(f => /name|student/i.test(f));
                if (!nameField && fields.length > 0) nameField = fields[0]; // Fallback to first column

                // Find School Column (matches "school", "institution", etc)
                let schoolField = fields.find(f => /school|institution|university|organization/i.test(f));
                // Only use 2nd column as fallback if we have at least 2 columns and it's not the name column
                if (!schoolField && fields.length > 1 && fields[1] !== nameField) {
                    // Optional: enable this if we want looser fallback, but strict matching is safer
                    // schoolField = fields[1]; 
                }

                if (!nameField) {
                    toast.error('Could not identify a "Student Name" column. Please ensure headers are present.');
                    return;
                }

                const data: CertificateData[] = results.data.map((row: any) => {
                    return {
                        studentName: row[nameField!]?.trim() || '',
                        schoolName: schoolField ? row[schoolField]?.trim() : undefined,
                        date: new Date().toLocaleDateString() // Always use system date for now
                    };
                }).filter(d => d.studentName);

                if (data.length === 0) {
                    toast.error('No valid student names found in the CSV.');
                    return;
                }

                setParsedData(data);
                toast.success(`Found ${data.length} students` + (schoolField ? ` and detecting schools from "${schoolField}"` : ''));
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                toast.error('Failed to parse CSV file');
            },
        });
    };

    const handleGenerateCertificates = async () => {
        if (parsedData.length === 0) {
            toast.error('Please upload a valid CSV first');
            return;
        }

        if (!certificateConfig.templateUrl) {
            toast.error('Certificate template not configured');
            return;
        }

        setIsGenerating(true);
        setProgress({ current: 0, total: parsedData.length, currentName: '' });

        try {
            // Generate all certificates
            const certificates = await generateBulkCertificates(
                certificateConfig,
                parsedData,
                (prog) => setProgress(prog)
            );

            if (certificates.size === 0) {
                toast.error('Failed to generate any certificates');
                return;
            }

            // Create ZIP file
            setProgress({ current: parsedData.length, total: parsedData.length, currentName: 'Creating ZIP...' });
            const zipBlob = await createCertificateZip(certificates);

            // Download ZIP
            const sanitizedTitle = programTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const zipFileName = `${sanitizedTitle}_certificates.zip`;
            downloadBlob(zipBlob, zipFileName);

            // Log the generation
            await logGeneration.mutateAsync({
                programId,
                count: certificates.size,
                studentNames: parsedData.map(d => d.studentName),
            });

            toast.success(`Successfully generated ${certificates.size} certificates!`);

            // Reset state
            setParsedData([]);
            setCsvFileName('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Certificate generation error:', error);
            toast.error('Failed to generate certificates. Please try again.');
        } finally {
            setIsGenerating(false);
            setProgress(null);
        }
    };

    const handleClearCSV = () => {
        setParsedData([]);
        setCsvFileName('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-100">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                    Mass Certificate Generator
                </h3>
                <p className="text-sm text-indigo-700">
                    Upload a CSV file. The system will automatically detect <strong>Student Name</strong> and <strong>School Name</strong> columns (if present) to generate certificates.
                </p>
            </div>

            {/* CSV Upload Area */}
            {parsedData.length === 0 ? (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                        }`}
                >
                    <div className="mx-auto w-16 h-16 mb-4 text-gray-400">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                    </div>
                    <p className="text-gray-600 mb-2">
                        <span className="font-medium">Drag & drop</span> your CSV file here, or
                    </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-upload"
                    />
                    <label
                        htmlFor="csv-upload"
                        className="inline-block px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition"
                    >
                        Browse Files
                    </label>
                    <p className="text-xs text-gray-500 mt-3">
                        Supported columns: Name, School/Institution.
                    </p>
                </div>
            ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* CSV File Info */}
                    <div className="bg-green-50 p-4 border-b border-green-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-green-800">{csvFileName}</p>
                                <p className="text-sm text-green-600">{parsedData.length} records found</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClearCSV}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            title="Remove file"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Names Preview */}
                    <div className="p-4 bg-white">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Preview (showing first 10)</h4>
                        <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                        {parsedData.some(d => d.schoolName) && (
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {parsedData.slice(0, 10).map((record, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                                            <td className="px-3 py-2 text-gray-900 font-medium">{record.studentName}</td>
                                            {parsedData.some(d => d.schoolName) && (
                                                <td className="px-3 py-2 text-gray-600">{record.schoolName || '-'}</td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {parsedData.length > 10 && (
                                <p className="text-center text-sm text-gray-500 py-2 bg-gray-50">
                                    ... and {parsedData.length - 10} more
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Indicator */}
            {isGenerating && progress && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800">
                            Generating certificates...
                        </span>
                        <span className="text-sm text-blue-600">
                            {progress.current} / {progress.total}
                        </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                    {progress.currentName && (
                        <p className="text-xs text-blue-600 mt-2 truncate">
                            {progress.currentName === 'Creating ZIP...'
                                ? 'Creating ZIP archive...'
                                : `Processing: ${progress.currentName}`}
                        </p>
                    )}
                </div>
            )}

            {/* Generate Button */}
            {parsedData.length > 0 && !isGenerating && (
                <Button
                    fullWidth
                    onClick={handleGenerateCertificates}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Generate & Download {parsedData.length} Certificates
                    </span>
                </Button>
            )}

            {/* Help Text */}
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="flex gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">CSV Format Requirements:</p>
                        <ul className="list-disc list-inside space-y-1 text-amber-700">
                            <li>File must have headers</li>
                            <li>Should include a column with "Name" or "Student"</li>
                            <li>Optional: Include "School" or "Institution" column</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
