/**
 * Firestore Hooks for News/Blog
 */

'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
    collection,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    where,
    DocumentSnapshot,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { NewsArticle } from '../types/firestore';

const NEWS_PER_PAGE = 9;

/**
 * Fetch all news with infinite scroll
 */
export function useNews(filters?: {
    tag?: string;
}) {
    return useInfiniteQuery({
        queryKey: ['news', filters],
        queryFn: async ({ pageParam }) => {
            let constraints: any[] = [
                where('isPublished', '==', true),
                orderBy('isPinned', 'desc'),
                orderBy('createdAt', 'desc'),
                limit(NEWS_PER_PAGE)
            ];

            if (filters?.tag) {
                // Note: This requires an index on 'tags' array
                constraints.unshift(where('tags', 'array-contains', filters.tag));
            }

            if (pageParam) {
                constraints.push(startAfter(pageParam));
            }

            const q = query(collection(db, 'news'), ...constraints);
            const snapshot = await getDocs(q);
            const news: NewsArticle[] = [];
            snapshot.forEach((doc) => {
                news.push({ id: doc.id, ...doc.data() } as NewsArticle);
            });

            return {
                news,
                lastDoc: snapshot.docs[snapshot.docs.length - 1],
                hasMore: snapshot.docs.length === NEWS_PER_PAGE,
            };
        },
        initialPageParam: null as DocumentSnapshot | null,
        getNextPageParam: (lastPage) => {
            return lastPage.hasMore ? lastPage.lastDoc : undefined;
        },
    });
}

/**
 * Fetch a single news article by ID
 */
export function useNewsArticle(articleId: string | null) {
    return useQuery({
        queryKey: ['news-article', articleId],
        queryFn: async () => {
            if (!articleId) return null;
            const docRef = doc(db, 'news', articleId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data(),
                } as NewsArticle;
            }
            return null;
        },
        enabled: !!articleId,
    });
}

/**
 * Create a new news article
 */
export function useCreateNews() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (articleData: Partial<NewsArticle>) => {
            const user = auth.currentUser;
            if (!user) throw new Error('Must be logged in to create news');

            const newArticle = {
                ...articleData,
                authorId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isPublished: true, // Default to published for now
                isPinned: articleData.isPinned || false,
            };

            const docRef = await addDoc(collection(db, 'news'), newArticle);
            return docRef.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
        },
    });
}

/**
 * Update an existing news article
 */
export function useUpdateNews() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ articleId, updates }: { articleId: string; updates: Partial<NewsArticle> }) => {
            const docRef = doc(db, 'news', articleId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
            queryClient.invalidateQueries({ queryKey: ['news-article', variables.articleId] });
        },
    });
}

/**
 * Delete a news article
 */
export function useDeleteNews() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (articleId: string) => {
            const docRef = doc(db, 'news', articleId);
            await deleteDoc(docRef);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['news'] });
        },
    });
}
