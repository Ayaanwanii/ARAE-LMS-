import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Rank } from '../types/firestore';

export function useAddRank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (newRank: Omit<Rank, 'id'>) => {
            const ranksRef = collection(db, 'ranks');
            const docRef = await addDoc(ranksRef, newRank);
            return { id: docRef.id, ...newRank };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ranks'] });
        },
    });
}

export function useUpdateRank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Rank> & { id: string }) => {
            const rankRef = doc(db, 'ranks', id);
            await updateDoc(rankRef, updates);
            return { id, ...updates };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ranks'] });
        },
    });
}

export function useDeleteRank() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const rankRef = doc(db, 'ranks', id);
            await deleteDoc(rankRef);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ranks'] });
        },
    });
}
