'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/hooks/useAuth';
import Button from '@/components/ui/Button';
import { toast } from '@/lib/stores/toastStore';

const ROLES = [
    { id: 'student', label: 'Student', description: 'I am a student looking to learn' },
    { id: 'teacher', label: 'Teacher', description: 'I am an educator looking for resources' },
    { id: 'parent', label: 'Parent', description: 'I am a parent exploring for my child' },
];

export default function RoleSelectionModal() {
    const { user, profile } = useAuth();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Only show if user is logged in but has generic 'user' role
    if (!user || !profile || (profile.role !== 'user' && profile.role !== '')) {
        return null;
    }

    const handleSave = async () => {
        if (!selectedRole) return;
        setLoading(true);

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                role: selectedRole
            });

            // Force page reload to refresh profile state if needed, 
            // though useAuth should pick up the change automatically via onSnapshot if it was using it,
            // but useAuth uses getDoc in useEffect, so it might not update immediately without a reload 
            // or a manual state update context. 
            // For now, let's rely on the fact that we updated it. 
            // Actually, useAuth fetches once on mount/auth change. 
            // We might need to trigger a reload to get the new role in the app state.
            window.location.reload();

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
            <div className="surface-elevated rounded-[28px] max-w-lg w-full p-5 sm:p-8 animate-pop-in">
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome to ARAE LMS</h2>
                    <p className="text-slate-600 dark:text-slate-300">Tell us your role so we can tailor the experience to you.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-8">
                    {ROLES.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            className={`relative p-4 rounded-2xl border text-left transition-all duration-200 ${selectedRole === role.id
                                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-500/10 ring-2 ring-indigo-400/20'
                                : 'border-slate-200 bg-white/70 hover:border-indigo-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-4">

                                <div>
                                    <h3 className={`font-bold ${selectedRole === role.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-900 dark:text-white'}`}>
                                        {role.label}
                                    </h3>
                                    <p className={`text-sm ${selectedRole === role.id ? 'text-indigo-700 dark:text-indigo-200' : 'text-slate-500 dark:text-slate-300'}`}>
                                        {role.description}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <Button
                    fullWidth
                    size="lg"
                    onClick={handleSave}
                    disabled={!selectedRole}
                    isLoading={loading}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
}
