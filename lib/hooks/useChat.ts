/**
 * Chat Hooks
 * Firestore hooks for real-time chat functionality
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    onSnapshot,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ChatMessage, ChatRoom } from '@/lib/types/firestore';
import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';

/**
 * Get chat messages for a program or room
 */
export function useChatMessages(programId: string, roomId?: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!programId) {
            setLoading(false);
            return;
        }

        console.log('useChatMessages hook running for program:', programId);
        setLoading(true);

        const messagesRef = collection(db, 'chat_messages');
        const q = query(
            messagesRef,
            where('programRef', '==', programId),
            ...(roomId ? [where('roomId', '==', roomId)] : []),
            orderBy('timestamp', 'asc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: ChatMessage[] = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            setMessages(msgs);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [programId, roomId]);

    return { messages, loading };
}

/**
 * Send a chat message
 */
export function useSendMessage() {
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            programId,
            message,
            roomId,
        }: {
            programId: string;
            message: string;
            roomId?: string;
        }) => {
            if (!user || !profile) throw new Error('Must be logged in');

            const messageData: Partial<ChatMessage> = {
                userRef: user.uid,
                userName: profile.displayName,
                userImage: profile.photoUrl || '',
                message,
                programRef: programId,
                roomId: roomId || null,
                timestamp: serverTimestamp() as Timestamp,
                isRead: false,
            };

            const docRef = await addDoc(collection(db, 'chat_messages'), messageData);
            return docRef.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        },
    });
}

/**
 * Delete a chat message
 */
export function useDeleteMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (messageId: string) => {
            await deleteDoc(doc(db, 'chat_messages', messageId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        },
    });
}

/**
 * Get chat rooms for a program
 */
export function useChatRooms(programId: string) {
    return useQuery({
        queryKey: ['chat-rooms', programId],
        queryFn: async () => {
            const roomsRef = collection(db, 'chat_rooms');
            const q = query(
                roomsRef,
                where('programRef', '==', programId),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(q);
            const rooms: ChatRoom[] = [];
            snapshot.forEach((doc) => {
                rooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
            });
            return rooms;
        },
    });
}

/**
 * Create a chat room
 */
export function useCreateChatRoom() {
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            programId,
            name,
            description,
        }: {
            programId: string;
            name: string;
            description?: string;
        }) => {
            if (!user || !profile) throw new Error('Must be logged in');

            const roomData: Partial<ChatRoom> = {
                name,
                description: description || '',
                programRef: programId,
                createdBy: user.uid,
                createdAt: serverTimestamp() as Timestamp,
                participants: [doc(db, 'users', user.uid)],
                isActive: true,
            };

            const docRef = await addDoc(collection(db, 'chat_rooms'), roomData);
            return docRef.id;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['chat-rooms', variables.programId] });
        },
    });
}

// Missing import
import { getDocs } from 'firebase/firestore';
