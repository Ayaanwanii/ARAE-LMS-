import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface SectionBackgrounds {
    programs?: string;
    news?: string;
    rewards?: string;
    calendar?: string;
}

export function useBackgrounds() {
    return useQuery({
        queryKey: ['settings-backgrounds'],
        queryFn: async () => {
            const docRef = doc(db, 'settings', 'backgrounds');
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                return snap.data() as SectionBackgrounds;
            }
            return {};
        }
    });
}

export function useUpdateBackgrounds() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updates: Partial<SectionBackgrounds>) => {
            const docRef = doc(db, 'settings', 'backgrounds');
            await setDoc(docRef, updates, { merge: true });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings-backgrounds'] });
        }
    });
}
