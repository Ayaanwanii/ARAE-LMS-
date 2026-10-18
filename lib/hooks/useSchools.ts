/**
 * School and Organization Hooks
 * Firestore hooks for managing schools and organizations
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
    getDoc,
    getDocs,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { School } from '@/lib/types/firestore';
import { useAuth } from './useAuth';

/**
 * Get all schools
 */
export function useSchools() {
    return useQuery({
        queryKey: ['schools'],
        queryFn: async () => {
            const schoolsRef = collection(db, 'schools');
            const q = query(schoolsRef, orderBy('name', 'asc'), limit(100));

            const snapshot = await getDocs(q);
            const schools: School[] = [];
            snapshot.forEach((doc) => {
                schools.push({ id: doc.id, ...doc.data() } as School);
            });
            return schools;
        },
    });
}

/**
 * Get single school
 */
export function useSchool(schoolId: string) {
    return useQuery({
        queryKey: ['school', schoolId],
        queryFn: async () => {
            const docRef = doc(db, 'schools', schoolId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error('School not found');
            }

            return { id: docSnap.id, ...docSnap.data() } as School;
        },
        enabled: !!schoolId,
    });
}

/**
 * Search schools by name
 */
export function useSearchSchools(searchTerm: string) {
    return useQuery({
        queryKey: ['schools-search', searchTerm],
        queryFn: async () => {
            if (!searchTerm) return [];

            const schoolsRef = collection(db, 'schools');
            const snapshot = await getDocs(schoolsRef);

            const schools: School[] = [];
            snapshot.forEach((doc) => {
                const school = { id: doc.id, ...doc.data() } as School;
                if (school.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    schools.push(school);
                }
            });

            return schools;
        },
        enabled: searchTerm.length > 2,
    });
}

/**
 * Get schools by region/country
 */
export function useSchoolsByRegion(region: string) {
    return useQuery({
        queryKey: ['schools-region', region],
        queryFn: async () => {
            const schoolsRef = collection(db, 'schools');
            const q = query(
                schoolsRef,
                where('region', '==', region),
                orderBy('name', 'asc')
            );

            const snapshot = await getDocs(q);
            const schools: School[] = [];
            snapshot.forEach((doc) => {
                schools.push({ id: doc.id, ...doc.data() } as School);
            });
            return schools;
        },
        enabled: !!region,
    });
}

/**
 * Create school
 */
export function useCreateSchool() {
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (schoolData: {
            name: string;
            address?: string;
            city?: string;
            region?: string;
            country?: string;
            contactEmail?: string;
            contactPhone?: string;
        }) => {
            if (!user || !profile?.isSuperAdmin) {
                throw new Error('Only admins can create schools');
            }

            const newSchool: Partial<School> = {
                ...schoolData,
                createdAt: serverTimestamp() as Timestamp,
                studentCount: 0,
                programCount: 0,
            };

            const docRef = await addDoc(collection(db, 'schools'), newSchool);
            return docRef.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schools'] });
        },
    });
}

/**
 * Update school
 */
export function useUpdateSchool() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            schoolId,
            updates,
        }: {
            schoolId: string;
            updates: Partial<School>;
        }) => {
            if (!profile?.isSuperAdmin) {
                throw new Error('Only admins can update schools');
            }

            const docRef = doc(db, 'schools', schoolId);
            await updateDoc(docRef, {
                ...updates,
                updatedAt: serverTimestamp(),
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['school', variables.schoolId] });
            queryClient.invalidateQueries({ queryKey: ['schools'] });
        },
    });
}

/**
 * Delete school
 */
export function useDeleteSchool() {
    const { profile } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (schoolId: string) => {
            if (!profile?.isSuperAdmin) {
                throw new Error('Only admins can delete schools');
            }

            await deleteDoc(doc(db, 'schools', schoolId));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schools'] });
        },
    });
}

/**
 * Get organization users
 */
export function useOrganizationsList() {
    return useQuery({
        queryKey: ['organizations-list'],
        queryFn: async () => {
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('isOrganisation', '==', true),
                orderBy('displayName', 'asc')
            );

            const snapshot = await getDocs(q);
            const orgs: any[] = [];
            snapshot.forEach((doc) => {
                orgs.push({ id: doc.id, ...doc.data() });
            });
            return orgs;
        },
    });
}
