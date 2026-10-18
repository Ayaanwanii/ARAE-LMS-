/**
 * Sign Up Page
 * New user registration
 * Styled matching ARAE LMS dark glassmorphism aesthetic
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignUp, useGoogleSignIn } from '@/lib/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';

export default function SignUpPage() {
    const router = useRouter();
    const signUp = useSignUp();
    const googleSignIn = useGoogleSignIn();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        displayName: '',
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            await signUp.mutateAsync({
                email: formData.email,
                password: formData.password,
                displayName: formData.displayName,
            });
            router.push('/profile/create');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to create account');
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await googleSignIn.mutateAsync();
            router.push('/profile/create');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative z-10 max-w-md w-full bg-slate-900/85 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 sm:p-10">
                {/* Logo & Header */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
                        <Logo />
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2 tracking-tight">
                        Join ARAE LMS
                    </h1>
                    <p className="text-sm font-medium text-slate-300">
                        Create your account to start learning
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Full Name"
                        type="text"
                        required
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        placeholder="John Doe"
                    />

                    <Input
                        label="Email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                    />

                    <Input
                        label="Password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        helperText="Must be at least 6 characters"
                    />

                    <Input
                        label="Confirm Password"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                    />

                    <Button
                        type="submit"
                        fullWidth
                        isLoading={signUp.isPending}
                        className="py-3.5 mt-2 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-lg shadow-indigo-500/25 transition-all duration-300"
                    >
                        Create Account
                    </Button>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700/60" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-wider font-semibold">
                            <span className="px-3 bg-slate-900 text-slate-400">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        fullWidth
                        onClick={handleGoogleSignIn}
                        isLoading={googleSignIn.isPending}
                        className="mt-4 py-3 rounded-xl border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold transition-all duration-200"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign up with Google
                    </Button>
                </div>

                <p className="mt-8 text-center text-sm font-medium text-slate-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
