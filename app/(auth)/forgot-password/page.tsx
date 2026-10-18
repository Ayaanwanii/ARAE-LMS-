/**
 * Forgot Password Page
 * Password reset request
 * Styled matching ARAE LMS dark glassmorphism aesthetic
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Logo from '@/components/ui/Logo';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
            {/* Background Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-md w-full bg-slate-900/85 border border-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 sm:p-10">
                {/* Logo & Header */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
                        <Logo />
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2 tracking-tight">
                        Reset Password
                    </h1>
                    <p className="text-sm font-medium text-slate-300">
                        Enter your email to receive a password reset link
                    </p>
                </div>

                {success ? (
                    <div className="space-y-6">
                        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-sm">
                            <p className="font-bold mb-1 text-base text-emerald-400">Check your email!</p>
                            <p>
                                We&apos;ve sent a password reset link to <strong className="text-white">{email}</strong>
                            </p>
                        </div>

                        <Link href="/login">
                            <Button fullWidth variant="outline" className="py-3 rounded-xl border-slate-700 bg-slate-800 text-slate-200 hover:text-white font-semibold">
                                Back to Sign In
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium flex items-center gap-2">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Email Address"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                            />

                            <Button
                                type="submit"
                                fullWidth
                                isLoading={loading}
                                className="py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-lg shadow-indigo-500/25 transition-all duration-300"
                            >
                                Send Reset Link
                            </Button>
                        </form>

                        <p className="mt-8 text-center text-sm font-medium text-slate-400">
                            Remember your password?{' '}
                            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
