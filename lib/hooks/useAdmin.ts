/**
 * Admin Hooks
 * Administrative operations for user and program management
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    collection,
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    increment,
    getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Admin: Add user to program
 */
export function useAdminAddUserToProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ programId, userId }: { programId: string; userId: string }) => {
            // Add user to program's userJoined array
            const programRef = doc(db, 'event', programId);
            const userRef = doc(db, 'users', userId);

            await updateDoc(programRef, {
                userJoined: arrayUnion(userId),
                userJoinedNumber: increment(1),
            });

            await updateDoc(userRef, {
                joinedEvent: arrayUnion(programId),
                joinedEventNumber: increment(1),
            });

            return { programId, userId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['program', data.programId] });
            queryClient.invalidateQueries({ queryKey: ['program-participants', data.programId] });
            queryClient.invalidateQueries({ queryKey: ['user-profile', data.userId] });
        },
    });
}

/**
 * Admin: Remove user from program
 */
export function useAdminRemoveUserFromProgram() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ programId, userId }: { programId: string; userId: string }) => {
            const programRef = doc(db, 'event', programId);
            const userRef = doc(db, 'users', userId);

            await updateDoc(programRef, {
                userJoined: arrayRemove(userId),
                userJoinedNumber: increment(-1),
            });

            await updateDoc(userRef, {
                joinedEvent: arrayRemove(programId),
                joinedEventNumber: increment(-1),
            });

            return { programId, userId };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['program', data.programId] });
            queryClient.invalidateQueries({ queryKey: ['program-participants', data.programId] });
            queryClient.invalidateQueries({ queryKey: ['user-profile', data.userId] });
        },
    });
}

/**
 * Get program participants with full user details
 */
export async function getProgramParticipants(programId: string) {
    const programRef = doc(db, 'event', programId);
    const programSnap = await getDoc(programRef);

    if (!programSnap.exists()) {
        return [];
    }

    const userIds = programSnap.data().userJoined || [];

    if (userIds.length === 0) {
        return [];
    }

    // Fetch user details
    const usersRef = collection(db, 'users');
    const participants = [];

    for (const userId of userIds) {
        const userDoc = await getDoc(doc(usersRef, userId));
        if (userDoc.exists()) {
            participants.push({
                ...userDoc.data(),
                uid: userDoc.id,
            });
        }
    }

    return participants;
}
