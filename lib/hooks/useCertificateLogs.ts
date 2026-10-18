/**
 * Firestore Hooks for Certificate Generation Logs
 * Track who generated certificates and how many
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    collection,
    query,
    orderBy,
    getDocs,
    addDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

export interface CertificateLogEntry {
    id?: string;
    generatedBy: {
        id: string;
        name: string;
        email: string;
    };
    generatedAt: Timestamp;
    count: number;
    studentNames: string[];
}

export interface CertificateStats {
    totalGenerated: number;
    logs: CertificateLogEntry[];
}

/**
 * Fetch certificate generation logs for a program
 */
export function useCertificateLogs(programId: string | null) {
    return useQuery({
        queryKey: ['certificate-logs', programId],
        queryFn: async (): Promise<CertificateStats> => {
            if (!programId) {
                return { totalGenerated: 0, logs: [] };
            }

            const logsRef = collection(db, 'event', programId, 'certificateLogs');
            const q = query(logsRef, orderBy('generatedAt', 'desc'));

            const snapshot = await getDocs(q);
            const logs: CertificateLogEntry[] = [];
            let totalGenerated = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                logs.push({
                    id: doc.id,
                    generatedBy: data.generatedBy,
                    generatedAt: data.generatedAt,
                    count: data.count,
                    studentNames: data.studentNames || [],
                });
                totalGenerated += data.count || 0;
            });

            return {
                totalGenerated,
                logs,
            };
        },
        enabled: !!programId,
    });
}

/**
 * Log a certificate generation event
 */
export function useLogCertificateGeneration() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            programId,
            count,
            studentNames,
        }: {
            programId: string;
            count: number;
            studentNames: string[];
        }) => {
            const user = auth.currentUser;
            if (!user) throw new Error('Must be logged in to generate certificates');

            const logsRef = collection(db, 'event', programId, 'certificateLogs');

            const logEntry = {
                generatedBy: {
                    id: user.uid,
                    name: user.displayName || 'Unknown User',
                    email: user.email || '',
                },
                generatedAt: serverTimestamp(),
                count,
                studentNames,
            };

            await addDoc(logsRef, logEntry);
        },
        onSuccess: (_, variables) => {
            // Invalidate certificate logs to refetch
            queryClient.invalidateQueries({ queryKey: ['certificate-logs', variables.programId] });
        },
    });
}

/**
 * Get aggregated certificate stats (helper for stats page)
 * Groups by user and returns summary
 */
export function useCertificateStatsSummary(programId: string | null) {
    const { data: stats, isLoading, error } = useCertificateLogs(programId);

    // Process logs to get per-user summary
    const userSummary = new Map<string, { name: string; email: string; totalCount: number; lastGenerated: Timestamp | null }>();

    if (stats?.logs) {
        stats.logs.forEach((log) => {
            const userId = log.generatedBy.id;
            const existing = userSummary.get(userId);

            if (existing) {
                existing.totalCount += log.count;
                // Keep the most recent generation date
                if (!existing.lastGenerated || (log.generatedAt && log.generatedAt.toMillis() > existing.lastGenerated.toMillis())) {
                    existing.lastGenerated = log.generatedAt;
                }
            } else {
                userSummary.set(userId, {
                    name: log.generatedBy.name,
                    email: log.generatedBy.email,
                    totalCount: log.count,
                    lastGenerated: log.generatedAt,
                });
            }
        });
    }

    return {
        totalGenerated: stats?.totalGenerated || 0,
        logs: stats?.logs || [],
        userSummary: Array.from(userSummary.entries()).map(([userId, data]) => ({
            userId,
            ...data,
        })),
        isLoading,
        error,
    };
}
