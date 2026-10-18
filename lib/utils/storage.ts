/**
 * Storage Utilities
 * Helper functions for Firebase Storage file uploads
 */

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface UploadProgress {
    progress: number;
    url?: string;
    error?: string;
}

/**
 * Upload a file to Firebase Storage with progress tracking
 */
export async function uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            (error) => {
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
}

/**
 * Upload an image with automatic path generation
 */
export async function uploadImage(
    file: File,
    folder: 'programs' | 'profiles' | 'episodes' | 'attachments' | 'news' | 'rewards' | 'certificates' | 'ranks' | 'folders' | 'backgrounds',
    onProgress?: (progress: number) => void
): Promise<string> {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `${folder}/${timestamp}_${sanitizedName}`;

    return uploadFile(file, path, onProgress);
}

/**
 * Upload a video file
 */
export async function uploadVideo(
    file: File,
    folder: 'programs' | 'episodes',
    onProgress?: (progress: number) => void
): Promise<string> {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `${folder}/videos/${timestamp}_${sanitizedName}`;

    return uploadFile(file, path, onProgress);
}

/**
 * Upload a PDF file
 */
export async function uploadPDF(
    file: File,
    folder: 'programs' | 'episodes' | 'attachments',
    onProgress?: (progress: number) => void
): Promise<string> {
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const path = `${folder}/pdfs/${timestamp}_${sanitizedName}`;

    return uploadFile(file, path, onProgress);
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
    try {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

/**
 * Validate file size (in MB)
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}

/**
 * Validate file type
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some((type) => file.type.startsWith(type));
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}
