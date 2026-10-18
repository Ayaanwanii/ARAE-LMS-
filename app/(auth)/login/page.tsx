/**
 * Login Page
 * User authentication with email/password and Google Sign-In
 * Styled matching ARAE LMS dark glassmorphism aesthetic
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSignIn, useGoogleSignIn } from '@/lib/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';

export default function LoginPage() {
    const router = useRouter();
    const signIn = useSignIn();
    const googleSignIn = useGoogleSignIn();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await signIn.mutateAsync(formData);
            router.push('/programs');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await googleSignIn.mutateAsync();
            router.push('/programs');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative z-10 max-w-md w-full bg-slate-900/85 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 sm:p-10">
                {/* Logo & Header */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
                        <Logo />
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2 tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-sm font-medium text-slate-300">
                        Sign in to access your educational programs
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

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="your@email.com"
                    />

                    <div>
                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            rightElement={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="focus:outline-none hover:text-white transition-colors p-1"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    )}
                                </button>
                            }
                        />
                        <div className="flex justify-end mt-1.5">
                            <Link href="/forgot-password" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        fullWidth
                        isLoading={signIn.isPending}
                        className="py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-lg shadow-indigo-500/25 transition-all duration-300"
                    >
                        Sign In
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
                        Sign in with Google
                    </Button>
                </div>

                <p className="mt-8 text-center text-sm font-medium text-slate-400">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
