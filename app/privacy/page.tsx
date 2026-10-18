'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import LandingNavbar from '@/components/layout/LandingNavbar';
import Button from '@/components/ui/Button';

export default function PrivacyPage() {
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
                        Privacy Policy
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
                            <span className="text-indigo-400">1.</span> Information We Collect
                        </h2>
                        <p>
                            We collect information you provide directly to us when registering for an account, accessing courses, or playing games on the ARAE LMS platform. This includes:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li><strong>Account Information</strong>: Your name, email address, school affiliation, interests, age, and profile photo.</li>
                            <li><strong>Activity & Progress Data</strong>: Completed tasks, learning duration, points earned, streak milestones, and game performance statistics.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">2.</span> How We Use Your Information
                        </h2>
                        <p>
                            We use the collected information for the following purposes:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-400">
                            <li>To operate, maintain, and personalize your learning dashboard experience.</li>
                            <li>To calculate and update your academic score, global streaks, and corresponding ranks.</li>
                            <li>To provide analytical insights to your designated school teachers or organization administrators.</li>
                            <li>To communicate platform updates, reward eligibility notices, and system alerts.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">3.</span> Information Sharing & Visibility
                        </h2>
                        <p>
                            Your privacy is a core priority. We do not sell your personal data. Your progress metrics, email, and name are shared strictly with verified administrators and educators connected to your institutional network for academic assessment. Ranks and streaks may also be visible on classroom leaderboards to foster healthy motivation.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">4.</span> Data Security & Retention
                        </h2>
                        <p>
                            We deploy robust security protocols to protect your personal account credentials and details. We retain your profile data as long as your account remains active. You may request account deletion or request a copy of your compiled data by reaching out to support.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-indigo-400">5.</span> Contact Us
                        </h2>
                        <p>
                            If you have questions, feedback, or data privacy complaints, please contact our data Protection Office:
                        </p>
                            <div className="bg-white/5 border border-white/5 rounded-xl p-4 mt-2 text-indigo-300 font-medium">
                            Email: privacy@arae.education
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
