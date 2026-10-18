/**
 * Program Folder Hooks
 * Firestore hooks for program folder management
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    collection,
    query,
    where,
    orderBy,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    serverTimestamp,
    Timestamp,
    arrayUnion,
    arrayRemove,
    increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ProgramFolder, FolderView, EventProgram } from '@/lib/types/firestore';
import { useAuth } from './useAuth';

// Generate a unique share token
function generateShareToken(): string {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}

/**
 * Get all program folders for admin
 */
export function useProgramFolders() {
    const { user, profile } = useAuth();

    return useQuery({
        queryKey: ['program-folders', user?.uid],
        queryFn: async () => {
            if (!user) return [];

            const q = query(
                collection(db, 'program_folders'),
                where('createdBy', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const folders: ProgramFolder[] = [];

            snapshot.forEach((doc) => {
                folders.push({ id: doc.id, ...doc.data() } as ProgramFolder);
            });

            return folders;
        },
        enabled: !!user && (profile?.isOrganisation || profile?.isSuperAdmin),
    });
}

/**
 * Get a single program folder by ID
 */
export function useProgramFolder(folderId: string) {
    return useQuery({
        queryKey: ['program-folder', folderId],
        queryFn: async () => {
            if (!folderId) return null;

            const docRef = doc(db, 'program_folders', folderId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error('Folder not found');
            }

            return { id: docSnap.id, ...docSnap.data() } as ProgramFolder;
        },
        enabled: !!folderId,
    });
}

/**
 * Get programs in a folder (by IDs)
 */
export function useProgramsInFolder(programIds: string[]) {
    return useQuery({
        queryKey: ['programs-in-folder', programIds],
        queryFn: async () => {
            if (!programIds || programIds.length === 0) return [];

            // Fetch programs by their IDs
            const programs: EventProgram[] = [];

            // Firestore 'in' query has a limit of 30, so we batch
            const batches = [];
            for (let i = 0; i < programIds.length; i += 30) {
                batches.push(programIds.slice(i, i + 30));
            }

            for (const batch of batches) {
                const q = query(
                    collection(db, 'event'),
                    where('__name__', 'in', batch)
                );
                const snapshot = await getDocs(q);
                snapshot.forEach((doc) => {
                    programs.push({ id: doc.id, ...doc.data() } as EventProgram);
                });
            }

            return programs.sort((a, b) => programIds.indexOf(a.id) - programIds.indexOf(b.id));
        },
        enabled: programIds && programIds.length > 0,
    });
}

/**
 * Create a new program folder
 */
export function useCreateProgramFolder() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ name, description }: { name: string; description?: string }) => {
            if (!user) throw new Error('Must be logged in');

            const newFolder: Partial<ProgramFolder> = {
                name,
                description: description || '',
                createdBy: user.uid,
                createdAt: serverTimestamp() as Timestamp,
                programIds: [],
                userJoined: [],
                userJoinedNumber: 0,
                shareToken: generateShareToken(),
                isShareable: true,
                viewCount: 0,
            };

            const docRef = await addDoc(collection(db, 'program_folders'), newFolder);
            return docRef.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['program-folders'] });
        },
    });
}

/**
 * Update a program folder
 */
export function useUpdateProgramFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            folderId,
            updates,
        }: {
            folderId: string;
            updates: Partial<Omit<ProgramFolder, 'id' | 'createdBy' | 'createdAt'>>;
        }) => {
            const docRef = doc(db, 'program_folders', folderId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['program-folder', variables.folderId] });
            queryClient.invalidateQueries({ queryKey: ['program-folders'] });
        },
    });
}

/**
 * Delete a program folder
 */
export function useDeleteProgramFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (folderId: string) => {
            await deleteDoc(doc(db, 'program_folders', folderId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['program-folders'] });
        },
    });
}

/**
 * Add programs to a folder
 */
export function useAddProgramsToFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ folderId, programIds }: { folderId: string; programIds: string[] }) => {
            const docRef = doc(db, 'program_folders', folderId);
            await updateDoc(docRef, {
                programIds: arrayUnion(...programIds),
                updatedAt: serverTimestamp(),
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['program-folder', variables.folderId] });
            queryClient.invalidateQueries({ queryKey: ['program-folders'] });
        },
    });
}

/**
 * Remove a program from a folder
 */
export function useRemoveProgramFromFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ folderId, programId }: { folderId: string; programId: string }) => {
            const docRef = doc(db, 'program_folders', folderId);
            await updateDoc(docRef, {
                programIds: arrayRemove(programId),
                updatedAt: serverTimestamp(),
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['program-folder', variables.folderId] });
            queryClient.invalidateQueries({ queryKey: ['program-folders'] });
        },
    });
}

/**
 * Regenerate share token for a folder
 */
export function useRegenerateShareToken() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (folderId: string) => {
            const docRef = doc(db, 'program_folders', folderId);
            const newToken = generateShareToken();
            await updateDoc(docRef, {
                shareToken: newToken,
                updatedAt: serverTimestamp(),
            });
            return newToken;
        },
        onSuccess: (_, folderId) => {
            queryClient.invalidateQueries({ queryKey: ['program-folder', folderId] });
            queryClient.invalidateQueries({ queryKey: ['program-folders'] });
        },
    });
}

/**
 * Get folder analytics (view history)
 */
export function useFolderAnalytics(folderId: string) {
    return useQuery({
        queryKey: ['folder-analytics', folderId],
        queryFn: async () => {
            if (!folderId) return { views: [], totalViews: 0, uniqueViewers: 0 };

            const q = query(
                collection(db, 'folder_views'),
                where('folderId', '==', folderId),
                orderBy('viewedAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const views: FolderView[] = [];
            const uniqueUsers = new Set<string>();

            snapshot.forEach((doc) => {
                const view = { id: doc.id, ...doc.data() } as FolderView;
                views.push(view);
                uniqueUsers.add(view.userId);
            });

            return {
                views,
                totalViews: views.length,
                uniqueViewers: uniqueUsers.size,
            };
        },
        enabled: !!folderId,
    });
}

/**
 * Fetch shared folder data (public/shared view)
 */
export function useSharedFolder(token: string) {
    return useQuery({
        queryKey: ['shared-folder', token],
        queryFn: async () => {
            if (!token) return null;
            const res = await fetch(`/api/programs/shared/${token}`);

            // Read body once as text to avoid "stream already read" errors
            const textCopy = await res.text();

            let data;
            try {
                data = JSON.parse(textCopy);
            } catch (e) {
                // Parsing failed, it's not JSON (likely an HTML error page from the server)
                console.error('API Error (Non-JSON):', textCopy);
                // Throw an error with a snippet of the response body
                throw new Error(`Server Error (${res.status}): ${textCopy.slice(0, 200)}...`);
            }

            if (!res.ok) {
                // It was valid JSON, but the server returned an error code (4xx/5xx)
                throw new Error(data.error || 'Failed to fetch folder');
            }

            return data as { folder: ProgramFolder; programs: EventProgram[] };
        },
        enabled: !!token,
        retry: false,
    });
}

/**
 * Join a program folder
 */
export function useJoinFolder() {
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (folderId: string) => {
            if (!user) throw new Error('Must be logged in to join a folder');

            const folderRef = doc(db, 'program_folders', folderId);
            const userRef = doc(db, 'users', user.uid);

            // Update folder: add user to joined lists
            await updateDoc(folderRef, {
                joined: arrayUnion(userRef),
                userJoined: arrayUnion(user.uid),
                userJoinedNumber: increment(1),
            });

            // Update user: add folder to joined list
            await updateDoc(userRef, {
                joinedFoldersRef: arrayUnion(folderRef),
                joinedFoldersNumber: increment(1),
            });
        },
        onSuccess: (_, folderId) => {
            queryClient.invalidateQueries({ queryKey: ['joined-folders'] });
            queryClient.invalidateQueries({ queryKey: ['program-folder', folderId] });
            queryClient.invalidateQueries({ queryKey: ['user-joined-folder', folderId] });
        },
    });
}

/**
 * Check if the user has joined a specific folder
 */
export function useHasJoinedFolder(folderId: string) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['user-joined-folder', folderId, user?.uid],
        queryFn: async () => {
            if (!user || !folderId) return false;

            const folderSnap = await getDoc(doc(db, 'program_folders', folderId));
            if (!folderSnap.exists()) return false;

            const data = folderSnap.data() as ProgramFolder;
            return data.userJoined?.includes(user.uid) || false;
        },
        enabled: !!user && !!folderId,
    });
}

/**
 * Get all folders the user has joined
 */
export function useJoinedFolders() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['joined-folders', user?.uid],
        queryFn: async () => {
            if (!user) return [];

            const q = query(
                collection(db, 'program_folders'),
                where('userJoined', 'array-contains', user.uid)
            );

            const snapshot = await getDocs(q);
            const folders: ProgramFolder[] = [];

            snapshot.forEach((doc) => {
                folders.push({ id: doc.id, ...doc.data() } as ProgramFolder);
            });

            // Sort client-side to avoid index requirements
            return folders.sort((a, b) => {
                const bTime = (b.createdAt as any)?.toMillis?.() || 0;
                const aTime = (a.createdAt as any)?.toMillis?.() || 0;
                return bTime - aTime;
            });
        },
        enabled: !!user,
    });
}
