/**
 * Authentication utilities and hooks
 * Handles user authentication state and operations
 */

'use client';

import { useEffect, useState } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile } from '../types/firestore';

function getAuthErrorMessage(error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';

    if (code === 'auth/configuration-not-found') {
        return 'Firebase Authentication is not enabled or configured for this Firebase project. Enable Authentication and the Google sign-in provider in Firebase Console, then restart the dev server.';
    }

    if (code === 'auth/operation-not-allowed') {
        return 'This sign-in method is not enabled for this Firebase project. Enable the provider in Firebase Authentication settings.';
    }

    if (code === 'auth/unauthorized-domain') {
        return 'This domain is not authorized for Firebase Authentication. Add it in Firebase Authentication settings.';
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'An unexpected authentication error occurred';
}

/**
 * Custom hook for authentication state
 * Returns current user, profile data, and loading state
 */
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // Fetch user profile from Firestore
                try {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                    if (userDoc.exists()) {
                        setProfile(userDoc.data() as UserProfile);
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { user, profile, loading };
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return { user: result.user, error: null };
    } catch (error: unknown) {
        return { user: null, error: getAuthErrorMessage(error) };
    }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
    email: string,
    password: string,
    displayName: string
) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;

        // Update display name
        await updateProfile(user, { displayName });

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            photoUrl: '',
            phoneNumber: '',
            phoneNumberDialCode: '',
            createdTime: serverTimestamp(),
            role: 'user',
            gender: '',
            age: 0,
            interest: [],
            schoolName: '',
            schoolRef: '',
            countryRef: '',
            stateRef: '',
            postcode: 0,
            isOrganisation: false,
            isSuperAdmin: false,
            joinedEventNumber: 0,
            joinedEventRef: [],
        });

        return { user, error: null };
    } catch (error: unknown) {
        return { user: null, error: getAuthErrorMessage(error) };
    }
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        provider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user profile exists, if not create one
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || '',
                photoUrl: user.photoURL || '',
                phoneNumber: user.phoneNumber || '',
                phoneNumberDialCode: '',
                createdTime: serverTimestamp(),
                role: 'user',
                gender: '',
                age: 0,
                interest: [],
                schoolName: '',
                schoolRef: '',
                countryRef: '',
                stateRef: '',
                postcode: 0,
                isOrganisation: false,
                isSuperAdmin: false,
                joinedEventNumber: 0,
                joinedEventRef: [],
            });
        }

        return { user, error: null };
    } catch (error: unknown) {
        return { user: null, error: getAuthErrorMessage(error) };
    }
}

/**
 * Sign out current user
 */
export async function signOut() {
    try {
        await firebaseSignOut(auth);
        return { error: null };
    } catch (error: unknown) {
        return { error: getAuthErrorMessage(error) };
    }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
    try {
        await sendPasswordResetEmail(auth, email);
        return { error: null };
    } catch (error: unknown) {
        return { error: getAuthErrorMessage(error) };
    }
}

/**
 * Check if user is super admin
 */
export function useIsSuperAdmin() {
    const { profile } = useAuth();
    return profile?.isSuperAdmin ?? false;
}

/**
 * Check if user is organization
 */
/**
 * Check if user is organization
 */
export function useIsOrganisation() {
    const { profile } = useAuth();
    return profile?.isOrganisation ?? false;
}

// React Query Mutation Hooks
import { useMutation } from '@tanstack/react-query';

/**
 * Hook for email/password sign in
 */
export function useSignIn() {
    return useMutation({
        mutationFn: async ({ email, password }: { email: string; password: string }) => {
            const result = await signInWithEmail(email, password);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.user;
        },
    });
}

/**
 * Hook for email/password sign up
 */
export function useSignUp() {
    return useMutation({
        mutationFn: async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
            const result = await signUpWithEmail(email, password, displayName);
            if (result.error) {
                throw new Error(result.error);
            }
            return result.user;
        },
    });
}

/**
 * Hook for Google sign in
 */
export function useGoogleSignIn() {
    return useMutation({
        mutationFn: async () => {
            const result = await signInWithGoogle();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.user;
        },
    });
}

/**
 * Hook for sign out
 */
export function useSignOut() {
    return useMutation({
        mutationFn: async () => {
            const result = await signOut();
            if (result.error) {
                throw new Error(result.error);
            }
        },
    });
}
