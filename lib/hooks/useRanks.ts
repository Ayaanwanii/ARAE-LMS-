import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Rank } from '../types/firestore';

export function useRanks() {
    return useQuery({
        queryKey: ['ranks'],
        queryFn: async () => {
            const ranksRef = collection(db, 'ranks');
            // Assuming we want them ordered by the minimum programs count
            const q = query(ranksRef, orderBy('min', 'asc'));
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Rank[];
        }
    });
}
