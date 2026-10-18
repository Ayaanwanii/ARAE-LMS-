'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Button from '@/components/ui/Button';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#0f172a] text-white relative overflow-hidden flex flex-col">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 z-0 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] z-0 pointer-events-none"></div>

            <LandingNavbar />

            {/* Content Container */}
            <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 relative z-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                        Terms & Conditions
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Last Updated: June 15, 2026
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl space-y-8 text-gray-300 leading-relaxed text-sm sm:text-base"
                >
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">1.</span> Acceptance of Terms
                        </h2>
                        <p>
                            Welcome to <strong>ARAE LMS</strong>. By accessing or using our website, services, educational programs, games, or platform applications, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the platform.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">2.</span> Account Registration & Security
                        </h2>
                        <p>
                            To participate in programs and earn points, you may be required to register for an account. You agree to provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">3.</span> Points, Streaks & Rewards
                        </h2>
                        <p>
                            The platform includes a gamified rewards system featuring global streaks, experience ranks, and virtual points. You acknowledge and agree that:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li>Points, login streaks, and ranks are purely virtual and represent educational achievements.</li>
                            <li>Virtual points have no real-world monetary value and cannot be exchanged, transferred, or redeemed for cash, legal tender, or currency, unless explicitly stated as part of an official sponsored program.</li>
                            <li>ARAE LMS reserves the right to adjust, void, or reset points, streaks, or ranks in the event of technical error, suspicious activity, cheating, or violations of these Terms.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">4.</span> Intellectual Property Rights
                        </h2>
                        <p>
                            All content available on the platform, including but not limited to text, graphics, logos, video files, software, educational curriculum, and games, is the property of the platform or its licensors and is protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access the content solely for your personal, non-commercial educational use.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">5.</span> Prohibited Conduct
                        </h2>
                        <p>
                            When using the platform, you agree not to:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li>Use automated scripts, bots, or scrape content from the platform.</li>
                            <li>Attempt to manipulate the points, scoring, or ranks system.</li>
                            <li>Submit false, misleading, or inappropriate profile details or learning reports.</li>
                            <li>Circumvent any access controls or security measures on the site.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">6.</span> Limitation of Liability
                        </h2>
                        <p>
                            The platform is provided on an "as-is" and "as-available" basis without warranties of any kind. We do not guarantee that the services will be uninterrupted or error-free. To the maximum extent permitted by law, the platform shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of or inability to use the platform.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">7.</span> Governing Law
                        </h2>
                        <p>
                            These Terms and Conditions shall be governed by and construed in accordance with the laws of the jurisdiction in which the platform operates, without regard to its conflict of law principles. Any dispute arising from these terms shall be resolved exclusively in the competent courts of that jurisdiction.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">8.</span> Contact Information
                        </h2>
                        <p>
                            If you have any questions or concerns about these Terms and Conditions, please contact us at:
                        </p>
                        <div className="bg-white/5 border border-white/5 rounded-xl p-4 mt-2 text-indigo-350 font-medium">
                            Email: support@arae.education
                        </div>
                    </section>
                </motion.div>

                <div className="text-center mt-12">
                    <Link href="/">
                        <Button variant="outline" size="lg" className="border-indigo-400 text-indigo-200 hover:bg-indigo-900/50 hover:text-white">
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
