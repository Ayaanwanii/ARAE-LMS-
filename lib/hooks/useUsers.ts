/**
 * Firestore Hooks for User Management
 * Custom React hooks for user profile operations
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    serverTimestamp,
    limit,
    orderBy,
    getCountFromServer,
    onSnapshot,
} from 'firebase/firestore';
import { useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { UserProfile } from '../types/firestore';

/**
 * Fetch current user's profile
 */
export function useUserProfile(userId?: string) {
    const currentUser = auth.currentUser;
    const targetUserId = userId || currentUser?.uid;

    return useQuery({
        queryKey: ['user-profile', targetUserId],
        queryFn: async () => {
            if (!targetUserId) return null;

            const docRef = doc(db, 'users', targetUserId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return {
                    ...docSnap.data(),
                    uid: docSnap.id,
                } as UserProfile;
            }
            return null;
        },
        enabled: !!targetUserId,
    });
}

/**
 * Update user profile
 */
export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: Partial<UserProfile>) => {
            const user = auth.currentUser;
            if (!user) throw new Error('Must be logged in');

            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, {
                ...updates,
                editedTime: serverTimestamp(),
            });
        },
        onSuccess: (_, variables) => {
            const user = auth.currentUser;
            if (user) {
                queryClient.invalidateQueries({ queryKey: ['user-profile', user.uid] });
            }
        },
    });
}

/**
 * Search users by display name or email
 */
export function useSearchUsers(searchTerm: string) {
    return useQuery({
        queryKey: ['search-users', searchTerm],
        queryFn: async () => {
            if (!searchTerm || searchTerm.length < 2) return [];

            // Simple search - in production, use a search service
            const q = query(collection(db, 'users'));
            const snapshot = await getDocs(q);

            const allUsers = snapshot.docs.map((doc) => ({
                ...doc.data(),
                uid: doc.id,
            })) as UserProfile[];



            const searchLower = searchTerm.toLowerCase();
            return allUsers.filter((user) => {
                const name = user.displayName?.toLowerCase() || '';
                const email = user.email?.toLowerCase() || '';
                return name.includes(searchLower) || email.includes(searchLower);
            });
        },
        enabled: searchTerm.length >= 2,
    });
}

interface UserFilters {
    country: string;
    state: string;
    school: string;
    ageRange: string;
}

/**
 * Fetch all users with filter options for admin lookup
 */
export function useFilteredUsers(filters: UserFilters) {
    return useQuery({
        queryKey: ['filtered-users', filters],
        queryFn: async () => {
            // Fetch all users (in production, add server-side filtering)
            const q = query(collection(db, 'users'), limit(500));
            const snapshot = await getDocs(q);

            const allUsers = snapshot.docs.map((doc) => ({
                ...doc.data(),
                uid: doc.id,
            })) as UserProfile[];

            // Extract unique values for filter dropdowns
            const uniqueCountries = new Set<string>();
            const uniqueStates = new Set<string>();
            const uniqueSchools = new Set<string>();

            allUsers.forEach((user) => {
                if (user.countryRef) uniqueCountries.add(user.countryRef);
                if (user.stateRef) uniqueStates.add(user.stateRef);
                // Check both schoolName and schoolRef for schools
                if (user.schoolName) uniqueSchools.add(user.schoolName);
                if (user.schoolRef && typeof user.schoolRef === 'string') uniqueSchools.add(user.schoolRef);
            });

            // Apply filters
            const hasFilters = filters.country || filters.state || filters.school || filters.ageRange;

            const filteredUsers = hasFilters ? allUsers.filter((user) => {
                if (filters.country && user.countryRef !== filters.country) return false;
                if (filters.state && user.stateRef !== filters.state) return false;
                // Check both schoolName and schoolRef for school filter
                if (filters.school && user.schoolName !== filters.school && user.schoolRef !== filters.school) return false;

                if (filters.ageRange) {
                    const age = user.age || 0;
                    if (filters.ageRange === 'under-12' && age >= 12) return false;
                    if (filters.ageRange === '12-15' && (age < 12 || age > 15)) return false;
                    if (filters.ageRange === '16-18' && (age < 16 || age > 18)) return false;
                    if (filters.ageRange === '18-plus' && age < 18) return false;
                }
                return true;
            }) : [];

            return {
                users: filteredUsers,
                options: {
                    countries: Array.from(uniqueCountries).sort(),
                    states: Array.from(uniqueStates).sort(),
                    schools: Array.from(uniqueSchools).sort(),
                },
            };
        },
        staleTime: 60000,
    });
}

/**
 * Fetch users by school
 */
export function useUsersBySchool(schoolRef: string) {
    return useQuery({
        queryKey: ['users-by-school', schoolRef],
        queryFn: async () => {
            if (!schoolRef) return [];

            const q = query(
                collection(db, 'users'),
                where('schoolRef', '==', schoolRef)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                ...doc.data(),
                uid: doc.id,
            })) as UserProfile[];
        },
        enabled: !!schoolRef,
    });
}

/**
 * Fetch organization/admin users
 */
export function useOrganizationUsers() {
    return useQuery({
        queryKey: ['organization-users'],
        queryFn: async () => {
            const q = query(
                collection(db, 'users'),
                where('isOrganisation', '==', true)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                ...doc.data(),
                uid: doc.id,
            })) as UserProfile[];
        },
    });
}

/**
 * Fetch super admin users
 */
export function useSuperAdmins() {
    return useQuery({
        queryKey: ['super-admins'],
        queryFn: async () => {
            const q = query(
                collection(db, 'users'),
                where('isSuperAdmin', '==', true)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                ...doc.data(),
                uid: doc.id,
            })) as UserProfile[];
        },
    });
}

/**
 * Fetch all users (for admin dashboard)
 */
export function useUsers() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            orderBy('createdTime', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const users = snapshot.docs.map((doc) => ({
                ...doc.data(),
                uid: doc.id,
            })) as UserProfile[];

            queryClient.setQueryData(['all-users'], users);
        });

        return () => unsubscribe();
    }, [queryClient]);

    return useQuery({
        queryKey: ['all-users'],
        queryFn: () => [] as UserProfile[], // Fallback, data is set via onSnapshot
        enabled: false,
        staleTime: Infinity,
    });
}

/**
 * Update user role (for admin)
 */
export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, isSubAdmin, isSuperAdmin }: { userId: string; isSubAdmin?: boolean; isSuperAdmin?: boolean }) => {
            const docRef = doc(db, 'users', userId);
            const updates: any = { editedTime: serverTimestamp() };

            if (isSubAdmin !== undefined) updates.isSubAdmin = isSubAdmin;
            if (isSuperAdmin !== undefined) updates.isSuperAdmin = isSuperAdmin;

            await updateDoc(docRef, updates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-users'] });
        },
    });
}

/**
 * Update user's last active time
 */
export function useUpdateLastActive() {
    return useMutation({
        mutationFn: async () => {
            const user = auth.currentUser;
            if (!user) return;

            const docRef = doc(db, 'users', user.uid);
            await updateDoc(docRef, {
                lastActiveTime: serverTimestamp(),
            });
        },
    });
}

/**
 * Fetch user counts by role
 */
export function useUserCounts() {
    return useQuery({
        queryKey: ['user-counts'],
        queryFn: async () => {
            const usersRef = collection(db, 'users');

            // Total Users
            const totalSnapshot = await getCountFromServer(usersRef);
            const total = totalSnapshot.data().count;

            // Teachers
            const teachersQuery = query(usersRef, where('role', '==', 'teacher'));
            const teachersSnapshot = await getCountFromServer(teachersQuery);
            const teachers = teachersSnapshot.data().count;

            // Parents
            const parentsQuery = query(usersRef, where('role', '==', 'parent'));
            const parentsSnapshot = await getCountFromServer(parentsQuery);
            const parents = parentsSnapshot.data().count;

            // Students (Calculate as remainder to account for users with missing role)
            const students = total - teachers - parents;

            return {
                total,
                teachers,
                students,
                parents
            };
        },
        refetchInterval: 5000, // Poll every 5 seconds for "realtime" counts
        refetchOnWindowFocus: true,
    });
}

/**
 * Fetch count of rewards redeemed by current user
 */
export function useUserRedemptionCount() {
    const { currentUser } = auth;
    const userId = currentUser?.uid;

    return useQuery({
        queryKey: ['user-redemption-count', userId],
        queryFn: async () => {
            if (!userId) return 0;

            const q = query(
                collection(db, 'redemptions'),
                where('userId', '==', userId)
            );

            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        },
        enabled: !!userId,
    });
}
