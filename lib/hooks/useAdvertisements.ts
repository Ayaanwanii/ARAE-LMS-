/**
 * Advertisement Hooks
 * Firestore hooks for advertisement management
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
    getDocs,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Advertisement } from '@/lib/types/firestore';
import { useAuth } from './useAuth';

/**
 * Get all advertisements (Admin only)
 */
export function useAdvertisements() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['advertisements'],
        queryFn: async () => {
            const adsRef = collection(db, 'advertisements');
            const q = query(adsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Advertisement[];
        },
        enabled: !!user,
    });
}

/**
 * Get active advertisement (Public/User)
 */
export function useActiveAdvertisement() {
    return useQuery({
        queryKey: ['active-advertisement'],
        queryFn: async () => {
            const adsRef = collection(db, 'advertisements');
            const now = new Date();

            const q = query(
                adsRef,
                where('isActive', '==', true)
                // Note: Firestore doesn't support multiple inequality filters easily.
                // We'll filter by date client-side or use a compound index if needed.
                // For now, let's fetch active ones and filter by date here.
            );

            const snapshot = await getDocs(q);
            const ads = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Advertisement[];

            // Sort by createdAt descending (Newest first)
            ads.sort((a, b) => {
                const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime();
                const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime();
                return dateB - dateA;
            });

            // Filter valid ads (not expired)
            const validAds = ads.filter(ad => {
                const endDate = ad.endDate instanceof Timestamp
                    ? ad.endDate.toDate()
                    : new Date(ad.endDate);
                return endDate > now;
            });

            return validAds;
        },
        // Refetch every minute? Or just once per session? Default stale time is fine.
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Create advertisement
 */
export function useCreateAdvertisement() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Omit<Advertisement, 'id' | 'createdAt' | 'createdBy' | 'isActive'>) => {
            if (!user) throw new Error('Must be logged in');

            const newAd = {
                ...data,
                isActive: true,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
            };

            // Remove undefined fields
            Object.keys(newAd).forEach(key => {
                if ((newAd as any)[key] === undefined) {
                    delete (newAd as any)[key];
                }
            });

            await addDoc(collection(db, 'advertisements'), newAd);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['advertisements'] });
            queryClient.invalidateQueries({ queryKey: ['active-advertisement'] });
        },
    });
}

/**
 * Update advertisement
 */
export function useUpdateAdvertisement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Advertisement> }) => {
            const docRef = doc(db, 'advertisements', id);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['advertisements'] });
            queryClient.invalidateQueries({ queryKey: ['active-advertisement'] });
        },
    });
}

/**
 * Delete advertisement
 */
export function useDeleteAdvertisement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await deleteDoc(doc(db, 'advertisements', id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['advertisements'] });
            queryClient.invalidateQueries({ queryKey: ['active-advertisement'] });
        },
    });
}
